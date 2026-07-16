function finiteNonNegative(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function isoDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(date.getTime())
    || date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

function formatIsoDate(date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function keepNumberReminderDate(lastActionDate) {
  const date = isoDate(lastActionDate);
  if (!date) return null;
  const originalDay = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + 5);
  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(originalDay, lastDay));
  return formatIsoDate(date);
}

export function keepNumberCalendar(lastActionDate) {
  const reminder = keepNumberReminderDate(lastActionDate);
  if (!reminder) return null;
  const compact = reminder.replaceAll("-", "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//getgiffgaff//Keep Number Reminder//ZH-CN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:keep-number-${compact}@getgiffgaff.com`,
    `DTSTART;VALUE=DATE:${compact}`,
    "SUMMARY:检查 giffgaff 保号状态",
    "DESCRIPTION:打开官方 inactive 规则，核对账号、余额和可验证的有效动作。第 5 个月提醒是本站风险缓冲建议。",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function evidenceIsCurrent({ expiresAt, now } = {}) {
  const expiry = isoDate(expiresAt);
  const current = isoDate(now);
  return Boolean(expiry && current && current <= expiry);
}

export function roamingCost(options = {}) {
  const {
    megabytes,
    sms = 0,
    outgoingMinutes = 0,
    incomingMinutes = 0,
    ratePerMegabyte,
    ratePerSms = 0.3,
    ratePerOutgoingMinute = 1,
    ratePerIncomingMinute = 1,
    expiresAt,
    now,
  } = options || {};
  const values = [
    megabytes,
    sms,
    outgoingMinutes,
    incomingMinutes,
    ratePerMegabyte,
    ratePerSms,
    ratePerOutgoingMinute,
    ratePerIncomingMinute,
  ].map(finiteNonNegative);
  if (values.includes(null) || !evidenceIsCurrent({ expiresAt, now })) {
    return null;
  }
  const [usage, smsCount, outgoing, incoming, dataRate, smsRate, outgoingRate, incomingRate] = values;
  const total = usage * dataRate
    + smsCount * smsRate
    + outgoing * outgoingRate
    + incoming * incomingRate;
  return Math.round((total + Number.EPSILON) * 100) / 100;
}

export function totalCost(options = {}) {
  const {
    card,
    balance,
    shipping,
    topup,
    expectedUsage,
  } = options || {};
  const cardCost = finiteNonNegative(card);
  const usableBalance = finiteNonNegative(balance);
  const shippingCost = finiteNonNegative(shipping);
  const topupCost = finiteNonNegative(topup);
  const usageCost = finiteNonNegative(expectedUsage);
  if ([cardCost, usableBalance, shippingCost, topupCost, usageCost].includes(null)) return null;
  const gross = Math.round(
    (cardCost + shippingCost + topupCost + usageCost + Number.EPSILON) * 100,
  ) / 100;
  return {
    gross,
    usableBalance,
    cashOutlay: gross,
  };
}
