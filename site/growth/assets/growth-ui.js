import {
  evidenceIsCurrent,
  keepNumberCalendar,
  keepNumberReminderDate,
  roamingCostBreakdown,
  totalCost,
} from "./tools.js";

function todayIso() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function money(value, currency) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function fieldValue(root, name) {
  return root.querySelector(`[name="${name}"]`)?.value ?? null;
}

function emitToolResult() {
  document.dispatchEvent(new CustomEvent("analytics_event_v1", {
    detail: { event: "tool_result" },
  }));
}

function bindKeepNumber(root) {
  const output = root.querySelector("output");
  const calculate = root.querySelector("[data-calculate]");
  const download = root.querySelector("[data-download-ics]");
  if (!output || !calculate || !download) return;
  let calendar = null;
  calculate.addEventListener("click", () => {
    if (!evidenceIsCurrent({ expiresAt: root.dataset.expires, now: todayIso() })) {
      calendar = null;
      download.disabled = true;
      output.textContent = "规则核验期已过，请先打开官方来源复核；当前不生成日历。";
      return;
    }
    const value = fieldValue(root, "last-action");
    const reminder = keepNumberReminderDate(value);
    calendar = keepNumberCalendar(value);
    if (!reminder || !calendar) {
      download.disabled = true;
      output.textContent = "请输入有效日期。";
      return;
    }
    output.textContent = `第 5 个月操作提醒：${reminder}。这不是号码状态保证，请操作前复核官方规则。`;
    download.disabled = false;
    emitToolResult();
  });
  download.addEventListener("click", () => {
    if (!calendar) return;
    const url = URL.createObjectURL(new Blob([calendar], { type: "text/calendar;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "giffgaff-keep-number-reminder.ics";
    anchor.click();
    URL.revokeObjectURL(url);
  });
}

function bindRoamingCost(root) {
  const output = root.querySelector("output");
  const calculate = root.querySelector("[data-calculate]");
  if (!output || !calculate) return;
  calculate.addEventListener("click", () => {
    const result = roamingCostBreakdown({
      megabytes: fieldValue(root, "megabytes"),
      sms: fieldValue(root, "sms"),
      outgoingMinutes: fieldValue(root, "outgoing-minutes"),
      incomingMinutes: fieldValue(root, "incoming-minutes"),
      ratePerMegabyte: root.dataset.ratePerMegabyte,
      ratePerSms: root.dataset.ratePerSms,
      ratePerOutgoingMinute: root.dataset.ratePerOutgoingMinute,
      ratePerIncomingMinute: root.dataset.ratePerIncomingMinute,
      expiresAt: root.dataset.expires,
      now: todayIso(),
    });
    if (result === null) {
      output.textContent = "费率已过核验期或输入无效，已停止给出数值结果。";
      return;
    }
    output.textContent = `PAYG Credit 估算合计 ${money(result.total, "GBP")}：流量 ${money(result.data.amount, "GBP")}；发出短信 ${money(result.sms.amount, "GBP")}；单次拨打 ${money(result.outgoingCall.amount, "GBP")}（按 ${result.outgoingCall.billedSeconds} 秒）；单次接听 ${money(result.incomingCall.amount, "GBP")}（按 ${result.incomingCall.billedMinutes} 个整分钟）。不含 Travel Data Add-on；实际扣费以运营商账单为准。`;
    emitToolResult();
  });
}

function bindTotalCost(root) {
  const output = root.querySelector("output");
  const calculate = root.querySelector("[data-calculate]");
  if (!output || !calculate) return;
  calculate.addEventListener("click", () => {
    const result = totalCost({
      card: fieldValue(root, "card"),
      balance: fieldValue(root, "balance"),
      shipping: fieldValue(root, "shipping"),
      topup: fieldValue(root, "topup"),
      expectedUsage: fieldValue(root, "usage"),
    });
    if (!result) {
      output.textContent = "请完整填写不小于 0 的金额。";
      return;
    }
    output.textContent = `按本次输入，现金支出为 ${money(result.cashOutlay, "CNY")}；可用余额记录为 £${result.usableBalance.toFixed(2)}，未按未知汇率抵扣。`;
    emitToolResult();
  });
}

for (const root of document.querySelectorAll("[data-tool]")) {
  if (root.dataset.tool === "keep-number") bindKeepNumber(root);
  if (root.dataset.tool === "roaming-cost") bindRoamingCost(root);
  if (root.dataset.tool === "total-cost") bindTotalCost(root);
}
