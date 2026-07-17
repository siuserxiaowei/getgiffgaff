import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  SeoReleaseError,
  extractSitemapUrls,
  parseRobotsTxt,
  parseCliOptions,
  validateCanonicalVariants,
  validatePolicyProbes,
  validateRobotsPolicy,
  validateSeoRelease,
} from "../scripts/verify-seo-release.mjs";

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
  return async (input) => {
    const url = typeof input === "string" ? input : input.url;
    const route = routes.get(url);
    if (!route) return jsonResponse("not found", { status: 404 });
    return typeof route === "function" ? route(url) : route.clone();
  };
}

const EXPECTED_ROBOTS_POLICY = {
  allow: [
    "Googlebot",
    "Bingbot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "Claude-SearchBot",
    "Claude-User",
    "PerplexityBot",
  ],
  disallow: ["GPTBot", "ClaudeBot", "Google-Extended"],
};

const INDEXABLE_ROBOT_PATHS = [
  "/",
  "/guides/7-arrival-checklist/",
  "/tools/china-roaming-cost/",
];

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

test("validates supporting, private and non-HTML policy probes", async () => {
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
    [`${BASE_URL}/privacy/`, jsonResponse("status", {
      headers: { "x-robots-tag": "noindex, follow, noarchive" },
    })],
    [`${BASE_URL}/terms/`, jsonResponse("status", {
      headers: { "x-robots-tag": "noindex, follow, noarchive" },
    })],
    [`${BASE_URL}/refund/`, jsonResponse("status", {
      headers: { "x-robots-tag": "noindex, follow, noarchive" },
    })],
    [`${BASE_URL}/shipping/`, jsonResponse("status", {
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
    [`${BASE_URL}/robots.txt`, jsonResponse(`User-agent: *
Allow: /

User-agent: Googlebot
User-agent: Bingbot
User-agent: Baiduspider
User-agent: OAI-SearchBot
User-agent: ChatGPT-User
User-agent: Claude-SearchBot
User-agent: Claude-User
User-agent: PerplexityBot
User-agent: Perplexity-User
Allow: /

User-agent: Amazonbot
User-agent: Applebot-Extended
User-agent: Bytespider
User-agent: CCBot
User-agent: ClaudeBot
User-agent: cohere-ai
User-agent: GPTBot
User-agent: meta-externalagent
User-agent: anthropic-ai
User-agent: Google-Extended
Disallow: /
`)],
  ]);

  const issues = await validatePolicyProbes(BASE_URL, {
    fetchImpl: fixtureFetch(routes),
  });

  assert.deepEqual(issues, []);
});

test("parses Cloudflare-prepended robots groups and ignores non-crawl directives", () => {
  const parsed = parseRobotsTxt(`# BEGIN Cloudflare Managed content
User-agent: *
Content-Signal: search=yes,ai-train=no,use=reference
Allow: /

User-agent: GPTBot
Disallow: /training/
# END Cloudflare Managed Content

User-agent: Googlebot
User-agent: Bingbot
Allow: /
Sitemap: https://getgiffgaff.test/sitemap.xml
`);

  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.groups.length, 3);
  assert.deepEqual(parsed.groups[0].agents, ["*"]);
  assert.equal(parsed.groups[0].source, "cloudflare-managed");
  assert.deepEqual(parsed.groups[0].rules, [{ directive: "allow", pattern: "/", line: 4 }]);
  assert.equal(parsed.groups[2].source, "repository");
  assert.deepEqual(parsed.groups[2].agents, ["googlebot", "bingbot"]);
});

test("robots semantics enforce the repository allow and disallow matrix", () => {
  const issues = validateRobotsPolicy(`User-agent: *
Allow: /

User-agent: GPTBot
User-agent: ClaudeBot
User-agent: Google-Extended
Disallow: /
`, {
    baseUrl: BASE_URL,
    expectedPolicy: EXPECTED_ROBOTS_POLICY,
    indexablePaths: INDEXABLE_ROBOT_PATHS,
  });

  assert.deepEqual(issues, []);
});

test("repository robots.txt remains synchronized with the postdeploy crawler matrix", async () => {
  const robots = await readFile(new URL("../public/robots.txt", import.meta.url), "utf8");
  const issues = validateRobotsPolicy(robots, {
    baseUrl: "https://getgiffgaff.com",
    indexablePaths: INDEXABLE_ROBOT_PATHS,
  });

  assert.deepEqual(issues, []);
});

test("robots semantics reject blocked search crawlers and allowed training crawlers", () => {
  const issues = validateRobotsPolicy(`User-agent: *
Allow: /

User-agent: OAI-SearchBot
Disallow: /

User-agent: Claude-SearchBot
Disallow: /guides/
Allow: /guides/public$

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
User-agent: Google-Extended
Disallow: /
`, {
    baseUrl: BASE_URL,
    expectedPolicy: EXPECTED_ROBOTS_POLICY,
    indexablePaths: INDEXABLE_ROBOT_PATHS,
  });

  const blocked = issues.filter(({ code }) => code === "robots-indexable-blocked");
  assert.equal(blocked.length, 2);
  assert.match(blocked.find(({ message }) => /OAI-SearchBot/.test(message)).message, /all 3 proposed indexable paths/i);
  assert.match(
    blocked.find(({ message }) => /Claude-SearchBot/.test(message)).message,
    /\/guides\/7-arrival-checklist\//,
  );
  assert.doesNotMatch(blocked.map(({ message }) => message).join("\n"), /Googlebot.*blocked/i);
  const allowed = issues.find(({ code }) => code === "robots-excluded-agent-allowed");
  assert.ok(allowed);
  assert.match(allowed.message, /GPTBot/);
});

test("robots validation reports Cloudflare managed policy conflicts even when merged rules allow", () => {
  const issues = validateRobotsPolicy(`# BEGIN Cloudflare Managed content
User-agent: GPTBot
Disallow: /
# END Cloudflare Managed Content

User-agent: GPTBot
Disallow: /
`, {
    baseUrl: BASE_URL,
    expectedPolicy: {
      allow: [],
      disallow: ["GPTBot"],
    },
    indexablePaths: INDEXABLE_ROBOT_PATHS,
  });

  assert.equal(issues.some(({ code }) => code === "robots-excluded-agent-allowed"), false);
  assert.equal(issues.some(({ code }) => code === "robots-indexable-blocked"), false);
  assert.equal(issues.some(({ code }) => code === "robots-cloudflare-policy-conflict"), false);

  const conflictIssues = validateRobotsPolicy(`# BEGIN Cloudflare Managed content
User-agent: GPTBot
Disallow: /
# END Cloudflare Managed Content

User-agent: GPTBot
Allow: /
`, {
    baseUrl: BASE_URL,
    expectedPolicy: {
      allow: [],
      disallow: ["GPTBot"],
    },
    indexablePaths: INDEXABLE_ROBOT_PATHS,
  });

  assert.ok(conflictIssues.some(({ code }) => code === "robots-excluded-agent-allowed"));
  const conflict = conflictIssues.find(({ code }) => code === "robots-cloudflare-policy-conflict");
  assert.ok(conflict);
  assert.match(conflict.message, /GPTBot/);
  assert.match(conflict.message, /Cloudflare managed.*repository/i);
});

test("robots parsing and policy validation fail closed on rules without a User-agent", () => {
  const issues = validateRobotsPolicy("Disallow: /\n", {
    baseUrl: BASE_URL,
    expectedPolicy: EXPECTED_ROBOTS_POLICY,
    indexablePaths: INDEXABLE_ROBOT_PATHS,
  });

  assert.ok(issues.some(({ code }) => code === "robots-parse"));
  assert.ok(issues.some(({ code }) => code === "robots-agent-policy-missing"));
});

test("policy probes read final robots text and fail closed when the body cannot be read", async () => {
  const privateHeaders = {
    "cache-control": "private, no-store",
    "x-robots-tag": "noindex, nofollow, noarchive",
  };
  const routes = new Map([
    [`${BASE_URL}/llms.txt`, jsonResponse("llms", {
      headers: { "x-robots-tag": "noindex, follow, noarchive" },
    })],
    [`${BASE_URL}/llms-full.txt`, jsonResponse("retired", { status: 410, headers: privateHeaders })],
    ...["privacy", "terms", "refund", "shipping"].map((name) => [
      `${BASE_URL}/${name}/`,
      jsonResponse("status", { headers: { "x-robots-tag": "noindex, follow, noarchive" } }),
    ]),
    [`${BASE_URL}/__seo-release-probe-missing__/`, jsonResponse("missing", { status: 404, headers: privateHeaders })],
    [`${BASE_URL}/api/__seo-release-probe`, jsonResponse("missing", { status: 404, headers: privateHeaders })],
    [`${BASE_URL}/robots.txt`, () => ({
      status: 200,
      headers: new Headers(),
      async text() {
        throw new Error("stream reset");
      },
    })],
  ]);

  const issues = await validatePolicyProbes(BASE_URL, { fetchImpl: fixtureFetch(routes) });
  assert.ok(issues.some(({ code }) => code === "robots-body"));
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
