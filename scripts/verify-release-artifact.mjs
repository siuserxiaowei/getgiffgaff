import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import worker from "../public/_worker.js";
import { RELEASE_PROVENANCE_PLACEHOLDER } from "./build-release-artifact.mjs";
import {
  LEGACY_ROUTES,
  PUBLIC_INDEXABLE_PATHS,
  ROUTE_MANIFEST,
} from "../public/route-manifest.js";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const DEFAULT_RELEASE_ROOT = path.join(ROOT, ".release");
const ORIGIN = "https://getgiffgaff.com";

function contentTypeFor(pathname) {
  if (pathname.endsWith("/") || pathname.endsWith(".html")) return "text/html; charset=utf-8";
  if (pathname.endsWith(".css")) return "text/css; charset=utf-8";
  if (pathname.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (pathname.endsWith(".json")) return "application/json; charset=utf-8";
  if (pathname.endsWith(".svg")) return "image/svg+xml";
  if (pathname.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

function publicFile(root, pathname) {
  if (pathname === "/") return path.join(root, "index.html");
  if (pathname.endsWith("/")) return path.join(root, pathname.slice(1), "index.html");
  return path.join(root, pathname.slice(1));
}

function assetsEnvironment(root) {
  return {
    ASSETS: {
      async fetch(input) {
        const request = input instanceof Request ? input : new Request(input);
        const url = new URL(request.url);
        const filename = publicFile(root, url.pathname);
        const relative = path.relative(root, filename);
        if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`)) {
          return new Response("Bad path", { status: 400 });
        }
        try {
          const bytes = await readFile(filename);
          return new Response(request.method === "HEAD" ? null : bytes, {
            status: 200,
            headers: {
              "content-type": contentTypeFor(url.pathname),
              "content-length": String(bytes.length),
              "x-robots-tag": "noindex, nofollow, noarchive",
            },
          });
        } catch (error) {
          if (error?.code !== "ENOENT") throw error;
          return new Response("Not found", { status: 404 });
        }
      },
    },
  };
}

function attribute(tag, name) {
  const match = String(tag).match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"),
  );
  return match ? match[1] ?? match[2] ?? match[3] ?? "" : "";
}

function canonical(html) {
  const tag = (html.match(
    /<link\b(?=[^>]*\brel=["'][^"']*canonical[^"']*["'])[^>]*>/i,
  ) || [])[0];
  return tag ? attribute(tag, "href") : "";
}

function ogUrl(html) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    if (attribute(tag, "property").toLowerCase() === "og:url") {
      return attribute(tag, "content");
    }
  }
  return "";
}

function parseJsonLd(html, route) {
  for (const match of html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    assert.doesNotThrow(() => JSON.parse(match[1]), `${route} invalid JSON-LD`);
  }
}

export async function verifyReleaseArtifact(options = {}) {
  const releaseRoot = options.releaseRoot || DEFAULT_RELEASE_ROOT;
  const env = assetsEnvironment(releaseRoot);
  let indexablePages = 0;
  let noindexPages = 0;

  for (const [route, record] of Object.entries(ROUTE_MANIFEST)) {
    const url = `${ORIGIN}${route}`;
    const response = await worker.fetch(new Request(url), env, {});
    const html = await response.text();
    assert.equal(response.status, 200, `${route} status`);
    assert.equal(canonical(html), url, `${route} canonical`);
    assert.equal(ogUrl(html), url, `${route} og:url`);
    assert.doesNotMatch(html, /\/_next\/|getgiffgaff\.pages\.dev/i, route);
    parseJsonLd(html, route);

    const robots = response.headers.get("x-robots-tag") || "";
    if (record.indexPolicy === "index") {
      indexablePages += 1;
      assert.match(robots, /(?:^|,)\s*index\b/i, `${route} index`);
      assert.doesNotMatch(robots, /noindex/i, `${route} noindex regression`);
    } else {
      noindexPages += 1;
      assert.match(robots, /noindex/i, `${route} noindex`);
      assert.match(robots, /follow/i, `${route} follow`);
    }

    const head = await worker.fetch(new Request(url, { method: "HEAD" }), env, {});
    assert.equal(head.status, 200, `${route} HEAD`);
    assert.equal(await head.text(), "", `${route} HEAD body`);
  }

  const sitemapResponse = await worker.fetch(new Request(`${ORIGIN}/sitemap.xml`), env, {});
  const sitemap = await sitemapResponse.text();
  const sitemapUrls = (sitemap.match(/<url>/g) || []).length;
  assert.equal(sitemapUrls, PUBLIC_INDEXABLE_PATHS.length);

  const contact = await readFile(publicFile(releaseRoot, "/contact/"), "utf8");
  const commerceTokens = [
    "胡小胡",
    "微信咨询",
    "查看 G0 小程序码",
    "查看 G2 小程序码",
    "快团团小程序码",
    "扫描前请核对页面主体",
  ];
  for (const token of commerceTokens) assert.match(contact, new RegExp(token), token);
  const provenance = await readFile(
    publicFile(releaseRoot, "/release-provenance.json"),
    "utf8",
  );
  assert.equal(provenance, `${JSON.stringify(RELEASE_PROVENANCE_PLACEHOLDER)}\n`);

  return {
    manifestPages: Object.keys(ROUTE_MANIFEST).length,
    indexablePages,
    noindexPages,
    legacyPages: LEGACY_ROUTES.length,
    growthPages: Object.keys(ROUTE_MANIFEST).length - LEGACY_ROUTES.length,
    sitemapUrls,
    commerceChecks: commerceTokens.length,
  };
}

const direct =
  process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (direct) {
  const report = await verifyReleaseArtifact({
    releaseRoot: process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_RELEASE_ROOT,
  });
  process.stdout.write(`${JSON.stringify(report)}\n`);
}
