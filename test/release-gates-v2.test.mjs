import assert from "node:assert/strict";
import test from "node:test";

import worker, { CANONICAL_ORIGIN } from "../public/worker-logic.js";
import {
  PUBLIC_INDEXABLE_PATHS,
  ROUTE_MANIFEST,
  routeFor,
} from "../public/route-manifest.js";

const INDEXABLE = "index, follow, max-snippet:-1, max-image-preview:large";
const SUPPORTING_NOINDEX = "noindex, follow, noarchive";
const PRIVATE_NOINDEX = "noindex, nofollow, noarchive";

const COMMERCIAL_HOLD_PATHS = [
  "/shop/",
  "/shop/giffgaff-g0/",
  "/shop/giffgaff-g2/",
  "/guides/1-order/",
  "/guides/4-recharge-service/",
];

const TRUST_INDEX_PATHS = [
  "/about/",
  "/contact/",
  "/shipping/",
  "/returns/",
  "/editorial-policy/",
  "/disclaimer/",
];

function htmlFixture(pathname, status = 200) {
  return new Response(`<!doctype html><html lang="zh-CN"><head>
    <title>Preview</title>
    <link rel="canonical" href="${CANONICAL_ORIGIN}/">
    <meta property="og:url" content="${CANONICAL_ORIGIN}/">
    <script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "FAQPage", mainEntity: [] },
        { "@type": "Product", name: "G2", offers: { "@type": "Offer", price: "99" } },
        { "@type": "Offer", price: "99", priceCurrency: "CNY" },
      ],
    })}</script>
  </head><body><main><h1>${pathname}</h1></main></body></html>`, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex",
      "set-cookie": "preview=unsafe",
    },
  });
}

async function withFetch(fetchImpl, callback) {
  const original = globalThis.fetch;
  globalThis.fetch = fetchImpl;
  try {
    return await callback();
  } finally {
    globalThis.fetch = original;
  }
}

function sitemapLocations(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

test("route manifest is the single index policy source and commerce fails closed", () => {
  assert.ok(Object.keys(ROUTE_MANIFEST).length > 34);
  assert.equal(new Set(PUBLIC_INDEXABLE_PATHS).size, PUBLIC_INDEXABLE_PATHS.length);

  for (const [pathname, route] of Object.entries(ROUTE_MANIFEST)) {
    assert.equal(route.path, pathname, pathname);
    assert.equal(typeof route.contentOwner, "string", pathname);
    assert.ok(route.contentOwner.length > 0, pathname);
    assert.match(route.lastModified, /^\d{4}-\d{2}-\d{2}$/, pathname);
    assert.equal(typeof route.cachePolicy, "string", pathname);
    assert.ok(Array.isArray(route.schemaTypes), pathname);
    assert.equal(typeof route.commerceAllowed, "boolean", pathname);
  }

  for (const pathname of PUBLIC_INDEXABLE_PATHS) {
    const route = routeFor(pathname);
    assert.equal(route?.indexPolicy, "index", pathname);
    assert.equal(route?.canonicalPath, pathname, pathname);
    assert.equal(route?.commerceAllowed, false, pathname);
  }

  for (const pathname of COMMERCIAL_HOLD_PATHS) {
    const route = routeFor(pathname);
    assert.equal(route?.indexPolicy, "noindex", pathname);
    assert.equal(route?.commerceAllowed, false, pathname);
    assert.equal(route?.contentOwner, "business-owner-pending", pathname);
    assert.equal(PUBLIC_INDEXABLE_PATHS.includes(pathname), false, pathname);
  }

  for (const pathname of TRUST_INDEX_PATHS) {
    assert.equal(routeFor(pathname)?.indexPolicy, "index", pathname);
  }
  for (const pathname of ["/privacy/", "/terms/", "/research/"]) {
    assert.equal(routeFor(pathname)?.indexPolicy, "noindex", pathname);
  }
});

test("sensitive credentials are rejected before rendering and cookie requests stay uncacheable", async () => {
  let calls = 0;
  let forwardedCookie = "not-called";
  await withFetch(async (request) => {
    calls += 1;
    forwardedCookie = request.headers.get("cookie");
    return htmlFixture(new URL(request.url).pathname);
  }, async () => {
    for (const url of [
      `${CANONICAL_ORIGIN}/guides/?api_key=secret`,
      `${CANONICAL_ORIGIN}/guides/?auth_token=secret`,
      `${CANONICAL_ORIGIN}/guides/?id_token=secret`,
      `${CANONICAL_ORIGIN}/guides/?otp=123456`,
    ]) {
      const response = await worker.fetch(new Request(url), {});
      assert.equal(response.status, 400, url);
      assert.equal(response.headers.get("x-robots-tag"), PRIVATE_NOINDEX, url);
      assert.match(response.headers.get("cache-control") ?? "", /no-store/i, url);
    }

    const authorization = await worker.fetch(new Request(`${CANONICAL_ORIGIN}/guides/`, {
      headers: { authorization: "Bearer secret" },
    }), {});
    assert.equal(authorization.status, 400);
    assert.equal(calls, 0, "credentials must be rejected before upstream fetch");

    const publicRequest = await worker.fetch(new Request(`${CANONICAL_ORIGIN}/guides/`, {
      headers: { cookie: "session=secret" },
    }), {});
    assert.equal(publicRequest.status, 200);
    assert.equal(calls, 0, "local pages must never call the retired upstream fetch");
    assert.equal(forwardedCookie, "not-called");
    assert.match(publicRequest.headers.get("cache-control") ?? "", /no-store/i);
  });
});

test("non-functional and ambiguous URL variants cannot create indexable copies", async () => {
  await withFetch(async () => {
    throw new Error("canonical variants must not reach upstream");
  }, async () => {
    const cases = [
      [`${CANONICAL_ORIGIN}/contact/?utm_source=test`, `${CANONICAL_ORIGIN}/contact/`, 301],
      [`${CANONICAL_ORIGIN}/contact//`, `${CANONICAL_ORIGIN}/contact/`, 301],
      [`${CANONICAL_ORIGIN}/contact/index.html`, `${CANONICAL_ORIGIN}/contact/`, 301],
    ];
    for (const [url, location, status] of cases) {
      const response = await worker.fetch(new Request(url), {});
      assert.equal(response.status, status, url);
      assert.equal(response.headers.get("location"), location, url);
    }

    const encodedSlash = await worker.fetch(
      new Request(`${CANONICAL_ORIGIN}/contact%2F`),
      {},
    );
    assert.equal(encodedSlash.status, 400);
    assert.equal(encodedSlash.headers.get("x-robots-tag"), PRIVATE_NOINDEX);
  });
});

test("sitemap is generated locally from the manifest for GET and HEAD", async () => {
  await withFetch(async () => {
    throw new Error("sitemap must not depend on preview origin");
  }, async () => {
    const get = await worker.fetch(new Request(`${CANONICAL_ORIGIN}/sitemap.xml`), {});
    const xml = await get.text();
    const head = await worker.fetch(
      new Request(`${CANONICAL_ORIGIN}/sitemap.xml`, { method: "HEAD" }),
      {},
    );
    const locations = sitemapLocations(xml);

    assert.equal(get.status, 200);
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
    assert.equal(head.headers.get("content-type"), get.headers.get("content-type"));
    assert.equal(head.headers.get("etag"), get.headers.get("etag"));
    assert.equal(Number(head.headers.get("content-length")), new TextEncoder().encode(xml).length);
    assert.deepEqual(
      locations,
      PUBLIC_INDEXABLE_PATHS.map((pathname) => `${CANONICAL_ORIGIN}${pathname}`),
    );
    assert.doesNotMatch(xml, /<changefreq>|<priority>/);
    for (const pathname of COMMERCIAL_HOLD_PATHS) {
      assert.equal(locations.includes(`${CANONICAL_ORIGIN}${pathname}`), false, pathname);
    }
  });
});

test("llms files fail closed and never repeat suspended commerce claims", async () => {
  await withFetch(async () => {
    throw new Error("llms files must not depend on preview origin");
  }, async () => {
    const full = await worker.fetch(new Request(`${CANONICAL_ORIGIN}/llms-full.txt`), {});
    assert.equal(full.status, 410);
    assert.equal(full.headers.get("x-robots-tag"), PRIVATE_NOINDEX);

    const short = await worker.fetch(new Request(`${CANONICAL_ORIGIN}/llms.txt`), {});
    const text = await short.text();
    assert.equal(short.status, 200);
    assert.equal(short.headers.get("x-robots-tag"), SUPPORTING_NOINDEX);
    assert.match(text, /Independent third-party|独立第三方/i);
    assert.match(text, /\/guides\/3-usage\//);
    assert.doesNotMatch(text, /\/shop\/giffgaff-g2\/|10\s*[\u2013-]\s*14|G2.*(?:购买|推荐)/i);
  });
});

test("Contact and trust pages are local, accessible, non-commercial documents", async () => {
  await withFetch(async () => {
    throw new Error("trust pages must not depend on preview origin");
  }, async () => {
    for (const pathname of TRUST_INDEX_PATHS) {
      const response = await worker.fetch(new Request(`${CANONICAL_ORIGIN}${pathname}`), {});
      const html = await response.text();
      assert.equal(response.status, 200, pathname);
      assert.equal(response.headers.get("x-robots-tag"), INDEXABLE, pathname);
      assert.match(html, /<a[^>]+href="#main-content"[^>]*>.*?<\/a>/is, pathname);
      assert.equal((html.match(/<main\b/gi) || []).length, 1, pathname);
      assert.equal((html.match(/<h1\b/gi) || []).length, 1, pathname);
      assert.match(html, new RegExp(`<link rel="canonical" href="${CANONICAL_ORIGIN.replaceAll(".", "\\.")}${pathname}"`), pathname);
      assert.doesNotMatch(html, /pages\.dev|giffgaff\s*(?:官网|官方客服)/i, pathname);
    }

    const contact = await worker.fetch(new Request(`${CANONICAL_ORIGIN}/contact/`), {});
    const html = await contact.text();
    assert.match(html, /<title>联系 getgiffgaff｜订单、发货与使用支持<\/title>/);
    assert.match(html, /<h1[^>]*>联系 getgiffgaff：订单、发货与使用支持<\/h1>/);
    assert.match(html, /(?:请勿|不要)发送[\s\S]*(?:密码|验证码)[\s\S]*(?:支付卡|eSIM)/);
    assert.doesNotMatch(html, /确认\s*G[02]\s*库存|快团团|ktt-giga-card|购买按钮/i);
  });
});

test("unsupported Product, Offer and FAQ schema are removed from rendered HTML", async () => {
  await withFetch(async (request) => htmlFixture(new URL(request.url).pathname), async () => {
    const response = await worker.fetch(new Request(`${CANONICAL_ORIGIN}/guides/`), {});
    const html = await response.text();
    assert.doesNotMatch(html, /"@type"\s*:\s*"(?:Product|Offer|FAQPage)"/);
    assert.doesNotMatch(html, /"(?:offers|price|availability)"\s*:/);
  });

  const tutorial = await worker.fetch(
    new Request(`${CANONICAL_ORIGIN}/guides/2-activate/`),
    {},
  );
  assert.doesNotMatch(await tutorial.text(), /"@type"\s*:\s*"FAQPage"/);
});

test("security headers and error metadata are consistent", async () => {
  await withFetch(async (request) => htmlFixture(new URL(request.url).pathname, 404), async () => {
    const response = await worker.fetch(new Request(`${CANONICAL_ORIGIN}/missing/`), {});
    const html = await response.text();
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("x-robots-tag"), PRIVATE_NOINDEX);
    assert.equal(
      response.headers.get("strict-transport-security"),
      "max-age=31536000; includeSubDomains",
    );
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
    assert.doesNotMatch(html, /rel="canonical"|property="og:url"/i);
  });
});
