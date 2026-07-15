import assert from "node:assert/strict";
import test from "node:test";

import worker, {
  cacheVersionFor,
  CANONICAL_ORIGIN,
} from "../public/worker-logic.js";

class MemoryCache {
  constructor() {
    this.entries = new Map();
    this.matches = [];
    this.puts = [];
  }

  async match(request) {
    this.matches.push(request.url);
    return this.entries.get(request.url)?.clone() || undefined;
  }

  async put(request, response) {
    this.puts.push(request.url);
    this.entries.set(request.url, response.clone());
  }
}

async function withCache(cache, callback) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "caches");
  Object.defineProperty(globalThis, "caches", {
    configurable: true,
    value: { default: cache },
  });
  try {
    return await callback();
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "caches", descriptor);
    else delete globalThis.caches;
  }
}

test("cache versions include claim review boundaries and route policy", () => {
  const beforeReview = cacheVersionFor(
    "/",
    new Date("2026-08-14T23:59:59.999Z"),
  );
  const atReview = cacheVersionFor(
    "/",
    new Date("2026-08-15T00:00:00.000Z"),
  );
  const usage = cacheVersionFor(
    "/guides/3-usage/",
    new Date("2026-07-15T12:00:00.000Z"),
  );

  assert.notEqual(beforeReview, atReview, "an ACTIVE claim must expire out of the cache key");
  assert.notEqual(beforeReview, usage, "route policy and content revision must affect the key");
});

test("index pages cache only versioned local output and expose deterministic hits", async () => {
  const cache = new MemoryCache();
  await withCache(cache, async () => {
    const request = new Request(`${CANONICAL_ORIGIN}/guides/`);
    const first = await worker.fetch(request, {});
    const firstHtml = await first.text();
    assert.equal(first.status, 200);
    assert.equal(first.headers.get("x-getgiffgaff-cache"), null);
    assert.match(first.headers.get("x-getgiffgaff-cache-version") ?? "", /^local-source-v2-/);
    assert.equal(cache.puts.length, 1);
    assert.doesNotMatch(firstHtml, /立即购买|确认库存|10\s*[–—-]\s*14\s*英镑/);

    const second = await worker.fetch(new Request(request.url), {});
    assert.equal(second.headers.get("x-getgiffgaff-cache"), "HIT");
    assert.equal(cache.puts.length, 1);
    assert.equal(await second.text(), firstHtml);
  });
});

test("legacy cache entries without the exact version header are never served", async () => {
  const cache = new MemoryCache();
  await withCache(cache, async () => {
    const request = new Request(`${CANONICAL_ORIGIN}/guides/`);
    const version = cacheVersionFor("/guides/");
    const key = new URL(request.url);
    key.searchParams.set("__gg_cache_version", version);
    cache.entries.set(
      key.toString(),
      new Response("<main><h1>立即购买 G2，确认库存</h1></main>", {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "x-getgiffgaff-cache-version": "retired-preview-version",
        },
      }),
    );

    const response = await worker.fetch(request, {});
    const html = await response.text();
    assert.equal(response.headers.get("x-getgiffgaff-cache"), null);
    assert.doesNotMatch(html, /立即购买 G2|确认库存/);
    assert.match(html, /giffgaff 中文教程：按生命周期选路/);
  });
});

test("evidence-dependent pages cannot use stale-while-revalidate", async () => {
  for (const pathname of ["/guides/3-usage/", "/guides/5-travel-data/"]) {
    const response = await worker.fetch(
      new Request(`${CANONICAL_ORIGIN}${pathname}`),
      {},
    );
    const cacheControl = response.headers.get("cache-control") || "";
    assert.match(cacheControl, /s-maxage=60/);
    assert.match(cacheControl, /must-revalidate/);
    assert.doesNotMatch(cacheControl, /stale-while-revalidate/);
  }
});

test("requests carrying cookies bypass the edge cache and remain no-store", async () => {
  const cache = new MemoryCache();
  await withCache(cache, async () => {
    const response = await worker.fetch(
      new Request(`${CANONICAL_ORIGIN}/guides/`, {
        headers: { cookie: "session=must-not-leak" },
      }),
      {},
    );
    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control") || "", /no-store/);
    assert.equal(cache.matches.length, 0);
    assert.equal(cache.puts.length, 0);
  });
});
