#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PUBLIC_INDEXABLE_PATHS } from "../public/route-manifest.js";

const DEFAULT_EXPECTED_URL_COUNT = PUBLIC_INDEXABLE_PATHS.length;
const DEFAULT_CONCURRENCY = 6;
const DEFAULT_TIMEOUT_MS = 15_000;
const PERMANENT_REDIRECT_STATUSES = new Set([301, 308]);
const ROBOTS_NAMES = new Set(["robots", "googlebot", "bingbot"]);

export class SeoReleaseError extends Error {
  constructor(issues, report = {}) {
    super(`SEO release verification failed with ${issues.length} issue(s)`);
    this.name = "SeoReleaseError";
    this.issues = issues;
    this.report = { ...report, ok: false, issues };
  }
}

function issue(code, url, message) {
  return { code, url, message };
}

function decodeEntities(value) {
  const named = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    quot: '"',
  };

  return value.replace(/&(#x[\da-f]+|#\d+|amp|apos|gt|lt|quot);/gi, (match, entity) => {
    const normalized = entity.toLowerCase();
    if (normalized.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(normalized.slice(2), 16));
    }
    if (normalized.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(normalized.slice(1), 10));
    }
    return named[normalized] ?? match;
  });
}

export function extractSitemapUrls(xml) {
  const urls = [];
  for (const match of xml.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc>/gi)) {
    urls.push(decodeEntities(match[1].trim()));
  }
  return urls;
}

function positiveInteger(value, label) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new TypeError(`${label} must be a positive integer`);
  }
  return parsed;
}

export function parseCliOptions(args = [], env = process.env) {
  let baseUrl = env.SEO_BASE_URL || env.BASE_URL || "";
  let expectedUrlCount = positiveInteger(
    env.SEO_EXPECTED_URL_COUNT || DEFAULT_EXPECTED_URL_COUNT,
    "SEO_EXPECTED_URL_COUNT",
  );
  let help = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--help" || argument === "-h") {
      help = true;
      continue;
    }
    if (argument === "--base-url") {
      baseUrl = args[index + 1] || "";
      index += 1;
      continue;
    }
    if (argument.startsWith("--base-url=")) {
      baseUrl = argument.slice("--base-url=".length);
      continue;
    }
    if (argument === "--expected-url-count") {
      expectedUrlCount = positiveInteger(args[index + 1], "--expected-url-count");
      index += 1;
      continue;
    }
    if (argument.startsWith("--expected-url-count=")) {
      expectedUrlCount = positiveInteger(
        argument.slice("--expected-url-count=".length),
        "--expected-url-count",
      );
      continue;
    }
    throw new TypeError(`Unknown option: ${argument}`);
  }

  if (!help && !baseUrl) {
    throw new TypeError("Missing --base-url (or SEO_BASE_URL environment variable)");
  }

  return { baseUrl, expectedUrlCount, help };
}

function normalizeBaseUrl(value) {
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol)) {
    throw new TypeError("baseUrl must use http or https");
  }
  if ((url.pathname && url.pathname !== "/") || url.search || url.hash) {
    throw new TypeError("baseUrl must be an origin without a path, query, or fragment");
  }
  return url.origin;
}

function requestInit(accept, timeoutMs) {
  const init = {
    redirect: "manual",
    headers: {
      accept,
      "user-agent": "getgiffgaff-seo-release-gate/1.0",
    },
  };
  if (timeoutMs && typeof AbortSignal?.timeout === "function") {
    init.signal = AbortSignal.timeout(timeoutMs);
  }
  return init;
}

async function mapLimit(items, limit, callback) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await callback(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, Math.max(1, items.length)) }, () => worker()),
  );
  return results;
}

function parseAttributes(tag) {
  const attributes = {};
  const attributePattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;
  while ((match = attributePattern.exec(tag)) !== null) {
    const name = match[1].toLowerCase();
    if (name.startsWith("<") || name === "meta" || name === "link" || name === "script") {
      continue;
    }
    attributes[name] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attributes;
}

function tagsWithAttributes(html, tagName) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>`, "gi");
  return Array.from(html.matchAll(pattern), (match) => parseAttributes(match[0]));
}

function absoluteUrl(value, documentUrl) {
  try {
    return new URL(value, documentUrl).href;
  } catch {
    return null;
  }
}

function containsNoindex(value) {
  return /(?:^|[\s,])noindex(?:$|[\s,])/i.test(value || "");
}

function structuredDataScripts(html) {
  const scripts = [];
  const pattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    const attributes = parseAttributes(`<script ${match[1]}>`);
    if ((attributes.type || "").toLowerCase().split(";")[0].trim() === "application/ld+json") {
      scripts.push(match[2].trim());
    }
  }
  return scripts;
}

function typeNames(value) {
  const values = Array.isArray(value) ? value : [value];
  return values.filter((entry) => typeof entry === "string").map((entry) => entry.toLowerCase());
}

function stringValues(value) {
  if (Array.isArray(value)) return value.flatMap((entry) => stringValues(entry));
  if (typeof value === "string") return [value];
  if (value && typeof value === "object") {
    return [value.name, value.url, value["@id"], value.sameAs]
      .flatMap((entry) => stringValues(entry));
  }
  return [];
}

function referencesGiffgaffEntity(value) {
  return stringValues(value).some((entry) => {
    const normalized = entry.toLowerCase().replace(/\s+/g, " ").trim();
    if (normalized === "giffgaff") return true;
    try {
      const hostname = new URL(normalized).hostname.toLowerCase();
      return hostname === "giffgaff.com" || hostname.endsWith(".giffgaff.com");
    } catch {
      return /^(?:www\.)?giffgaff\.com(?:\/|$)/i.test(normalized);
    }
  });
}

function findOfficialEntityClaims(value, baseOrigin, path = "$") {
  const claims = [];
  if (!value || typeof value !== "object") return claims;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      claims.push(...findOfficialEntityClaims(entry, baseOrigin, `${path}[${index}]`));
    });
    return claims;
  }

  const types = typeNames(value["@type"]);
  const entityTypes = new Set(["organization", "website", "onlinestore", "localbusiness"]);
  const isSiteEntity = types.some((type) => entityTypes.has(type));
  const name = typeof value.name === "string" ? value.name.toLowerCase().replace(/\s+/g, " ") : "";
  const entityUrl = absoluteUrl(value.url || value["@id"] || "", `${baseOrigin}/`);
  const belongsToSite = entityUrl ? new URL(entityUrl).origin === baseOrigin : false;
  const claimsOfficialStatus =
    /giffgaff\s*(official|官方网站|官网|官方)/i.test(name) ||
    /(official|官方网站|官网|官方)\s*giffgaff/i.test(name) ||
    (belongsToSite && name.trim() === "giffgaff");

  if (isSiteEntity && claimsOfficialStatus) {
    claims.push(`${path} identifies this site as an official giffgaff entity`);
  }

  for (const property of ["publisher", "parentOrganization", "seller"]) {
    if (property in value && referencesGiffgaffEntity(value[property])) {
      claims.push(`${path}.${property} assigns giffgaff as this site's ${property}`);
    }
  }

  if (isSiteEntity && belongsToSite && referencesGiffgaffEntity(value.sameAs)) {
    claims.push(`${path}.sameAs equates this site's entity with giffgaff`);
  }

  for (const [key, entry] of Object.entries(value)) {
    if (entry && typeof entry === "object") {
      claims.push(...findOfficialEntityClaims(entry, baseOrigin, `${path}.${key}`));
    }
  }
  return claims;
}

function findUnverifiedCommerceClaims(value, path = "$") {
  const claims = [];
  if (!value || typeof value !== "object") return claims;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      claims.push(...findUnverifiedCommerceClaims(entry, `${path}[${index}]`));
    });
    return claims;
  }

  const types = typeNames(value["@type"]);
  const isProduct = types.includes("product");
  const isOffer = types.includes("offer");
  const productEvidenceProperties = ["offers", "aggregateRating", "review", "reviews"];
  const offerEvidenceProperties = [
    "availability",
    "inventoryLevel",
    "price",
    "priceCurrency",
    "priceSpecification",
    "priceValidUntil",
  ];

  if (isProduct) {
    for (const property of productEvidenceProperties) {
      if (property in value) {
        claims.push(`${path}.${property} publishes commerce evidence without a release-proof source`);
      }
    }
  }
  if (isOffer) {
    for (const property of offerEvidenceProperties) {
      if (property in value) {
        claims.push(`${path}.${property} publishes price or availability without a release-proof source`);
      }
    }
  }

  for (const [key, entry] of Object.entries(value)) {
    if (entry && typeof entry === "object") {
      claims.push(...findUnverifiedCommerceClaims(entry, `${path}.${key}`));
    }
  }
  return claims;
}

async function inspectPage(url, { fetchImpl, baseOrigin, timeoutMs }) {
  const issues = [];
  let response;
  try {
    response = await fetchImpl(
      url,
      requestInit("text/html,application/xhtml+xml;q=0.9,*/*;q=0.1", timeoutMs),
    );
  } catch (error) {
    return [issue("page-fetch", url, `Could not fetch sitemap URL: ${error.message}`)];
  }

  if (response.status !== 200) {
    issues.push(issue("page-status", url, `Expected 200 with no redirect, received ${response.status}`));
    return issues;
  }

  const xRobotsTag = response.headers.get("x-robots-tag") || "";
  if (containsNoindex(xRobotsTag)) {
    issues.push(issue("x-robots-noindex", url, `X-Robots-Tag contains noindex: ${xRobotsTag}`));
  }

  const contentType = response.headers.get("content-type") || "";
  if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) {
    issues.push(issue("content-type", url, `Sitemap URL is not HTML: ${contentType || "missing content-type"}`));
  }

  let html;
  try {
    html = await response.text();
  } catch (error) {
    issues.push(issue("page-body", url, `Could not read HTML response: ${error.message}`));
    return issues;
  }

  const metaTags = tagsWithAttributes(html, "meta");
  for (const meta of metaTags) {
    if (ROBOTS_NAMES.has((meta.name || "").toLowerCase()) && containsNoindex(meta.content)) {
      issues.push(
        issue(
          "meta-robots-noindex",
          url,
          `meta robots directive contains noindex: ${meta.content}`,
        ),
      );
    }
  }

  const canonicalValues = tagsWithAttributes(html, "link")
    .filter((link) => (link.rel || "").toLowerCase().split(/\s+/).includes("canonical"))
    .map((link) => absoluteUrl(link.href || "", url));
  if (canonicalValues.length !== 1 || !canonicalValues[0]) {
    issues.push(
      issue(
        "canonical-count",
        url,
        `Expected exactly one valid self-referencing canonical, found ${canonicalValues.length}`,
      ),
    );
  } else if (canonicalValues[0] !== new URL(url).href) {
    issues.push(
      issue(
        "canonical-self",
        url,
        `canonical must be self-referencing; found ${canonicalValues[0]}`,
      ),
    );
  }

  const ogUrls = metaTags
    .filter((meta) => (meta.property || "").toLowerCase() === "og:url")
    .map((meta) => absoluteUrl(meta.content || "", url));
  const canonical = canonicalValues.length === 1 ? canonicalValues[0] : null;
  if (ogUrls.length !== 1 || !ogUrls[0]) {
    issues.push(issue("og-url-count", url, `Expected exactly one valid og:url, found ${ogUrls.length}`));
  } else if (!canonical || ogUrls[0] !== canonical) {
    issues.push(
      issue(
        "og-url-canonical",
        url,
        `og:url must equal canonical; found ${ogUrls[0]} and ${canonical || "no valid canonical"}`,
      ),
    );
  }

  for (const [index, source] of structuredDataScripts(html).entries()) {
    if (/pages\.dev/i.test(source)) {
      issues.push(issue("jsonld-preview-domain", url, `JSON-LD #${index + 1} contains pages.dev`));
    }
    let data;
    try {
      data = JSON.parse(source);
    } catch (error) {
      issues.push(issue("jsonld-parse", url, `Invalid JSON-LD #${index + 1}: ${error.message}`));
      continue;
    }
    for (const claim of findOfficialEntityClaims(data, baseOrigin)) {
      issues.push(issue("jsonld-official-entity", url, `JSON-LD official giffgaff entity claim: ${claim}`));
    }
    for (const claim of findUnverifiedCommerceClaims(data)) {
      issues.push(issue("jsonld-unverified-commerce", url, `JSON-LD unverified commerce claim: ${claim}`));
    }
  }

  return issues;
}

function canonicalVariants(canonicalUrl) {
  const canonical = new URL(canonicalUrl);
  const variants = [];
  const protocols = canonical.protocol === "https:"
    ? [canonical.protocol, "http:"]
    : [canonical.protocol];
  const hostnames = canonical.hostname.toLowerCase().startsWith("www.")
    ? [canonical.hostname]
    : [canonical.hostname, `www.${canonical.hostname}`];
  const pathnames =
    canonical.pathname !== "/" && canonical.pathname.endsWith("/")
      ? [canonical.pathname, canonical.pathname.slice(0, -1)]
      : [canonical.pathname];

  for (const protocol of protocols) {
    for (const hostname of hostnames) {
      for (const pathname of pathnames) {
        const variant = new URL(canonical);
        variant.protocol = protocol;
        variant.hostname = hostname;
        variant.pathname = pathname;
        if (variant.href === canonical.href) continue;

        const changes = [];
        if (protocol !== canonical.protocol) changes.push("HTTP");
        if (hostname !== canonical.hostname) changes.push("www");
        if (pathname !== canonical.pathname) changes.push("no-trailing-slash");
        variants.push({ kind: changes.join("+"), url: variant.href });
      }
    }
  }

  const seen = new Set();
  return variants.filter((variant) => {
    if (variant.url === canonical.href || seen.has(variant.url)) return false;
    seen.add(variant.url);
    return true;
  });
}

export async function validateCanonicalVariants(
  canonicalUrl,
  {
    baseUrl,
    fetchImpl = globalThis.fetch,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = {},
) {
  const canonical = new URL(canonicalUrl).href;
  const baseOrigin = normalizeBaseUrl(baseUrl || new URL(canonical).origin);
  const issues = [];

  if (new URL(canonical).origin !== baseOrigin) {
    return [issue("canonical-origin", canonical, `Canonical URL is outside base origin ${baseOrigin}`)];
  }

  for (const variant of canonicalVariants(canonical)) {
    let response;
    try {
      response = await fetchImpl(
        variant.url,
        requestInit("text/html,application/xhtml+xml;q=0.9,*/*;q=0.1", timeoutMs),
      );
    } catch (error) {
      issues.push(
        issue("canonicalization-fetch", variant.url, `${variant.kind} variant could not be fetched: ${error.message}`),
      );
      continue;
    }

    if (!PERMANENT_REDIRECT_STATUSES.has(response.status)) {
      issues.push(
        issue(
          "canonicalization-status",
          variant.url,
          `${variant.kind} variant must use a permanent redirect (301 or 308); received ${response.status}`,
        ),
      );
      continue;
    }

    const location = response.headers.get("location");
    const destination = location ? absoluteUrl(location, variant.url) : null;
    if (destination !== canonical) {
      issues.push(
        issue(
          "canonicalization-hop",
          variant.url,
          `${variant.kind} variant must reach ${canonical} in one hop; found ${destination || "no Location header"}`,
        ),
      );
    }
  }

  return issues;
}

function robotsDirectiveSet(value) {
  return new Set(
    (value || "")
      .toLowerCase()
      .split(",")
      .map((directive) => directive.trim())
      .filter(Boolean),
  );
}

function missingDirectives(value, expected) {
  const directives = robotsDirectiveSet(value);
  return expected.filter((directive) => !directives.has(directive));
}

export async function validatePolicyProbes(
  baseUrl,
  {
    fetchImpl = globalThis.fetch,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = {},
) {
  const baseOrigin = normalizeBaseUrl(baseUrl);
  const issues = [];
  const probePaths = [
    "/llms.txt",
    "/llms-full.txt",
    "/privacy/",
    "/terms/",
    "/__seo-release-probe-missing__/",
    "/api/__seo-release-probe",
    "/robots.txt",
  ];

  for (const pathname of probePaths) {
    const url = `${baseOrigin}${pathname}`;
    let response;
    try {
      response = await fetchImpl(url, requestInit("*/*", timeoutMs));
    } catch (error) {
      issues.push(issue("policy-probe-fetch", url, `Policy probe failed: ${error.message}`));
      continue;
    }

    const xRobotsTag = response.headers.get("x-robots-tag") || "";
    const cacheControl = response.headers.get("cache-control") || "";

    if (pathname === "/robots.txt") {
      if (response.status !== 200) {
        issues.push(issue("robots-status", url, `Expected robots.txt status 200, received ${response.status}`));
      }
      if (xRobotsTag) {
        issues.push(issue("robots-header", url, `robots.txt must not emit X-Robots-Tag; found ${xRobotsTag}`));
      }
      continue;
    }

    const isLlms = pathname === "/llms.txt";
    const isRetiredLlmsFull = pathname === "/llms-full.txt";
    const isPolicyPage = pathname === "/privacy/" || pathname === "/terms/";
    const isPrivate = isRetiredLlmsFull || (!isLlms && (!isPolicyPage || response.status !== 200));

    if (isLlms && response.status !== 200) {
      issues.push(issue("llms-status", url, `Expected ${pathname} status 200, received ${response.status}`));
    }
    if (isRetiredLlmsFull && response.status !== 410) {
      issues.push(
        issue(
          "llms-full-status",
          url,
          `Expected retired ${pathname} status 410, received ${response.status}`,
        ),
      );
    }
    if (isPolicyPage && ![200, 404].includes(response.status)) {
      issues.push(
        issue(
          "policy-page-status",
          url,
          `Expected ${pathname} to be a published 200 or an explicit 404, received ${response.status}`,
        ),
      );
    }
    if (pathname === "/__seo-release-probe-missing__/" && response.status !== 404) {
      issues.push(issue("404-probe-status", url, `Expected deliberate missing URL to return 404, received ${response.status}`));
    }
    if (
      pathname === "/api/__seo-release-probe" &&
      (response.status < 200 || response.status >= 500 || (response.status >= 300 && response.status < 400))
    ) {
      issues.push(issue("api-probe-status", url, `Sensitive API probe returned unexpected status ${response.status}`));
    }

    const expectedDirectives = isPrivate
      ? ["noindex", "nofollow", "noarchive"]
      : ["noindex", "follow", "noarchive"];
    const missing = missingDirectives(xRobotsTag, expectedDirectives);
    if (missing.length > 0) {
      issues.push(
        issue(
          "policy-probe-robots",
          url,
          `Expected X-Robots-Tag directives ${expectedDirectives.join(", ")}; missing ${missing.join(", ") || "none"}`,
        ),
      );
    }

    if (isPrivate && (!/\bprivate\b/i.test(cacheControl) || !/\bno-store\b/i.test(cacheControl))) {
      issues.push(
        issue(
          "policy-probe-cache",
          url,
          `Private probe must bypass shared cache; found Cache-Control: ${cacheControl || "missing"}`,
        ),
      );
    }
  }

  return issues;
}

export async function validateSeoRelease({
  baseUrl,
  expectedUrlCount = DEFAULT_EXPECTED_URL_COUNT,
  fetchImpl = globalThis.fetch,
  checkCanonicalization = true,
  checkPolicyProbes = true,
  concurrency = DEFAULT_CONCURRENCY,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  const baseOrigin = normalizeBaseUrl(baseUrl);
  const expectedCount = positiveInteger(expectedUrlCount, "expectedUrlCount");
  const issues = [];
  const sitemapUrl = `${baseOrigin}/sitemap.xml`;
  let sitemapResponse;

  try {
    sitemapResponse = await fetchImpl(
      sitemapUrl,
      requestInit("application/xml,text/xml;q=0.9,*/*;q=0.1", timeoutMs),
    );
  } catch (error) {
    throw new SeoReleaseError([
      issue("sitemap-fetch", sitemapUrl, `Could not fetch sitemap: ${error.message}`),
    ], { sitemapUrl, urlCount: 0, pagesChecked: 0 });
  }

  if (sitemapResponse.status !== 200) {
    throw new SeoReleaseError([
      issue("sitemap-status", sitemapUrl, `Expected sitemap status 200, received ${sitemapResponse.status}`),
    ], { sitemapUrl, urlCount: 0, pagesChecked: 0 });
  }
  const sitemapRobots = sitemapResponse.headers.get("x-robots-tag") || "";
  if (containsNoindex(sitemapRobots)) {
    issues.push(
      issue("sitemap-noindex", sitemapUrl, `sitemap.xml inherited a noindex X-Robots-Tag: ${sitemapRobots}`),
    );
  }

  const sitemapXml = await sitemapResponse.text();
  const sitemapUrls = extractSitemapUrls(sitemapXml);
  const uniqueUrls = [...new Set(sitemapUrls)];
  const duplicateUrls = [...new Set(
    sitemapUrls.filter((url, index) => sitemapUrls.indexOf(url) !== index),
  )];

  for (const duplicate of duplicateUrls) {
    issues.push(issue("sitemap-duplicate", duplicate, `Duplicate sitemap URL: ${duplicate}`));
  }
  if (sitemapUrls.length !== expectedCount) {
    issues.push(
      issue(
        "sitemap-count",
        sitemapUrl,
        `Expected ${expectedCount} sitemap entries, found ${sitemapUrls.length}`,
      ),
    );
  }
  if (uniqueUrls.length !== expectedCount) {
    issues.push(
      issue(
        "sitemap-unique-count",
        sitemapUrl,
        `Expected ${expectedCount} unique sitemap URLs, found ${uniqueUrls.length}`,
      ),
    );
  }

  const validUrls = [];
  for (const value of uniqueUrls) {
    let parsed;
    try {
      parsed = new URL(value);
    } catch {
      issues.push(issue("sitemap-url", value, `Invalid absolute URL in sitemap: ${value}`));
      continue;
    }
    if (parsed.origin !== baseOrigin) {
      issues.push(issue("sitemap-origin", value, `Sitemap URL is outside canonical origin ${baseOrigin}`));
      continue;
    }
    validUrls.push(parsed.href);
  }

  const pageIssueGroups = await mapLimit(validUrls, concurrency, (url) =>
    inspectPage(url, { fetchImpl, baseOrigin, timeoutMs }),
  );
  issues.push(...pageIssueGroups.flat());

  if (checkCanonicalization) {
    const redirectIssueGroups = await mapLimit(validUrls, concurrency, (url) =>
      validateCanonicalVariants(url, {
        baseUrl: baseOrigin,
        fetchImpl,
        timeoutMs,
      }),
    );
    issues.push(...redirectIssueGroups.flat());
  }

  if (checkPolicyProbes) {
    issues.push(
      ...(await validatePolicyProbes(baseOrigin, {
        fetchImpl,
        timeoutMs,
      })),
    );
  }

  const report = {
    ok: issues.length === 0,
    sitemapUrl,
    urlCount: uniqueUrls.length,
    sitemapEntryCount: sitemapUrls.length,
    pagesChecked: validUrls.length,
    canonicalizationChecked: checkCanonicalization,
    policyProbesChecked: checkPolicyProbes,
    issues,
  };

  if (issues.length > 0) throw new SeoReleaseError(issues, report);
  return report;
}

const USAGE = `Usage:
  node scripts/verify-seo-release.mjs --base-url https://getgiffgaff.com [--expected-url-count ${DEFAULT_EXPECTED_URL_COUNT}]

Environment fallbacks:
  SEO_BASE_URL
  SEO_EXPECTED_URL_COUNT (default: ${DEFAULT_EXPECTED_URL_COUNT})`;

export async function runCli(
  args = process.argv.slice(2),
  env = process.env,
  { stdout = console.log, stderr = console.error } = {},
) {
  let options;
  try {
    options = parseCliOptions(args, env);
  } catch (error) {
    stderr(error.message);
    stderr(USAGE);
    return 2;
  }

  if (options.help) {
    stdout(USAGE);
    return 0;
  }

  try {
    const report = await validateSeoRelease(options);
    stdout(
      `SEO release gate passed: ${report.urlCount} unique sitemap URLs, ` +
        `${report.pagesChecked} pages and all canonical variants verified.`,
    );
    return 0;
  } catch (error) {
    if (!(error instanceof SeoReleaseError)) {
      stderr(error.stack || error.message);
      return 2;
    }
    stderr(error.message);
    for (const finding of error.issues) {
      stderr(`- [${finding.code}] ${finding.url}: ${finding.message}`);
    }
    return 1;
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  process.exitCode = await runCli();
}
