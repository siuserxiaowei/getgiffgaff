import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import {
  calculateReminderDates,
  calculateRoamingCost,
  createReminderIcs,
  initializeEvidenceTools,
  currentRetentionClaim,
  renderKeepNumberTool,
  renderRoamingCostTool,
} from "../public/evidence-tools.js";

const ACTIVE_TARIFF = Object.freeze({
  claimId: "china-roaming-test-fixture",
  status: "ACTIVE",
  checkedAt: "2026-07-15",
  expiresAt: "2026-08-15",
  applicableCountry: "China",
  sourceUrl: "https://www.giffgaff.com/roaming",
  rates: [
    {
      serviceType: "outgoingSms",
      rate: 0.37,
      currency: "GBP",
      billingUnit: "message",
      minimumQuantity: 1,
    },
    {
      serviceType: "outgoingCall",
      rate: 1.11,
      currency: "GBP",
      billingUnit: "minute",
      minimumQuantity: 1,
    },
    {
      serviceType: "incomingCall",
      rate: 0.73,
      currency: "GBP",
      billingUnit: "minute",
      minimumQuantity: 1,
    },
    {
      serviceType: "data",
      rate: 0.19,
      currency: "GBP",
      billingUnit: "MB",
      minimumQuantity: 0.01,
    },
  ],
});

const ACTIVE_RETENTION = Object.freeze({
  claimId: "retention.inactivity_window",
  status: "ACTIVE",
  sourceHealth: "healthy",
  value: "six-month-rule-with-five-month-risk-buffer",
  verifiedAt: "2026-07-15T00:00:00.000Z",
  nextReviewAt: "2026-08-15T00:00:00.000Z",
  expiresAt: "2026-10-15T23:59:59.999Z",
  author: "verified-author-fixture",
  reviewer: "verified-reviewer-fixture",
  evidence: ["Reviewed official inactivity help page."],
  sources: [
    {
      title: "Understanding why your number has been deactivated",
      url: "https://help.giffgaff.com/en/articles/242797-understanding-why-your-number-has-been-deactivated",
    },
  ],
});

test("calculates conservative reminder dates by calendar month and clamps month ends", () => {
  assert.deepEqual(
    calculateReminderDates({
      lastActionDate: "2024-01-31",
      actionReminderMonths: 5,
      today: "2024-02-01",
    }),
    {
      lastActionDate: "2024-01-31",
      preReminderDate: "2024-05-31",
      actionReminderDate: "2024-06-30",
      officialReviewDate: "2024-07-31",
      actionReminderMonths: 5,
    },
  );

  assert.equal(
    calculateReminderDates({
      lastActionDate: "2024-02-29",
      actionReminderMonths: 4,
      today: "2024-03-01",
    }).officialReviewDate,
    "2024-08-29",
  );
});

test("rejects unsafe or non-conservative reminder input", () => {
  assert.throws(() => calculateReminderDates({ lastActionDate: "not-a-date" }), /valid date/i);
  assert.throws(
    () => calculateReminderDates({ lastActionDate: "2026-02-30", today: "2026-03-01" }),
    /valid date/i,
  );
  assert.throws(
    () => calculateReminderDates({ lastActionDate: "2026-04-01", today: "2026-03-01" }),
    /future/i,
  );
  assert.throws(
    () => calculateReminderDates({
      lastActionDate: "2026-01-01",
      actionReminderMonths: 6,
      today: "2026-03-01",
    }),
    /between 2 and 5/i,
  );
});

test("uses a local current date when the calculation caller omits today", () => {
  assert.equal(
    calculateReminderDates({ lastActionDate: "2000-01-01" }).actionReminderDate,
    "2000-06-01",
  );
});

test("builds a local all-day ICS with generic titles and no account identifiers", () => {
  const dates = calculateReminderDates({
    lastActionDate: "2026-01-20",
    actionReminderMonths: 5,
    today: "2026-02-01",
  });
  const ics = createReminderIcs(dates, { generatedAt: "2026-02-01T00:00:00Z" });

  assert.match(ics, /^BEGIN:VCALENDAR\r\nVERSION:2\.0\r\n/);
  assert.match(ics, /DTSTART;VALUE=DATE:20260520/);
  assert.match(ics, /DTSTART;VALUE=DATE:20260620/);
  assert.match(ics, /DTSTART;VALUE=DATE:20260720/);
  assert.match(ics, /SUMMARY:保号预提醒/);
  assert.match(ics, /URL:https:\/\/help\.giffgaff\.com\//);
  assert.doesNotMatch(ics, /(?:phone|mobile|account|email|手机号|账号|邮箱)/i);
  assert.doesNotMatch(ics.replaceAll("\r\n", ""), /\n/);
});

test("rejects malformed ICS inputs and insecure source URLs", () => {
  assert.throws(() => createReminderIcs(null), /required/i);
  assert.throws(
    () => createReminderIcs({
      preReminderDate: "2026-01-01",
      actionReminderDate: "2026-02-01",
      officialReviewDate: "2026-03-01",
    }, { generatedAt: "not-a-timestamp" }),
    /valid timestamp/i,
  );
  const validDates = calculateReminderDates({ lastActionDate: "2026-01-01", today: "2026-02-01" });
  assert.throws(() => createReminderIcs(validDates, { sourceUrl: "%%%" }), /valid URL/i);
  assert.throws(() => createReminderIcs(validDates, { sourceUrl: "http://example.com" }), /HTTPS/i);
});

test("renders an accessible local-only keep-number tool with explicit boundaries", () => {
  const html = renderKeepNumberTool(ACTIVE_RETENTION, {
    now: "2026-07-15T12:00:00.000Z",
  });

  assert.match(html, /<section[^>]+aria-labelledby="keep-number-tool-title"/);
  assert.match(html, /<form[^>]+data-keep-number-form/);
  assert.match(html, /<label[^>]+for="keep-number-last-action"/);
  assert.match(html, /type="date"/);
  assert.match(html, /min="2" max="5" value="5"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /日历月/);
  assert.match(html, /全部计算和 \.ics 生成都在当前浏览器完成/);
  assert.match(html, /不上传、不写入 localStorage/);
  assert.match(html, /不要输入手机号、账号/);
  assert.match(html, /本站的风险缓冲建议/);
  assert.doesNotMatch(html, /<input[^>]+(?:phone|account|email)/i);
  assert.doesNotMatch(html, /<(?:input|select)[^>]+\bname=/i);
  assert.match(html, /<button type="button" data-calculate-reminders>/);
  assert.match(html, /data-retention-claim/);
});

test("keep-number reminder fails closed when review metadata is missing or stale", () => {
  assert.equal(
    currentRetentionClaim(ACTIVE_RETENTION, {
      now: "2026-07-15T12:00:00.000Z",
    })?.claimId,
    ACTIVE_RETENTION.claimId,
  );

  for (const [claim, now] of [
    [undefined, "2026-07-15T12:00:00.000Z"],
    [{ ...ACTIVE_RETENTION, reviewer: null }, "2026-07-15T12:00:00.000Z"],
    [ACTIVE_RETENTION, ACTIVE_RETENTION.nextReviewAt],
    [ACTIVE_RETENTION, "2026-10-16T00:00:00.000Z"],
  ]) {
    assert.equal(currentRetentionClaim(claim, { now }), null);
    const html = renderKeepNumberTool(claim, { now });
    assert.match(html, /暂不计算/);
    assert.match(html, /审核人|复核期限|ACTIVE/);
    assert.match(html, /<fieldset disabled>/);
    assert.doesNotMatch(html, /data-retention-claim/);
    assert.doesNotMatch(html, /data-download-reminders/);
  }
});

test("fails closed without a current ACTIVE tariff claim and never invents a price", () => {
  for (const claim of [
    undefined,
    { ...ACTIVE_TARIFF, status: "SUSPENDED" },
    { ...ACTIVE_TARIFF, expiresAt: "2026-07-14" },
    { ...ACTIVE_TARIFF, rates: ACTIVE_TARIFF.rates.slice(0, 3) },
  ]) {
    const html = renderRoamingCostTool(claim, { today: "2026-07-15" });
    assert.match(html, /暂不计算/);
    assert.match(html, /没有通过发布门禁的 ACTIVE 费率声明/);
    assert.match(html, /<button[^>]+disabled/);
    assert.doesNotMatch(html, /data-roaming-claim/);
    assert.doesNotMatch(html, /(?:£|GBP)\s*\d/i);
  }
});

test("renders an accessible calculator only for a current, complete ACTIVE claim", () => {
  const html = renderRoamingCostTool(ACTIVE_TARIFF, { today: "2026-07-15" });

  assert.match(html, /<section[^>]+aria-labelledby="roaming-cost-tool-title"/);
  assert.match(html, /<form[^>]+data-roaming-cost-form/);
  assert.match(html, /<caption>本次发布所使用的费率声明<\/caption>/);
  assert.match(html, /核验日：<time datetime="2026-07-15">2026-07-15<\/time>/);
  assert.match(html, /失效日：<time datetime="2026-08-15">2026-08-15<\/time>/);
  assert.match(html, /href="https:\/\/www\.giffgaff\.com\/roaming"/);
  assert.match(html, /data-roaming-claim/);
  assert.match(html, /<button type="button" data-calculate-roaming>计算本次参考成本<\/button>/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /不预测未来费率/);
  assert.match(html, /不代表网络覆盖或第三方 OTP 成功/);
  assert.match(html, /全部输入只在当前页面计算/);
  assert.doesNotMatch(html, /<(?:input|select)[^>]+\bname=/i);
});

test("calculates itemized roaming costs with billing increments and optional user FX", () => {
  const result = calculateRoamingCost(
    {
      outgoingSms: 2,
      outgoingCallMinutes: 1.2,
      incomingCallMinutes: 0.2,
      dataMb: 1.234,
      cnyPerCurrencyUnit: 9.25,
    },
    ACTIVE_TARIFF,
    { today: "2026-07-15" },
  );

  assert.deepEqual(result.items.map(({ serviceType, billedQuantity }) => [serviceType, billedQuantity]), [
    ["outgoingSms", 2],
    ["outgoingCall", 2],
    ["incomingCall", 1],
    ["data", 1.24],
  ]);
  assert.equal(result.currency, "GBP");
  assert.equal(result.total, 3.9256);
  assert.equal(result.cnyReference, 36.3118);

  assert.throws(
    () => calculateRoamingCost({ dataMb: 1 }, undefined, { today: "2026-07-15" }),
    /ACTIVE tariff claim/i,
  );
  assert.throws(
    () => calculateRoamingCost({ dataMb: 100001 }, ACTIVE_TARIFF, { today: "2026-07-15" }),
    /safe input limit/i,
  );
  assert.throws(
    () => calculateRoamingCost({ outgoingSms: 0.5 }, ACTIVE_TARIFF, { today: "2026-07-15" }),
    /whole number/i,
  );
  assert.throws(
    () => calculateRoamingCost(
      { cnyPerCurrencyUnit: 0 },
      ACTIVE_TARIFF,
      { today: "2026-07-15" },
    ),
    /greater than zero/i,
  );
});

test("escapes untrusted claim content and rejects unsafe evidence URLs", () => {
  const injected = {
    ...ACTIVE_TARIFF,
    claimId: '"><img src=x onerror=alert(1)>',
  };
  const html = renderRoamingCostTool(injected, { today: "2026-07-15" });
  assert.doesNotMatch(html, /<img|<script>alert/);
  assert.match(html, /\\u003cimg/);

  assert.match(
    renderRoamingCostTool(
      { ...ACTIVE_TARIFF, applicableCountry: "China<script>alert(1)</script>" },
      { today: "2026-07-15" },
    ),
    /暂不计算/,
  );

  const unsafe = renderRoamingCostTool(
    { ...ACTIVE_TARIFF, sourceUrl: "javascript:alert(1)" },
    { today: "2026-07-15" },
  );
  assert.match(unsafe, /暂不计算/);
  assert.doesNotMatch(unsafe, /javascript:/);

  assert.match(
    renderRoamingCostTool(
      { ...ACTIVE_TARIFF, sourceUrl: "not a URL" },
      { today: "2026-07-15" },
    ),
    /暂不计算/,
  );
  assert.match(
    renderRoamingCostTool(
      { ...ACTIVE_TARIFF, checkedAt: "invalid" },
      { today: "2026-07-15" },
    ),
    /暂不计算/,
  );
});

test("browser initializer safely handles documents without mounted tools", () => {
  const selectors = [];
  initializeEvidenceTools({
    querySelectorAll(selector) {
      selectors.push(selector);
      return [];
    },
  });
  assert.deepEqual(selectors, ["#keep-number-tool", "#roaming-cost-tool"]);
});

test("browser module contains no network or persistent-storage calls", async () => {
  const source = await readFile(new URL("../public/evidence-tools.js", import.meta.url), "utf8");

  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /XMLHttpRequest|sendBeacon|WebSocket/);
  assert.doesNotMatch(source, /\b(?:localStorage|sessionStorage|indexedDB)\s*[.(]/);
});
