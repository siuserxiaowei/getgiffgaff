import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import worker from "../public/_worker.js";

const ORIGIN = "https://getgiffgaff.com";
const ANALYTICS_CANARY_HEADER = "x-getgiffgaff-release-probe";
const ANALYTICS_CANARY_HEADER_VALUE = "seo_release_canary_v1";
const ANALYTICS_CANARY_ID_HEADER = "x-getgiffgaff-release-probe-id";
const ANALYTICS_CANARY_ID = "a".repeat(64);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

test("wrangler binds the production Analytics Engine dataset", async () => {
  const config = await readFile(path.join(ROOT, "wrangler.toml"), "utf8");

  assert.match(
    config,
    /\[\[analytics_engine_datasets\]\]\s*\nbinding\s*=\s*"ANALYTICS"\s*\ndataset\s*=\s*"getgiffgaff_events_v1"/,
  );
});

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

test("analytics_event_v1 accepts page views and requires an allowlisted contact channel", async () => {
  const env = analyticsEnv();
  const pageView = await worker.fetch(eventRequest({
    version: "analytics_event_v1",
    path: "/shop/",
    source: "search",
    event: "page_view",
  }), env, {});
  const contact = await worker.fetch(eventRequest({
    version: "analytics_event_v1",
    path: "/contact/",
    source: "internal",
    event: "contact_click",
    channel: "telegram",
  }), env, {});
  const channels = ["wechat"];
  for (const channel of channels) {
    const response = await worker.fetch(eventRequest({
      version: "analytics_event_v1",
      path: "/contact/",
      source: "direct",
      event: "contact_click",
      channel,
    }), env, {});
    assert.equal(response.status, 204);
  }

  assert.equal(pageView.status, 204);
  assert.equal(contact.status, 204);

  const missingChannel = await worker.fetch(eventRequest({
    version: "analytics_event_v1",
    path: "/contact/",
    source: "internal",
    event: "contact_click",
  }), env, {});
  assert.equal(missingChannel.status, 400);
  assert.deepEqual(env.writes, [
    {
      indexes: ["page_view"],
      blobs: ["/shop/", "search", "page_view"],
      doubles: [1],
    },
    {
      indexes: ["contact_click"],
      blobs: ["/contact/", "internal", "contact_click", "telegram"],
      doubles: [1],
    },
    {
      indexes: ["contact_click"],
      blobs: ["/contact/", "direct", "contact_click", "wechat"],
      doubles: [1],
    },
  ]);
});

test("analytics_event_v1 accepts only fixed privacy-safe distribution sources", async () => {
  const allowed = [
    "dist_partner",
    "dist_private_share",
    "dist_wechat_group",
    "dist_wechat_official",
    "dist_xiaohongshu",
    "paid_google",
    "paid_microsoft",
  ];
  const env = analyticsEnv();
  for (const source of allowed) {
    const response = await worker.fetch(eventRequest({
      version: "analytics_event_v1",
      path: "/",
      source,
      event: "page_view",
    }), env, {});
    assert.equal(response.status, 204, source);
  }
  assert.deepEqual(
    env.writes.map((entry) => entry.blobs[1]),
    allowed,
  );

  for (const source of ["xiaohongshu", "DIST_PARTNER", "partner-name", "13800000000"]) {
    const rejectedEnv = analyticsEnv();
    const response = await worker.fetch(eventRequest({
      version: "analytics_event_v1",
      path: "/",
      source,
      event: "page_view",
    }), rejectedEnv, {});
    assert.equal(response.status, 400, source);
    assert.equal(rejectedEnv.writes.length, 0, source);
  }
});

test("analytics_event_v1 stores only fixed pitfalls commerce intents", async () => {
  const env = analyticsEnv();
  for (const intent of ["before-purchase", "after-purchase"]) {
    const response = await worker.fetch(eventRequest({
      version: "analytics_event_v1",
      path: "/guides/6-pitfalls/",
      source: "search",
      event: "commerce_click",
      intent,
    }), env, {});
    assert.equal(response.status, 204, intent);
  }
  assert.deepEqual(env.writes, [
    {
      indexes: ["commerce_click"],
      blobs: [
        "/guides/6-pitfalls/",
        "search",
        "commerce_click",
        "before-purchase",
      ],
      doubles: [1],
    },
    {
      indexes: ["commerce_click"],
      blobs: [
        "/guides/6-pitfalls/",
        "search",
        "commerce_click",
        "after-purchase",
      ],
      doubles: [1],
    },
  ]);

  for (const payload of [
    {
      version: "analytics_event_v1",
      path: "/guides/6-pitfalls/",
      source: "search",
      event: "commerce_click",
      intent: "BEFORE-PURCHASE",
    },
    {
      version: "analytics_event_v1",
      path: "/guides/6-pitfalls/",
      source: "search",
      event: "commerce_click",
      intent: "arbitrary DOM text or URL",
    },
    {
      version: "analytics_event_v1",
      path: "/guides/6-pitfalls/",
      source: "search",
      event: "page_view",
      intent: "before-purchase",
    },
    {
      version: "analytics_event_v1",
      path: "/contact/",
      source: "search",
      event: "commerce_click",
      intent: "before-purchase",
    },
    {
      version: "analytics_event_v1",
      path: "/contact/",
      source: "search",
      event: "contact_click",
      channel: "wechat",
      intent: "after-purchase",
    },
  ]) {
    const rejectedEnv = analyticsEnv();
    const response = await worker.fetch(eventRequest(payload), rejectedEnv, {});
    assert.equal(response.status, 400, JSON.stringify(payload));
    assert.equal(rejectedEnv.writes.length, 0, JSON.stringify(payload));
  }
});

test("analytics_event_v1 marks only an exact production page-view release canary", async () => {
  const env = analyticsEnv();
  const response = await worker.fetch(eventRequest({
    version: "analytics_event_v1",
    path: "/",
    source: "direct",
    event: "page_view",
  }, {
    [ANALYTICS_CANARY_HEADER]: ANALYTICS_CANARY_HEADER_VALUE,
    [ANALYTICS_CANARY_ID_HEADER]: ANALYTICS_CANARY_ID,
  }), env, {});

  assert.equal(response.status, 204);
  assert.deepEqual(env.writes, [{
    indexes: [`seo_release_canary:${ANALYTICS_CANARY_ID}`],
    blobs: ["/", "direct", "page_view", "seo_release_canary", ANALYTICS_CANARY_ID],
    doubles: [1],
  }]);
  assert.ok(
    Buffer.byteLength(env.writes[0].indexes[0], "utf8") <= 96,
    "release probe index must stay within the Analytics Engine limit",
  );

  for (const headers of [
    {
      [ANALYTICS_CANARY_HEADER]: "seo_release_canary",
      [ANALYTICS_CANARY_ID_HEADER]: ANALYTICS_CANARY_ID,
    },
    {
      [ANALYTICS_CANARY_HEADER]: "SEO_RELEASE_CANARY_V1",
      [ANALYTICS_CANARY_ID_HEADER]: ANALYTICS_CANARY_ID,
    },
    { [ANALYTICS_CANARY_HEADER]: ANALYTICS_CANARY_HEADER_VALUE },
    { [ANALYTICS_CANARY_ID_HEADER]: ANALYTICS_CANARY_ID },
    {
      [ANALYTICS_CANARY_HEADER]: ANALYTICS_CANARY_HEADER_VALUE,
      [ANALYTICS_CANARY_ID_HEADER]: "not-a-256-bit-id",
    },
  ]) {
    const rejectedEnv = analyticsEnv();
    const rejected = await worker.fetch(eventRequest({
      version: "analytics_event_v1",
      path: "/",
      source: "direct",
      event: "page_view",
    }, headers), rejectedEnv, {});
    assert.equal(rejected.status, 400);
    assert.equal(rejectedEnv.writes.length, 0);
  }

  const wrongEventEnv = analyticsEnv();
  const wrongEvent = await worker.fetch(eventRequest({
    version: "analytics_event_v1",
    path: "/shop/",
    source: "direct",
    event: "shop_click",
  }, {
    [ANALYTICS_CANARY_HEADER]: ANALYTICS_CANARY_HEADER_VALUE,
    [ANALYTICS_CANARY_ID_HEADER]: ANALYTICS_CANARY_ID,
  }), wrongEventEnv, {});
  assert.equal(wrongEvent.status, 400);
  assert.equal(wrongEventEnv.writes.length, 0);
});

test("analytics_event_v1 rejects Pages Preview hosts before touching the production binding", async () => {
  const payload = {
    version: "analytics_event_v1",
    path: "/",
    source: "direct",
    event: "page_view",
  };

  for (const hostname of [
    "getgiffgaff.pages.dev",
    "release-abc123.getgiffgaff.pages.dev",
  ]) {
    const env = analyticsEnv();
    const response = await worker.fetch(new Request(
      `https://${hostname}/analytics-event-v1`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: ORIGIN,
          [ANALYTICS_CANARY_HEADER]: ANALYTICS_CANARY_HEADER_VALUE,
        },
        body: JSON.stringify(payload),
      },
    ), env, {});

    assert.equal(response.status, 404);
    assert.equal(env.writes.length, 0);
    assert.match(response.headers.get("cache-control") || "", /private.*no-store/i);
    assert.match(response.headers.get("x-robots-tag") || "", /noindex/i);
  }
});

test("analytics_event_v1 reports a missing or failing dataset instead of pretending to persist", async () => {
  const validPayload = {
    version: "analytics_event_v1",
    path: "/shop/",
    source: "direct",
    event: "page_view",
  };
  const environments = [
    {},
    { ANALYTICS: {} },
    {
      ANALYTICS: {
        writeDataPoint() {
          throw new Error("dataset unavailable");
        },
      },
    },
    {
      ANALYTICS: {
        async writeDataPoint() {
          throw new Error("async dataset unavailable");
        },
      },
    },
  ];

  for (const env of environments) {
    const response = await worker.fetch(eventRequest(validPayload), env, {});
    assert.equal(response.status, 503);
    assert.match(response.headers.get("content-type") || "", /^application\/json\b/i);
    assert.match(response.headers.get("cache-control") || "", /no-store/);
    assert.match(response.headers.get("x-robots-tag") || "", /noindex/);
    assert.deepEqual(await response.json(), { error: "analytics_unavailable" });
  }
});

test("analytics_event_v1 rejects unknown routes, fields, origins, events and oversized bodies", async () => {
  const probes = [
    eventRequest({ version: "analytics_event_v1", path: "/missing/", source: "direct", event: "shop_click" }),
    eventRequest({ version: "analytics_event_v1", path: "/shop/", source: "direct", event: "shop_click", phone: "13800000000" }),
    eventRequest({ version: "analytics_event_v1", path: "/shop/", source: "raw-referrer.example", event: "shop_click" }),
    eventRequest({ version: "analytics_event_v1", path: "/shop/", source: "direct", event: "arbitrary" }),
    eventRequest({ version: "analytics_event_v1", path: "/contact/", source: "direct", event: "contact_click", channel: "phone" }),
    eventRequest({ version: "analytics_event_v1", path: "/contact/", source: "direct", event: "contact_click", channel: "ktt" }),
    eventRequest({ version: "analytics_event_v1", path: "/contact/", source: "direct", event: "contact_click", channel: "13800000000" }),
    eventRequest({ version: "analytics_event_v1", path: "/contact/", source: "direct", event: "contact_click" }),
    eventRequest({ version: "analytics_event_v1", path: "/shop/", source: "direct", event: "shop_click", channel: "wechat" }),
    eventRequest({ version: "analytics_event_v1", path: "/shop/", source: "direct", event: "shop_click", intent: "before-purchase" }),
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
