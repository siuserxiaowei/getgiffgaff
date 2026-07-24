#!/usr/bin/env node

import path from "node:path";
import { pathToFileURL } from "node:url";

import { resolveWranglerBearerToken } from "./verify-analytics-persistence.mjs";

const ACCOUNT_ID = "ab6289976235fa386fcddcddd7bf62c5";
const DATASET = "getgiffgaff_events_v1";
const ENDPOINT = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/analytics_engine/sql`;
const SCHEMA = "getgiffgaff_distribution_report_v1";

export const DISTRIBUTION_PATHS = Object.freeze([
  "/tools/china-roaming-cost/",
  "/tools/keep-number-reminder/",
]);
export const DISTRIBUTION_SOURCES = Object.freeze(["dist_tinylaunch", "dist_uneed"]);
export const DISTRIBUTION_EVENTS = Object.freeze([
  "commerce_click",
  "contact_click",
  "page_view",
  "tool_result",
]);

const pathSet = new Set(DISTRIBUTION_PATHS);
const sourceSet = new Set(DISTRIBUTION_SOURCES);
const eventSet = new Set(DISTRIBUTION_EVENTS);

function quoted(values) {
  return values.map((value) => `'${value}'`).join(", ");
}

export function distributionReportSql() {
  return [
    "SELECT",
    "  toStartOfDay(timestamp) AS day_utc,",
    "  blob1 AS path,",
    "  blob2 AS source,",
    "  index1 AS event,",
    "  SUM(_sample_interval * double1) AS weighted_events",
    `FROM ${DATASET}`,
    "WHERE timestamp >= toStartOfDay(NOW() - INTERVAL '28' DAY)",
    "  AND timestamp < toStartOfDay(NOW())",
    "  AND blob4 != 'seo_release_canary'",
    `  AND blob1 IN (${quoted(DISTRIBUTION_PATHS)})`,
    `  AND blob2 IN (${quoted(DISTRIBUTION_SOURCES)})`,
    `  AND index1 IN (${quoted(DISTRIBUTION_EVENTS)})`,
    "GROUP BY day_utc, path, source, event",
    "ORDER BY day_utc ASC, path ASC, source ASC, event ASC",
    "FORMAT JSON",
  ].join("\n");
}

function dayText(value) {
  const match = /^(\d{4}-\d{2}-\d{2})/u.exec(String(value || ""));
  if (!match || Number.isNaN(Date.parse(`${match[1]}T00:00:00Z`))) {
    throw new Error("Analytics returned an invalid UTC day");
  }
  return match[1];
}

export function assessDistributionMetrics({
  page_view = 0,
  tool_result = 0,
  commerce_click = 0,
  contact_click = 0,
} = {}, days = 7) {
  const values = { page_view, tool_result, commerce_click, contact_click };
  if (!Object.values(values).every((value) => Number.isFinite(value) && value >= 0)) {
    throw new TypeError("Distribution metrics must be finite non-negative numbers");
  }
  const tool_use_rate = page_view > 0 ? tool_result / page_view : 0;
  const action_clicks = commerce_click + contact_click;
  if (days === 7) {
    if (page_view < 10) return { status: "INSUFFICIENT_TRAFFIC", tool_use_rate, action_clicks };
    if (page_view >= 20 && tool_result >= 5 && tool_use_rate >= 0.2 && action_clicks >= 1) {
      return { status: "STRONG_SIGNAL", tool_use_rate, action_clicks };
    }
    if (tool_result === 0) return { status: "OPTIMIZE_ONCE", tool_use_rate, action_clicks };
    return { status: "OBSERVE", tool_use_rate, action_clicks };
  }
  if (days === 28) {
    const click_signal = contact_click >= 2 && tool_use_rate >= 0.2;
    return {
      status: click_signal ? "CLICK_SIGNAL_MET" : "STOP_ACTIVE_PROMOTION",
      tool_use_rate,
      action_clicks,
      manual_qualified_consultation_required: !click_signal,
    };
  }
  throw new TypeError("Distribution assessment supports only 7 or 28 days");
}

function zeroCounts() {
  return Object.fromEntries(DISTRIBUTION_EVENTS.map((event) => [event, 0]));
}

export function buildDistributionReport(rows, now = Date.now()) {
  const nowDay = new Date(now).toISOString().slice(0, 10);
  const end = Date.parse(`${nowDay}T00:00:00Z`);
  const normalized = rows.map((row) => {
    const day_utc = dayText(row.day_utc);
    if (!pathSet.has(row.path) || !sourceSet.has(row.source) || !eventSet.has(row.event)) {
      throw new Error("Analytics returned a dimension outside the fixed distribution allowlist");
    }
    if (!Number.isFinite(row.weighted_events) || row.weighted_events < 0) {
      throw new Error("Analytics returned an invalid event count");
    }
    return { ...row, day_utc };
  });
  const launches = [];
  for (const route of DISTRIBUTION_PATHS) {
    for (const source of DISTRIBUTION_SOURCES) {
      const entry = { path: route, source, windows: {} };
      for (const days of [7, 28]) {
        const startDay = new Date(end - days * 86_400_000).toISOString().slice(0, 10);
        const counts = zeroCounts();
        for (const row of normalized) {
          if (row.path === route && row.source === source && row.day_utc >= startDay && row.day_utc < nowDay) {
            counts[row.event] += row.weighted_events;
          }
        }
        entry.windows[`d${days}`] = {
          start_utc: startDay,
          end_utc: new Date(end - 86_400_000).toISOString().slice(0, 10),
          counts,
          assessment: assessDistributionMetrics(counts, days),
        };
      }
      launches.push(entry);
    }
  }
  return {
    schema: SCHEMA,
    generated_at: new Date(now).toISOString(),
    privacy: "Aggregated anonymous events only; no tool inputs, accounts, phone numbers or cookies.",
    manual_funnel: "Record received, qualified and paid separately; do not claim cross-device attribution.",
    launches,
  };
}

async function queryDistributionReport() {
  const token = await resolveWranglerBearerToken();
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "text/plain;charset=UTF-8",
    },
    body: distributionReportSql(),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Analytics SQL API returned status ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload?.data)) throw new Error("Analytics SQL API returned an invalid result");
  return payload.data;
}

export async function runDistributionReport() {
  const report = buildDistributionReport(await queryDistributionReport());
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  runDistributionReport().catch((error) => {
    process.stderr.write(`${String(error?.message || error).replace(/Bearer\s+\S+/giu, "Bearer [redacted]")}\n`);
    process.exitCode = 1;
  });
}
