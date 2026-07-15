import assert from "node:assert/strict";
import test from "node:test";

import {
  ANALYTICS_EVENT_VERSION,
  normalizeAnalyticsEvent,
} from "../public/analytics-contract.js";

test("analytics_event_v1 accepts only minimal aggregate fields", () => {
  const event = normalizeAnalyticsEvent({
    timestamp: "2026-07-15T10:00:00.000Z",
    canonicalPath: "/guides/3-usage/",
    sourceClass: "ai-referral",
    eventName: "tool_complete",
    anonymousSession: "s_8f3a1c",
  });

  assert.deepEqual(event, {
    version: ANALYTICS_EVENT_VERSION,
    timestamp: "2026-07-15T10:00:00.000Z",
    canonicalPath: "/guides/3-usage/",
    sourceClass: "ai-referral",
    eventName: "tool_complete",
    anonymousSession: "s_8f3a1c",
  });
});

test("analytics_event_v1 rejects PII, credentials and unapproved paths or events", () => {
  const base = {
    timestamp: "2026-07-15T10:00:00.000Z",
    canonicalPath: "/guides/3-usage/",
    sourceClass: "organic-search",
    eventName: "page_view",
    anonymousSession: "s_test123",
  };

  for (const forbidden of [
    { rawQuery: "phone=13800000000" },
    { cookie: "session=secret" },
    { authorization: "Bearer secret" },
    { orderId: "ORDER-1" },
    { phone: "13800000000" },
    { screenshot: "data:image/png;base64,secret" },
  ]) {
    assert.throws(() => normalizeAnalyticsEvent({ ...base, ...forbidden }), /forbidden field/i);
  }

  assert.throws(
    () => normalizeAnalyticsEvent({ ...base, canonicalPath: "https://evil.test/" }),
    /canonical path/i,
  );
  assert.throws(
    () => normalizeAnalyticsEvent({ ...base, eventName: "checkout_with_card_number" }),
    /event name/i,
  );
});
