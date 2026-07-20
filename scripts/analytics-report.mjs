#!/usr/bin/env node

import path from "node:path";
import { pathToFileURL } from "node:url";

import { resolveWranglerBearerToken } from "./verify-analytics-persistence.mjs";

// Keep these values local and fixed. This command intentionally has no option
// that accepts an account, dataset, SQL statement, event name, or date range.
// It is a read-only diagnostic for this site's production Analytics Engine data.
const CLOUDFLARE_ACCOUNT_ID = "ab6289976235fa386fcddcddd7bf62c5";
const ANALYTICS_DATASET = "getgiffgaff_events_v1";
const ANALYTICS_SQL_ENDPOINT =
  `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/analytics_engine/sql`;
const REPORT_DAYS = 28;
const REQUEST_TIMEOUT_MS = 15_000;
const REPORT_SCHEMA = "getgiffgaff_analytics_report_v1";

export const ANALYTICS_REPORT_EVENTS = Object.freeze([
  "commerce_click",
  "contact_click",
  "growth_related_click",
  "page_view",
  "shop_click",
  "tool_result",
]);

const EVENT_SET = new Set(ANALYTICS_REPORT_EVENTS);
const WINDOW_SIZES = Object.freeze([1, 7, 28]);

function bearerToken(value) {
  const token = String(value || "").trim();
  if (!token || /[\r\n]/u.test(token)) {
    throw new Error("Cloudflare bearer credential is missing or malformed");
  }
  return token;
}

function finiteTimestamp(value) {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp)) {
    throw new TypeError("Analytics report clock must return a finite millisecond timestamp");
  }
  return timestamp;
}

function utcDayFromTimestamp(value) {
  return new Date(finiteTimestamp(value)).toISOString().slice(0, 10);
}

function validUtcDay(day) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(day)) return false;
  const timestamp = Date.parse(`${day}T00:00:00.000Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === day;
}

function parseGroupedUtcDay(value) {
  const text = String(value || "").trim();
  const match = /^(\d{4}-\d{2}-\d{2})(?:[ T]00:00:00(?:\.0+)?(?:Z|[+-]00:00)?)?$/u.exec(text);
  const day = match?.[1];
  if (!day || !validUtcDay(day)) {
    throw new Error("Analytics SQL API returned an invalid UTC day");
  }
  return day;
}

function exactObjectKeys(value, expected) {
  return value && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).sort().join(",") === [...expected].sort().join(",");
}

function contentType(response) {
  return (response?.headers?.get("content-type") || "").toLowerCase().split(";", 1)[0].trim();
}

function dateRangeEndingYesterday(days, nowMs) {
  const currentUtcDay = utcDayFromTimestamp(nowMs);
  const currentUtcMidnight = Date.parse(`${currentUtcDay}T00:00:00.000Z`);
  const start = new Date(currentUtcMidnight - days * 86_400_000).toISOString().slice(0, 10);
  const end = new Date(currentUtcMidnight - 86_400_000).toISOString().slice(0, 10);
  return { start, end };
}

function utcDays({ start, days }) {
  const startMs = Date.parse(`${start}T00:00:00.000Z`);
  return Array.from({ length: days }, (_, offset) => (
    new Date(startMs + offset * 86_400_000).toISOString().slice(0, 10)
  ));
}

function zeroEventCounts() {
  return Object.fromEntries(ANALYTICS_REPORT_EVENTS.map((event) => [event, 0]));
}

function sumEventCounts(rows) {
  const totals = zeroEventCounts();
  for (const row of rows) {
    totals[row.event] += row.weighted_events;
    if (!Number.isFinite(totals[row.event])) {
      throw new Error("Analytics SQL API returned an event total outside the supported range");
    }
  }
  return totals;
}

function sumCounts(counts) {
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  if (!Number.isFinite(total)) {
    throw new Error("Analytics SQL API returned a total outside the supported range");
  }
  return total;
}

function buildWindowReport(days, observedDays, nowMs) {
  const { start, end } = dateRangeEndingYesterday(days, nowMs);
  const requiredDays = utcDays({ start, days });
  const missingDays = requiredDays.filter((day) => !observedDays.has(day));
  const status = missingDays.length === 0 ? "READY" : "HOLD";
  return Object.freeze({
    status,
    required_complete_utc_days: days,
    start_utc: start,
    end_utc: end,
    observed_days: days - missingDays.length,
    missing_days: missingDays,
    reason: status === "READY"
      ? `最近 ${days} 个完整 UTC 日都至少返回了一条白名单事件记录。`
      : `数据不足：最近 ${days} 个完整 UTC 日中有 ${missingDays.length} 天未返回白名单事件记录；未返回行不能按 0 处理。`,
  });
}

/**
 * The only SQL statement this command can issue. It has two independent
 * protections against release canaries: an event allowlist and the blob4
 * exclusion required by the analytics data contract.
 */
export function analyticsReportSql() {
  const events = ANALYTICS_REPORT_EVENTS.map((event) => `'${event}'`).join(", ");
  return [
    "SELECT",
    "  toStartOfDay(timestamp) AS day_utc,",
    "  index1 AS event,",
    "  SUM(_sample_interval * double1) AS weighted_events",
    `FROM ${ANALYTICS_DATASET}`,
    `WHERE timestamp >= toStartOfDay(NOW() - INTERVAL '${REPORT_DAYS}' DAY)`,
    "  AND timestamp < toStartOfDay(NOW())",
    "  AND blob4 != 'seo_release_canary'",
    `  AND index1 IN (${events})`,
    "GROUP BY day_utc, event",
    "ORDER BY day_utc ASC, event ASC",
    "FORMAT JSON",
  ].join("\n");
}

/**
 * Parses the documented Analytics Engine FORMAT JSON response. The report
 * rejects unknown dimensions rather than treating them as traffic, so a worker
 * change cannot silently alter the metrics this command presents.
 */
export function validateAnalyticsReportResponse(response, payload) {
  if (response?.status !== 200) {
    throw new Error(`Analytics SQL API returned status ${response?.status ?? "missing"}`);
  }
  if (contentType(response) !== "application/json") {
    throw new Error(
      `Analytics SQL API returned ${response?.headers?.get("content-type") || "a missing Content-Type"}, expected application/json`,
    );
  }
  if (
    !payload
    || Array.isArray(payload)
    || typeof payload !== "object"
    || !Array.isArray(payload.meta)
    || !Array.isArray(payload.data)
    || !Number.isSafeInteger(payload.rows)
    || payload.rows < 0
    || payload.rows !== payload.data.length
  ) {
    throw new Error("Analytics SQL API returned an invalid JSON result shape");
  }

  const expectedColumns = ["day_utc", "event", "weighted_events"];
  if (
    payload.meta.length !== expectedColumns.length
    || !payload.meta.every((column, index) => (
      column
      && typeof column === "object"
      && !Array.isArray(column)
      && column.name === expectedColumns[index]
      && typeof column.type === "string"
      && column.type
    ))
  ) {
    throw new Error("Analytics SQL API returned unexpected column metadata");
  }

  const seen = new Set();
  const rows = payload.data.map((row) => {
    if (!exactObjectKeys(row, expectedColumns)) {
      throw new Error("Analytics SQL API returned an invalid aggregated row");
    }
    const day_utc = parseGroupedUtcDay(row.day_utc);
    const event = row.event;
    const weighted_events = row.weighted_events;
    if (!EVENT_SET.has(event)) {
      throw new Error("Analytics SQL API returned an event outside the fixed allowlist");
    }
    if (typeof weighted_events !== "number" || !Number.isFinite(weighted_events) || weighted_events < 0) {
      throw new Error("Analytics SQL API returned an invalid weighted event count");
    }
    const key = `${day_utc}\u0000${event}`;
    if (seen.has(key)) {
      throw new Error("Analytics SQL API returned duplicate aggregated rows");
    }
    seen.add(key);
    return Object.freeze({ day_utc, event, weighted_events });
  });
  return Object.freeze(rows.sort((left, right) => (
    left.day_utc.localeCompare(right.day_utc) || left.event.localeCompare(right.event)
  )));
}

/**
 * Builds a UTC-only, fail-closed report. A day without any returned allowed
 * event is marked missing, not zero: the SQL result alone cannot distinguish
 * an all-zero day from a collection/visibility gap.
 */
export function buildAnalyticsReport(rows, {
  nowFactory = Date.now,
} = {}) {
  if (!Array.isArray(rows)) throw new TypeError("Analytics report rows must be an array");
  const nowMs = finiteTimestamp(nowFactory());
  const fullRange = dateRangeEndingYesterday(REPORT_DAYS, nowMs);
  const expectedDays = utcDays({ start: fullRange.start, days: REPORT_DAYS });
  const expectedDaySet = new Set(expectedDays);
  const rowsByDay = new Map();
  const seen = new Set();

  for (const row of rows) {
    if (!exactObjectKeys(row, ["day_utc", "event", "weighted_events"])) {
      throw new TypeError("Analytics report rows must contain exactly day_utc, event, and weighted_events");
    }
    const day_utc = parseGroupedUtcDay(row.day_utc);
    if (!expectedDaySet.has(day_utc)) {
      throw new Error("Analytics SQL API returned a day outside the fixed complete-UTC reporting range");
    }
    if (!EVENT_SET.has(row.event)) {
      throw new Error("Analytics report rows contain an event outside the fixed allowlist");
    }
    if (typeof row.weighted_events !== "number" || !Number.isFinite(row.weighted_events) || row.weighted_events < 0) {
      throw new Error("Analytics report rows contain an invalid weighted event count");
    }
    const key = `${day_utc}\u0000${row.event}`;
    if (seen.has(key)) throw new Error("Analytics report rows must not contain duplicate day/event pairs");
    seen.add(key);
    const dayRows = rowsByDay.get(day_utc) || [];
    dayRows.push({ day_utc, event: row.event, weighted_events: row.weighted_events });
    rowsByDay.set(day_utc, dayRows);
  }

  const daily = expectedDays.map((day_utc) => {
    const dayRows = rowsByDay.get(day_utc);
    if (!dayRows) {
      return Object.freeze({
        day_utc,
        data_status: "MISSING",
        event_counts: null,
        weighted_events: null,
      });
    }
    const event_counts = sumEventCounts(dayRows);
    return Object.freeze({
      day_utc,
      data_status: "OBSERVED",
      event_counts: Object.freeze(event_counts),
      weighted_events: sumCounts(event_counts),
    });
  });
  const observedRows = rows.flatMap((row) => [row]);
  const totalsByEvent = sumEventCounts(observedRows);
  const observedDays = new Set(rowsByDay.keys());
  const missingDays = expectedDays.filter((day) => !observedDays.has(day));
  const windows = Object.fromEntries(WINDOW_SIZES.map((days) => [
    `D${days}`,
    buildWindowReport(days, observedDays, nowMs),
  ]));

  return Object.freeze({
    schema: REPORT_SCHEMA,
    generated_at_utc: new Date(nowMs).toISOString(),
    timezone: "UTC",
    scope: Object.freeze({
      start_utc: fullRange.start,
      end_utc: fullRange.end,
      complete_utc_days: REPORT_DAYS,
      allowed_events: ANALYTICS_REPORT_EVENTS,
      release_canary_excluded: true,
      event_count_method: "SUM(_sample_interval * double1)",
    }),
    totals: Object.freeze({
      observed_days: observedDays.size,
      missing_days: missingDays,
      event_counts: Object.freeze(totalsByEvent),
      weighted_events: sumCounts(totalsByEvent),
    }),
    windows: Object.freeze(windows),
    daily: Object.freeze(daily),
    caveat: "事件量为采样加权事件，不是独立访客、会话或顺序漏斗；没有返回行的 UTC 日期不能当作 0。",
  });
}

/**
 * Executes exactly one read-only Analytics Engine SQL POST. It never calls the
 * site's event endpoint and never writes a canary. The bearer credential stays
 * only in process memory and is not included in the return value or errors.
 */
export async function queryAnalyticsReport({
  fetchImpl = globalThis.fetch,
  resolveToken = resolveWranglerBearerToken,
  timeoutMs = REQUEST_TIMEOUT_MS,
} = {}) {
  if (typeof fetchImpl !== "function") throw new TypeError("Analytics report requires a fetch implementation");
  if (typeof resolveToken !== "function") throw new TypeError("Analytics report requires a credential resolver");
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) {
    throw new TypeError("Analytics report timeout must be an integer from 1 through 60000 milliseconds");
  }
  const token = bearerToken(await resolveToken());
  let response;
  try {
    response = await fetchImpl(ANALYTICS_SQL_ENDPOINT, {
      method: "POST",
      redirect: "error",
      cache: "no-store",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
        "content-type": "text/plain; charset=utf-8",
      },
      body: analyticsReportSql(),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    throw new Error(`Analytics SQL API request failed before a response: ${error?.name || "network error"}`);
  }
  if (response?.status !== 200) {
    throw new Error(`Analytics SQL API returned status ${response?.status ?? "missing"}`);
  }
  let raw;
  try {
    raw = await response.text();
  } catch (error) {
    throw new Error(`Analytics SQL API response body failed in transit: ${error?.name || "network error"}`);
  }
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error("Analytics SQL API returned invalid JSON");
  }
  return validateAnalyticsReportResponse(response, payload);
}

export async function readAnalyticsReport({
  query = queryAnalyticsReport,
  nowFactory = Date.now,
} = {}) {
  const rows = await query();
  return buildAnalyticsReport(rows, { nowFactory });
}

export function parseAnalyticsReportOptions(args = []) {
  let help = false;
  for (const argument of args) {
    if (argument === "--help" || argument === "-h") help = true;
    else throw new TypeError(`Unknown option: ${argument}`);
  }
  return { help };
}

export async function runAnalyticsReportCli(args = process.argv.slice(2), {
  readReport = readAnalyticsReport,
  write = (value) => process.stdout.write(value),
} = {}) {
  const options = parseAnalyticsReportOptions(args);
  if (options.help) {
    write(
      "Usage: npm run analytics:report\n\n"
      + "Runs one read-only Analytics Engine SQL query for the latest 28 complete UTC days.\n"
      + "It never writes a production event. D1, D7, and D28 stay HOLD until every day\n"
      + "in that trailing UTC window has at least one returned allowlisted event row.\n",
    );
    return Object.freeze({ help: true });
  }
  const report = await readReport();
  write(`${JSON.stringify(report, null, 2)}\n`);
  return report;
}

function publicErrorMessage(error) {
  const message = String(error?.message || "Analytics report failed");
  return message
    .replace(/Bearer\s+[^\s]+/giu, "Bearer [redacted]")
    .replace(/\b(token|credential)\s*[=:]\s*[^\s]+/giu, "$1=[redacted]");
}

const invokedDirectly =
  process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (invokedDirectly) {
  runAnalyticsReportCli().catch((error) => {
    process.stderr.write(`${publicErrorMessage(error)}\n`);
    process.exitCode = 1;
  });
}
