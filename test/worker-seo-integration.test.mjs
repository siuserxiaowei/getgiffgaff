import assert from "node:assert/strict";
import test from "node:test";

import worker, {
  CANONICAL_ORIGIN,
  HOTFIX_ORIGIN,
  PUBLIC_INDEXABLE_PATHS,
} from "../public/worker-logic.js";

const INDEXABLE_DIRECTIVES =
  "index, follow, max-snippet:-1, max-image-preview:large";
const PRIVATE_DIRECTIVES = "noindex, nofollow, noarchive";

function parseAttributes(tag) {
  const attributes = new Map();
  const pattern = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

  for (const match of tag.matchAll(pattern)) {
    attributes.set(match[1].toLowerCase(), match[2] ?? match[3] ?? "");
  }

  return attributes;
}

function tags(html, tagName) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, "gi"))].map(
    (match) => match[0],
  );
}

function canonicalHref(html) {
  const canonical = tags(html, "link").find((tag) =>
    parseAttributes(tag)
      .get("rel")
      ?.toLowerCase()
      .split(/\s+/)
      .includes("canonical"),
  );

  return canonical ? parseAttributes(canonical).get("href") : undefined;
}

function metaContent(html, attributeName, attributeValue) {
  const meta = tags(html, "meta").find(
    (tag) =>
      parseAttributes(tag).get(attributeName)?.toLowerCase() ===
      attributeValue.toLowerCase(),
  );

  return meta ? parseAttributes(meta).get("content") : undefined;
}

function legacyHtml(pathname) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <title>Preview fixture</title>
    <meta name="description" content="Preview fixture for ${pathname}">
    <meta name="keywords" content="giffgaff官方客服,getgiffgaff官网">
    <link rel="canonical" href="${HOTFIX_ORIGIN}${pathname}">
    <meta property="og:url" content="${HOTFIX_ORIGIN}${pathname}">
    <script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Fixture product",
      offers: {
        "@type": "Offer",
        price: "99",
        priceCurrency: "CNY",
        availability: "https://schema.org/InStock",
      },
      aggregateRating: { "@type": "AggregateRating", ratingValue: "5" },
      review: [{ "@type": "Review", reviewBody: "fixture" }],
    })}</script>
  </head>
  <body>
    <main><h1>Fixture page</h1></main>
  </body>
</html>`;
}

function upstreamSitemapFixture() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${CANONICAL_ORIGIN}/contact/?utm_source=preview#fragment</loc></url>
  <url><loc>${CANONICAL_ORIGIN}/contact/</loc></url>
  <url><loc>${HOTFIX_ORIGIN}/</loc></url>
  <url><loc>${CANONICAL_ORIGIN}/not-public/</loc></url>
</urlset>`;
}

function responseWithInheritedNoindex(body, {
  status = 200,
  contentType = "text/html; charset=utf-8",
} = {}) {
  return new Response(body, {
    status,
    headers: {
      "content-type": contentType,
      "x-robots-tag": "noindex",
      "x-upstream-fixture": "inherited-noindex",
    },
  });
}

function localAssetEnv() {
  return {
    ASSETS: {
      fetch: async (request) => {
        const { pathname } = new URL(request.url);

        if (pathname === "/guides/6-pitfalls-page.txt") {
          return responseWithInheritedNoindex(
            legacyHtml("/guides/6-pitfalls/"),
          );
        }

        if (pathname === "/research/index-page.txt") {
          return responseWithInheritedNoindex(legacyHtml("/research/"));
        }

        if (pathname === "/robots.txt") {
          return responseWithInheritedNoindex(
            "User-agent: *\nAllow: /\nSitemap: https://getgiffgaff.com/sitemap.xml\n",
            { contentType: "text/plain; charset=utf-8" },
          );
        }

        if (pathname === "/contact/getgiffgaff-contact-og.png") {
          return responseWithInheritedNoindex("png-fixture", {
            contentType: "image/png",
          });
        }

        return responseWithInheritedNoindex("asset not found", {
          status: 404,
          contentType: "text/plain; charset=utf-8",
        });
      },
    },
  };
}

async function withMockFetch(fetchImpl, callback) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchImpl;

  try {
    return await callback();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function offlineUpstreamFetch(request) {
  const { pathname } = new URL(request.url);

  if (pathname === "/sitemap.xml") {
    return Promise.resolve(
      responseWithInheritedNoindex(upstreamSitemapFixture(), {
        contentType: "application/xml; charset=utf-8",
      }),
    );
  }

  if (pathname === "/missing/") {
    return Promise.resolve(
      responseWithInheritedNoindex(legacyHtml(pathname), { status: 404 }),
    );
  }

  if (pathname === "/assets/site.css") {
    return Promise.resolve(
      responseWithInheritedNoindex("body { color: #111; }", {
        contentType: "text/css; charset=utf-8",
      }),
    );
  }

  return Promise.resolve(responseWithInheritedNoindex(legacyHtml(pathname)));
}

function extractSitemapLocations(xml) {
  return [...xml.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc>/gi)].map(
    (match) => match[1].trim().replace(/&amp;/g, "&"),
  );
}

test("the production indexable allowlist contains exactly 34 unique canonical paths", () => {
  assert.equal(PUBLIC_INDEXABLE_PATHS.length, 34);
  assert.equal(new Set(PUBLIC_INDEXABLE_PATHS).size, 34);

  for (const pathname of PUBLIC_INDEXABLE_PATHS) {
    assert.match(pathname, /^\//, pathname);
    assert.ok(
      pathname === "/" || pathname.endsWith("/"),
      `expected a trailing slash for ${pathname}`,
    );
  }
});

test("all 34 public routes override inherited noindex and emit self-referencing metadata", async () => {
  await withMockFetch(offlineUpstreamFetch, async () => {
    const env = localAssetEnv();

    for (const pathname of PUBLIC_INDEXABLE_PATHS) {
      const expectedUrl = `${CANONICAL_ORIGIN}${pathname}`;
      const response = await worker.fetch(new Request(expectedUrl), env);
      const html = await response.text();

      assert.equal(response.status, 200, pathname);
      assert.equal(
        response.headers.get("x-robots-tag"),
        INDEXABLE_DIRECTIVES,
        pathname,
      );
      assert.equal(canonicalHref(html), expectedUrl, pathname);
      assert.equal(metaContent(html, "property", "og:url"), expectedUrl, pathname);
      assert.equal(metaContent(html, "name", "keywords"), undefined, pathname);
      assert.doesNotMatch(
        html,
        /"(?:offers|price|priceCurrency|availability|aggregateRating|review)"\s*:/,
        pathname,
      );
    }
  });
});

test("sitemap.xml is rebuilt as exactly the 34 unique canonical public URLs", async () => {
  await withMockFetch(offlineUpstreamFetch, async () => {
    const response = await worker.fetch(
      new Request(`${CANONICAL_ORIGIN}/sitemap.xml`),
      localAssetEnv(),
    );
    const xml = await response.text();
    const locations = extractSitemapLocations(xml);
    const expected = PUBLIC_INDEXABLE_PATHS.map(
      (pathname) => `${CANONICAL_ORIGIN}${pathname}`,
    );

    assert.equal(response.status, 200);
    assert.equal(response.headers.has("x-robots-tag"), false);
    assert.equal(locations.length, 34);
    assert.equal(new Set(locations).size, 34);
    assert.deepEqual(locations, expected);
  });
});

test("HTTP, www and missing-trailing-slash variants redirect to the final URL in one hop", async () => {
  const cases = [
    {
      request: "http://getgiffgaff.com/contact?source=http-apex",
      expected: "https://getgiffgaff.com/contact/?source=http-apex",
      status: 301,
      method: "GET",
    },
    {
      request: "https://www.getgiffgaff.com/contact?source=https-www",
      expected: "https://getgiffgaff.com/contact/?source=https-www",
      status: 301,
      method: "GET",
    },
    {
      request: "http://www.getgiffgaff.com/contact?source=combined&campaign=seo",
      expected:
        "https://getgiffgaff.com/contact/?source=combined&campaign=seo",
      status: 301,
      method: "GET",
    },
    {
      request: "https://getgiffgaff.com/contact?source=slash-only",
      expected: "https://getgiffgaff.com/contact/?source=slash-only",
      status: 301,
      method: "GET",
    },
    {
      request: "http://www.getgiffgaff.com/contact?source=post",
      expected: "https://getgiffgaff.com/contact/?source=post",
      status: 308,
      method: "POST",
    },
  ];

  await withMockFetch(
    async () => {
      throw new Error("redirect variants must not reach the upstream fixture");
    },
    async () => {
      for (const { request, expected, status, method } of cases) {
        const response = await worker.fetch(new Request(request, { method }), {});

        assert.equal(response.status, status, request);
        assert.equal(response.headers.get("location"), expected, request);
      }
    },
  );
});

test("404 and API responses remain noindex and bypass every cache", async () => {
  await withMockFetch(offlineUpstreamFetch, async () => {
    const cases = [
      ["/missing/", 404],
      ["/api/orders/fixture", 200],
    ];

    for (const [pathname, expectedStatus] of cases) {
      const response = await worker.fetch(
        new Request(`${CANONICAL_ORIGIN}${pathname}`),
        localAssetEnv(),
      );

      assert.equal(response.status, expectedStatus, pathname);
      assert.equal(
        response.headers.get("x-robots-tag"),
        PRIVATE_DIRECTIVES,
        pathname,
      );
      assert.match(response.headers.get("cache-control") ?? "", /\bno-store\b/i);
    }
  });
});

test("robots.txt and local or proxied static assets never inherit preview noindex", async () => {
  await withMockFetch(offlineUpstreamFetch, async () => {
    const cases = [
      ["/robots.txt", "text/plain"],
      ["/contact/getgiffgaff-contact-og.png", "image/png"],
      ["/assets/site.css", "text/css"],
    ];

    for (const [pathname, expectedContentType] of cases) {
      const response = await worker.fetch(
        new Request(`${CANONICAL_ORIGIN}${pathname}`),
        localAssetEnv(),
      );

      assert.equal(response.status, 200, pathname);
      assert.match(
        response.headers.get("content-type") ?? "",
        new RegExp(`^${expectedContentType.replace("/", "\\/")}`, "i"),
        pathname,
      );
      assert.equal(response.headers.has("x-robots-tag"), false, pathname);
    }
  });
});
