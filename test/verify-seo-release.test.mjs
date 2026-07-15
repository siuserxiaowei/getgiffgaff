import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  SeoReleaseError,
  extractSitemapUrls,
  parseCliOptions,
  runCli,
  validateCanonicalVariants,
  validatePolicyProbes,
  validateSeoRelease,
} from "../scripts/verify-seo-release.mjs";
import worker from "../public/worker-logic.js";

const BASE_URL = "https://getgiffgaff.test";

function jsonResponse(body, init = {}) {
  return new Response(body, init);
}

function healthyHtml(url, extraJsonLd = {}) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <link rel="canonical" href="${url}">
    <meta property="og:url" content="${url}">
    <meta name="robots" content="index, follow">
    <script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      url,
      ...extraJsonLd,
    })}</script>
  </head>
  <body><main>ok</main></body>
</html>`;
}

function fixtureFetch(routes) {
  return async (input, init = {}) => {
    const url = typeof input === "string" ? input : input.url;
    const route = routes.get(url);
    if (!route) return jsonResponse("not found", { status: 404 });
    return typeof route === "function" ? route(url, init) : route.clone();
  };
}

const ROBOTS_POLICY = `User-agent: *
Allow: /

User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: PerplexityBot
User-agent: Perplexity-User
Allow: /

User-agent: GPTBot
User-agent: ClaudeBot
User-agent: Google-Extended
User-agent: Bytespider
User-agent: CCBot
Disallow: /

Sitemap: ${BASE_URL}/sitemap.xml`;

test("extractSitemapUrls preserves duplicate loc entries for validation", () => {
  const xml = `<?xml version="1.0"?><urlset>
    <url><loc>https://getgiffgaff.test/</loc></url>
    <url><loc>https://getgiffgaff.test/contact/?a=1&amp;b=2</loc></url>
    <url><loc>https://getgiffgaff.test/</loc></url>
  </urlset>`;

  assert.deepEqual(extractSitemapUrls(xml), [
    "https://getgiffgaff.test/",
    "https://getgiffgaff.test/contact/?a=1&b=2",
    "https://getgiffgaff.test/",
  ]);
});

test("validates sitemap pages without making live requests", async () => {
  const urls = [`${BASE_URL}/`, `${BASE_URL}/contact/`];
  const sitemap = `<?xml version="1.0"?><urlset>${urls
    .map((url) => `<url><loc>${url}</loc></url>`)
    .join("")}</urlset>`;
  const routes = new Map([
    [`${BASE_URL}/sitemap.xml`, jsonResponse(sitemap, {
      headers: { "content-type": "application/xml" },
    })],
    ...urls.map((url) => [
      url,
      jsonResponse(healthyHtml(url), {
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    ]),
  ]);

  const report = await validateSeoRelease({
    baseUrl: BASE_URL,
    expectedUrlCount: 2,
    expectedIndexablePaths: ["/", "/contact/"],
    fetchImpl: fixtureFetch(routes),
    checkCanonicalization: false,
    checkPolicyProbes: false,
  });

  assert.equal(report.ok, true);
  assert.equal(report.urlCount, 2);
  assert.equal(report.pagesChecked, 2);
  assert.deepEqual(report.issues, []);
});

test("collects duplicate, robots, canonical, OG and JSON-LD failures", async () => {
  const url = `${BASE_URL}/contact/`;
  const sitemap = `<?xml version="1.0"?><urlset>
    <url><loc>${url}</loc></url><url><loc>${url}</loc></url>
  </urlset>`;
  const brokenHtml = `<!doctype html><html><head>
    <link href="${BASE_URL}/wrong/" rel="canonical">
    <meta content="${url}" property="og:url">
    <meta content="noindex, follow" name="robots">
    <script type="application/ld+json">{"url":"https://preview.pages.dev"}</script>
    <script type="application/ld+json">{"broken":</script>
    <script type="application/ld+json">${JSON.stringify({
      "@type": "Organization",
      name: "giffgaff 官方网站",
      url: BASE_URL,
    })}</script>
    <script type="application/ld+json">${JSON.stringify({
      "@type": "Product",
      name: "Unverified product",
      offers: {
        "@type": "Offer",
        price: "99",
        priceCurrency: "CNY",
        availability: "https://schema.org/InStock",
      },
      aggregateRating: { "@type": "AggregateRating", ratingValue: "5" },
    })}</script>
  </head><body></body></html>`;
  const routes = new Map([
    [`${BASE_URL}/sitemap.xml`, jsonResponse(sitemap)],
    [url, jsonResponse(brokenHtml, {
      headers: {
        "content-type": "text/html",
        "x-robots-tag": "noindex",
      },
    })],
  ]);

  await assert.rejects(
    validateSeoRelease({
      baseUrl: BASE_URL,
      expectedUrlCount: 2,
      expectedIndexablePaths: ["/contact/"],
      fetchImpl: fixtureFetch(routes),
      checkCanonicalization: false,
      checkPolicyProbes: false,
    }),
    (error) => {
      assert.ok(error instanceof SeoReleaseError);
      const messages = error.issues.map((issue) => issue.message).join("\n");
      assert.match(messages, /duplicate sitemap URL/i);
      assert.match(messages, /X-Robots-Tag.*noindex/i);
      assert.match(messages, /meta robots.*noindex/i);
      assert.match(messages, /canonical.*self-referencing/i);
      assert.match(messages, /og:url.*canonical/i);
      assert.match(messages, /invalid JSON-LD/i);
      assert.match(messages, /pages\.dev/i);
      assert.match(messages, /official giffgaff entity/i);
      assert.match(messages, /unverified commerce/i);
      assert.match(messages, /paused schema type/i);
      assert.match(messages, /schema\.org @context/i);
      return true;
    },
  );
});

test("allows giffgaff as an external Brand but rejects it as this site's publisher", async () => {
  const url = `${BASE_URL}/contact/`;
  const sitemap = `<?xml version="1.0"?><urlset><url><loc>${url}</loc></url></urlset>`;
  const routesFor = (jsonLd) => new Map([
    [`${BASE_URL}/sitemap.xml`, jsonResponse(sitemap)],
    [url, jsonResponse(healthyHtml(url, jsonLd), {
      headers: { "content-type": "text/html" },
    })],
  ]);

  const allowed = await validateSeoRelease({
    baseUrl: BASE_URL,
    expectedUrlCount: 1,
    expectedIndexablePaths: ["/contact/"],
    fetchImpl: fixtureFetch(routesFor({
      about: {
        "@type": "Brand",
        name: "giffgaff",
        url: "https://giffgaff.com/",
      },
    })),
    checkCanonicalization: false,
    checkPolicyProbes: false,
  });
  assert.equal(allowed.ok, true);

  await assert.rejects(
    validateSeoRelease({
      baseUrl: BASE_URL,
      expectedUrlCount: 1,
      expectedIndexablePaths: ["/contact/"],
      fetchImpl: fixtureFetch(routesFor({
        publisher: {
          "@type": "Organization",
          url: "https://giffgaff.com/",
        },
      })),
      checkCanonicalization: false,
      checkPolicyProbes: false,
    }),
    (error) => {
      assert.ok(error instanceof SeoReleaseError);
      assert.match(error.issues.map((entry) => entry.message).join("\n"), /publisher/i);
      return true;
    },
  );
});

test("requires every canonicalization variant to redirect permanently in one hop", async () => {
  const canonicalUrl = `${BASE_URL}/contact/`;
  const expectedVariants = new Set([
    "http://getgiffgaff.test/contact/",
    "https://www.getgiffgaff.test/contact/",
    "https://getgiffgaff.test/contact",
    "http://www.getgiffgaff.test/contact/",
    "http://getgiffgaff.test/contact",
    "https://www.getgiffgaff.test/contact",
    "http://www.getgiffgaff.test/contact",
  ]);
  const seen = new Set();
  const fetchImpl = async (input, init) => {
    const url = typeof input === "string" ? input : input.url;
    seen.add(url);
    assert.equal(init.redirect, "manual");
    return jsonResponse(null, {
      status: 301,
      headers: { location: canonicalUrl },
    });
  };

  const issues = await validateCanonicalVariants(canonicalUrl, {
    baseUrl: BASE_URL,
    fetchImpl,
  });

  assert.deepEqual(issues, []);
  assert.deepEqual(seen, expectedVariants);
});

test("rejects temporary redirects and indirect redirect targets", async () => {
  const canonicalUrl = `${BASE_URL}/contact/`;
  const fetchImpl = async (input) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.startsWith("http://")) {
      return jsonResponse(null, {
        status: 302,
        headers: { location: canonicalUrl },
      });
    }
    return jsonResponse(null, {
      status: 301,
      headers: { location: `${BASE_URL}/intermediate/` },
    });
  };

  const issues = await validateCanonicalVariants(canonicalUrl, {
    baseUrl: BASE_URL,
    fetchImpl,
  });
  const messages = issues.map((issue) => issue.message).join("\n");

  assert.match(messages, /permanent redirect/i);
  assert.match(messages, /one hop/i);
});

test("validates supporting, private, sensitive, robots and non-HTML policy probes", async () => {
  const privateHeaders = {
    "cache-control": "private, no-store",
    "x-robots-tag": "noindex, nofollow, noarchive",
  };
  const routes = new Map([
    [`${BASE_URL}/llms.txt`, jsonResponse("llms", {
      headers: { "x-robots-tag": "noindex, follow, noarchive" },
    })],
    [`${BASE_URL}/llms-full.txt`, jsonResponse("retired", {
      status: 410,
      headers: privateHeaders,
    })],
    [`${BASE_URL}/privacy/`, jsonResponse("privacy", {
      status: 200,
      headers: { "x-robots-tag": "noindex, follow, noarchive" },
    })],
    [`${BASE_URL}/terms/`, jsonResponse("terms", {
      status: 200,
      headers: { "x-robots-tag": "noindex, follow, noarchive" },
    })],
    [`${BASE_URL}/__seo-release-probe-missing__/`, jsonResponse("missing", {
      status: 404,
      headers: privateHeaders,
    })],
    [`${BASE_URL}/api/__seo-release-probe`, jsonResponse("missing", {
      status: 404,
      headers: privateHeaders,
    })],
    [`${BASE_URL}/contact/?otp=release-gate-secret`, jsonResponse("rejected", {
      status: 400,
      headers: privateHeaders,
    })],
    [`${BASE_URL}/contact/?api_key=release-gate-secret`, jsonResponse("rejected", {
      status: 400,
      headers: privateHeaders,
    })],
    [`${BASE_URL}/contact/?auth_token=release-gate-secret`, jsonResponse("rejected", {
      status: 400,
      headers: privateHeaders,
    })],
    [`${BASE_URL}/contact/?id_token=release-gate-secret`, jsonResponse("rejected", {
      status: 400,
      headers: privateHeaders,
    })],
    [`${BASE_URL}/contact/`, (url, init) => {
      assert.equal(init.headers.authorization, "Bearer release-gate-secret");
      return jsonResponse("rejected", { status: 400, headers: privateHeaders });
    }],
    [`${BASE_URL}/robots.txt`, jsonResponse(ROBOTS_POLICY)],
  ]);

  const issues = await validatePolicyProbes(BASE_URL, {
    fetchImpl: fixtureFetch(routes),
  });

  assert.deepEqual(issues, []);
});

test("requires sitemap URLs to match the route manifest paths exactly", async () => {
  const expectedUrl = `${BASE_URL}/contact/`;
  const unexpectedUrl = `${BASE_URL}/shop/`;
  const sitemap = `<?xml version="1.0"?><urlset>
    <url><loc>${unexpectedUrl}</loc></url>
  </urlset>`;
  const routes = new Map([
    [`${BASE_URL}/sitemap.xml`, jsonResponse(sitemap, {
      headers: { "content-type": "application/xml" },
    })],
    [unexpectedUrl, jsonResponse(healthyHtml(unexpectedUrl), {
      headers: { "content-type": "text/html" },
    })],
  ]);

  await assert.rejects(
    validateSeoRelease({
      baseUrl: BASE_URL,
      expectedIndexablePaths: ["/contact/"],
      expectedUrlCount: 1,
      fetchImpl: fixtureFetch(routes),
      checkCanonicalization: false,
      checkPolicyProbes: false,
    }),
    (error) => {
      const codes = new Set(error.issues.map((entry) => entry.code));
      assert.ok(codes.has("sitemap-manifest-missing"), `missing ${expectedUrl}`);
      assert.ok(codes.has("sitemap-manifest-unexpected"), `unexpected ${unexpectedUrl}`);
      assert.ok(codes.has("sitemap-noindex-route"), `${unexpectedUrl} is a noindex route`);
      return true;
    },
  );
});

test("requires successful HEAD checks for sitemap and every indexable page", async () => {
  const url = `${BASE_URL}/contact/`;
  const sitemap = `<?xml version="1.0"?><urlset><url><loc>${url}</loc></url></urlset>`;
  const fetchImpl = async (input, init = {}) => {
    const requestUrl = typeof input === "string" ? input : input.url;
    const method = init.method || "GET";
    if (requestUrl === `${BASE_URL}/sitemap.xml`) {
      if (method === "HEAD") return jsonResponse(null, { status: 405 });
      return jsonResponse(sitemap, { headers: { "content-type": "application/xml" } });
    }
    if (requestUrl === url) {
      if (method === "HEAD") return jsonResponse(null, { status: 503 });
      return jsonResponse(healthyHtml(url), { headers: { "content-type": "text/html" } });
    }
    return jsonResponse("not found", { status: 404 });
  };

  await assert.rejects(
    validateSeoRelease({
      baseUrl: BASE_URL,
      expectedIndexablePaths: ["/contact/"],
      expectedUrlCount: 1,
      fetchImpl,
      checkCanonicalization: false,
      checkPolicyProbes: false,
    }),
    (error) => {
      const codes = new Set(error.issues.map((entry) => entry.code));
      assert.ok(codes.has("sitemap-head-status"));
      assert.ok(codes.has("page-head-status"));
      return true;
    },
  );
});

test("policy probes fail closed for policy pages, sensitive inputs, robots and 404 canonicals", async () => {
  const supportingHeaders = { "x-robots-tag": "noindex, follow, noarchive" };
  const privateHeaders = {
    "cache-control": "private, no-store",
    "x-robots-tag": "noindex, nofollow, noarchive",
  };
  const canonical404 = `<!doctype html><link rel="canonical" href="${BASE_URL}/"><meta property="og:url" content="${BASE_URL}/">`;
  const routes = new Map([
    [`${BASE_URL}/llms.txt`, jsonResponse("llms", { headers: supportingHeaders })],
    [`${BASE_URL}/llms-full.txt`, jsonResponse("gone", { status: 410, headers: privateHeaders })],
    [`${BASE_URL}/privacy/`, jsonResponse("missing", { status: 404, headers: privateHeaders })],
    [`${BASE_URL}/terms/`, jsonResponse("missing", { status: 404, headers: privateHeaders })],
    [`${BASE_URL}/__seo-release-probe-missing__/`, jsonResponse(canonical404, {
      status: 404,
      headers: { ...privateHeaders, "content-type": "text/html" },
    })],
    [`${BASE_URL}/api/__seo-release-probe`, jsonResponse("missing", { status: 404, headers: privateHeaders })],
    [`${BASE_URL}/contact/?otp=release-gate-secret`, jsonResponse("forwarded", { status: 200 })],
    [`${BASE_URL}/contact/?api_key=release-gate-secret`, jsonResponse("forwarded", { status: 200 })],
    [`${BASE_URL}/contact/?auth_token=release-gate-secret`, jsonResponse("forwarded", { status: 200 })],
    [`${BASE_URL}/contact/?id_token=release-gate-secret`, jsonResponse("forwarded", { status: 200 })],
    [`${BASE_URL}/contact/`, jsonResponse("forwarded", { status: 200 })],
    [`${BASE_URL}/robots.txt`, jsonResponse("User-agent: *\nAllow: /\n")],
  ]);

  const issues = await validatePolicyProbes(BASE_URL, { fetchImpl: fixtureFetch(routes) });
  const codes = new Set(issues.map((entry) => entry.code));
  assert.ok(codes.has("policy-page-status"));
  assert.ok(codes.has("sensitive-request-status"));
  assert.ok(codes.has("robots-ai-policy"));
  assert.ok(codes.has("404-canonical"));
  assert.ok(codes.has("404-og-url"));
});

test("rejects commercial destinations and high-risk sales CTAs on indexable pages", async () => {
  const url = `${BASE_URL}/answers/`;
  const html = healthyHtml(url).replace(
    "<main>ok</main>",
    '<main><a href="/shop/">立即购买 G2</a><button>确认 G2 库存</button><p>验证码更可靠</p></main>',
  );
  const sitemap = `<?xml version="1.0"?><urlset><url><loc>${url}</loc></url></urlset>`;
  const routes = new Map([
    [`${BASE_URL}/sitemap.xml`, jsonResponse(sitemap, { headers: { "content-type": "application/xml" } })],
    [url, jsonResponse(html, { headers: { "content-type": "text/html" } })],
  ]);

  await assert.rejects(
    validateSeoRelease({
      baseUrl: BASE_URL,
      expectedIndexablePaths: ["/answers/"],
      expectedUrlCount: 1,
      fetchImpl: fixtureFetch(routes),
      checkCanonicalization: false,
      checkPolicyProbes: false,
    }),
    (error) => {
      const codes = new Set(error.issues.map((entry) => entry.code));
      assert.ok(codes.has("commercial-link"));
      assert.ok(codes.has("commercial-cta"));
      assert.ok(codes.has("commercial-claim"));
      return true;
    },
  );
});

test("the local-only Worker passes the complete release verifier without network access", async () => {
  const contentTypes = new Map([
    [".txt", "text/plain; charset=utf-8"],
    [".png", "image/png"],
    [".svg", "image/svg+xml"],
    [".css", "text/css; charset=utf-8"],
    [".js", "text/javascript; charset=utf-8"],
  ]);
  const assets = {
    async fetch(request) {
      const url = new URL(request.url);
      const relativePath = url.pathname.replace(/^\/+/, "");
      const assetUrl = new URL(`../public/${relativePath}`, import.meta.url);
      try {
        const body = await readFile(assetUrl);
        const extension = url.pathname.slice(url.pathname.lastIndexOf("."));
        return jsonResponse(request.method === "HEAD" ? null : body, {
          headers: { "content-type": contentTypes.get(extension) || "application/octet-stream" },
        });
      } catch {
        return jsonResponse("not found", { status: 404 });
      }
    },
  };
  const fetchImpl = (input, init = {}) =>
    worker.fetch(new Request(input, init), { ASSETS: assets }, {});

  const report = await validateSeoRelease({
    baseUrl: "https://getgiffgaff.com",
    fetchImpl,
  });

  assert.equal(report.ok, true);
  assert.equal(report.urlCount, report.pagesChecked);
  assert.equal(report.canonicalizationChecked, true);
  assert.equal(report.policyProbesChecked, true);
});

test("parses --base-url and environment fallbacks with a configurable count", () => {
  assert.deepEqual(
    parseCliOptions(["--base-url", "https://cli.test", "--expected-url-count=12"], {
      SEO_BASE_URL: "https://env.test",
      SEO_EXPECTED_URL_COUNT: "34",
    }),
    {
      baseUrl: "https://cli.test",
      expectedUrlCount: 12,
      help: false,
    },
  );

  assert.deepEqual(parseCliOptions([], {
    SEO_BASE_URL: "https://env.test/",
    SEO_EXPECTED_URL_COUNT: "7",
  }), {
    baseUrl: "https://env.test/",
    expectedUrlCount: 7,
    help: false,
  });
});

test("fails fast on invalid CLI and sitemap transport inputs", async () => {
  assert.throws(() => parseCliOptions([], {}), /Missing --base-url/);
  assert.throws(
    () => parseCliOptions(["--unknown"], { SEO_BASE_URL: BASE_URL }),
    /Unknown option/,
  );
  assert.throws(
    () => parseCliOptions(["--expected-url-count=0"], { SEO_BASE_URL: BASE_URL }),
    /positive integer/,
  );

  await assert.rejects(
    validateSeoRelease({
      baseUrl: BASE_URL,
      fetchImpl: async () => {
        throw new Error("offline");
      },
      checkCanonicalization: false,
      checkPolicyProbes: false,
    }),
    (error) => error instanceof SeoReleaseError && error.issues[0].code === "sitemap-fetch",
  );

  await assert.rejects(
    validateSeoRelease({
      baseUrl: BASE_URL,
      fetchImpl: async () => jsonResponse("unavailable", { status: 503 }),
      checkCanonicalization: false,
      checkPolicyProbes: false,
    }),
    (error) => error instanceof SeoReleaseError && error.issues[0].code === "sitemap-status",
  );
});

test("CLI help and invalid invocation return deterministic exit codes", async () => {
  const stdout = [];
  const stderr = [];
  assert.equal(await runCli(["--help"], {}, {
    stdout: (line) => stdout.push(line),
    stderr: (line) => stderr.push(line),
  }), 0);
  assert.match(stdout.join("\n"), /Usage:/);

  stdout.length = 0;
  assert.equal(await runCli([], {}, {
    stdout: (line) => stdout.push(line),
    stderr: (line) => stderr.push(line),
  }), 2);
  assert.match(stderr.join("\n"), /Missing --base-url/);
});

test("rejects canonical checks against a different origin", async () => {
  const issues = await validateCanonicalVariants("https://other.test/contact/", {
    baseUrl: BASE_URL,
    fetchImpl: async () => {
      throw new Error("must not fetch");
    },
  });
  assert.equal(issues.length, 1);
  assert.equal(issues[0].code, "canonical-origin");
});
