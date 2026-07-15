const KEEP_NUMBER_SOURCE =
  "https://help.giffgaff.com/en/articles/242797-understanding-why-your-number-has-been-deactivated";
const ROAMING_SOURCE = "https://www.giffgaff.com/roaming";
const REQUIRED_RATE_TYPES = Object.freeze([
  "outgoingSms",
  "outgoingCall",
  "incomingCall",
  "data",
]);

const RATE_META = Object.freeze({
  outgoingSms: { label: "主动短信", usageKey: "outgoingSms", unit: "message", inputLabel: "主动短信（条）" },
  outgoingCall: {
    label: "主动通话",
    usageKey: "outgoingCallMinutes",
    unit: "minute",
    inputLabel: "主动通话（分钟）",
  },
  incomingCall: {
    label: "接听通话",
    usageKey: "incomingCallMinutes",
    unit: "minute",
    inputLabel: "接听通话（分钟）",
  },
  data: { label: "移动数据", usageKey: "dataMb", unit: "MB", inputLabel: "移动数据（MB）" },
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeJson(value) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) => {
    const hex = character.codePointAt(0).toString(16).padStart(4, "0");
    return `\\u${hex}`;
  });
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function parseDateOnly(value, label = "date") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    throw new TypeError(`${label} must be a valid date in YYYY-MM-DD format`);
  }

  const [year, month, day] = String(value).split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new RangeError(`${label} must be a valid date`);
  }

  return { value: String(value), year, month, day };
}

function formatDateOnly(year, month, day) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function addCalendarMonths(dateValue, months) {
  const { year, month, day } = parseDateOnly(dateValue);
  const targetMonthIndex = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(targetMonthIndex / 12);
  const targetMonth = (targetMonthIndex % 12) + 1;
  const finalDay = Math.min(day, new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate());
  return formatDateOnly(targetYear, targetMonth, finalDay);
}

function addCalendarDays(dateValue, days) {
  const { year, month, day } = parseDateOnly(dateValue);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return formatDateOnly(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
}

/**
 * Calculate conservative local reminders using calendar months, not a fixed day count.
 * The official-review boundary remains six months; the action reminder is configurable
 * only from two to five months so the tool cannot encourage waiting until that boundary.
 */
export function calculateReminderDates({
  lastActionDate,
  actionReminderMonths = 5,
  today = localToday(),
} = {}) {
  const lastAction = parseDateOnly(lastActionDate, "lastActionDate");
  const currentDate = parseDateOnly(today, "today");

  if (lastAction.value > currentDate.value) {
    throw new RangeError("lastActionDate cannot be in the future");
  }
  if (
    !Number.isInteger(actionReminderMonths) ||
    actionReminderMonths < 2 ||
    actionReminderMonths > 5
  ) {
    throw new RangeError("actionReminderMonths must be an integer between 2 and 5");
  }

  return {
    lastActionDate: lastAction.value,
    preReminderDate: addCalendarMonths(lastAction.value, actionReminderMonths - 1),
    actionReminderDate: addCalendarMonths(lastAction.value, actionReminderMonths),
    officialReviewDate: addCalendarMonths(lastAction.value, 6),
    actionReminderMonths,
  };
}

function toIcsDate(dateValue) {
  parseDateOnly(dateValue);
  return dateValue.replaceAll("-", "");
}

function toIcsTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("generatedAt must be a valid timestamp");
  }
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value) {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Create a standards-based, all-day calendar file containing generic local reminders. */
export function createReminderIcs(
  dates,
  { generatedAt = new Date().toISOString(), sourceUrl = KEEP_NUMBER_SOURCE } = {},
) {
  if (!dates || typeof dates !== "object") {
    throw new TypeError("calculated reminder dates are required");
  }

  const events = [
    ["pre", dates.preReminderDate, "保号预提醒", "提前查看当前官方规则，确认可用动作与当日费用。"],
    ["action", dates.actionReminderDate, "保号操作提醒", "核对当前官方规则后，完成可验证的有效动作。"],
    ["review", dates.officialReviewDate, "保号规则复核", "这是重新核对官方页面的日期，不是有效期保证。"],
  ];
  const timestamp = toIcsTimestamp(generatedAt);
  let source;
  try {
    source = new URL(sourceUrl);
  } catch {
    throw new TypeError("sourceUrl must be a valid URL");
  }
  if (source.protocol !== "https:") {
    throw new TypeError("sourceUrl must use HTTPS");
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//getgiffgaff//Keep Number Reminder//ZH-CN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const [key, dateValue, summary, description] of events) {
    parseDateOnly(dateValue, `${key} reminder date`);
    lines.push(
      "BEGIN:VEVENT",
      `UID:keep-number-${key}-${toIcsDate(dateValue)}@getgiffgaff.com`,
      `DTSTAMP:${timestamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(dateValue)}`,
      `DTEND;VALUE=DATE:${toIcsDate(addCalendarDays(dateValue, 1))}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      `DESCRIPTION:${escapeIcsText(description)}`,
      `URL:${source.href}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

function isOfficialGiffgaffUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "giffgaff.com" || url.hostname.endsWith(".giffgaff.com"))
    );
  } catch {
    return false;
  }
}

function parsedInstant(value) {
  const instant = new Date(value);
  return Number.isNaN(instant.valueOf()) ? null : instant;
}

export function currentRetentionClaim(claim, { now = new Date() } = {}) {
  try {
    const timestamp = parsedInstant(now);
    if (!timestamp || !claim || typeof claim !== "object" || Array.isArray(claim)) return null;
    if (claim.claimId !== "retention.inactivity_window") return null;
    if (claim.status !== "ACTIVE" || claim.sourceHealth !== "healthy") return null;
    if (claim.value !== "six-month-rule-with-five-month-risk-buffer") return null;
    if (typeof claim.author !== "string" || !claim.author.trim()) return null;
    if (typeof claim.reviewer !== "string" || !claim.reviewer.trim()) return null;
    if (!Array.isArray(claim.evidence) || claim.evidence.length === 0) return null;
    if (!Array.isArray(claim.sources) || claim.sources.length === 0) return null;

    const verifiedAt = parsedInstant(claim.verifiedAt);
    const nextReviewAt = parsedInstant(claim.nextReviewAt);
    const expiresAt = parsedInstant(claim.expiresAt);
    if (!verifiedAt || !nextReviewAt || !expiresAt) return null;
    if (verifiedAt > timestamp || nextReviewAt <= timestamp || expiresAt < timestamp) return null;
    if (verifiedAt >= nextReviewAt || nextReviewAt > expiresAt) return null;

    const sources = claim.sources
      .filter((source) => source && isOfficialGiffgaffUrl(source.url))
      .map((source) => ({ title: String(source.title || "giffgaff 官方来源"), url: new URL(source.url).href }));
    if (sources.length !== claim.sources.length) return null;
    const source = sources.find(({ url }) => url === KEEP_NUMBER_SOURCE) || sources[0];

    return {
      claimId: claim.claimId,
      status: "ACTIVE",
      sourceHealth: "healthy",
      value: claim.value,
      verifiedAt: verifiedAt.toISOString(),
      nextReviewAt: nextReviewAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      author: claim.author,
      reviewer: claim.reviewer,
      evidence: [...claim.evidence].map(String),
      sources,
      sourceUrl: source.url,
    };
  } catch {
    return null;
  }
}

function currentTariffClaim(claim, { today = localToday() } = {}) {
  try {
    const currentDate = parseDateOnly(today, "today").value;
    if (!claim || typeof claim !== "object" || Array.isArray(claim)) return null;
    if (claim.status !== "ACTIVE") return null;

    const claimId = claim.claimId ?? claim.claim_id;
    if (typeof claimId !== "string" || claimId.length < 1 || claimId.length > 160) return null;
    if (!/^(?:China|中国)$/.test(claim.applicableCountry)) return null;
    const checkedAt = parseDateOnly(claim.checkedAt, "checkedAt").value;
    const expiresAt = parseDateOnly(claim.expiresAt, "expiresAt").value;
    if (checkedAt > currentDate || expiresAt < currentDate || expiresAt < checkedAt) return null;
    if (!isOfficialGiffgaffUrl(claim.sourceUrl)) return null;
    if (!Array.isArray(claim.rates) || claim.rates.length !== REQUIRED_RATE_TYPES.length) return null;

    const seen = new Set();
    const normalizedRates = [];
    for (const rate of claim.rates) {
      if (!rate || typeof rate !== "object" || seen.has(rate.serviceType)) return null;
      const meta = RATE_META[rate.serviceType];
      if (!meta || rate.billingUnit !== meta.unit) return null;
      if (!Number.isFinite(rate.rate) || rate.rate < 0 || rate.rate > 1_000_000) return null;
      if (!/^[A-Z]{3}$/.test(rate.currency)) return null;
      if (
        !Number.isFinite(rate.minimumQuantity) ||
        rate.minimumQuantity <= 0 ||
        rate.minimumQuantity > 10_000
      ) return null;
      if (rate.serviceType === "outgoingSms" && rate.minimumQuantity !== 1) return null;
      seen.add(rate.serviceType);
      normalizedRates.push({
        serviceType: rate.serviceType,
        rate: rate.rate,
        currency: rate.currency,
        billingUnit: rate.billingUnit,
        minimumQuantity: rate.minimumQuantity,
      });
    }
    if (!REQUIRED_RATE_TYPES.every((serviceType) => seen.has(serviceType))) return null;
    const currencies = new Set(normalizedRates.map(({ currency }) => currency));
    if (currencies.size !== 1) return null;

    return {
      claimId,
      status: "ACTIVE",
      checkedAt,
      expiresAt,
      applicableCountry: claim.applicableCountry,
      sourceUrl: new URL(claim.sourceUrl).href,
      rates: REQUIRED_RATE_TYPES.map(
        (serviceType) => normalizedRates.find((rate) => rate.serviceType === serviceType),
      ),
    };
  } catch {
    return null;
  }
}

function boundedUsage(value, label, maximum, { integer = false } = {}) {
  const normalized = value === undefined || value === "" ? 0 : Number(value);
  if (!Number.isFinite(normalized) || normalized < 0 || normalized > maximum) {
    throw new RangeError(`${label} exceeds the safe input limit`);
  }
  if (integer && !Number.isInteger(normalized)) {
    throw new RangeError(`${label} must be a whole number`);
  }
  return normalized;
}

function round(value, places = 8) {
  return Number(value.toFixed(places));
}

function billableQuantity(quantity, increment) {
  if (quantity === 0) return 0;
  return round(Math.ceil((quantity - Number.EPSILON) / increment) * increment);
}

/** Calculate an itemized estimate only when a complete, unexpired ACTIVE claim is present. */
export function calculateRoamingCost(usage = {}, tariffClaim, options = {}) {
  const claim = currentTariffClaim(tariffClaim, options);
  if (!claim) {
    throw new Error("A current, complete ACTIVE tariff claim is required");
  }

  const values = {
    outgoingSms: boundedUsage(usage.outgoingSms, "outgoingSms", 10_000, { integer: true }),
    outgoingCallMinutes: boundedUsage(
      usage.outgoingCallMinutes,
      "outgoingCallMinutes",
      10_000,
    ),
    incomingCallMinutes: boundedUsage(
      usage.incomingCallMinutes,
      "incomingCallMinutes",
      10_000,
    ),
    dataMb: boundedUsage(usage.dataMb, "dataMb", 100_000),
  };

  const items = claim.rates.map((rate) => {
    const quantity = values[RATE_META[rate.serviceType].usageKey];
    const billedQuantity = billableQuantity(quantity, rate.minimumQuantity);
    return {
      serviceType: rate.serviceType,
      quantity,
      billedQuantity,
      rate: rate.rate,
      cost: round(billedQuantity * rate.rate),
    };
  });
  const total = round(items.reduce((sum, item) => sum + item.cost, 0));

  let cnyReference = null;
  if (usage.cnyPerCurrencyUnit !== undefined && usage.cnyPerCurrencyUnit !== "") {
    const exchangeRate = boundedUsage(
      usage.cnyPerCurrencyUnit,
      "cnyPerCurrencyUnit",
      1_000,
    );
    if (exchangeRate === 0) {
      throw new RangeError("cnyPerCurrencyUnit must be greater than zero when provided");
    }
    cnyReference = round(total * exchangeRate, 4);
  }

  return {
    claimId: claim.claimId,
    checkedAt: claim.checkedAt,
    expiresAt: claim.expiresAt,
    currency: claim.rates[0].currency,
    items,
    total,
    cnyReference,
  };
}

function renderDisabledKeepNumberTool() {
  return `<section class="evidence-tool" id="keep-number-tool" aria-labelledby="keep-number-tool-title">
  <div class="evidence-tool__heading">
    <p class="evidence-tool__eyebrow">规则门禁 · Fail closed</p>
    <h2 id="keep-number-tool-title">giffgaff 保号提醒</h2>
  </div>
  <div class="evidence-tool__notice evidence-tool__notice--blocked" role="status">
    <strong>暂不计算：</strong>保号规则声明尚未同时满足 ACTIVE 状态、真实作者与审核人、官方证据和当前复核期限。旧缓存或过期声明也不能继续导出提醒。
  </div>
  <form class="evidence-tool__form" aria-describedby="keep-number-disabled-boundary">
    <fieldset disabled>
      <legend>本地提醒</legend>
      <label for="keep-number-disabled-date">最近一次可验证动作日期</label>
      <input id="keep-number-disabled-date" type="date">
      <button type="button" disabled>计算本地提醒</button>
    </fieldset>
  </form>
  <p id="keep-number-disabled-boundary" class="evidence-tool__boundary">请先打开<a href="${KEEP_NUMBER_SOURCE}" rel="external noopener">giffgaff 当前官方页面</a>人工核对。业务方补齐真实复核人并重新激活声明后，工具才会开放。</p>
</section>`;
}

export function renderKeepNumberTool(retentionClaim, options = {}) {
  const claim = currentRetentionClaim(retentionClaim, options);
  if (!claim) return renderDisabledKeepNumberTool();

  return `<section class="evidence-tool" id="keep-number-tool" aria-labelledby="keep-number-tool-title">
  <div class="evidence-tool__heading">
    <p class="evidence-tool__eyebrow">本地工具 · 不收集个人资料</p>
    <h2 id="keep-number-tool-title">giffgaff 保号提醒</h2>
    <p>输入最近一次可验证动作的日期，用日历月计算预提醒、操作提醒和六个月规则复核日。本站的风险缓冲建议不是运营商的新规则。</p>
    <p>核验日：<time datetime="${claim.verifiedAt}">${claim.verifiedAt.slice(0, 10)}</time>；下次复核：<time datetime="${claim.nextReviewAt}">${claim.nextReviewAt.slice(0, 10)}</time>；最晚失效：<time datetime="${claim.expiresAt}">${claim.expiresAt.slice(0, 10)}</time>。</p>
  </div>
  <div class="evidence-tool__notice" id="keep-number-privacy">
    <strong>隐私方法：</strong>全部计算和 .ics 生成都在当前浏览器完成；不上传、不写入 localStorage，本工具不主动保存输入。不要输入手机号、账号、密码或验证码。
  </div>
  <form class="evidence-tool__form" data-keep-number-form aria-describedby="keep-number-privacy keep-number-boundary">
    <div class="evidence-tool__field">
      <label for="keep-number-last-action">最近一次可验证动作日期</label>
      <input id="keep-number-last-action" type="date" required autocomplete="off">
    </div>
    <div class="evidence-tool__field">
      <label for="keep-number-action-type">动作类型</label>
      <select id="keep-number-action-type">
        <option value="unknown">不确定</option>
        <option value="outgoing-call">主动通话</option>
        <option value="outgoing-sms">主动 SMS/MMS</option>
        <option value="mobile-data">移动数据连接</option>
        <option value="credit-plan">购买 Credit/plan</option>
      </select>
    </div>
    <div class="evidence-tool__field">
      <label for="keep-number-buffer-months">操作提醒间隔（月）</label>
      <input id="keep-number-buffer-months" type="number" min="2" max="5" value="5" step="1" inputmode="numeric" required>
      <small>可设 2–5 个月；不允许设到第 6 个月，以便预留排障缓冲。</small>
    </div>
    <div class="evidence-tool__actions">
      <button type="button" data-calculate-reminders>计算本地提醒</button>
      <button type="button" data-download-reminders disabled>下载 .ics</button>
    </div>
  </form>
  <div class="evidence-tool__result" data-keep-number-result role="status" aria-live="polite">计算后会在这里显示三个日期。</div>
  <p id="keep-number-boundary" class="evidence-tool__boundary">
    <strong>边界：</strong>保号动作和六个月说明可能更新，操作前请重新打开<a href="${escapeHtml(claim.sourceUrl)}" rel="external noopener">当前官方页面</a>。单纯接收短信不是工具默认认定的有效动作；本工具不保证号码继续有效。
  </p>
  <script type="application/json" data-retention-claim>${safeJson(claim)}</script>
</section>`;
}

function renderDisabledRoamingTool() {
  return `<section class="evidence-tool" id="roaming-cost-tool" aria-labelledby="roaming-cost-tool-title">
  <div class="evidence-tool__heading">
    <p class="evidence-tool__eyebrow">费率门禁 · Fail closed</p>
    <h2 id="roaming-cost-tool-title">中国漫游成本工具</h2>
  </div>
  <div class="evidence-tool__notice evidence-tool__notice--blocked" role="status">
    <strong>暂不计算：</strong>没有通过发布门禁的 ACTIVE 费率声明。本页不写死价格，也不用过期或缺项数据返回伪精确结果。
  </div>
  <form class="evidence-tool__form" data-roaming-cost-form aria-describedby="roaming-disabled-boundary">
    <fieldset disabled>
      <legend>预计用量</legend>
      <label for="roaming-disabled-sms">主动短信（条）</label>
      <input id="roaming-disabled-sms" type="number" min="0" value="0">
      <button type="button" disabled>计算本次参考成本</button>
    </fieldset>
  </form>
  <p id="roaming-disabled-boundary" class="evidence-tool__boundary">请先打开<a href="${ROAMING_SOURCE}" rel="external noopener">giffgaff 当前漫游页</a>人工核对。费率、计费单位和适用条件齐全前，计算功能保持关闭。</p>
</section>`;
}

export function renderRoamingCostTool(tariffClaim, options = {}) {
  const claim = currentTariffClaim(tariffClaim, options);
  if (!claim) return renderDisabledRoamingTool();

  const currency = claim.rates[0].currency;
  const rateRows = claim.rates.map((rate) => `<tr>
      <th scope="row">${RATE_META[rate.serviceType].label}</th>
      <td>${escapeHtml(rate.rate)} ${escapeHtml(rate.currency)} / ${escapeHtml(rate.billingUnit)}</td>
      <td>${escapeHtml(rate.minimumQuantity)} ${escapeHtml(rate.billingUnit)}</td>
    </tr>`).join("");
  const fields = claim.rates.map((rate) => {
    const meta = RATE_META[rate.serviceType];
    const id = `roaming-${rate.serviceType}`;
    const step = rate.serviceType === "outgoingSms" ? "1" : "0.01";
    const maximum = rate.serviceType === "data" ? "100000" : "10000";
    return `<div class="evidence-tool__field">
      <label for="${id}">${meta.inputLabel}</label>
      <input id="${id}" type="number" min="0" max="${maximum}" step="${step}" value="0" inputmode="decimal" required>
    </div>`;
  }).join("");

  return `<section class="evidence-tool" id="roaming-cost-tool" aria-labelledby="roaming-cost-tool-title">
  <div class="evidence-tool__heading">
    <p class="evidence-tool__eyebrow">ACTIVE 费率声明 · 本地试算</p>
    <h2 id="roaming-cost-tool-title">中国漫游成本工具</h2>
    <p>核验日：<time datetime="${claim.checkedAt}">${claim.checkedAt}</time>；失效日：<time datetime="${claim.expiresAt}">${claim.expiresAt}</time>。超过失效日后，浏览器会拒绝计算。</p>
  </div>
  <div class="evidence-tool__table" tabindex="0" role="region" aria-label="可滚动的费率声明表">
    <table>
      <caption>本次发布所使用的费率声明</caption>
      <thead><tr><th scope="col">服务</th><th scope="col">费率</th><th scope="col">最小计费单位</th></tr></thead>
      <tbody>${rateRows}</tbody>
    </table>
  </div>
  <p><a href="${escapeHtml(claim.sourceUrl)}" rel="external noopener">打开这份声明的 giffgaff 官方来源</a></p>
  <div class="evidence-tool__notice" id="roaming-local-method"><strong>方法：</strong>用量按声明中的最小计费单位向上取整，再分项求和。全部输入只在当前页面计算，不上传、不保存。</div>
  <form class="evidence-tool__form" data-roaming-cost-form aria-describedby="roaming-local-method roaming-active-boundary">
    <fieldset>
      <legend>预计用量</legend>
      <div class="evidence-tool__grid">${fields}</div>
      <div class="evidence-tool__field">
        <label for="roaming-cny-rate">1 ${escapeHtml(currency)} 兑换多少 CNY（可选，由你填写）</label>
        <input id="roaming-cny-rate" type="number" min="0.0001" max="1000" step="0.0001" inputmode="decimal" placeholder="不提供默认汇率">
      </div>
      <button type="button" data-calculate-roaming>计算本次参考成本</button>
    </fieldset>
  </form>
  <div class="evidence-tool__result" data-roaming-cost-result role="status" aria-live="polite">输入预计用量后才会计算。</div>
  <p id="roaming-active-boundary" class="evidence-tool__boundary"><strong>边界：</strong>本工具不预测未来费率，不代表网络覆盖或第三方 OTP 成功。移动数据可能快速产生费用；不使用时请关闭数据漫游和后台数据。</p>
  <script type="application/json" data-roaming-claim>${safeJson(claim)}</script>
</section>`;
}

function formatAmount(value) {
  return round(value, 4).toFixed(4).replace(/\.?0+$/, "");
}

function initializeKeepNumberTool(section) {
  if (section.dataset.initialized === "true") return;
  section.dataset.initialized = "true";
  const form = section.querySelector("[data-keep-number-form]");
  const result = section.querySelector("[data-keep-number-result]");
  const download = section.querySelector("[data-download-reminders]");
  const calculate = section.querySelector("[data-calculate-reminders]");
  const dateInput = section.querySelector("#keep-number-last-action");
  const monthsInput = section.querySelector("#keep-number-buffer-months");
  const actionInput = section.querySelector("#keep-number-action-type");
  const claimElement = section.querySelector("[data-retention-claim]");
  if (!form || !result || !download || !calculate || !dateInput || !monthsInput || !actionInput || !claimElement) return;

  let claim;
  try {
    claim = JSON.parse(claimElement.textContent);
  } catch {
    claim = null;
  }
  if (!currentRetentionClaim(claim)) {
    for (const control of form.elements) control.disabled = true;
    result.textContent = "保号声明已到复核日、已失效或无法校验，计算和导出均已关闭。";
    return;
  }

  dateInput.max = localToday();
  let currentDates = null;
  form.addEventListener("input", () => {
    currentDates = null;
    download.disabled = true;
  });
  form.addEventListener("submit", (event) => event.preventDefault());
  calculate.addEventListener("click", () => {
    try {
      const currentClaim = currentRetentionClaim(claim);
      if (!currentClaim) throw new Error("保号声明已到复核日或失效，请重新加载并人工核对官方规则");
      currentDates = calculateReminderDates({
        lastActionDate: dateInput.value,
        actionReminderMonths: Number(monthsInput.value),
      });
      const actionType = actionInput.value;
      const actionNote = actionType === "unknown"
        ? "动作类型不确定：工具不判定其是否有效。"
        : "所选类型属于当前官方页面列明的类别，但操作当日仍需复核条件。";
      result.textContent = `预提醒：${currentDates.preReminderDate}；操作提醒：${currentDates.actionReminderDate}；官方规则复核：${currentDates.officialReviewDate}。${actionNote}`;
      download.disabled = false;
    } catch (error) {
      currentDates = null;
      download.disabled = true;
      result.textContent = `无法计算：${error.message}`;
    }
  });
  download.addEventListener("click", () => {
    const currentClaim = currentRetentionClaim(claim);
    if (!currentDates || !currentClaim) {
      currentDates = null;
      download.disabled = true;
      result.textContent = "保号声明已到复核日或失效，日历导出已关闭。";
      return;
    }
    const blob = new Blob([
      createReminderIcs(currentDates, { sourceUrl: currentClaim.sourceUrl }),
    ], { type: "text/calendar;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "keep-number-reminders.ics";
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  });
}

function initializeRoamingTool(section) {
  if (section.dataset.initialized === "true") return;
  section.dataset.initialized = "true";
  const form = section.querySelector("[data-roaming-cost-form]");
  const result = section.querySelector("[data-roaming-cost-result]");
  const claimElement = section.querySelector("[data-roaming-claim]");
  const calculate = section.querySelector("[data-calculate-roaming]");
  if (!form || !result || !claimElement || !calculate) return;

  let claim;
  try {
    claim = JSON.parse(claimElement.textContent);
  } catch {
    claim = null;
  }
  if (!currentTariffClaim(claim)) {
    for (const control of form.elements) control.disabled = true;
    result.textContent = "费率声明已过期或无法校验，计算已关闭。";
    return;
  }

  form.addEventListener("submit", (event) => event.preventDefault());
  calculate.addEventListener("click", () => {
    try {
      const output = calculateRoamingCost(
        {
          outgoingSms: section.querySelector("#roaming-outgoingSms").value,
          outgoingCallMinutes: section.querySelector("#roaming-outgoingCall").value,
          incomingCallMinutes: section.querySelector("#roaming-incomingCall").value,
          dataMb: section.querySelector("#roaming-data").value,
          cnyPerCurrencyUnit: section.querySelector("#roaming-cny-rate").value,
        },
        claim,
      );
      const details = output.items.map((item) => {
        const label = RATE_META[item.serviceType].label;
        return `${label} ${formatAmount(item.cost)} ${output.currency}`;
      }).join("；");
      const cny = output.cnyReference === null
        ? ""
        : `；按你填写的汇率换算约 ${formatAmount(output.cnyReference)} CNY`;
      result.textContent = `${details}。合计 ${formatAmount(output.total)} ${output.currency}${cny}。`;
    } catch (error) {
      result.textContent = `无法计算：${error.message}`;
    }
  });
}

export function initializeEvidenceTools(root = document) {
  root.querySelectorAll("#keep-number-tool").forEach(initializeKeepNumberTool);
  root.querySelectorAll("#roaming-cost-tool").forEach(initializeRoamingTool);
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initializeEvidenceTools(), { once: true });
  } else {
    initializeEvidenceTools();
  }
}
