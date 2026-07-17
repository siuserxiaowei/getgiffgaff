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
    "URL:https://help.giffgaff.com/en/articles/242797-understanding-why-your-number-has-been-deactivated",
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

function moneyAmount(value) {
  if (!Number.isFinite(value)) return null;
  const amount = Math.round((value + Number.EPSILON) * 100) / 100;
  return Number.isFinite(amount) ? amount : null;
}

function billedUnits(value, multiplier = 1) {
  const unroundedUnits = value * multiplier;
  if (!Number.isFinite(unroundedUnits)) return null;
  const units = Math.ceil(Number(unroundedUnits.toFixed(9)));
  return Number.isSafeInteger(units) && units >= 0 ? units : null;
}

export function outgoingCallCharge(minutes, ratePerMinute) {
  const actualMinutes = finiteNonNegative(minutes);
  const rate = finiteNonNegative(ratePerMinute);
  if (actualMinutes === null || rate === null) return null;
  const calculatedSeconds = billedUnits(actualMinutes, 60);
  if (calculatedSeconds === null) return null;
  const billedSeconds = actualMinutes === 0 ? 0 : Math.max(30, calculatedSeconds);
  const amount = moneyAmount((billedSeconds / 60) * rate);
  if (amount === null) return null;
  return {
    actualMinutes,
    billedSeconds,
    amount,
  };
}

export function incomingCallCharge(minutes, ratePerMinute) {
  const actualMinutes = finiteNonNegative(minutes);
  const rate = finiteNonNegative(ratePerMinute);
  if (actualMinutes === null || rate === null) return null;
  const calculatedMinutes = billedUnits(actualMinutes);
  if (calculatedMinutes === null) return null;
  const billedMinutes = actualMinutes === 0 ? 0 : Math.max(1, calculatedMinutes);
  const amount = moneyAmount(billedMinutes * rate);
  if (amount === null) return null;
  return {
    actualMinutes,
    billedMinutes,
    amount,
  };
}

export function roamingCostBreakdown(options = {}) {
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
  const usage = finiteNonNegative(megabytes);
  const smsCount = finiteNonNegative(sms);
  const dataRate = finiteNonNegative(ratePerMegabyte);
  const smsRate = finiteNonNegative(ratePerSms);
  const outgoingCall = outgoingCallCharge(outgoingMinutes, ratePerOutgoingMinute);
  const incomingCall = incomingCallCharge(incomingMinutes, ratePerIncomingMinute);
  if (
    usage === null
    || smsCount === null
    || !Number.isSafeInteger(smsCount)
    || dataRate === null
    || smsRate === null
    || !outgoingCall
    || !incomingCall
    || !evidenceIsCurrent({ expiresAt, now })
  ) return null;

  const dataAmount = moneyAmount(usage * dataRate);
  const smsAmount = moneyAmount(smsCount * smsRate);
  if (dataAmount === null || smsAmount === null) return null;
  const data = {
    megabytes: usage,
    ratePerMegabyte: dataRate,
    amount: dataAmount,
  };
  const sentSms = {
    sent: smsCount,
    ratePerSms: smsRate,
    amount: smsAmount,
  };
  const total = moneyAmount(
    data.amount + sentSms.amount + outgoingCall.amount + incomingCall.amount,
  );
  if (total === null) return null;
  return {
    kind: "china-payg-credit",
    excludesTravelDataAddOn: true,
    data,
    sms: sentSms,
    outgoingCall,
    incomingCall,
    total,
  };
}

export function roamingCost(options = {}) {
  return roamingCostBreakdown(options)?.total ?? null;
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
