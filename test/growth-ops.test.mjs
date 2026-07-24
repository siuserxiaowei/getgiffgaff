import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  ATTRIBUTION_SOURCES,
  advertisingReadiness,
  attributionMatrix,
  buildAttributionUrl,
  dailyLedgerTemplate,
  evaluateGrowthWindow,
  paymentReadiness,
  runGrowthOpsCli,
  validateDailyLedger,
} from "../scripts/growth-ops.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function record(date, values = {}) {
  return {
    date_utc: date,
    source: "organic_search",
    page_views: 20,
    commerce_clicks: 4,
    contact_clicks: 2,
    received_messages: 2,
    qualified_consultations: 1,
    quotes_sent: 1,
    payments: 1,
    revenue_cny: 100,
    variable_cost_cny: 60,
    gross_profit_cny: 40,
    notes: "",
    ...values,
  };
}

function dates(start, count) {
  const first = new Date(`${start}T00:00:00Z`);
  return Array.from({ length: count }, (_, index) => (
    new Date(first.valueOf() + index * 86_400_000).toISOString().slice(0, 10)
  ));
}

test("UTM links use only fixed first-party attribution values and one query parameter", () => {
  const expected = [
    "dist_wechat_group",
    "dist_xiaohongshu",
    "dist_wechat_official",
    "dist_partner",
    "dist_private_share",
    "dist_uneed",
    "dist_tinylaunch",
    "paid_google",
    "paid_microsoft",
  ];
  assert.deepEqual(Object.values(ATTRIBUTION_SOURCES), expected);

  const url = new URL(buildAttributionUrl({
    source: "wechat_group",
    pathname: "/guides/6-pitfalls/",
  }));
  assert.equal(url.href, "https://getgiffgaff.com/guides/6-pitfalls/?utm_source=dist_wechat_group");
  assert.deepEqual([...url.searchParams], [["utm_source", "dist_wechat_group"]]);

  const matrix = attributionMatrix("/shop/");
  assert.equal(matrix.length, 9);
  assert.equal(matrix.filter(({ kind }) => kind === "paid").length, 2);
  assert.throws(
    () => buildAttributionUrl({ source: "private-person-name", pathname: "/" }),
    /Unknown source/,
  );
  for (const unsafePath of [
    "https://evil.test/",
    "//evil.test/",
    "/shop/?phone=13800000000",
    "/shop/#secret",
    "/not-a-public-route/",
    "/contact/../",
    "/guides/%36-pitfalls/",
    "/orders/13800000000/",
  ]) {
    assert.throws(
      () => buildAttributionUrl({ source: "partner", pathname: unsafePath }),
      /same-origin|query parameters|canonical public route|encoded|sensitive/,
    );
  }
});

test("daily ledger template is privacy-minimal, 28-day ready and strictly validated", () => {
  const csv = dailyLedgerTemplate({ startDate: "2026-07-20", days: 2 });
  assert.match(csv, /^date_utc,page_views,commerce_clicks,contact_clicks,received_messages,/);
  assert.doesNotMatch(csv, /name|phone|email|wechat_id|message_text/iu);
  const result = validateDailyLedger(csv);
  assert.deepEqual(result.errors, []);
  assert.equal(result.records.length, 0, "blank template rows must not be treated as zero-event days");
  assert.equal(csv.trimEnd().split("\n").length, 3, "one header plus one aggregate row per day");

  const invalid = `${csv.trimEnd()}\n2026-07-20,1,1,,,,,,,,,contains incomplete data\n`;
  assert.match(validateDailyLedger(invalid).errors.join("\n"), /all seven count fields/);

  const validNegativeMargin = [
    "date_utc,page_views,commerce_clicks,contact_clicks,received_messages,qualified_consultations,quotes_sent,payments,revenue_cny,variable_cost_cny,gross_profit_cny,notes",
    "2026-07-20,1.5,1,1,1,1,1,1,10,12,-2,loss day",
  ].join("\n");
  const checked = validateDailyLedger(validNegativeMargin);
  assert.deepEqual(checked.errors, []);
  assert.equal(checked.records[0].page_views, 1.5, "sample-weighted event counts may be fractional");
  assert.equal(checked.records[0].gross_profit_cny, -2);
});

test("D7 and D28 reports hold unless the exact trailing UTC window is complete", () => {
  const sixDays = dates("2026-07-20", 6).map((date) => record(date));
  const hold = evaluateGrowthWindow(sixDays, {
    expectedDays: 7,
    asOfDate: "2026-07-26",
  });
  assert.equal(hold.status, "HOLD");
  assert.match(hold.reason, /7 个连续完整 UTC/);

  const missingMiddle = dates("2026-07-20", 7)
    .filter((date) => date !== "2026-07-23")
    .map((date) => record(date));
  assert.equal(evaluateGrowthWindow(missingMiddle, {
    expectedDays: 7,
    asOfDate: "2026-07-26",
  }).status, "HOLD");

  const oldCompleteWindow = dates("2026-07-01", 7).map((date) => record(date));
  assert.equal(evaluateGrowthWindow(oldCompleteWindow, {
    expectedDays: 7,
    asOfDate: "2026-07-26",
  }).status, "HOLD");

  const twentyEight = dates("2026-07-20", 28).map((date) => record(date));
  assert.equal(evaluateGrowthWindow(twentyEight, {
    expectedDays: 28,
    asOfDate: "2026-08-16",
  }).status, "READY");
  assert.throws(
    () => evaluateGrowthWindow(twentyEight, { expectedDays: 7, asOfDate: "2026-02-31" }),
    /valid YYYY-MM-DD/,
  );

  const fractionalEvents = dates("2026-07-20", 7).map((date) => record(date, {
    page_views: 10.5,
    commerce_clicks: 1.25,
    contact_clicks: 0.5,
  }));
  assert.equal(evaluateGrowthWindow(fractionalEvents, {
    expectedDays: 7,
    asOfDate: "2026-07-26",
  }).status, "READY", "sample-weighted fractional events form a complete day");
  assert.equal(evaluateGrowthWindow(
    fractionalEvents.map((row, index) => (
      index === 3 ? { ...row, received_messages: 0.5 } : row
    )),
    { expectedDays: 7, asOfDate: "2026-07-26" },
  ).status, "HOLD", "manual message counts must remain whole numbers");
});

test("diagnostic routing treats browser events as independent trends and manual outcomes as a separate funnel", () => {
  const window = (values) => dates("2026-07-20", 7).map((date) => record(date, values));
  const evaluate = (values) => evaluateGrowthWindow(window(values), {
    expectedDays: 7,
    asOfDate: "2026-07-26",
  });

  assert.match(evaluate({ page_views: 5 }).recommendations[0], /^TRAFFIC:/);
  const independentEvents = evaluate({
    page_views: 100,
    commerce_clicks: 1,
    contact_clicks: 0,
    received_messages: 0,
    qualified_consultations: 0,
    quotes_sent: 0,
    payments: 0,
  });
  assert.equal(independentEvents.signals.averageDailyCommerceClicks, 1);
  assert.equal(independentEvents.signals.averageDailyContactClicks, 0);
  for (const removedRatio of [
    "commercePerPageView",
    "contactPerCommerce",
    "messagePerContact",
  ]) {
    assert.equal(removedRatio in independentEvents.signals, false, removedRatio);
  }
  assert.deepEqual(
    Object.keys(independentEvents.thresholds).sort(),
    ["minDailyPageViews", "minMessagesForPaymentSignal", "minPaymentPerMessage"].sort(),
  );
  assert.match(independentEvents.recommendations[0], /^CONSULTATION-RECEIPT:/);
  assert.match(independentEvents.caveat, /独立趋势信号.*不是顺序漏斗/);

  const paymentFriction = evaluate({
    page_views: 100,
    commerce_clicks: 10,
    contact_clicks: 5,
    received_messages: 2,
    payments: 0,
  });
  assert.match(paymentFriction.recommendations.join("\n"), /PAYMENT-FRICTION/);
  assert.match(paymentFriction.caveat, /不是行业基准/);
});

test("unknown financial fields stay null and block margin-dependent scale advice", () => {
  const records = dates("2026-07-20", 7).map((date) => record(date, {
    revenue_cny: null,
    variable_cost_cny: null,
    gross_profit_cny: null,
  }));
  const report = evaluateGrowthWindow(records, {
    expectedDays: 7,
    asOfDate: "2026-07-26",
  });

  assert.equal(report.status, "READY");
  assert.equal(report.financialsComplete, false);
  assert.equal(report.totals.revenue_cny, null);
  assert.equal(report.totals.variable_cost_cny, null);
  assert.equal(report.totals.gross_profit_cny, null);
  assert.doesNotMatch(report.recommendations.join("\n"), /^SCALE:/m);
  assert.match(report.recommendations.join("\n"), /FINANCIALS-HOLD/);

  const complete = evaluateGrowthWindow(
    dates("2026-07-20", 7).map((date) => record(date)),
    { expectedDays: 7, asOfDate: "2026-07-26" },
  );
  assert.equal(complete.financialsComplete, true);
  assert.equal(complete.totals.gross_profit_cny, 280);
  assert.match(complete.recommendations.join("\n"), /SCALE/);
});

test("ads and payment gates fail closed and never represent an external action", () => {
  const adsNoGo = advertisingReadiness();
  assert.equal(adsNoGo.status, "NO-GO");
  assert.equal(adsNoGo.blockers.length, 7);
  const adsReady = advertisingReadiness(Object.fromEntries(
    Object.keys(adsNoGo.gates).map((name) => [name, true]),
  ));
  assert.equal(adsReady.status, "GO-FOR-MANUAL-CAMPAIGN-REVIEW");
  assert.match(adsReady.caveat, /不创建广告、不授权花费/);

  const paymentNoGo = paymentReadiness();
  assert.equal(paymentNoGo.status, "NO-GO");
  assert.equal(paymentNoGo.blockers.length, 7);
  const paymentReady = paymentReadiness(Object.fromEntries(
    Object.keys(paymentNoGo.gates).map((name) => [name, true]),
  ));
  assert.equal(paymentReady.status, "GO-FOR-CONTROLLED-PILOT-REVIEW");
  assert.match(paymentReady.caveat, /不等于商户审批/);
  assert.equal(advertisingReadiness({ explicitOwnerAuthorization: "true" }).status, "NO-GO");
  assert.equal(paymentReadiness({ businessIdentityAndKyc: 1 }).status, "NO-GO");
});

test("CLI generates links and ledgers and exposes HOLD and NO-GO with distinct exit codes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-growth-ops-"));
  try {
    const ledgerPath = path.join(root, "daily.csv");
    const logs = [];
    const errors = [];
    const io = { log: (message) => logs.push(message), error: (message) => errors.push(message) };
    assert.equal(await runGrowthOpsCli([
      "utm",
      "--source",
      "xiaohongshu",
      "--path",
      "/guides/6-pitfalls/",
    ], io), 0);
    assert.match(logs.at(-1), /utm_source=dist_xiaohongshu/);
    assert.equal(await runGrowthOpsCli([
      "init-ledger",
      "--start-date",
      "2026-07-20",
      "--days",
      "7",
      "--out",
      ledgerPath,
    ], io), 0);
    assert.match(await readFile(ledgerPath, "utf8"), /2026-07-26/);
    assert.equal(await runGrowthOpsCli([
      "report",
      "--file",
      ledgerPath,
      "--window",
      "7",
      "--as-of",
      "2026-07-26",
    ], io), 3);
    assert.match(logs.at(-1), /"status": "HOLD"/);
    assert.equal(await runGrowthOpsCli(["ads-gate"], io), 2);

    assert.equal(await runGrowthOpsCli(["help"], io), 0);
    assert.match(logs.at(-1), /report HOLD:\s*3/);

    const readinessPath = path.join(root, "readiness.json");
    await writeFile(readinessPath, JSON.stringify({ explicitOwnerAuthorization: true }));
    assert.equal(await runGrowthOpsCli(["ads-gate", "--input", readinessPath], io), 2);
    assert.deepEqual(errors, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("privacy facts document matches the current tab-scoped attribution storage", async () => {
  const facts = await readFile(
    path.join(ROOT, "docs", "adsense", "PRIVACY-FACTS-NEEDED.md"),
    "utf8",
  );
  assert.match(facts, /固定白名单来源[^\n]*sessionStorage/);
  assert.match(facts, /当前标签页|关闭标签页/);
  assert.doesNotMatch(facts, /不使用 Cookie\/localStorage\/sessionStorage/);

  const runbook = await readFile(
    path.join(ROOT, "docs", "operations", "growth-operations-runbook-2026-07-19.md"),
    "utf8",
  );
  assert.match(runbook, /commerce_click[^\n]*混合多个阶段/);
  assert.match(runbook, /独立趋势信号/);
  assert.doesNotMatch(runbook, /commerce\/page view 5%|contact\/commerce 25%|实际消息\/contact 50%/);
});
