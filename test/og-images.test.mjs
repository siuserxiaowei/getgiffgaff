import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import worker, {
  CANONICAL_ORIGIN,
  PUBLIC_INDEXABLE_PATHS,
} from "../public/worker-logic.js";
import { ogImagePathFor } from "../public/og-images.js";

const publicRoot = resolve(fileURLToPath(new URL("../public", import.meta.url)));
const pitfallsHtml = await readFile(
  new URL("../public/guides/6-pitfalls-page.txt", import.meta.url),
  "utf8",
);
const assetEnv = {
  ASSETS: {
    async fetch(request) {
      if (new URL(request.url).pathname === "/guides/6-pitfalls-page.txt") {
        return new Response(pitfallsHtml, {
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }
      return new Response("not found", { status: 404 });
    },
  },
};

function metaContent(html, property) {
  const tag = [...html.matchAll(/<meta\b[^>]*>/gi)].find((match) =>
    new RegExp(`property=["']${property.replace(":", "\\:")}["']`, "i").test(match[0]),
  )?.[0];
  return tag?.match(/content=["']([^"']+)["']/i)?.[1] || null;
}

test("every indexable route owns a unique 1200x630 PNG social card", async () => {
  const urls = new Set();
  const hashes = new Set();

  for (const pathname of PUBLIC_INDEXABLE_PATHS) {
    const expectedPath = ogImagePathFor(pathname);
    const expectedUrl = `${CANONICAL_ORIGIN}${expectedPath}`;
    const response = await worker.fetch(
      new Request(`${CANONICAL_ORIGIN}${pathname}`),
      assetEnv,
    );
    const html = await response.text();

    assert.equal(metaContent(html, "og:image"), expectedUrl, pathname);
    assert.equal(metaContent(html, "og:image:width"), "1200", pathname);
    assert.equal(metaContent(html, "og:image:height"), "630", pathname);
    assert.equal(urls.has(expectedUrl), false, pathname);
    urls.add(expectedUrl);

    const image = await readFile(resolve(publicRoot, expectedPath.slice(1)));
    assert.equal(image.subarray(1, 4).toString("ascii"), "PNG", pathname);
    assert.equal(image.readUInt32BE(16), 1200, pathname);
    assert.equal(image.readUInt32BE(20), 630, pathname);
    hashes.add(createHash("sha256").update(image).digest("hex"));
  }

  assert.equal(urls.size, PUBLIC_INDEXABLE_PATHS.length);
  assert.equal(hashes.size, PUBLIC_INDEXABLE_PATHS.length);
});
