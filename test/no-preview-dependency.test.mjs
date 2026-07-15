import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import worker, {
  CANONICAL_ORIGIN,
  PUBLIC_INDEXABLE_PATHS,
} from "../public/worker-logic.js";

const workerSource = await readFile(
  new URL("../public/worker-logic.js", import.meta.url),
  "utf8",
);

test("production worker contains no concrete preview origin or HTML hotfix pipeline", () => {
  assert.doesNotMatch(workerSource, /https:\/\/[^"']+\.pages\.dev/i);
  assert.doesNotMatch(workerSource, /HOTFIX_ORIGIN|upstreamRequestFor|rewriteGlobalSeoHtml|stripNextHydration|MutationObserver/);
  assert.doesNotMatch(workerSource, /await\s+fetch\s*\(/);
});

test("unknown pages and retired Next assets fail locally without an upstream request", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    throw new Error("no upstream network is allowed");
  };
  try {
    for (const pathname of ["/missing/", "/_next/static/chunks/old.js", "/gg-card-hero.png"]) {
      const response = await worker.fetch(new Request(`${CANONICAL_ORIGIN}${pathname}`), {});
      assert.equal(response.status, 404, pathname);
      assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow, noarchive", pathname);
      assert.match(response.headers.get("cache-control") ?? "", /no-store/i, pathname);
    }
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
  }
});

test("every indexable route is served while the network is completely unavailable", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("no upstream network is allowed");
  };
  try {
    const unavailableAssets = {
      ASSETS: {
        async fetch() {
          return new Response("asset unavailable", { status: 503 });
        },
      },
    };
    for (const pathname of PUBLIC_INDEXABLE_PATHS.filter(
      (entry) => entry !== "/guides/6-pitfalls/",
    )) {
      const response = await worker.fetch(
        new Request(`${CANONICAL_ORIGIN}${pathname}`),
        unavailableAssets,
      );
      assert.equal(response.status, 200, pathname);
    }
  } finally {
    globalThis.fetch = original;
  }
});
