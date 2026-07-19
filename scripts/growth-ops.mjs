#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ROUTE_MANIFEST } from "../public/route-manifest.js";

const CANONICAL_ORIGIN = "https://getgiffgaff.com";

export const ATTRIBUTION_SOURCES = Object.freeze({
  wechat_group: "dist_wechat_group",
  xiaohongshu: "dist_xiaohongshu",
  wechat_official: "dist_wechat_official",
  partner: "dist_partner",
  private_share: "dist_private_share",
  google_ads: "paid_google",
  microsoft_ads: "paid_microsoft",
});

const SOURCE_VALUES = new Set(Object.values(ATTRIBUTION_SOURCES));
const PAID_SOURCES = new Set([
  ATTRIBUTION_SOURCES.google_ads,
  ATTRIBUTION_SOURCES.microsoft_ads,
]);
const PUBLIC_CANONICAL_PATHS = new Set(Object.keys(ROUTE_MANIFEST));

export const DAILY_LEDGER_FIELDS = Object.freeze([
  "date_utc",
  "page_views",
  "commerce_clicks",
  "contact_clicks",
  "received_messages",
  "qualified_consultations",
  "quotes_sent",
  "payments",
  "revenue_cny",
  "variable_cost_cny",
  "gross_profit_cny",
  "notes",
]);

const DEFAULT_THRESHOLDS = Object.freeze({
  minDailyPageViews: 10,
  minMessagesForPaymentSignal: 10,
  minPaymentPerMessage: 0.1,
});

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n\r]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < String(text).length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"' && field === "") {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/u, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (quoted) throw new TypeError("CSV contains an unterminated quoted field");
  if (field !== "" || row.length) {
    row.push(field.replace(/\r$/u, ""));
    rows.push(row);
  }
  return rows.filter((values) => values.some((value) => value !== ""));
}

export function buildAttributionUrl({ source, pathname = "/" } = {}) {
  const resolvedSource = ATTRIBUTION_SOURCES[source] || source;
  if (!SOURCE_VALUES.has(resolvedSource)) {
    throw new TypeError(
      `Unknown source ${JSON.stringify(source)}; use one of ${Object.keys(ATTRIBUTION_SOURCES).join(", ")}`,
    );
  }
  const rawPath = String(pathname || "/").trim();
  if (!rawPath.startsWith("/") || rawPath.startsWith("//")) {
    throw new TypeError("Path must be a same-origin path beginning with one slash");
  }
  if (rawPath.includes("%")) {
    throw new TypeError("Path must not contain encoded path segments");
  }
  if (/\d{6,}/u.test(rawPath)) {
    throw new TypeError("Path must not contain sensitive long digit sequences");
  }
  let url;
  try {
    url = new URL(rawPath, CANONICAL_ORIGIN);
  } catch {
    throw new TypeError("Path is not a valid same-origin URL path");
  }
  if (url.origin !== CANONICAL_ORIGIN || url.username || url.password) {
    throw new TypeError("Path must stay on https://getgiffgaff.com");
  }
  if (url.search || url.hash) {
    throw new TypeError("Path must not contain query parameters or a fragment");
  }
  if (url.pathname !== rawPath || !PUBLIC_CANONICAL_PATHS.has(rawPath)) {
    throw new TypeError("Path must exactly match a canonical public route");
  }
  url.searchParams.set("utm_source", resolvedSource);
  return url.href;
}

export function attributionMatrix(pathname = "/") {
  return Object.entries(ATTRIBUTION_SOURCES).map(([label, source]) => ({
    label,
    source,
    kind: PAID_SOURCES.has(source) ? "paid" : "distribution",
    url: buildAttributionUrl({ source, pathname }),
  }));
}

export function dailyLedgerTemplate({ startDate, days = 28 } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(String(startDate || ""))) {
    throw new TypeError("startDate must be YYYY-MM-DD in UTC");
  }
  if (!Number.isSafeInteger(days) || days < 1 || days > 366) {
    throw new TypeError("days must be an integer from 1 to 366");
  }
  const firstDay = new Date(`${startDate}T00:00:00Z`);
  if (Number.isNaN(firstDay.valueOf()) || firstDay.toISOString().slice(0, 10) !== startDate) {
    throw new TypeError("startDate is not a valid calendar date");
  }
  const lines = [DAILY_LEDGER_FIELDS.join(",")];
  for (let offset = 0; offset < days; offset += 1) {
    const day = new Date(firstDay.valueOf() + offset * 86_400_000).toISOString().slice(0, 10);
    lines.push(DAILY_LEDGER_FIELDS.map((field) => (
      field === "date_utc" ? day : ""
    )).map(csvCell).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function safeIntegerCount(value, field, lineNumber, errors) {
  const text = String(value ?? "").trim();
  if (text === "") return null;
  const number = Number(text);
  if (!Number.isSafeInteger(number) || number < 0) {
    errors.push(`line ${lineNumber}: ${field} must be a non-negative integer or blank`);
    return null;
  }
  return number;
}

function safeEventCount(value, field, lineNumber, errors) {
  const text = String(value ?? "").trim();
  if (text === "") return null;
  const number = Number(text);
  if (!Number.isFinite(number) || number < 0) {
    errors.push(`line ${lineNumber}: ${field} must be a non-negative number or blank`);
    return null;
  }
  return number;
}

function safeMoney(value, field, lineNumber, errors, { signed = false } = {}) {
  const text = String(value ?? "").trim();
  if (text === "") return null;
  const number = Number(text);
  if (!Number.isFinite(number) || (!signed && number < 0)) {
    errors.push(
      `line ${lineNumber}: ${field} must be a ${signed ? "finite" : "non-negative"} number or blank`,
    );
    return null;
  }
  return number;
}

export function validateDailyLedger(csvText) {
  const errors = [];
  let rows;
  try {
    rows = parseCsv(String(csvText || "").replace(/^\uFEFF/u, ""));
  } catch (error) {
    return { errors: [error.message], records: [] };
  }
  if (!rows.length) return { errors: ["ledger is empty"], records: [] };
  const headers = rows[0];
  if (headers.join(",") !== DAILY_LEDGER_FIELDS.join(",")) {
    errors.push(`header must equal ${DAILY_LEDGER_FIELDS.join(",")}`);
  }
  const records = [];
  for (const [index, values] of rows.slice(1).entries()) {
    const lineNumber = index + 2;
    if (values.length !== DAILY_LEDGER_FIELDS.length) {
      errors.push(`line ${lineNumber}: expected ${DAILY_LEDGER_FIELDS.length} columns, got ${values.length}`);
      continue;
    }
    const row = Object.fromEntries(DAILY_LEDGER_FIELDS.map((field, fieldIndex) => [field, values[fieldIndex]]));
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(row.date_utc)) {
      errors.push(`line ${lineNumber}: date_utc must be YYYY-MM-DD`);
    } else {
      const parsed = new Date(`${row.date_utc}T00:00:00Z`);
      if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== row.date_utc) {
        errors.push(`line ${lineNumber}: date_utc is not a valid date`);
      }
    }
    const record = { date_utc: row.date_utc, notes: row.notes };
    for (const field of ["page_views", "commerce_clicks", "contact_clicks"]) {
      record[field] = safeEventCount(row[field], field, lineNumber, errors);
    }
    for (const field of [
      "received_messages",
      "qualified_consultations",
      "quotes_sent",
      "payments",
    ]) {
      record[field] = safeIntegerCount(row[field], field, lineNumber, errors);
    }
    record.revenue_cny = safeMoney(row.revenue_cny, "revenue_cny", lineNumber, errors);
    record.variable_cost_cny = safeMoney(
      row.variable_cost_cny,
      "variable_cost_cny",
      lineNumber,
      errors,
    );
    record.gross_profit_cny = safeMoney(
      row.gross_profit_cny,
      "gross_profit_cny",
      lineNumber,
      errors,
      { signed: true },
    );
    const counts = [
      "page_views",
      "commerce_clicks",
      "contact_clicks",
      "received_messages",
      "qualified_consultations",
      "quotes_sent",
      "payments",
    ];
    const enteredCounts = counts.filter((field) => record[field] !== null);
    if (enteredCounts.length > 0 && enteredCounts.length < counts.length) {
      errors.push(`line ${lineNumber}: all seven count fields are required once any count is entered`);
    }
    if (record.gross_profit_cny !== null && record.revenue_cny !== null && record.variable_cost_cny !== null) {
      const expected = record.revenue_cny - record.variable_cost_cny;
      if (Math.abs(expected - record.gross_profit_cny) > 0.01) {
        errors.push(`line ${lineNumber}: gross_profit_cny must equal revenue_cny - variable_cost_cny`);
      }
    }
    if (enteredCounts.length === counts.length) records.push(record);
  }
  const seen = new Set();
  for (const record of records) {
    if (seen.has(record.date_utc)) errors.push(`duplicate date row: ${record.date_utc}`);
    seen.add(record.date_utc);
  }
  return { errors, records };
}

function ratio(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : null;
}

function fixed(value) {
  return value === null ? null : Number(value.toFixed(4));
}

export function evaluateGrowthWindow(records, {
  expectedDays = 7,
  thresholds = {},
  asOfDate,
} = {}) {
  if (![7, 28].includes(expectedDays)) throw new TypeError("expectedDays must be 7 or 28");
  const limits = Object.fromEntries(Object.keys(DEFAULT_THRESHOLDS).map((name) => [
    name,
    Object.hasOwn(thresholds, name) ? thresholds[name] : DEFAULT_THRESHOLDS[name],
  ]));
  const validDates = [...new Set(records.map(({ date_utc }) => date_utc))].sort();
  const terminalDate = asOfDate || validDates.at(-1) || null;
  const terminalValue = terminalDate
    ? new Date(`${terminalDate}T00:00:00Z`).valueOf()
    : Number.NaN;
  if (terminalDate && (
    !/^\d{4}-\d{2}-\d{2}$/u.test(terminalDate) ||
    Number.isNaN(terminalValue) ||
    new Date(terminalValue).toISOString().slice(0, 10) !== terminalDate
  )) {
    throw new TypeError("asOfDate must be a valid YYYY-MM-DD UTC date");
  }
  const expectedDateSet = Number.isNaN(terminalValue)
    ? new Set()
    : new Set(Array.from({ length: expectedDays }, (_, index) => (
        new Date(terminalValue - index * 86_400_000).toISOString().slice(0, 10)
      )));
  const completeDates = validDates.filter((date) => {
    const dayRows = records.filter((record) => record.date_utc === date);
    return dayRows.length > 0 && dayRows.every((record) => {
      const eventFieldsComplete = [
        "page_views",
        "commerce_clicks",
        "contact_clicks",
      ].every((field) => Number.isFinite(record[field]) && record[field] >= 0);
      const manualFieldsComplete = [
        "received_messages",
        "qualified_consultations",
        "quotes_sent",
        "payments",
      ].every((field) => Number.isSafeInteger(record[field]) && record[field] >= 0);
      return eventFieldsComplete && manualFieldsComplete;
    });
  });
  const trailingDates = completeDates.filter((date) => expectedDateSet.has(date)).slice(-expectedDays);
  const consecutive = trailingDates.length === expectedDays && trailingDates.every((date, index) => (
    index === 0 || new Date(`${date}T00:00:00Z`).valueOf()
      - new Date(`${trailingDates[index - 1]}T00:00:00Z`).valueOf() === 86_400_000
  ));
  if (
    !consecutive ||
    (terminalDate && trailingDates.at(-1) !== terminalDate)
  ) {
    return {
      status: "HOLD",
      windowDays: expectedDays,
      completeConsecutiveDays: trailingDates.length,
      reason: `截至 ${terminalDate || "未指定日期"} 需要 ${expectedDays} 个连续完整 UTC 自然日；当前窗口可用 ${trailingDates.length} 个`,
      recommendations: ["继续按同一 UTC 口径记录，不把残缺时段或空白当作 0"],
    };
  }

  const windowRows = records.filter(({ date_utc }) => trailingDates.includes(date_utc));
  const eventAndOutcomeFields = [
    "page_views",
    "commerce_clicks",
    "contact_clicks",
    "received_messages",
    "qualified_consultations",
    "quotes_sent",
    "payments",
  ];
  const financialFields = ["revenue_cny", "variable_cost_cny", "gross_profit_cny"];
  const financialsComplete = windowRows.every((record) => (
    financialFields.every((field) => Number.isFinite(record[field]))
  ));
  const totals = Object.fromEntries(eventAndOutcomeFields.map((field) => [
    field,
    windowRows.reduce((sum, record) => sum + record[field], 0),
  ]));
  for (const field of financialFields) {
    totals[field] = financialsComplete
      ? windowRows.reduce((sum, record) => sum + record[field], 0)
      : null;
  }
  const signals = {
    averageDailyPageViews: fixed(totals.page_views / expectedDays),
    averageDailyCommerceClicks: fixed(totals.commerce_clicks / expectedDays),
    averageDailyContactClicks: fixed(totals.contact_clicks / expectedDays),
    averageDailyReceivedMessages: fixed(totals.received_messages / expectedDays),
    qualifiedPerMessage: fixed(ratio(totals.qualified_consultations, totals.received_messages)),
    quotePerQualified: fixed(ratio(totals.quotes_sent, totals.qualified_consultations)),
    paymentPerMessage: fixed(ratio(totals.payments, totals.received_messages)),
    paymentPerQuote: fixed(ratio(totals.payments, totals.quotes_sent)),
  };
  const recommendations = [];
  if (signals.averageDailyPageViews < limits.minDailyPageViews) {
    recommendations.push("TRAFFIC: 扩大已标记社群/合作分发，并优化现有 Bing 高曝光页面；外链只做相关编辑型机会");
  } else if (totals.received_messages === 0) {
    recommendations.push("CONSULTATION-RECEIPT: 将 commerce/contact 事件量作为独立趋势线索，真机排查微信/Telegram 拉起、账号可用性和客服实际收件");
  }
  if (
    totals.received_messages >= limits.minMessagesForPaymentSignal &&
    (signals.paymentPerMessage ?? 0) < limits.minPaymentPerMessage
  ) {
    recommendations.push("PAYMENT-FRICTION: 先核对价格、SKU、信任与政策；仅在支付门禁全通过后评估托管结账");
  }
  if (!financialsComplete) {
    recommendations.push("FINANCIALS-HOLD: 收入、变动成本或毛利存在空白；未知值不按 0 计，不给出依赖毛利的放大渠道或广告建议");
  } else if (
    recommendations.length === 0
    && totals.gross_profit_cny > 0
  ) {
    recommendations.push("SCALE: 财务字段完整且本窗口毛利为正；仍只可结合 source/page 独立趋势信号与全站人工结果，进入受控实验复核");
  } else if (recommendations.length === 0) {
    recommendations.push("FINANCIALS-REVIEW: 财务字段完整，但本窗口毛利不为正；先复核价格、成本和履约，不放大渠道");
  }
  return {
    status: "READY",
    windowDays: expectedDays,
    startDateUtc: trailingDates[0],
    endDateUtc: trailingDates.at(-1),
    financialsComplete,
    totals,
    signals,
    thresholds: limits,
    recommendations,
    caveat: "page_view、commerce_click 和 contact_click 只是独立趋势信号，commerce_click 混合多个阶段，不是顺序漏斗分母。这些也不是行业基准、独立访客转化率或因果结论。",
  };
}

export function paymentReadiness(input = {}) {
  const gates = {
    businessIdentityAndKyc: input.businessIdentityAndKyc === true,
    serverSideSkuPriceStock: input.serverSideSkuPriceStock === true,
    reviewedPolicies: input.reviewedPolicies === true,
    ordersAndIdempotentWebhooks: input.ordersAndIdempotentWebhooks === true,
    fulfillmentRefundReconciliation: input.fulfillmentRefundReconciliation === true,
    evidencePackageValidated: input.evidencePackageValidated === true,
    paymentFrictionObserved: input.paymentFrictionObserved === true,
  };
  const blockers = Object.entries(gates).filter(([, passed]) => !passed).map(([name]) => name);
  return {
    status: blockers.length ? "NO-GO" : "GO-FOR-CONTROLLED-PILOT-REVIEW",
    gates,
    blockers,
    caveat: "通过本地门禁不等于商户审批、法务意见、库存证明、生产部署或收款成功。",
  };
}

export function advertisingReadiness(input = {}) {
  const gates = {
    explicitOwnerAuthorization: input.explicitOwnerAuthorization === true,
    paidAttributionDeployedAndReadBack: input.paidAttributionDeployedAndReadBack === true,
    sevenCompleteUtcDays: input.sevenCompleteUtcDays === true,
    qualifiedConsultationRecorded: input.qualifiedConsultationRecorded === true,
    contributionMarginKnown: input.contributionMarginKnown === true,
    landingPageAndPolicyReviewed: input.landingPageAndPolicyReviewed === true,
    budgetAndStopLossApproved: input.budgetAndStopLossApproved === true,
  };
  const blockers = Object.entries(gates).filter(([, passed]) => !passed).map(([name]) => name);
  return {
    status: blockers.length ? "NO-GO" : "GO-FOR-MANUAL-CAMPAIGN-REVIEW",
    gates,
    blockers,
    caveat: "该结果不创建广告、不授权花费；账户所有者仍须人工审核关键词、地域、预算和落地页。",
  };
}

function help() {
  return `Usage:
  node scripts/growth-ops.mjs utm --source <label|fixed_value> [--path /guides/6-pitfalls/]
  node scripts/growth-ops.mjs utm-matrix [--path /]
  node scripts/growth-ops.mjs init-ledger --start-date YYYY-MM-DD [--days 28] [--out path.csv]
  node scripts/growth-ops.mjs report --file path.csv [--window 7|28] [--as-of YYYY-MM-DD]
  node scripts/growth-ops.mjs payment-gate [--input readiness.json]
  node scripts/growth-ops.mjs ads-gate [--input readiness.json]

Exit codes: success/READY = 0; validation or command error = 1; readiness NO-GO = 2; report HOLD: 3.
Browser event counts are independent trend signals. commerce_click mixes multiple stages and is not a stable funnel denominator.
Commands are local-only. They do not send outreach, configure GSC/Bing, create ads, spend money, submit URLs or start payments.`;
}

function parseOptions(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) throw new TypeError(`Unexpected argument: ${arg}`);
    const [name, inline] = arg.slice(2).split("=", 2);
    options[name] = inline ?? args[++index];
    if (options[name] === undefined) throw new TypeError(`Missing value for --${name}`);
  }
  return options;
}

async function readJsonInput(filePath) {
  if (!filePath) return {};
  return JSON.parse(await readFile(path.resolve(filePath), "utf8"));
}

export async function runGrowthOpsCli(
  args = process.argv.slice(2),
  { log = console.log, error = console.error } = {},
) {
  const [command, ...rest] = args;
  if (!command || command === "help" || command === "--help" || command === "-h") {
    log(help());
    return 0;
  }
  const options = parseOptions(rest);
  if (command === "utm") {
    log(buildAttributionUrl({ source: options.source, pathname: options.path || "/" }));
    return 0;
  }
  if (command === "utm-matrix") {
    log(attributionMatrix(options.path || "/").map(({ label, kind, url }) => `${label}\t${kind}\t${url}`).join("\n"));
    return 0;
  }
  if (command === "init-ledger") {
    const csv = dailyLedgerTemplate({ startDate: options["start-date"], days: Number(options.days || 28) });
    if (options.out) {
      await writeFile(path.resolve(options.out), csv, { encoding: "utf8", flag: "wx" });
      log(`Created ${path.resolve(options.out)}`);
    } else {
      log(csv.trimEnd());
    }
    return 0;
  }
  if (command === "report") {
    if (!options.file) throw new TypeError("report requires --file");
    const result = validateDailyLedger(await readFile(path.resolve(options.file), "utf8"));
    if (result.errors.length) {
      result.errors.forEach((message) => error(message));
      return 1;
    }
    const report = evaluateGrowthWindow(result.records, {
      expectedDays: Number(options.window || 7),
      asOfDate: options["as-of"],
    });
    log(JSON.stringify(report, null, 2));
    return report.status === "HOLD" ? 3 : 0;
  }
  if (command === "payment-gate" || command === "ads-gate") {
    const input = await readJsonInput(options.input);
    const result = command === "payment-gate" ? paymentReadiness(input) : advertisingReadiness(input);
    log(JSON.stringify(result, null, 2));
    return result.status === "NO-GO" ? 2 : 0;
  }
  throw new TypeError(`Unknown command: ${command}\n${help()}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runGrowthOpsCli().then((exitCode) => {
    process.exitCode = exitCode;
  }).catch((caught) => {
    console.error(caught.message);
    process.exitCode = 1;
  });
}
