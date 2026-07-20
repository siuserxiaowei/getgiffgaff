import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  ANALYTICS_REPORT_EVENTS,
  analyticsReportSql,
  buildAnalyticsReport,
  parseAnalyticsReportOptions,
  queryAnalyticsReport,
  readAnalyticsReport,
  runAnalyticsReportCli,
  validateAnalyticsReportResponse,
} from "../scripts/analytics-report.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT_SCRIPT = path.join(ROOT, "scripts", "analytics-report.mjs");
const NOW = Date.parse("2026-07-20T12:00:00.000Z");

function response(data, { status = 200, contentType = "application/json" } = {}) {
  return new Response(JSON.stringify({
    meta: [
      { name: "day_utc", type: "DateTime" },
      { name: "event", type: "String" },
      { name: "weighted_events", type: "Float64" },
    ],
    data,
    rows: data.length,
  }), {
    status,
    headers: { "content-type": contentType },
  });
}

function daysBeforeToday(count = 28) {
  const yesterday = Date.parse("2026-07-19T00:00:00.000Z");
  return Array.from({ length: count }, (_, index) => (
    new Date(yesterday - (count - index - 1) * 86_400_000).toISOString().slice(0, 10)
  ));
}

function pageViews(days = daysBeforeToday()) {
  return days.map((day, index) => ({
    day_utc: `${day} 00:00:00`,
    event: "page_view",
    weighted_events: index + 0.5,
  }));
}

test("analytics report has one fixed UTC SQL statement, event allowlist, and canary exclusion", async () => {
  const sql = analyticsReportSql();
  assert.match(sql, /^SELECT/m);
  assert.match(sql, /FROM getgiffgaff_events_v1/);
  assert.match(sql, /toStartOfDay\(timestamp\) AS day_utc/);
  assert.match(sql, /timestamp < toStartOfDay\(NOW\(\)\)/);
  assert.match(sql, /blob4 != 'seo_release_canary'/);
  assert.match(sql, /SUM\(_sample_interval \* double1\) AS weighted_events/);
  assert.match(sql, /FORMAT JSON$/);
  for (const event of ANALYTICS_REPORT_EVENTS) {
    assert.match(sql, new RegExp(`'${event}'`));
  }
  assert.doesNotMatch(sql, /analytics-event-v1|writeDataPoint|INSERT|DELETE|UPDATE/i);

  const source = await readFile(REPORT_SCRIPT, "utf8");
  assert.doesNotMatch(source, /analytics-event-v1|writeDataPoint/i);
  assert.doesNotMatch(source, /console\.log\([^)]*token|process\.stdout\.write\([^)]*token/i);
});

test("Analytics Engine response validation accepts only exact allowlisted UTC aggregates", () => {
  const accepted = validateAnalyticsReportResponse(response([
    { day_utc: "2026-07-19T00:00:00Z", event: "contact_click", weighted_events: 1.25 },
    { day_utc: "2026-07-18 00:00:00", event: "page_view", weighted_events: 7 },
  ]), {
    meta: [
      { name: "day_utc", type: "DateTime" },
      { name: "event", type: "String" },
      { name: "weighted_events", type: "Float64" },
    ],
    data: [
      { day_utc: "2026-07-19T00:00:00Z", event: "contact_click", weighted_events: 1.25 },
      { day_utc: "2026-07-18 00:00:00", event: "page_view", weighted_events: 7 },
    ],
    rows: 2,
  });
  assert.deepEqual(accepted, [
    { day_utc: "2026-07-18", event: "page_view", weighted_events: 7 },
    { day_utc: "2026-07-19", event: "contact_click", weighted_events: 1.25 },
  ]);

  const validMeta = [
    { name: "day_utc", type: "DateTime" },
    { name: "event", type: "String" },
    { name: "weighted_events", type: "Float64" },
  ];
  const cases = [
    {
      meta: validMeta,
      data: [{ day_utc: "2026-07-19", event: "seo_release_canary", weighted_events: 1 }],
      rows: 1,
    },
    {
      meta: validMeta,
      data: [{ day_utc: "not-a-day", event: "page_view", weighted_events: 1 }],
      rows: 1,
    },
    {
      meta: validMeta,
      data: [{ day_utc: "2026-07-19", event: "page_view", weighted_events: -1 }],
      rows: 1,
    },
    {
      meta: validMeta,
      data: [{ day_utc: "2026-07-19", event: "page_view", weighted_events: 1, source: "search" }],
      rows: 1,
    },
    {
      meta: validMeta,
      data: [
        { day_utc: "2026-07-19", event: "page_view", weighted_events: 1 },
        { day_utc: "2026-07-19", event: "page_view", weighted_events: 2 },
      ],
      rows: 2,
    },
  ];
  for (const payload of cases) {
    assert.throws(
      () => validateAnalyticsReportResponse(response(payload.data), payload),
      /allowlist|UTC day|weighted event|aggregated row|duplicate/i,
    );
  }
  assert.throws(
    () => validateAnalyticsReportResponse(
      response([], { contentType: "text/plain" }),
      { meta: validMeta, data: [], rows: 0 },
    ),
    /expected application\/json/,
  );
});

test("report treats returned UTC dates as observed and does not fabricate zero-data days", () => {
  const complete = buildAnalyticsReport(pageViews(), { nowFactory: () => NOW });
  assert.equal(complete.timezone, "UTC");
  assert.equal(complete.scope.release_canary_excluded, true);
  assert.deepEqual(complete.scope.allowed_events, ANALYTICS_REPORT_EVENTS);
  assert.equal(complete.totals.observed_days, 28);
  assert.deepEqual(complete.totals.missing_days, []);
  assert.equal(complete.windows.D1.status, "READY");
  assert.equal(complete.windows.D7.status, "READY");
  assert.equal(complete.windows.D28.status, "READY");
  assert.equal(complete.daily.at(-1).day_utc, "2026-07-19");
  assert.deepEqual(complete.daily.at(-1).event_counts, {
    commerce_click: 0,
    contact_click: 0,
    growth_related_click: 0,
    page_view: 27.5,
    shop_click: 0,
    tool_result: 0,
  });

  const onlyYesterday = buildAnalyticsReport(pageViews(["2026-07-19"]), { nowFactory: () => NOW });
  assert.equal(onlyYesterday.windows.D1.status, "READY");
  assert.equal(onlyYesterday.windows.D7.status, "HOLD");
  assert.equal(onlyYesterday.windows.D28.status, "HOLD");
  assert.equal(onlyYesterday.windows.D7.observed_days, 1);
  assert.equal(onlyYesterday.windows.D7.missing_days.length, 6);
  assert.equal(onlyYesterday.daily.at(-2).data_status, "MISSING");
  assert.equal(onlyYesterday.daily.at(-2).event_counts, null);
  assert.match(onlyYesterday.windows.D7.reason, /不能按 0 处理/);

  const noData = buildAnalyticsReport([], { nowFactory: () => NOW });
  for (const window of Object.values(noData.windows)) {
    assert.equal(window.status, "HOLD");
  }
  assert.equal(noData.daily.every((row) => row.data_status === "MISSING"), true);
});

test("read-only query makes exactly one Analytics Engine SQL POST and does not return credentials", async () => {
  const calls = [];
  const rows = await queryAnalyticsReport({
    resolveToken: async () => "TOKEN_SHOULD_NEVER_APPEAR_IN_REPORT",
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init });
      return response([{ day_utc: "2026-07-19", event: "page_view", weighted_events: 1 }]);
    },
  });

  assert.deepEqual(rows, [{ day_utc: "2026-07-19", event: "page_view", weighted_events: 1 }]);
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /\/analytics_engine\/sql$/);
  assert.doesNotMatch(calls[0].url, /getgiffgaff\.com|analytics-event-v1/);
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.redirect, "error");
  assert.equal(calls[0].init.cache, "no-store");
  assert.equal(new Headers(calls[0].init.headers).get("content-type"), "text/plain; charset=utf-8");
  assert.match(calls[0].init.body, /blob4 != 'seo_release_canary'/);
  assert.doesNotMatch(JSON.stringify(rows), /TOKEN_SHOULD_NEVER_APPEAR_IN_REPORT/);
});

test("CLI prints a report or help, keeps token-bearing failures out of stdout, and rejects options", async () => {
  const output = [];
  const report = await readAnalyticsReport({
    query: async () => [{ day_utc: "2026-07-19", event: "page_view", weighted_events: 2 }],
    nowFactory: () => NOW,
  });
  assert.equal(report.windows.D1.status, "READY");

  const result = await runAnalyticsReportCli([], {
    readReport: async () => report,
    write: (value) => output.push(value),
  });
  assert.equal(result, report);
  assert.match(output.at(-1), /"D28"/);
  assert.doesNotMatch(output.at(-1), /TOKEN_SHOULD_NEVER_APPEAR_IN_REPORT/);

  assert.deepEqual(parseAnalyticsReportOptions(["--help"]), { help: true });
  assert.throws(() => parseAnalyticsReportOptions(["--days", "7"]), /Unknown option/);
  const help = await runAnalyticsReportCli(["--help"], {
    write: (value) => output.push(value),
  });
  assert.deepEqual(help, { help: true });
  assert.match(output.at(-1), /read-only Analytics Engine SQL/);
});
