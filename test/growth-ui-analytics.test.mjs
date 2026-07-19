import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLIENT = path.join(ROOT, "site", "growth", "assets", "growth-ui.js");

class FakeButton {
  constructor() {
    this.disabled = false;
    this.listeners = new Map();
  }

  addEventListener(type, callback) {
    this.listeners.set(type, callback);
  }

  click() {
    this.listeners.get("click")?.();
  }
}

function toolRoot(tool, { dataset = {}, fields = {} } = {}) {
  const calculate = new FakeButton();
  const download = new FakeButton();
  const output = { textContent: "" };
  const values = Object.fromEntries(
    Object.entries(fields).map(([name, value]) => [name, { value }]),
  );
  return {
    calculate,
    dataset: { tool, ...dataset },
    download,
    fields: values,
    output,
    querySelector(selector) {
      if (selector === "output") return output;
      if (selector === "[data-calculate]") return calculate;
      if (selector === "[data-download-ics]") return download;
      const match = selector.match(/^\[name="([^"]+)"\]$/);
      return match ? values[match[1]] ?? null : null;
    },
  };
}

test("growth tools emit one anonymous event only after each valid result", async () => {
  const keepNumber = toolRoot("keep-number", {
    dataset: { expires: "2099-12-31" },
    fields: { "last-action": "2026-07-16" },
  });
  const roaming = toolRoot("roaming-cost", {
    dataset: {
      expires: "2099-12-31",
      ratePerMegabyte: "0.2",
      ratePerSms: "0.3",
      ratePerOutgoingMinute: "1",
      ratePerIncomingMinute: "1",
    },
    fields: {
      megabytes: "10",
      sms: "1",
      "outgoing-minutes": "0.5",
      "incoming-minutes": "0.5",
    },
  });
  const totalCost = toolRoot("total-cost", {
    fields: {
      card: "20",
      balance: "10",
      shipping: "8",
      topup: "10",
      usage: "6",
    },
  });
  const roots = [keepNumber, roaming, totalCost];
  const events = [];
  const originalDocument = globalThis.document;
  const originalCustomEvent = globalThis.CustomEvent;
  globalThis.document = {
    dispatchEvent(event) {
      events.push(event);
      return true;
    },
    querySelectorAll(selector) {
      return selector === "[data-tool]" ? roots : [];
    },
  };
  globalThis.CustomEvent = class {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail;
    }
  };

  try {
    await import(`${pathToFileURL(CLIENT).href}?analytics=${Date.now()}`);
    for (const root of roots) root.calculate.click();

    assert.deepEqual(
      events.map(({ type, detail }) => ({ type, detail })),
      Array.from({ length: 3 }, () => ({
        type: "analytics_event_v1",
        detail: { event: "tool_result" },
      })),
      "successful calculations expose no tool inputs, values or identifiers",
    );

    keepNumber.fields["last-action"].value = "";
    roaming.fields.megabytes.value = "";
    totalCost.fields.card.value = "";
    for (const root of roots) root.calculate.click();
    assert.equal(events.length, 3, "invalid or expired result attempts emit nothing");
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
    if (originalCustomEvent === undefined) delete globalThis.CustomEvent;
    else globalThis.CustomEvent = originalCustomEvent;
  }
});
