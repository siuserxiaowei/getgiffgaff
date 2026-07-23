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
  "/",
  "/shop/",
  "/guides/0-intro/",
  "/guides/1-order/",
  "/answers/",
  "/guides/2-activate/",
  "/guides/3-account/",
  "/guides/3-app/",
  "/guides/3-usage/",
  "/guides/4-recharge-service/",
  "/guides/4-signal/",
  "/guides/5-travel-data/",
  "/more/03-esim/",
  "/more/04-esim-qrcode/",
  "/qa/02-topup/",
  "/qa/07-voicemail-switch/",
  "/guides/6-pitfalls/",
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
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg";
  if (pathname.endsWith(".xml")) return "application/xml; charset=utf-8";
  if (pathname.endsWith(".json")) return "application/json; charset=utf-8";
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

function createMemoryCache() {
  const entries = new Map();
  return {
    entries,
    async match(request) {
      const stored = entries.get(request.url);
      return stored ? stored.clone() : undefined;
    },
    async put(request, response) {
      entries.set(request.url, response.clone());
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

test("route manifest owns 49 indexable and seven noindex routes with real source dates", async () => {
  assert.equal(LEGACY_ROUTES.length, 34);
  assert.equal(INDEXABLE_GROWTH_ROUTES.length, 15);
  assert.equal(NOINDEX_GROWTH_ROUTES.length, 7);
  assert.equal(Object.keys(ROUTE_MANIFEST).length, 56);
  assert.equal(PUBLIC_INDEXABLE_PATHS.length, 49);
  assert.equal(new Set(PUBLIC_INDEXABLE_PATHS).size, 49);
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
  const consultationRecoveryRoutes = new Set([
    "/",
    "/guides/0-intro/",
    "/guides/1-order/",
    "/guides/3-account/",
    "/guides/3-app/",
    "/guides/4-recharge-service/",
    "/guides/5-travel-data/",
    "/guides/6-pitfalls/",
    "/guides/7-arrival-checklist/",
    "/guides/8-uk-sim-choice/",
    "/more/00-wechat/",
    "/more/02-telegram/",
    "/qa/00-username/",
    "/qa/01-change-number/",
    "/qa/02-topup/",
    "/qa/03-reissue/",
    "/qa/04-choose-number/",
    "/qa/05-multiple-number/",
    "/qa/06-activation-expiration/",
    "/qa/07-voicemail-switch/",
    "/qa/08-gv/",
    "/qa/09-spread/",
    "/shop/",
    "/shop/giffgaff-g0/",
    "/shop/giffgaff-g2/",
    "/contact/",
    "/tools/keep-number-reminder/",
    "/tools/china-roaming-cost/",
    "/tools/g0-g2-total-cost/",
  ]);
  const internalLinkRefinementRoutes = new Set([
    "/",
    "/shop/",
    "/guides/0-intro/",
    "/guides/1-order/",
    "/answers/",
    "/guides/2-activate/",
    "/guides/3-account/",
    "/guides/3-app/",
    "/guides/3-usage/",
    "/guides/4-recharge-service/",
    "/guides/4-signal/",
    "/guides/5-travel-data/",
    "/more/03-esim/",
    "/qa/02-topup/",
    "/qa/07-voicemail-switch/",
    "/guides/6-pitfalls/",
    "/guides/7-arrival-checklist/",
    "/guides/8-uk-sim-choice/",
    "/tools/keep-number-reminder/",
    "/tools/china-roaming-cost/",
    "/tools/g0-g2-total-cost/",
  ]);
  const accountVerificationExpansionRoutes = new Set([
    "/",
    "/shop/",
    "/guides/3-account/",
    "/guides/4-signal/",
    "/guides/6-pitfalls/",
    "/guides/claude-identity-verification/",
    "/guides/claude-phone-verification/",
    "/guides/claude-account-disabled-appeal/",
  ]);

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

    const expectedDate = pathname === "/tools/keep-number-reminder/"
      ? "2026-07-23"
      : pathname === "/"
      ? "2026-07-20T06:51:08Z"
      : accountVerificationExpansionRoutes.has(pathname)
        ? "2026-07-20T06:15:00Z"
      : internalLinkRefinementRoutes.has(pathname)
        ? "2026-07-19T15:35:26Z"
      : consultationRecoveryRoutes.has(pathname)
        ? "2026-07-19"
        : record.contentSource === "legacy"
          ? legacyDates.get(pathname)
          : growthDates.get(pathname);
    assert.equal(record.lastModified, expectedDate, `${pathname} lastModified`);
    assert.match(record.lastModified, /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}Z)?$/, pathname);
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
    const expectedWidgets = [
      "/guides/claude-identity-verification/",
      "/guides/claude-account-disabled-appeal/",
    ].includes(pathname) ? 0 : 1;
    assert.equal(commerceWidgets, expectedWidgets, `${pathname} commerce widget count`);
    if (record.contentSource === "legacy") {
      const frozen = frozenByRoute.get(pathname);
      assert.ok(frozen, `${pathname} freeze record`);
      assert.equal(slots, slotRoutes.has(pathname) ? 1 : 0, `${pathname} additive slot count`);
      assert.doesNotMatch(
        getBody,
        /获取 eSIM 二维码，并写入到 9eSIM|涉及密码、验证码或账号安全时，要确认你理解操作风险/,
        pathname,
      );
      assert.doesNotMatch(
        getBody,
        /优先推荐|更适合接收海外平台短信验证码|通常含 10-14 英镑余额/,
        pathname,
      );
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

  assert.equal(totalSlots, ADDITIVE_SLOT_ROUTES.length);
  assert.equal(totalCommerceWidgets, Object.keys(ROUTE_MANIFEST).length - 2);
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
  assert.equal(entries.length, 49);
  assert.equal(new Set(entries.map((entry) => entry.location)).size, 49);
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

test("canonical variants keep only allowlisted attribution and normalize in one hop", async () => {
  const root = await releaseRoot();
  const canonical = `${ORIGIN}/guides/7-arrival-checklist/`;
  const attributed = `${canonical}?utm_source=dist_wechat_group`;
  const cases = new Map([
    ["http://getgiffgaff.com/guides/7-arrival-checklist/", canonical],
    ["https://www.getgiffgaff.com/guides/7-arrival-checklist/", canonical],
    ["https://getgiffgaff.com:8443/guides/7-arrival-checklist/", canonical],
    ["https://getgiffgaff.com/guides/7-arrival-checklist", canonical],
    ["https://getgiffgaff.com/guides/7-arrival-checklist/index.html", canonical],
    ["https://getgiffgaff.com//guides//7-arrival-checklist//", canonical],
    [
      "https://getgiffgaff.com/guides/7-arrival-checklist/?utm_source=dist_wechat_group",
      null,
    ],
    [
      "https://getgiffgaff.com/guides/7-arrival-checklist/?utm_source=dist_wechat_group&utm_campaign=private-note",
      attributed,
    ],
    ["https://getgiffgaff.com/guides/7-arrival-checklist/?utm_source=contract", canonical],
    [
      "http://www.getgiffgaff.com//guides//7-arrival-checklist/index.html?utm_source=dist_partner",
      `${canonical}?utm_source=dist_partner`,
    ],
    ["https://getgiffgaff.com/index.html", `${ORIGIN}/`],
  ]);

  for (const [input, expected] of cases) {
    const env = createAssetsEnvironment(root);
    const response = await worker.fetch(new Request(input), env, {});
    if (expected === null) {
      assert.equal(response.status, 200, input);
      assert.equal(env.calls.length, 1, `${input} is already canonical`);
      continue;
    }
    assert.equal(response.status, 301, input);
    assert.equal(response.headers.get("location"), expected, input);
    assert.equal(env.calls.length, 0, `${input} must redirect before ASSETS`);
  }
});

test("retired WeChat QR URL permanently redirects to the owner-verified image", async () => {
  const root = await releaseRoot();
  for (const method of ["GET", "HEAD"]) {
    const env = createAssetsEnvironment(root);
    const response = await worker.fetch(
      new Request(`${ORIGIN}/contact/wechat-qr.png`, { method }),
      env,
      {},
    );
    assert.equal(response.status, 301, method);
    assert.equal(response.headers.get("location"), `${ORIGIN}/contact/wechat-qr.jpg`, method);
    assert.match(response.headers.get("cache-control") || "", /public/u, method);
    assert.doesNotMatch(response.headers.get("x-robots-tag") || "", /noindex/u, method);
    assert.equal(env.calls.length, 0, `${method} redirect occurs before ASSETS`);
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

test("canonical production HTML uses a versioned edge cache while private requests bypass it", async () => {
  const root = await releaseRoot();
  const env = createAssetsEnvironment(root);
  env.__STATIC_CACHE = createMemoryCache();
  const pending = [];
  const context = { waitUntil(promise) { pending.push(promise); } };
  const url = `${ORIGIN}/guides/7-arrival-checklist/`;

  const miss = await worker.fetch(new Request(url), env, context);
  const missBody = await miss.text();
  assert.equal(miss.status, 200);
  assert.equal(miss.headers.get("x-getgiffgaff-edge-cache"), "MISS");
  assert.equal(env.calls.length, 1);
  await Promise.all(pending);
  assert.equal(env.__STATIC_CACHE.entries.size, 1);
  assert.deepEqual(
    [...env.__STATIC_CACHE.entries.keys()],
    [`${url}?__getgiffgaff_release=__GETGIFFGAFF_RELEASE_COMMIT__`],
    "source artifacts must never share a production HTML cache namespace",
  );

  const hit = await worker.fetch(new Request(url), env, context);
  assert.equal(hit.status, 200);
  assert.equal(hit.headers.get("x-getgiffgaff-edge-cache"), "HIT");
  assert.equal(await hit.text(), missBody);
  assert.equal(env.calls.length, 1, "cache HIT must not fetch Pages ASSETS again");

  const head = await worker.fetch(new Request(url, { method: "HEAD" }), env, context);
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("x-getgiffgaff-edge-cache"), "HIT");
  assert.equal(await head.text(), "");
  assert.equal(env.calls.length, 1, "cached HEAD must reuse the GET representation");

  const cookieResponse = await worker.fetch(
    new Request(url, { headers: { cookie: "session=PRIVATE_CACHE_BYPASS" } }),
    env,
    context,
  );
  assert.equal(cookieResponse.headers.get("x-getgiffgaff-edge-cache"), null);
  assert.match(cookieResponse.headers.get("cache-control") || "", /\bprivate\b/i);
  assert.equal(env.calls.length, 2, "Cookie requests must bypass the shared edge cache");

  const preview = await worker.fetch(
    new Request("https://cache-preview.getgiffgaff.pages.dev/guides/7-arrival-checklist/"),
    env,
    context,
  );
  assert.equal(preview.headers.get("x-getgiffgaff-edge-cache"), null);
  assert.match(preview.headers.get("cache-control") || "", /\bno-store\b/i);
  assert.equal(env.calls.length, 3, "preview requests must bypass the production edge cache");
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
    if (pathname === "/release-provenance.json") {
      assert.match(response.headers.get("cache-control") || "", /\bprivate\b/i);
      assert.match(response.headers.get("cache-control") || "", /\bno-store\b/i);
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
    if (pathname === "/release-provenance.json") {
      assert.match(head.headers.get("cache-control") || "", /\bprivate\b/i);
      assert.match(head.headers.get("cache-control") || "", /\bno-store\b/i);
    }
    assert.equal(head.headers.get("content-length"), String(expected.length), `${pathname} HEAD length`);
  }
});

test("versioned growth stylesheet is served from the same sanitized public asset", async () => {
  const root = await releaseRoot();
  const expected = await readFile(publicFile(root, "/growth-assets/growth.css"));
  for (const method of ["GET", "HEAD"]) {
    const env = createAssetsEnvironment(root);
    const response = await worker.fetch(
      new Request(`${ORIGIN}/growth-assets/growth.css?v=content-fingerprint`, { method }),
      env,
      {},
    );
    assert.equal(response.status, 200, method);
    assert.equal(response.headers.get("content-type"), "text/css; charset=utf-8", method);
    assert.equal(env.calls.length, 1, method);
    assert.equal(env.calls[0].pathname, "/growth-assets/growth.css", method);
    assert.equal(env.calls[0].search, "", method);
    if (method === "GET") {
      assert.equal(sha256(Buffer.from(await response.arrayBuffer())), sha256(expected));
    } else {
      assert.equal(await response.text(), "");
    }
  }
});

test("retired llms-full remains a private 410 for GET and HEAD", async () => {
  const root = await releaseRoot();
  const env = createAssetsEnvironment(root);
  const url = `${ORIGIN}/llms-full.txt`;

  const response = await worker.fetch(new Request(url), env, {});
  assert.equal(response.status, 410);
  assertDirectives(response, PRIVATE_DIRECTIVES, url);
  assert.match(await response.text(), /retired/i);
  assert.equal(env.calls.length, 0, "retired llms-full must not reach static assets");

  const head = await worker.fetch(new Request(url, { method: "HEAD" }), env, {});
  assert.equal(head.status, 410);
  assert.equal(await head.text(), "");
  assertDirectives(head, PRIVATE_DIRECTIVES, `${url} HEAD`);
  assert.equal(env.calls.length, 0, "retired llms-full HEAD must not reach static assets");
});

test("release search-change manifest remains an internal deployment artifact", async () => {
  const root = await releaseRoot();
  assert.ok((await readFile(path.join(root, "release-search-changes.json"))).length > 0);
  const env = createAssetsEnvironment(root);
  const response = await worker.fetch(
    new Request(`${ORIGIN}/release-search-changes.json`),
    env,
    {},
  );
  assert.equal(response.status, 404);
  assertDirectives(response, PRIVATE_DIRECTIVES, "/release-search-changes.json");
  assert.equal(env.calls.length, 0, "internal manifest must fail before ASSETS");
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
