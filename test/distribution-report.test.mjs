import assert from "node:assert/strict";
import test from "node:test";

import {
  assessDistributionMetrics,
  buildDistributionReport,
  distributionReportSql,
} from "../scripts/distribution-report.mjs";

test("distribution SQL is read-only and fixed to anonymous tool dimensions", () => {
  const sql = distributionReportSql();
  assert.match(sql, /blob1 AS path/);
  assert.match(sql, /blob2 AS source/);
  assert.match(sql, /dist_uneed/);
  assert.match(sql, /dist_tinylaunch/);
  assert.match(sql, /blob4 != 'seo_release_canary'/);
  assert.doesNotMatch(sql, /\b(?:INSERT|UPDATE|DELETE|DROP)\b/iu);
});

test("D7 and D28 gates follow the launch plan", () => {
  assert.equal(assessDistributionMetrics({ page_view: 9 }, 7).status, "INSUFFICIENT_TRAFFIC");
  assert.equal(assessDistributionMetrics({
    page_view: 20,
    tool_result: 5,
    commerce_click: 1,
  }, 7).status, "STRONG_SIGNAL");
  assert.equal(assessDistributionMetrics({ page_view: 14 }, 7).status, "OPTIMIZE_ONCE");
  assert.equal(assessDistributionMetrics({
    page_view: 20,
    tool_result: 4,
    contact_click: 2,
  }, 28).status, "CLICK_SIGNAL_MET");
});

test("report groups complete UTC windows by path, source and event", () => {
  const report = buildDistributionReport([
    {
      day_utc: "2026-07-23 00:00:00",
      path: "/tools/keep-number-reminder/",
      source: "dist_uneed",
      event: "page_view",
      weighted_events: 20,
    },
    {
      day_utc: "2026-07-23",
      path: "/tools/keep-number-reminder/",
      source: "dist_uneed",
      event: "tool_result",
      weighted_events: 5,
    },
    {
      day_utc: "2026-07-23",
      path: "/tools/keep-number-reminder/",
      source: "dist_uneed",
      event: "contact_click",
      weighted_events: 1,
    },
  ], Date.parse("2026-07-24T12:00:00Z"));
  const launch = report.launches.find(({ path, source }) => (
    path === "/tools/keep-number-reminder/" && source === "dist_uneed"
  ));
  assert.equal(launch.windows.d7.assessment.status, "STRONG_SIGNAL");
  assert.equal(launch.windows.d7.counts.page_view, 20);
  assert.match(report.privacy, /no tool inputs/i);
  assert.match(report.manual_funnel, /do not claim cross-device attribution/i);
});
