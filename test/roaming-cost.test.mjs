import assert from "node:assert/strict";
import test from "node:test";

import {
  incomingCallCharge,
  outgoingCallCharge,
  roamingCost,
  roamingCostBreakdown,
} from "../site/growth/assets/tools.js";
import { renderGrowthPage } from "../scripts/build-growth-pages.mjs";
import { GROWTH_PAGES } from "../site/growth/content-registry.js";
import { readFile } from "node:fs/promises";

const CURRENT_EVIDENCE = Object.freeze({
  expiresAt: "2026-08-15",
  now: "2026-07-17",
});

test("outgoing China PAYG calls use a 30-second minimum then per-second billing", () => {
  assert.deepEqual(outgoingCallCharge(0, 1), {
    actualMinutes: 0,
    billedSeconds: 0,
    amount: 0,
  });
  assert.deepEqual(outgoingCallCharge(0.1, 1), {
    actualMinutes: 0.1,
    billedSeconds: 30,
    amount: 0.5,
  });
  assert.deepEqual(outgoingCallCharge(0.5, 1), {
    actualMinutes: 0.5,
    billedSeconds: 30,
    amount: 0.5,
  });
  assert.deepEqual(outgoingCallCharge(0.51, 1), {
    actualMinutes: 0.51,
    billedSeconds: 31,
    amount: 0.52,
  });
  assert.deepEqual(outgoingCallCharge(1.1, 1), {
    actualMinutes: 1.1,
    billedSeconds: 66,
    amount: 1.1,
  });
});

test("incoming China PAYG calls round every positive call up to a whole minute", () => {
  assert.deepEqual(incomingCallCharge(0, 1), {
    actualMinutes: 0,
    billedMinutes: 0,
    amount: 0,
  });
  for (const [actualMinutes, billedMinutes, amount] of [
    [Number.MIN_VALUE, 1, 1],
    [0.1, 1, 1],
    [0.5, 1, 1],
    [0.51, 1, 1],
    [1.1, 2, 2],
  ]) {
    assert.deepEqual(incomingCallCharge(actualMinutes, 1), {
      actualMinutes,
      billedMinutes,
      amount,
    });
  }
});

test("call billing rejects blank, negative and non-finite values without charging zero", () => {
  for (const invalid of [undefined, null, "", " ", -0.1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(outgoingCallCharge(invalid, 1), null);
    assert.equal(incomingCallCharge(invalid, 1), null);
  }
  assert.equal(outgoingCallCharge(1, ""), null);
  assert.equal(incomingCallCharge(1, -1), null);
});

test("roaming billing fails closed before unsafe units or overflow escape", () => {
  const base = {
    ...CURRENT_EVIDENCE,
    megabytes: 0,
    ratePerMegabyte: 0.2,
    ratePerSms: 0.3,
    ratePerOutgoingMinute: 1,
    ratePerIncomingMinute: 1,
  };

  assert.equal(outgoingCallCharge(1e308, 1), null);
  assert.equal(incomingCallCharge(1e308, 1), null);
  assert.equal(roamingCostBreakdown({ ...base, megabytes: 1e308 }), null);
  assert.equal(roamingCostBreakdown({ ...base, outgoingMinutes: 1e308 }), null);
  assert.equal(roamingCostBreakdown({ ...base, incomingMinutes: 1e308 }), null);
  assert.equal(
    roamingCostBreakdown({ ...base, sms: Number.MAX_SAFE_INTEGER + 1 }),
    null,
  );
});

test("roaming breakdown explains PAYG components and preserves the number API", () => {
  const options = {
    ...CURRENT_EVIDENCE,
    megabytes: 10,
    sms: 1,
    outgoingMinutes: 0.1,
    incomingMinutes: 1.1,
    ratePerMegabyte: 0.2,
    ratePerSms: 0.3,
    ratePerOutgoingMinute: 1,
    ratePerIncomingMinute: 1,
  };
  assert.deepEqual(roamingCostBreakdown(options), {
    kind: "china-payg-credit",
    excludesTravelDataAddOn: true,
    data: { megabytes: 10, ratePerMegabyte: 0.2, amount: 2 },
    sms: { sent: 1, ratePerSms: 0.3, amount: 0.3 },
    outgoingCall: { actualMinutes: 0.1, billedSeconds: 30, amount: 0.5 },
    incomingCall: { actualMinutes: 1.1, billedMinutes: 2, amount: 2 },
    total: 4.8,
  });
  assert.equal(roamingCost(options), 4.8);
});

test("roaming breakdown remains fail-closed after evidence expiry", () => {
  const options = {
    ...CURRENT_EVIDENCE,
    now: "2026-08-16",
    megabytes: 0,
    ratePerMegabyte: 0.2,
  };
  assert.equal(roamingCostBreakdown(options), null);
  assert.equal(roamingCost(options), null);
});

test("China calculator is visibly scoped to PAYG Credit and links the separate official add-on", () => {
  const page = GROWTH_PAGES.find(({ path }) => path === "/tools/china-roaming-cost/");
  assert.ok(page);
  const html = renderGrowthPage(page);
  assert.match(html, /PAYG Credit/);
  assert.match(html, /Travel Data Add-on/);
  assert.match(
    html,
    /https:\/\/help\.giffgaff\.com\/en\/articles\/365501-giffgaff-travel-data-add-ons-and-how-they-work/,
  );
  assert.match(html, /不包含[^<。]*Travel Data Add-on/);
  assert.match(html, /单次|一次/);
});

test("roaming UI renders an explainable component breakdown", async () => {
  const source = await readFile(
    new URL("../site/growth/assets/growth-ui.js", import.meta.url),
    "utf8",
  );
  for (const component of [
    "result.data.amount",
    "result.sms.amount",
    "result.outgoingCall.amount",
    "result.outgoingCall.billedSeconds",
    "result.incomingCall.amount",
    "result.incomingCall.billedMinutes",
  ]) {
    assert.match(source, new RegExp(component.replaceAll(".", "\\.")), component);
  }
  assert.match(source, /不含 Travel Data Add-on/);
});
