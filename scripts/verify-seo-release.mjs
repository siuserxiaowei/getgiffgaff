#!/usr/bin/env node

import { createHash, randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PUBLIC_INDEXABLE_PATHS,
  ROUTE_MANIFEST,
} from "../public/route-manifest.js";

const DEFAULT_EXPECTED_URL_COUNT = PUBLIC_INDEXABLE_PATHS.length;
const DEFAULT_CONCURRENCY = 6;
const DEFAULT_TIMEOUT_MS = 15_000;
const PERMANENT_REDIRECT_STATUSES = new Set([301, 308]);
const ROBOTS_NAMES = new Set(["robots", "googlebot", "bingbot"]);
const ANALYTICS_EVENT_PATH = "/analytics-event-v1";
const ANALYTICS_RELEASE_PROBE_HEADER = "x-getgiffgaff-release-probe";
const ANALYTICS_RELEASE_PROBE_VALUE = "seo_release_canary_v1";
const ANALYTICS_RELEASE_PROBE_ID_HEADER = "x-getgiffgaff-release-probe-id";
const ANALYTICS_RELEASE_PROBE_PAYLOAD = Object.freeze({
  version: "analytics_event_v1",
  path: "/",
  source: "direct",
  event: "page_view",
});
const PUBLIC_NOINDEX_PATHS = Object.freeze(
  Object.entries(ROUTE_MANIFEST)
    .filter(([, record]) => record.indexPolicy === "noindex")
    .map(([pathname]) => pathname),
);
export const OWNER_QR_ASSETS = Object.freeze([
  Object.freeze({
    pathname: "/contact/wechat-qr.jpg",
    sha256: "751f8055949c3ee5d13a69dae6eef3aeef925a9e6f8dda1ca00b48e0399e1b43",
  }),
  Object.freeze({
    pathname: "/contact/telegram-qr.jpg",
    sha256: "9a6ed7d1e30acc7dc35d2dabe2e1078cd2cd0b3ceaecd7bf1d716fa5c1b1b3fa",
  }),
]);
export const EXPECTED_ROBOTS_POLICY = Object.freeze({
  allow: Object.freeze([
    "Googlebot",
    "Bingbot",
    "Baiduspider",
    "OAI-SearchBot",
    "ChatGPT-User",
    "Claude-SearchBot",
    "Claude-User",
    "PerplexityBot",
    "Perplexity-User",
  ]),
  disallow: Object.freeze([
    "Amazonbot",
    "Applebot-Extended",
    "Bytespider",
    "CCBot",
    "ClaudeBot",
    "cohere-ai",
    "GPTBot",
    "meta-externalagent",
    "anthropic-ai",
    "Google-Extended",
  ]),
});

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

function expectedSitemapUrls(baseOrigin, indexablePaths = PUBLIC_INDEXABLE_PATHS) {
  return indexablePaths.map((pathname) => new URL(pathname, `${baseOrigin}/`).href);
}

export function validateSitemapUrlSet(
  sitemapUrls,
  { baseOrigin, indexablePaths = PUBLIC_INDEXABLE_PATHS } = {},
) {
  const expectedUrls = expectedSitemapUrls(baseOrigin, indexablePaths);
  const actualSet = new Set(sitemapUrls);
  const expectedSet = new Set(expectedUrls);
  const issues = [];

  for (const expectedUrl of expectedUrls) {
    if (!actualSet.has(expectedUrl)) {
      issues.push(issue(
        "sitemap-path-missing",
        expectedUrl,
        `Sitemap is missing manifest indexable pathname ${new URL(expectedUrl).pathname}`,
      ));
    }
  }
  for (const actualUrl of actualSet) {
    if (!expectedSet.has(actualUrl)) {
      let pathname = actualUrl;
      try {
        pathname = new URL(actualUrl).pathname;
      } catch {
        // The existing absolute URL validation reports malformed values separately.
      }
      issues.push(issue(
        "sitemap-path-unexpected",
        actualUrl,
        `Sitemap contains unexpected pathname ${pathname} not present in the indexable manifest`,
      ));
    }
  }

  return issues;
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

function robotsSourceLabel(isCloudflareManaged) {
  return isCloudflareManaged ? "cloudflare-managed" : "repository";
}

export function parseRobotsTxt(value) {
  const groups = [];
  const errors = [];
  let currentGroup = null;
  let isCloudflareManaged = false;
  let mayAppendAgent = false;

  const lines = String(value ?? "").replace(/^\uFEFF/, "").split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const rawLine = lines[index];
    if (/^\s*#\s*BEGIN\s+Cloudflare\s+Managed\s+content\b/i.test(rawLine)) {
      isCloudflareManaged = true;
      currentGroup = null;
      mayAppendAgent = false;
      continue;
    }
    if (/^\s*#\s*END\s+Cloudflare\s+Managed\s+Content\b/i.test(rawLine)) {
      isCloudflareManaged = false;
      currentGroup = null;
      mayAppendAgent = false;
      continue;
    }

    const withoutComment = rawLine.replace(/#.*$/, "").trim();
    if (!withoutComment) continue;
    const separator = withoutComment.indexOf(":");
    if (separator < 1) {
      errors.push({ line: lineNumber, message: `Malformed robots.txt line: ${withoutComment}` });
      continue;
    }

    const directive = withoutComment.slice(0, separator).trim().toLowerCase();
    const directiveValue = withoutComment.slice(separator + 1).trim();
    const source = robotsSourceLabel(isCloudflareManaged);

    if (directive === "user-agent") {
      if (!directiveValue) {
        errors.push({ line: lineNumber, message: "User-agent must not be empty" });
        currentGroup = null;
        mayAppendAgent = false;
        continue;
      }
      const normalizedAgent = directiveValue.toLowerCase();
      if (
        currentGroup
        && currentGroup.source === source
        && mayAppendAgent
      ) {
        currentGroup.agents.push(normalizedAgent);
      } else {
        currentGroup = {
          agents: [normalizedAgent],
          rules: [],
          source,
          line: lineNumber,
        };
        groups.push(currentGroup);
      }
      mayAppendAgent = true;
      continue;
    }

    mayAppendAgent = false;

    if (directive === "allow" || directive === "disallow") {
      if (!currentGroup) {
        errors.push({
          line: lineNumber,
          message: `${directive} appears before a User-agent group`,
        });
        continue;
      }
      if (!directiveValue) continue;
      if (!directiveValue.startsWith("/") && !directiveValue.startsWith("*")) {
        errors.push({
          line: lineNumber,
          message: `${directive} path must begin with / or *: ${directiveValue}`,
        });
        continue;
      }
      currentGroup.rules.push({
        directive,
        pattern: directiveValue,
        line: lineNumber,
      });
      continue;
    }

    // Sitemap, Content-Signal, Crawl-delay, Host and other extensions do not
    // change Allow/Disallow matching for the release gate.
  }

  return { groups, errors };
}

function applicableRobotsGroups(groups, agent, source) {
  const normalizedAgent = String(agent).toLowerCase();
  const candidates = source ? groups.filter((group) => group.source === source) : groups;
  const exact = candidates.filter((group) => group.agents.includes(normalizedAgent));
  if (exact.length > 0) return exact;
  return candidates.filter((group) => group.agents.includes("*"));
}

function robotsPatternMatch(pattern, pathname) {
  const anchored = pattern.endsWith("$");
  const source = anchored ? pattern.slice(0, -1) : pattern;
  const expression = source
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${expression}${anchored ? "$" : ""}`).test(pathname);
}

function robotsDecision(groups, agent, pathname, source) {
  const applicable = applicableRobotsGroups(groups, agent, source);
  if (applicable.length === 0) {
    return { allowed: true, applicable: false, rule: null };
  }

  const matches = applicable
    .flatMap((group) => group.rules.map((rule) => ({ ...rule, source: group.source })))
    .filter((rule) => robotsPatternMatch(rule.pattern, pathname))
    .map((rule) => ({
      ...rule,
      specificity: rule.pattern.replace(/\*/g, "").replace(/\$$/, "").length,
    }))
    .sort((left, right) =>
      right.specificity - left.specificity
      || (left.directive === "allow" ? -1 : 1)
      || left.line - right.line);

  if (matches.length === 0) return { allowed: true, applicable: true, rule: null };
  return {
    allowed: matches[0].directive === "allow",
    applicable: true,
    rule: matches[0],
  };
}

function robotsPathSummary(paths, allPaths) {
  return paths.length === allPaths.length
    ? `all ${allPaths.length} proposed indexable paths`
    : paths.join(", ");
}

export function validateRobotsPolicy(
  robotsText,
  {
    baseUrl,
    expectedPolicy = EXPECTED_ROBOTS_POLICY,
    indexablePaths = PUBLIC_INDEXABLE_PATHS,
  } = {},
) {
  const baseOrigin = normalizeBaseUrl(baseUrl);
  const robotsUrl = `${baseOrigin}/robots.txt`;
  const parsed = parseRobotsTxt(robotsText);
  const issues = parsed.errors.map((error) =>
    issue("robots-parse", robotsUrl, `Line ${error.line}: ${error.message}`));
  const validPaths = [];
  const allowedAgents = Array.isArray(expectedPolicy?.allow) ? expectedPolicy.allow : [];
  const disallowedAgents = Array.isArray(expectedPolicy?.disallow) ? expectedPolicy.disallow : [];
  const policyOverlap = allowedAgents.filter((agent) =>
    disallowedAgents.some((entry) => entry.toLowerCase() === String(agent).toLowerCase()));
  if (policyOverlap.length > 0) {
    issues.push(
      issue(
        "robots-policy-matrix-conflict",
        robotsUrl,
        `Crawler policy lists agents as both allowed and disallowed: ${policyOverlap.join(", ")}`,
      ),
    );
  }

  for (const pathname of indexablePaths) {
    if (typeof pathname !== "string" || !pathname.startsWith("/")) {
      issues.push(
        issue("robots-indexable-path", robotsUrl, `Invalid proposed indexable path: ${String(pathname)}`),
      );
      continue;
    }
    validPaths.push(new URL(pathname, `${baseOrigin}/`).pathname);
  }

  if (validPaths.length === 0) {
    issues.push(
      issue("robots-indexable-path", robotsUrl, "No proposed indexable paths were supplied"),
    );
  }

  const sources = new Set(parsed.groups.map((group) => group.source));
  const expectedAgents = [
    ...allowedAgents.map((agent) => ({ agent, expected: "allow" })),
    ...disallowedAgents.map((agent) => ({ agent, expected: "disallow" })),
  ];
  for (const { agent, expected } of expectedAgents) {
    const applicable = applicableRobotsGroups(parsed.groups, agent);
    if (applicable.length === 0) {
      issues.push(
        issue(
          "robots-agent-policy-missing",
          robotsUrl,
          `${agent} has no matching User-agent or wildcard group; crawl access cannot be verified`,
        ),
      );
      continue;
    }

    const decisions = validPaths.map((pathname) => ({
      pathname,
      allowed: robotsDecision(parsed.groups, agent, pathname).allowed,
    }));
    if (expected === "allow") {
      const blockedPaths = decisions.filter((entry) => !entry.allowed).map((entry) => entry.pathname);
      if (blockedPaths.length > 0) {
        const detail = robotsPathSummary(blockedPaths, validPaths);
        issues.push(
          issue(
            "robots-indexable-blocked",
            robotsUrl,
            `${agent} is blocked from ${detail}`,
          ),
        );
      }
    } else {
      const allowedPaths = decisions.filter((entry) => entry.allowed).map((entry) => entry.pathname);
      if (allowedPaths.length > 0) {
        const detail = robotsPathSummary(allowedPaths, validPaths);
        issues.push(
          issue(
            "robots-excluded-agent-allowed",
            robotsUrl,
            `${agent} is allowed on ${detail}, contrary to the repository exclusion policy`,
          ),
        );
      }
    }

    if (sources.has("cloudflare-managed") && sources.has("repository")) {
      const conflictingPaths = validPaths.filter((pathname) => {
        const managed = robotsDecision(parsed.groups, agent, pathname, "cloudflare-managed");
        const repository = robotsDecision(parsed.groups, agent, pathname, "repository");
        return managed.applicable && repository.applicable && managed.allowed !== repository.allowed;
      });
      if (conflictingPaths.length > 0) {
        const detail = robotsPathSummary(conflictingPaths, validPaths);
        issues.push(
          issue(
            "robots-cloudflare-policy-conflict",
            robotsUrl,
            `${agent} has conflicting Cloudflare managed and repository crawl policy for ${detail}`,
          ),
        );
      }
    }
  }

  return issues;
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
    ...PUBLIC_NOINDEX_PATHS,
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
      if (response.status === 200) {
        try {
          const robotsText = await response.text();
          issues.push(...validateRobotsPolicy(robotsText, {
            baseUrl: baseOrigin,
            expectedPolicy: EXPECTED_ROBOTS_POLICY,
            indexablePaths: PUBLIC_INDEXABLE_PATHS,
          }));
        } catch (error) {
          issues.push(issue("robots-body", url, `Could not read robots.txt response: ${error.message}`));
        }
      }
      continue;
    }

    const isLlms = pathname === "/llms.txt";
    const isRetiredLlmsFull = pathname === "/llms-full.txt";
    const isPublicNoindexPage = PUBLIC_NOINDEX_PATHS.includes(pathname);
    const isPrivate = isRetiredLlmsFull || (
      !isLlms && (!isPublicNoindexPage || response.status !== 200)
    );

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
    if (isPublicNoindexPage && response.status !== 200) {
      issues.push(
        issue(
          "noindex-page-status",
          url,
          `Expected ${pathname} to be a published noindex page with status 200, received ${response.status}`,
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

export async function validateAnalyticsCanary(baseUrl, {
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  idFactory = () => randomBytes(32).toString("hex"),
} = {}) {
  const baseOrigin = normalizeBaseUrl(baseUrl);
  const url = `${baseOrigin}${ANALYTICS_EVENT_PATH}`;
  const releaseProbeId = String(idFactory()).trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/u.test(releaseProbeId)) {
    throw new Error("Analytics release probe ID must contain 256 bits of hexadecimal entropy");
  }
  let response;

  try {
    const init = requestInit("*/*", timeoutMs);
    init.method = "POST";
    init.headers = {
      ...init.headers,
      "content-type": "application/json",
      origin: baseOrigin,
      [ANALYTICS_RELEASE_PROBE_HEADER]: ANALYTICS_RELEASE_PROBE_VALUE,
      [ANALYTICS_RELEASE_PROBE_ID_HEADER]: releaseProbeId,
    };
    init.body = JSON.stringify(ANALYTICS_RELEASE_PROBE_PAYLOAD);
    response = await fetchImpl(url, init);
  } catch (error) {
    return [issue(
      "analytics-canary-fetch",
      url,
      `Production analytics canary failed: ${error.message}`,
    )];
  }

  const issues = [];
  if (response.status !== 204) {
    issues.push(issue(
      "analytics-canary-status",
      url,
      `Expected production analytics canary status 204, received ${response.status}`,
    ));
  }
  const xRobotsTag = response.headers.get("x-robots-tag") || "";
  const missing = missingDirectives(xRobotsTag, ["noindex", "nofollow", "noarchive"]);
  if (missing.length > 0) {
    issues.push(issue(
      "analytics-canary-robots",
      url,
      `Analytics canary response is missing X-Robots-Tag directives: ${missing.join(", ")}`,
    ));
  }
  const cacheControl = response.headers.get("cache-control") || "";
  if (!/\bprivate\b/i.test(cacheControl) || !/\bno-store\b/i.test(cacheControl)) {
    issues.push(issue(
      "analytics-canary-cache",
      url,
      `Analytics canary must bypass shared cache; found Cache-Control: ${cacheControl || "missing"}`,
    ));
  }

  return issues;
}

export async function validateOwnerQrAssets(baseUrl, {
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  assets = OWNER_QR_ASSETS,
} = {}) {
  const baseOrigin = normalizeBaseUrl(baseUrl);
  const issueGroups = await mapLimit(
    assets,
    Math.min(DEFAULT_CONCURRENCY, Math.max(1, assets.length)),
    async (asset) => {
      const url = `${baseOrigin}${asset.pathname}`;
      const issues = [];
      let getResponse;

      try {
        getResponse = await fetchImpl(url, requestInit("image/jpeg", timeoutMs));
      } catch (error) {
        issues.push(issue("owner-qr-get-fetch", url, `GET owner QR failed: ${error.message}`));
      }

      if (getResponse) {
        if (getResponse.status !== 200) {
          issues.push(issue(
            "owner-qr-get-status",
            url,
            `Expected owner QR GET status 200, received ${getResponse.status}`,
          ));
        }
        const contentType = getResponse.headers.get("content-type") || "";
        if (contentType.toLowerCase().split(";", 1)[0].trim() !== "image/jpeg") {
          issues.push(issue(
            "owner-qr-get-content-type",
            url,
            `Expected owner QR GET Content-Type image/jpeg, received ${contentType || "missing"}`,
          ));
        }
        try {
          const bytes = new Uint8Array(await getResponse.arrayBuffer());
          if (bytes.byteLength === 0) {
            issues.push(issue("owner-qr-empty", url, "Owner QR GET response is empty"));
          } else {
            const sha256 = createHash("sha256").update(bytes).digest("hex");
            if (sha256 !== asset.sha256) {
              issues.push(issue(
                "owner-qr-checksum",
                url,
                `Owner QR SHA-256 mismatch: expected ${asset.sha256}, received ${sha256}`,
              ));
            }
          }
        } catch (error) {
          issues.push(issue("owner-qr-get-body", url, `Could not read owner QR GET body: ${error.message}`));
        }
      }

      let headResponse;
      try {
        headResponse = await fetchImpl(url, {
          ...requestInit("image/jpeg", timeoutMs),
          method: "HEAD",
        });
      } catch (error) {
        issues.push(issue("owner-qr-head-fetch", url, `HEAD owner QR failed: ${error.message}`));
      }

      if (headResponse) {
        if (headResponse.status !== 200) {
          issues.push(issue(
            "owner-qr-head-status",
            url,
            `Expected owner QR HEAD status 200, received ${headResponse.status}`,
          ));
        }
        const contentType = headResponse.headers.get("content-type") || "";
        if (contentType.toLowerCase().split(";", 1)[0].trim() !== "image/jpeg") {
          issues.push(issue(
            "owner-qr-head-content-type",
            url,
            `Expected owner QR HEAD Content-Type image/jpeg, received ${contentType || "missing"}`,
          ));
        }
        if (headResponse.headers.get("content-length") === "0") {
          issues.push(issue(
            "owner-qr-head-empty",
            url,
            "Owner QR HEAD response reports an empty Content-Length",
          ));
        }
      }

      return issues;
    },
  );

  return issueGroups.flat();
}

export async function validateSeoRelease({
  baseUrl,
  expectedUrlCount = DEFAULT_EXPECTED_URL_COUNT,
  fetchImpl = globalThis.fetch,
  checkCanonicalization = true,
  checkPolicyProbes = true,
  checkAnalyticsCanary = checkPolicyProbes,
  checkOwnerQrAssets = checkPolicyProbes,
  indexablePaths = PUBLIC_INDEXABLE_PATHS,
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
  issues.push(...validateSitemapUrlSet(uniqueUrls, { baseOrigin, indexablePaths }));

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

  if (checkAnalyticsCanary) {
    issues.push(
      ...(await validateAnalyticsCanary(baseOrigin, {
        fetchImpl,
        timeoutMs,
      })),
    );
  }

  if (checkOwnerQrAssets) {
    issues.push(
      ...(await validateOwnerQrAssets(baseOrigin, {
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
    analyticsCanaryChecked: checkAnalyticsCanary,
    ownerQrAssetsChecked: checkOwnerQrAssets,
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
