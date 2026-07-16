import assert from "node:assert/strict";
import test from "node:test";

import worker from "../public/_worker.js";

const ORIGIN = "https://getgiffgaff.com";

function analyticsEnv() {
  const writes = [];
  return {
    writes,
    ANALYTICS: {
      writeDataPoint(point) {
        writes.push(point);
      },
    },
  };
}

function eventRequest(payload, headers = {}) {
  return new Request(`${ORIGIN}/analytics-event-v1`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: ORIGIN,
      cookie: "session=COOKIE_CANARY",
      ...headers,
    },
    body: JSON.stringify(payload),
  });
}

test("analytics_event_v1 stores only canonical path, source category and anonymous event", async () => {
  const env = analyticsEnv();
  const response = await worker.fetch(eventRequest({
    version: "analytics_event_v1",
    path: "/guides/7-arrival-checklist/",
    source: "internal",
    event: "commerce_click",
  }), env, {});

  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");
  assert.match(response.headers.get("cache-control") || "", /no-store/);
  assert.match(response.headers.get("x-robots-tag") || "", /noindex/);
  assert.deepEqual(env.writes, [{
    indexes: ["commerce_click"],
    blobs: ["/guides/7-arrival-checklist/", "internal", "commerce_click"],
    doubles: [1],
  }]);
  assert.doesNotMatch(JSON.stringify(env.writes), /COOKIE_CANARY|session|phone|query/i);
});

test("analytics_event_v1 rejects unknown routes, fields, origins, events and oversized bodies", async () => {
  const probes = [
    eventRequest({ version: "analytics_event_v1", path: "/missing/", source: "direct", event: "shop_click" }),
    eventRequest({ version: "analytics_event_v1", path: "/shop/", source: "direct", event: "shop_click", phone: "13800000000" }),
    eventRequest({ version: "analytics_event_v1", path: "/shop/", source: "raw-referrer.example", event: "shop_click" }),
    eventRequest({ version: "analytics_event_v1", path: "/shop/", source: "direct", event: "arbitrary" }),
    eventRequest({ version: "analytics_event_v1", path: "/shop/", source: "direct", event: "shop_click" }, { origin: "https://evil.example" }),
    new Request(`${ORIGIN}/analytics-event-v1`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        version: "analytics_event_v1",
        path: "/shop/",
        source: "direct",
        event: "shop_click",
      }),
    }),
    new Request(`${ORIGIN}/analytics-event-v1`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: ORIGIN },
      body: "x".repeat(1100),
    }),
  ];

  for (const request of probes) {
    const env = analyticsEnv();
    const response = await worker.fetch(request, env, {});
    assert.ok([400, 413].includes(response.status), `${response.status} ${request.url}`);
    assert.equal(env.writes.length, 0);
    assert.match(response.headers.get("cache-control") || "", /no-store/);
  }
});

test("analytics endpoint is POST-only and ordinary public pages remain read-only", async () => {
  const env = analyticsEnv();
  const get = await worker.fetch(new Request(`${ORIGIN}/analytics-event-v1`), env, {});
  const unrelatedPost = await worker.fetch(new Request(`${ORIGIN}/contact/`, { method: "POST" }), env, {});
  assert.equal(get.status, 405);
  assert.equal(unrelatedPost.status, 405);
  assert.equal(env.writes.length, 0);
});
