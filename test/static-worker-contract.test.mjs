import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import worker from "../public/_worker.js";
import {
  INDEXABLE_GROWTH_ROUTES,
  LEGACY_ROUTES,
  NOINDEX_GROWTH_ROUTES,
  PUBLIC_INDEXABLE_PATHS,
  PUBLIC_STATIC_ASSET_PATHS,
  ROUTE_MANIFEST,
  routeFor,
} from "../public/route-manifest.js";
import { legacyDomSignature } from "../scripts/capture-legacy-site.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://getgiffgaff.com";
const INDEX_DIRECTIVES = new Set([
  "index",
  "follow",
  "max-snippet:-1",
  "max-image-preview:large",
]);
const PRIVATE_DIRECTIVES = new Set(["noindex", "nofollow", "noarchive"]);
const ADDITIVE_SLOT_ROUTES = Object.freeze([
  "/guides/0-intro/",
  "/guides/1-order/",
  "/answers/",
  "/guides/2-activate/",
  "/guides/3-usage/",
  "/guides/4-signal/",
  "/guides/5-travel-data/",
  "/more/03-esim/",
]);
const ORIGINAL_FETCH = globalThis.fetch;
globalThis.fetch = async (input) => {
  throw new Error(`Worker attempted forbidden network fetch: ${String(input)}`);
};

let temporaryRoot = null;
let releaseRootPromise = null;

after(async () => {
  globalThis.fetch = ORIGINAL_FETCH;
  if (temporaryRoot) await rm(temporaryRoot, { recursive: true, force: true });
});

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function attribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(tag).match(
    new RegExp(`\\b${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"),
  );
  return match ? match[1] ?? match[2] ?? match[3] ?? "" : "";
}

function elementText(html, tagName) {
  return (html.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i")) || [])[1]
    ?.replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim() || "";
}

function metaContent(html, kind, key) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    if (attribute(tag, kind).toLowerCase() === key.toLowerCase()) {
      return attribute(tag, "content");
    }
  }
  return "";
}

function canonicalHref(html) {
  const tag = (html.match(
    /<link\b(?=[^>]*\brel=["'][^"']*\bcanonical\b[^"']*["'])[^>]*>/i,
  ) || [])[0];
  return tag ? attribute(tag, "href") : "";
}

function navigationSignature(html) {
  const nav = (html.match(
    /<nav\b(?=[^>]*aria-label=["']\u4e3b\u5bfc\u822a["'])[^>]*>([\s\S]*?)<\/nav>/i,
  ) || [])[1] || "";
  return sha256(nav.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/\s+/g, " ").trim());
}

function withoutGrowthSlot(html) {
  return String(html)
    .replace(
      /<section\b(?=[^>]*\bdata-growth-slot=["']related-tutorials-v1["'])[^>]*>[\s\S]*?<\/section>/gi,
      "",
    )
    .replace(
      /<aside\b(?=[^>]*\bdata-growth-slot=["']wechat-buying-guide-v1["'])[^>]*>[\s\S]*?<\/aside>/gi,
      "",
    );
}

function visibleTextSignature(html) {
  const source = withoutGrowthSlot(html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<head\b[\s\S]*?<\/head>/gi, "");
  const tokens = [];
  for (const match of source.matchAll(
    /<(h[1-6]|p|li|td|th|button|a)\b[^>]*>([\s\S]*?)<\/\1>/gi,
  )) {
    const text = match[2]
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/\s+/g, " ")
      .trim();
    if (text) tokens.push(`${match[1].toLowerCase()}:${text}`);
  }
  return sha256(tokens.join("\n"));
}

function additiveSlotCount(html) {
  return (
    String(html).match(
      /<section\b(?=[^>]*\bdata-growth-slot=["']related-tutorials-v1["'])[^>]*>/gi,
    ) || []
  ).length;
}

function commerceWidgetCount(html) {
  return (
    String(html).match(
      /<aside\b(?=[^>]*\bdata-growth-slot=["']wechat-buying-guide-v1["'])[^>]*>/gi,
    ) || []
  ).length;
}

function directiveSet(response) {
  return new Set(
    String(response.headers.get("x-robots-tag") || "")
      .toLowerCase()
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

function assertDirectives(response, expected, label) {
  const actual = directiveSet(response);
  for (const directive of expected) {
    assert.ok(actual.has(directive), `${label}: missing ${directive}; got ${[...actual].join(", ")}`);
  }
}

function publicFile(root, pathname) {
  if (pathname === "/") return path.join(root, "index.html");
  if (pathname.endsWith("/")) return path.join(root, pathname.slice(1), "index.html");
  return path.join(root, pathname.slice(1));
}

function contentTypeFor(pathname) {
  if (pathname.endsWith(".html") || pathname.endsWith("/")) return "text/html; charset=utf-8";
  if (pathname.endsWith(".css")) return "text/css; charset=utf-8";
  if (pathname.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (pathname.endsWith(".svg")) return "image/svg+xml";
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".xml")) return "application/xml; charset=utf-8";
  return "application/octet-stream";
}

async function releaseRoot() {
  if (!releaseRootPromise) {
    releaseRootPromise = (async () => {
      temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-release-contract-"));
      const modulePath = path.join(ROOT, "scripts", "build-release-artifact.mjs");
      const release = await import(`${pathToFileURL(modulePath).href}?contract=${Date.now()}`);
      assert.equal(
        typeof release.buildReleaseArtifact,
        "function",
        "scripts/build-release-artifact.mjs must export buildReleaseArtifact({ outputRoot })",
      );
      await release.buildReleaseArtifact({ outputRoot: temporaryRoot });
      return temporaryRoot;
    })();
  }
  return releaseRootPromise;
}

function createAssetsEnvironment(root, { setCookie = false } = {}) {
  const calls = [];
  return {
    calls,
    ASSETS: {
      async fetch(input) {
        const request = input instanceof Request ? input : new Request(input);
        const url = new URL(request.url);
        calls.push({
          method: request.method,
          pathname: url.pathname,
          search: url.search,
          authorization: request.headers.get("authorization"),
          cookie: request.headers.get("cookie"),
        });

        const filename = publicFile(root, url.pathname);
        const local = path.relative(root, filename);
        if (!local || local === ".." || local.startsWith(`..${path.sep}`)) {
          return new Response("Bad asset path", { status: 400 });
        }

        let bytes;
        try {
          bytes = await readFile(filename);
        } catch (error) {
          if (error?.code !== "ENOENT") throw error;
          const body = "<!doctype html><html><head><title>Not found</title></head><body><h1>Not found</h1></body></html>";
          return new Response(request.method === "HEAD" ? null : body, {
            status: 404,
            headers: {
              "content-type": "text/html; charset=utf-8",
              "content-length": String(Buffer.byteLength(body)),
              "x-robots-tag": "noindex, nofollow, noarchive",
            },
          });
        }

        const headers = new Headers({
          "content-type": contentTypeFor(url.pathname),
          "content-length": String(bytes.length),
          // Simulate the inherited Pages preview header that production must override.
          "x-robots-tag": "noindex, nofollow, noarchive",
        });
        if (setCookie) headers.set("set-cookie", "upstream_session=ASSET_COOKIE_CANARY; HttpOnly");
        return new Response(request.method === "HEAD" ? null : bytes, {
          status: 200,
          headers,
        });
      },
    },
  };
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(ROOT, relativePath), "utf8"));
}

function sitemapEntries(xml) {
  const entries = [];
  for (const block of xml.match(/<url\b[^>]*>[\s\S]*?<\/url>/gi) || []) {
    const location = (block.match(/<loc\b[^>]*>([\s\S]*?)<\/loc>/i) || [])[1]?.trim();
    const lastModified = (block.match(/<lastmod\b[^>]*>([\s\S]*?)<\/lastmod>/i) || [])[1]?.trim();
    if (location) entries.push({ location, lastModified: lastModified || "" });
  }
  return entries;
}

test("route manifest owns 39 indexable and three noindex routes with real source dates", async () => {
  assert.equal(LEGACY_ROUTES.length, 34);
  assert.equal(INDEXABLE_GROWTH_ROUTES.length, 5);
  assert.equal(NOINDEX_GROWTH_ROUTES.length, 3);
  assert.equal(Object.keys(ROUTE_MANIFEST).length, 42);
  assert.equal(PUBLIC_INDEXABLE_PATHS.length, 39);
  assert.equal(new Set(PUBLIC_INDEXABLE_PATHS).size, 39);
  assert.equal(new Set(PUBLIC_STATIC_ASSET_PATHS).size, PUBLIC_STATIC_ASSET_PATHS.length);

  const noindexRoutes = Object.values(ROUTE_MANIFEST)
    .filter((record) => record.indexPolicy === "noindex")
    .map((record) => record.pathname)
    .sort();
  assert.deepEqual(noindexRoutes, [...NOINDEX_GROWTH_ROUTES].sort());

  const capture = await readJson("site/legacy/capture.lock.json");
  const legacyDates = new Map(capture.pages.map((page) => [page.route, page.lastModified]));
  const growth = await readJson("site/growth/content-manifest.json");
  const growthDates = new Map(growth.pages.map((page) => [page.path, page.updatedAt]));

  for (const [pathname, record] of Object.entries(ROUTE_MANIFEST)) {
    assert.equal(record.pathname, pathname);
    assert.equal(record.canonicalPath, pathname);
    assert.equal(record.assetPath, pathname);
    assert.match(record.cachePolicy || "", /\S/, `${pathname} cachePolicy`);
    assert.match(record.schemaType || "", /\S/, `${pathname} schemaType`);
    assert.match(record.commerce || "", /\S/, `${pathname} commerce`);

    if (record.indexPolicy === "index") {
      assert.equal(record.sitemap, true, `${pathname} sitemap`);
      assert.ok(PUBLIC_INDEXABLE_PATHS.includes(pathname), pathname);
    } else {
      assert.equal(record.sitemap, false, `${pathname} sitemap`);
      assert.ok(!PUBLIC_INDEXABLE_PATHS.includes(pathname), pathname);
    }

    const expectedDate = record.contentSource === "legacy"
      ? legacyDates.get(pathname)
      : growthDates.get(pathname);
    assert.equal(record.lastModified, expectedDate, `${pathname} lastModified`);
    assert.match(record.lastModified, /^\d{4}-\d{2}-\d{2}$/, pathname);
  }
});

test("module Worker serves GET and HEAD for every manifest page and overrides inherited noindex", async () => {
  const root = await releaseRoot();
  const env = createAssetsEnvironment(root);
  const freeze = await readJson("site/legacy/legacy-freeze-manifest.json");
  assert.equal(freeze.schemaVersion, "legacy-freeze-v2");
  const frozenByRoute = new Map(freeze.pages.map((record) => [record.route, record]));
  const slotRoutes = new Set(ADDITIVE_SLOT_ROUTES);
  let totalSlots = 0;
  let totalCommerceWidgets = 0;

  for (const [pathname, record] of Object.entries(ROUTE_MANIFEST)) {
    const url = `${ORIGIN}${pathname}`;
    const getResponse = await worker.fetch(new Request(url), env, {});
    const getBody = await getResponse.text();
    assert.equal(getResponse.status, 200, `${pathname} GET`);
    assert.equal(getResponse.headers.get("content-type")?.split(";", 1)[0], "text/html", pathname);
    assert.equal(canonicalHref(getBody), url, `${pathname} canonical`);
    assert.equal(metaContent(getBody, "property", "og:url"), url, `${pathname} og:url`);
    assert.doesNotMatch(getBody, /\/_next\/|(?:self\.)?__next_|getgiffgaff\.pages\.dev/i, pathname);

    const slots = additiveSlotCount(getBody);
    totalSlots += slots;
    const commerceWidgets = commerceWidgetCount(getBody);
    totalCommerceWidgets += commerceWidgets;
    assert.equal(commerceWidgets, 1, `${pathname} commerce widget count`);
    if (record.contentSource === "legacy") {
      const frozen = frozenByRoute.get(pathname);
      assert.ok(frozen, `${pathname} freeze record`);
      assert.equal(slots, slotRoutes.has(pathname) ? 1 : 0, `${pathname} additive slot count`);
      assert.equal(elementText(getBody, "title"), frozen.title, `${pathname} title`);
      assert.equal(metaContent(getBody, "name", "description"), frozen.description, `${pathname} description`);
      assert.equal(elementText(getBody, "h1"), frozen.h1, `${pathname} H1`);
      assert.equal(navigationSignature(getBody), frozen.navigationSha256, `${pathname} navigation`);
      assert.equal(visibleTextSignature(getBody), frozen.visibleTextSha256, `${pathname} visible copy`);
      assert.equal(legacyDomSignature(getBody), frozen.domSha256, `${pathname} legacy DOM`);
    } else {
      assert.equal(slots, 0, `${pathname} must not duplicate a legacy growth slot`);
    }

    if (record.indexPolicy === "index") {
      assertDirectives(getResponse, INDEX_DIRECTIVES, pathname);
      assert.ok(!directiveSet(getResponse).has("noindex"), `${pathname} inherited noindex removed`);
      assert.match(getResponse.headers.get("cache-control") || "", /\bpublic\b/i, pathname);
      assert.match(getResponse.headers.get("cache-control") || "", /\bs-maxage=600\b/i, pathname);
    } else {
      assertDirectives(getResponse, new Set(["noindex", "follow", "noarchive"]), pathname);
      assert.ok(!directiveSet(getResponse).has("nofollow"), `${pathname} must remain follow`);
    }

    const headResponse = await worker.fetch(new Request(url, { method: "HEAD" }), env, {});
    assert.equal(headResponse.status, 200, `${pathname} HEAD`);
    assert.equal(await headResponse.text(), "", `${pathname} HEAD body`);
    assert.equal(
      headResponse.headers.get("content-length"),
      getResponse.headers.get("content-length"),
      `${pathname} GET/HEAD length`,
    );
    assert.deepEqual(directiveSet(headResponse), directiveSet(getResponse), `${pathname} GET/HEAD robots`);
  }

  assert.equal(totalSlots, 8);
  assert.equal(totalCommerceWidgets, Object.keys(ROUTE_MANIFEST).length);
  assert.ok(!env.calls.some((call) => /\/_next(?:\/|$)/i.test(call.pathname)));
});

test("sitemap is generated from the same manifest for GET and HEAD", async () => {
  const root = await releaseRoot();
  const env = createAssetsEnvironment(root);
  const sitemapUrl = `${ORIGIN}/sitemap.xml`;
  const getResponse = await worker.fetch(new Request(sitemapUrl), env, {});
  const xml = await getResponse.text();
  const entries = sitemapEntries(xml);

  assert.equal(getResponse.status, 200);
  assert.match(getResponse.headers.get("content-type") || "", /(?:application|text)\/xml/i);
  assert.equal(getResponse.headers.get("x-robots-tag"), null);
  assert.equal(entries.length, 39);
  assert.equal(new Set(entries.map((entry) => entry.location)).size, 39);
  assert.deepEqual(
    entries.map((entry) => entry.location),
    PUBLIC_INDEXABLE_PATHS.map((pathname) => `${ORIGIN}${pathname}`),
  );
  for (const entry of entries) {
    const pathname = new URL(entry.location).pathname;
    assert.equal(entry.lastModified, routeFor(pathname).lastModified, pathname);
  }
  for (const pathname of NOINDEX_GROWTH_ROUTES) {
    assert.ok(!xml.includes(`${ORIGIN}${pathname}`), pathname);
  }

  const headResponse = await worker.fetch(new Request(sitemapUrl, { method: "HEAD" }), env, {});
  assert.equal(headResponse.status, 200);
  assert.equal(await headResponse.text(), "");
  assert.equal(headResponse.headers.get("content-type"), getResponse.headers.get("content-type"));
  assert.equal(headResponse.headers.get("content-length"), getResponse.headers.get("content-length"));
  assert.equal(headResponse.headers.get("x-robots-tag"), null);
});

test("canonical variants normalize host, scheme, slash, index.html and ordinary query in one hop", async () => {
  const root = await releaseRoot();
  const canonical = `${ORIGIN}/guides/7-arrival-checklist/`;
  const cases = new Map([
    ["http://getgiffgaff.com/guides/7-arrival-checklist/", canonical],
    ["https://www.getgiffgaff.com/guides/7-arrival-checklist/", canonical],
    ["https://getgiffgaff.com:8443/guides/7-arrival-checklist/", canonical],
    ["https://getgiffgaff.com/guides/7-arrival-checklist", canonical],
    ["https://getgiffgaff.com/guides/7-arrival-checklist/index.html", canonical],
    ["https://getgiffgaff.com//guides//7-arrival-checklist//", canonical],
    ["https://getgiffgaff.com/guides/7-arrival-checklist/?utm_source=contract&utm_campaign=seo", canonical],
    [
      "http://www.getgiffgaff.com//guides//7-arrival-checklist/index.html?utm_source=contract",
      canonical,
    ],
    ["https://getgiffgaff.com/index.html", `${ORIGIN}/`],
  ]);

  for (const [input, expected] of cases) {
    const env = createAssetsEnvironment(root);
    const response = await worker.fetch(new Request(input), env, {});
    assert.equal(response.status, 301, input);
    assert.equal(response.headers.get("location"), expected, input);
    assert.equal(env.calls.length, 0, `${input} must redirect before ASSETS`);
  }
});

test("Authorization, sensitive queries and encoded CRLF fail before static assets", async () => {
  const root = await releaseRoot();
  const probes = [
    new Request(`${ORIGIN}/contact/`, {
      headers: { authorization: "Bearer AUTHORIZATION_CANARY" },
    }),
    ...["access_token", "api_key", "auth_token", "id_token", "otp", "API_KEY"].map(
      (key) => new Request(`${ORIGIN}/contact/?${key}=SENSITIVE_QUERY_CANARY`),
    ),
    ...[
      "/guides/%0d%0aX-Injected:yes/",
      "/guides/%250d%250aX-Injected:yes/",
      "/guides/%25250d%25250aX-Injected:yes/",
    ].map((pathname) => new Request(`${ORIGIN}${pathname}`)),
  ];

  for (const request of probes) {
    const env = createAssetsEnvironment(root);
    const response = await worker.fetch(request, env, {});
    const body = await response.text();
    assert.equal(response.status, 400, request.url);
    assertDirectives(response, PRIVATE_DIRECTIVES, request.url);
    assert.match(response.headers.get("cache-control") || "", /\bno-store\b/i, request.url);
    assert.equal(env.calls.length, 0, `${request.url} must fail before ASSETS`);
    assert.doesNotMatch(body, /AUTHORIZATION_CANARY|SENSITIVE_QUERY_CANARY|X-Injected/i);
  }
});

test("Cookie is stripped before ASSETS, response state is removed and caching fails closed", async () => {
  const root = await releaseRoot();
  const env = createAssetsEnvironment(root, { setCookie: true });
  const response = await worker.fetch(
    new Request(`${ORIGIN}/contact/`, {
      headers: { cookie: "session=COOKIE_REQUEST_CANARY; phone=13800000000" },
    }),
    env,
    {},
  );
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.equal(env.calls.length, 1);
  assert.equal(env.calls[0].cookie, null);
  assert.equal(env.calls[0].authorization, null);
  assert.equal(response.headers.get("set-cookie"), null);
  assert.match(response.headers.get("cache-control") || "", /\bprivate\b/i);
  assert.match(response.headers.get("cache-control") || "", /\bno-store\b/i);
  assertDirectives(response, INDEX_DIRECTIVES, "cookie response indexing");
  assert.doesNotMatch(body, /COOKIE_REQUEST_CANARY|13800000000|ASSET_COOKIE_CANARY/);
});

test("unknown hosts are rejected while project previews remain usable, private and noindex", async () => {
  const root = await releaseRoot();
  for (const hostname of ["evil.example", "unrelated.pages.dev", "branch.other-project.pages.dev"]) {
    const env = createAssetsEnvironment(root);
    const response = await worker.fetch(new Request(`https://${hostname}/guides/7-arrival-checklist/`), env, {});
    assert.equal(response.status, 421, hostname);
    assertDirectives(response, PRIVATE_DIRECTIVES, hostname);
    assert.match(response.headers.get("cache-control") || "", /\bno-store\b/i, hostname);
    assert.equal(env.calls.length, 0, hostname);
  }

  const env = createAssetsEnvironment(root);
  const response = await worker.fetch(
    new Request("https://contract-preview.getgiffgaff.pages.dev/guides/7-arrival-checklist/"),
    env,
    {},
  );
  const body = await response.text();
  assert.equal(response.status, 200);
  assertDirectives(response, PRIVATE_DIRECTIVES, "Pages preview");
  assert.match(response.headers.get("cache-control") || "", /\bprivate\b/i);
  assert.match(response.headers.get("cache-control") || "", /\bno-store\b/i);
  assert.equal(canonicalHref(body), `${ORIGIN}/guides/7-arrival-checklist/`);
  assert.equal(env.calls.length, 1);
});

test("404 responses are private noindex documents without another page canonical", async () => {
  const root = await releaseRoot();
  const env = createAssetsEnvironment(root);
  const url = `${ORIGIN}/does-not-exist/`;
  const response = await worker.fetch(new Request(url), env, {});
  const body = await response.text();

  assert.equal(response.status, 404);
  assertDirectives(response, PRIVATE_DIRECTIVES, url);
  assert.match(response.headers.get("cache-control") || "", /\bno-store\b/i);
  assert.equal(canonicalHref(body), "");
  assert.equal(metaContent(body, "property", "og:url"), "");
  assert.doesNotMatch(response.headers.get("link") || "", /rel=["']?canonical/i);
  assert.equal(env.calls.length, 0, "unknown routes must fail before Pages ASSETS fallback");

  const head = await worker.fetch(new Request(url, { method: "HEAD" }), env, {});
  assert.equal(head.status, 404);
  assert.equal(await head.text(), "");
  assertDirectives(head, PRIVATE_DIRECTIVES, `${url} HEAD`);
  assert.equal(env.calls.length, 0, "unknown HEAD routes must fail before Pages ASSETS fallback");

  const missingAsset = await worker.fetch(
    new Request(`${ORIGIN}/growth-assets/not-real.js`),
    env,
    {},
  );
  assert.equal(missingAsset.status, 404);
  assertDirectives(missingAsset, PRIVATE_DIRECTIVES, "unknown static asset");
  assert.equal(env.calls.length, 0, "unknown assets must fail before Pages ASSETS fallback");
});

test("legacy and growth static resources retain their public URLs and never inherit robots headers", async () => {
  const root = await releaseRoot();
  for (const pathname of PUBLIC_STATIC_ASSET_PATHS) {
    const expected = await readFile(publicFile(root, pathname));
    const env = createAssetsEnvironment(root);
    const response = await worker.fetch(new Request(`${ORIGIN}${pathname}`), env, {});
    const actual = Buffer.from(await response.arrayBuffer());

    assert.equal(response.status, 200, pathname);
    if (pathname === "/llms.txt") {
      assertDirectives(response, new Set(["noindex", "follow", "noarchive"]), pathname);
    } else {
      assert.equal(response.headers.get("x-robots-tag"), null, pathname);
    }
    assert.equal(sha256(actual), sha256(expected), pathname);
    assert.ok(!env.calls.some((call) => /\/_next(?:\/|$)/i.test(call.pathname)), pathname);
    if (/\.(?:css|js)$/.test(pathname)) {
      assert.doesNotMatch(
        actual.toString("utf8"),
        /\/_next\/|(?:self\.)?__next_|[a-z0-9-]+\.getgiffgaff\.pages\.dev/i,
        pathname,
      );
    }

    const head = await worker.fetch(new Request(`${ORIGIN}${pathname}`, { method: "HEAD" }), env, {});
    assert.equal(head.status, 200, `${pathname} HEAD`);
    assert.equal(await head.text(), "", `${pathname} HEAD body`);
    if (pathname === "/llms.txt") {
      assertDirectives(head, new Set(["noindex", "follow", "noarchive"]), `${pathname} HEAD`);
    } else {
      assert.equal(head.headers.get("x-robots-tag"), null, `${pathname} HEAD robots`);
    }
    assert.equal(head.headers.get("content-length"), String(expected.length), `${pathname} HEAD length`);
  }
});

test("every root-relative asset referenced by release HTML is Worker-allowlisted", async () => {
  const root = await releaseRoot();
  const allowlist = new Set(PUBLIC_STATIC_ASSET_PATHS);

  for (const pathname of Object.keys(ROUTE_MANIFEST)) {
    const html = await readFile(publicFile(root, pathname), "utf8");
    for (const match of html.matchAll(/\b(?:href|src)=["'](\/[^"']*)["']/gi)) {
      const referenced = new URL(match[1], ORIGIN).pathname;
      if (routeFor(referenced)) continue;
      assert.ok(
        allowlist.has(referenced),
        `${pathname} references ${referenced}, but it is missing from PUBLIC_STATIC_ASSET_PATHS`,
      );
    }
  }
});
