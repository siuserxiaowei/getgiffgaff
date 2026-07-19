import {
  PUBLIC_INDEXABLE_PATHS,
  OPTIONAL_PUBLIC_STATIC_ASSET_PATHS,
  PUBLIC_STATIC_ASSET_PATHS,
  ROUTE_MANIFEST,
  routeFor,
} from "./route-manifest.js";

export { PUBLIC_INDEXABLE_PATHS };

export const CANONICAL_ORIGIN = "https://getgiffgaff.com";

const CANONICAL_HOST = "getgiffgaff.com";
const WWW_HOST = "www.getgiffgaff.com";
const PROJECT_PREVIEW_HOST = "getgiffgaff.pages.dev";
const ANALYTICS_EVENT_PATH = "/analytics-event-v1";
const ANALYTICS_EVENT_VERSION = "analytics_event_v1";
const ANALYTICS_MAX_BYTES = 1024;
const ANALYTICS_RELEASE_PROBE_HEADER = "x-getgiffgaff-release-probe";
const ANALYTICS_RELEASE_PROBE_VALUE = "seo_release_canary_v1";
const ANALYTICS_RELEASE_PROBE_ID_HEADER = "x-getgiffgaff-release-probe-id";
const ANALYTICS_RELEASE_PROBE_INDEX_PREFIX = "seo_release_canary:";
const ANALYTICS_RELEASE_PROBE_BLOB = "seo_release_canary";
const RELEASE_PROVENANCE_PATH = "/release-provenance.json";
const PAYMENT_HANDOFF_PATH = "/pay/";
const PAYMENT_HANDOFF_TARGET = `${CANONICAL_ORIGIN}/contact/#ktt-giga-card`;
const RETIRED_WECHAT_QR_PATH = "/contact/wechat-qr.png";
const VERIFIED_WECHAT_QR_PATH = "/contact/wechat-qr.jpg";
const EDGE_HTML_CACHE_VERSION = "contact-channels-analytics-20260719-v1";
const PUBLIC_READ_METHODS = new Set(["GET", "HEAD"]);
const PUBLIC_STATIC_ASSETS = new Set(PUBLIC_STATIC_ASSET_PATHS);
const OPTIONAL_PUBLIC_STATIC_ASSETS = new Set(OPTIONAL_PUBLIC_STATIC_ASSET_PATHS);
const PRIVATE_HANDOFF_PATHS = new Set([PAYMENT_HANDOFF_PATH]);
const BODYLESS_STATUSES = new Set([101, 204, 205, 304]);
const PERMANENT_REDIRECT_STATUSES = new Set([301, 308]);

const SUPPORTING_NOINDEX_PATHS = new Set([
  "/llms.txt",
  "/llms-full.txt",
  "/privacy/",
  "/terms/",
  "/refund/",
  "/shipping/",
]);
const PRIVATE_ROUTE_PREFIXES = [
  "/admin",
  "/api",
  "/account",
  "/accounts",
  "/auth",
  "/cart",
  "/checkout",
  "/login",
  "/logout",
  "/order",
  "/orders",
  "/preview",
];
const SENSITIVE_QUERY_PARAMETERS = new Set([
  "access_token",
  "api_key",
  "auth",
  "auth_token",
  "authorization",
  "code",
  "cookie",
  "email",
  "id_token",
  "key",
  "mobile",
  "order",
  "order_id",
  "otp",
  "pass",
  "password",
  "phone",
  "secret",
  "session",
  "session_id",
  "token",
]);

const ROBOTS_DIRECTIVES = Object.freeze({
  indexable: "index, follow, max-snippet:-1, max-image-preview:large",
  "supporting-noindex": "noindex, follow, noarchive",
  "private-noindex": "noindex, nofollow, noarchive",
});
const ANALYTICS_SOURCES = new Set([
  "ai",
  "direct",
  "dist_partner",
  "dist_private_share",
  "dist_wechat_group",
  "dist_wechat_official",
  "dist_xiaohongshu",
  "paid_google",
  "paid_microsoft",
  "internal",
  "referral",
  "search",
  "social",
  "unknown",
]);
const ATTRIBUTION_QUERY_PARAMETER = "utm_source";
const ATTRIBUTION_SOURCES = new Set([
  "dist_partner",
  "dist_private_share",
  "dist_wechat_group",
  "dist_wechat_official",
  "dist_xiaohongshu",
  "paid_google",
  "paid_microsoft",
]);
const ANALYTICS_EVENTS = new Set([
  "commerce_click",
  "contact_click",
  "growth_related_click",
  "page_view",
  "shop_click",
  "tool_result",
]);
const ANALYTICS_CONTACT_CHANNELS = new Set([
  "telegram",
  "wechat",
]);
const ANALYTICS_PITFALLS_INTENT_PATH = "/guides/6-pitfalls/";
const ANALYTICS_PITFALLS_INTENTS = new Set([
  "after-purchase",
  "before-purchase",
]);

function matchesRoutePrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isProjectPreviewHost(hostname) {
  return (
    hostname === PROJECT_PREVIEW_HOST ||
    hostname.endsWith(`.${PROJECT_PREVIEW_HOST}`)
  );
}

function isAllowedHost(hostname) {
  return (
    hostname === CANONICAL_HOST ||
    hostname === WWW_HOST ||
    isProjectPreviewHost(hostname)
  );
}

function normalizeHostHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "");
}

function normalizePathname(pathname) {
  let normalized = pathname.replace(/\/{2,}/g, "/");
  if (/\/index\.html$/i.test(normalized)) {
    normalized = normalized.replace(/index\.html$/i, "");
  }
  if (!normalized) normalized = "/";
  if (!routeFor(normalized) && normalized !== "/" && !normalized.endsWith("/")) {
    const withSlash = `${normalized}/`;
    if (
      routeFor(withSlash)
      || SUPPORTING_NOINDEX_PATHS.has(withSlash)
      || PRIVATE_HANDOFF_PATHS.has(withSlash)
    ) {
      normalized = withSlash;
    }
  }
  return normalized;
}

function normalizedRoute(pathname) {
  const normalized = normalizePathname(pathname);
  return routeFor(normalized) ? normalized : pathname;
}

function hasSensitiveQuery(url) {
  return [...url.searchParams.keys()].some((key) =>
    SENSITIVE_QUERY_PARAMETERS.has(key.toLowerCase()),
  );
}

function hasEncodedRequestSmuggling(value) {
  return /%(?:25)*0[ad]|%(?:25)*(?:2f|5c)/i.test(value);
}

function securityHeaders(headers) {
  headers.set("strict-transport-security", "max-age=31536000; includeSubDomains");
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set(
    "permissions-policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  );
  headers.set("x-frame-options", "SAMEORIGIN");
}

function textResponse(request, body, status, contentType = "text/plain; charset=utf-8") {
  const bytes = new TextEncoder().encode(body);
  return new Response(request.method === "HEAD" ? null : bytes, {
    status,
    headers: {
      "content-type": contentType,
      "content-length": String(bytes.byteLength),
    },
  });
}

function privateError(request, status, message) {
  const upstream = textResponse(request, message, status);
  return finalizeResponse(request, upstream, "private-noindex");
}

function analyticsUnavailable(request) {
  const upstream = new Response(
    JSON.stringify({ error: "analytics_unavailable" }),
    {
      status: 503,
      headers: { "content-type": "application/json; charset=utf-8" },
    },
  );
  return finalizeResponse(request, upstream, "private-noindex");
}

export function policyFor(pathname, status, contentType = "") {
  const normalized = normalizedRoute(pathname);
  const record = routeFor(normalized);
  const normalizedType = String(contentType).toLowerCase();

  if (status >= 400) return "private-noindex";
  if (SUPPORTING_NOINDEX_PATHS.has(normalized)) return "supporting-noindex";
  if (PRIVATE_ROUTE_PREFIXES.some((prefix) => matchesRoutePrefix(pathname, prefix))) {
    return "private-noindex";
  }
  if (record && status >= 200 && status < 300 && normalizedType.includes("text/html")) {
    return record.indexPolicy === "index" ? "indexable" : "supporting-noindex";
  }
  if (status >= 200 && status < 300 && normalizedType.includes("text/html")) {
    return "private-noindex";
  }
  return "none";
}

export function finalizeResponse(request, upstream, policy) {
  const headers = new Headers(upstream.headers);
  const requestUrl = new URL(request.url);
  const preview = isProjectPreviewHost(requestUrl.hostname.toLowerCase());
  const sensitive = hasSensitiveQuery(requestUrl) || request.headers.has("authorization");
  const personalized = request.headers.has("cookie") || headers.has("set-cookie");
  const record = routeFor(normalizePathname(requestUrl.pathname));

  headers.delete("x-robots-tag");
  headers.delete("set-cookie");
  headers.delete("set-cookie2");
  if (/\bcookie\b/i.test(headers.get("vary") || "")) headers.delete("vary");
  securityHeaders(headers);

  const effectivePolicy = preview || sensitive ? "private-noindex" : policy;
  const directives = ROBOTS_DIRECTIVES[effectivePolicy];
  if (directives) headers.set("x-robots-tag", directives);

  if (
    preview
    || sensitive
    || effectivePolicy === "private-noindex"
    || personalized
    || requestUrl.pathname === RELEASE_PROVENANCE_PATH
  ) {
    headers.set("cache-control", "private, no-store");
  } else if (record && upstream.status >= 200 && upstream.status < 300) {
    headers.set(
      "cache-control",
      "public, max-age=0, s-maxage=600, stale-while-revalidate=86400",
    );
  } else if (requestUrl.pathname === "/sitemap.xml" || requestUrl.pathname === "/robots.txt") {
    headers.set(
      "cache-control",
      "public, max-age=300, s-maxage=600, stale-while-revalidate=3600",
    );
  } else if (
    (upstream.status >= 200 && upstream.status < 300)
    || PERMANENT_REDIRECT_STATUSES.has(upstream.status)
  ) {
    headers.set(
      "cache-control",
      "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    );
  } else {
    headers.set("cache-control", "private, no-store");
  }

  const body =
    request.method === "HEAD" || BODYLESS_STATUSES.has(upstream.status)
      ? null
      : upstream.body;
  return new Response(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

export function canonicalRedirectFor(request) {
  const original = new URL(request.url);
  const canonical = new URL(original.toString());
  const originalHost = original.hostname.toLowerCase();
  let changed = false;

  if (originalHost === WWW_HOST) {
    canonical.hostname = CANONICAL_HOST;
    canonical.port = "";
    changed = true;
  }
  if (originalHost === CANONICAL_HOST && original.port) {
    canonical.port = "";
    changed = true;
  }
  if (
    original.protocol === "http:" &&
    (originalHost === CANONICAL_HOST || originalHost === WWW_HOST)
  ) {
    canonical.protocol = "https:";
    canonical.hostname = CANONICAL_HOST;
    canonical.port = "";
    changed = true;
  }

  const normalizedPath = normalizePathname(canonical.pathname);
  if (normalizedPath !== canonical.pathname) {
    canonical.pathname = normalizedPath;
    changed = true;
  }
  if (routeFor(normalizedPath) && canonical.search) {
    const attribution = canonical.searchParams.get(ATTRIBUTION_QUERY_PARAMETER);
    const safeAttribution = ATTRIBUTION_SOURCES.has(attribution) ? attribution : null;
    const expectedSearch = safeAttribution
      ? `?${ATTRIBUTION_QUERY_PARAMETER}=${encodeURIComponent(safeAttribution)}`
      : "";
    if (canonical.search !== expectedSearch) {
      canonical.search = expectedSearch;
      changed = true;
    }
  }
  if (canonical.hash) {
    canonical.hash = "";
    changed = true;
  }
  if (!changed) return null;
  return Response.redirect(canonical.toString(), 301);
}

export function paymentHandoffResponse(request) {
  const upstream = new Response(null, {
    status: 303,
    headers: {
      location: PAYMENT_HANDOFF_TARGET,
      "x-getgiffgaff-payment-mode": "contact-qr-handoff",
      "x-getgiffgaff-payment-provider": "kuaituantuan",
    },
  });
  return finalizeResponse(request, upstream, "private-noindex");
}

function sitemapXml() {
  const entries = PUBLIC_INDEXABLE_PATHS.map((pathname) => {
    const lastModified = ROUTE_MANIFEST[pathname].lastModified;
    return `  <url>\n    <loc>${CANONICAL_ORIGIN}${pathname}</loc>\n    <lastmod>${lastModified}</lastmod>\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
}

function sanitizedAssetRequest(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = "";
  url.hash = "";
  const headers = new Headers(request.headers);
  headers.delete("authorization");
  headers.delete("cookie");
  headers.delete("proxy-authorization");
  return new Request(url.toString(), {
    method: request.method,
    headers,
    redirect: "manual",
  });
}

function edgeCacheFor(env) {
  return env?.__STATIC_CACHE || globalThis.caches?.default || null;
}

function edgeCacheKey(pathname) {
  const url = new URL(`${CANONICAL_ORIGIN}${pathname}`);
  url.searchParams.set("__getgiffgaff_release", EDGE_HTML_CACHE_VERSION);
  return new Request(url.toString(), { method: "GET" });
}

function shouldUseEdgeHtmlCache(request, pathname) {
  const url = new URL(request.url);
  const record = routeFor(pathname);
  return Boolean(
    record &&
      record.cachePolicy === "public" &&
      url.hostname.toLowerCase() === CANONICAL_HOST &&
      PUBLIC_READ_METHODS.has(request.method) &&
      !request.headers.has("authorization") &&
      !request.headers.has("cookie") &&
      !hasSensitiveQuery(url),
  );
}

function withEdgeCacheState(request, response, state) {
  const headers = new Headers(response.headers);
  headers.set("x-getgiffgaff-edge-cache", state);
  const body = request.method === "HEAD" ? null : response.body;
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function fetchStaticAsset(request, env, pathname, context) {
  if (!env?.ASSETS || typeof env.ASSETS.fetch !== "function") {
    return privateError(request, 503, "Static assets are unavailable");
  }
  const cache = shouldUseEdgeHtmlCache(request, pathname) ? edgeCacheFor(env) : null;
  const cacheKey = cache ? edgeCacheKey(pathname) : null;
  if (cache && cacheKey) {
    const cached = await cache.match(cacheKey);
    if (cached) return withEdgeCacheState(request, cached, "HIT");
  }

  const upstream = await env.ASSETS.fetch(sanitizedAssetRequest(request, pathname));
  const policy = policyFor(
    pathname,
    upstream.status,
    upstream.headers.get("content-type") || "",
  );
  const response = finalizeResponse(request, upstream, policy);
  if (
    cache &&
    cacheKey &&
    request.method === "GET" &&
    response.status >= 200 &&
    response.status < 300 &&
    !response.headers.has("set-cookie")
  ) {
    const put = cache.put(cacheKey, response.clone());
    if (context && typeof context.waitUntil === "function") context.waitUntil(put);
    else await put;
    return withEdgeCacheState(request, response, "MISS");
  }
  return response;
}

export async function analyticsEventV1(request, env) {
  const requestUrl = new URL(request.url);
  if (requestUrl.hostname.toLowerCase() !== CANONICAL_HOST) {
    return privateError(request, 404, "Not found");
  }
  if (request.method !== "POST") {
    return privateError(request, 405, "Method not allowed");
  }
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") || "")) {
    return privateError(request, 400, "Invalid analytics event");
  }
  const origin = request.headers.get("origin");
  if (origin !== CANONICAL_ORIGIN) {
    return privateError(request, 400, "Invalid analytics event");
  }
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(declaredLength) && declaredLength > ANALYTICS_MAX_BYTES) {
    return privateError(request, 413, "Analytics event is too large");
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > ANALYTICS_MAX_BYTES) {
    return privateError(request, 413, "Analytics event is too large");
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return privateError(request, 400, "Invalid analytics event");
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return privateError(request, 400, "Invalid analytics event");
  }
  const keys = Object.keys(payload).sort().join(",");
  const hasChannel = Object.hasOwn(payload, "channel");
  const hasIntent = Object.hasOwn(payload, "intent");
  const hasReleaseProbe = request.headers.has(ANALYTICS_RELEASE_PROBE_HEADER);
  const hasReleaseProbeId = request.headers.has(ANALYTICS_RELEASE_PROBE_ID_HEADER);
  const isReleaseProbe =
    request.headers.get(ANALYTICS_RELEASE_PROBE_HEADER) === ANALYTICS_RELEASE_PROBE_VALUE;
  const releaseProbeId = request.headers.get(ANALYTICS_RELEASE_PROBE_ID_HEADER) || "";
  if (
    keys !== "event,path,source,version" &&
    keys !== "channel,event,path,source,version" &&
    keys !== "event,intent,path,source,version"
  ) {
    return privateError(request, 400, "Invalid analytics event");
  }
  const route = typeof payload.path === "string" ? routeFor(payload.path) : null;
  if (
    payload.version !== ANALYTICS_EVENT_VERSION ||
    !route ||
    route.canonicalPath !== payload.path ||
    !ANALYTICS_SOURCES.has(payload.source) ||
    !ANALYTICS_EVENTS.has(payload.event) ||
    (payload.event === "contact_click" && !hasChannel) ||
    (hasChannel && (
      payload.event !== "contact_click" ||
      !ANALYTICS_CONTACT_CHANNELS.has(payload.channel)
    )) ||
    (hasIntent && (
      payload.path !== ANALYTICS_PITFALLS_INTENT_PATH ||
      payload.event !== "commerce_click" ||
      !ANALYTICS_PITFALLS_INTENTS.has(payload.intent)
    )) ||
    (hasReleaseProbe !== hasReleaseProbeId) ||
    (hasReleaseProbe && (
      !isReleaseProbe ||
      !/^[0-9a-f]{64}$/u.test(releaseProbeId) ||
      payload.path !== "/" ||
      payload.source !== "direct" ||
      payload.event !== "page_view" ||
      hasChannel ||
      hasIntent
    ))
  ) {
    return privateError(request, 400, "Invalid analytics event");
  }

  if (!env?.ANALYTICS || typeof env.ANALYTICS.writeDataPoint !== "function") {
    return analyticsUnavailable(request);
  }

  try {
    const blobs = [payload.path, payload.source, payload.event];
    if (hasChannel) blobs.push(payload.channel);
    if (hasIntent) blobs.push(payload.intent);
    if (isReleaseProbe) blobs.push(ANALYTICS_RELEASE_PROBE_BLOB, releaseProbeId);
    await env.ANALYTICS.writeDataPoint({
      indexes: [
        isReleaseProbe
          ? `${ANALYTICS_RELEASE_PROBE_INDEX_PREFIX}${releaseProbeId}`
          : payload.event,
      ],
      blobs,
      doubles: [1],
    });
  } catch {
    return analyticsUnavailable(request);
  }
  return finalizeResponse(
    request,
    new Response(null, { status: 204 }),
    "private-noindex",
  );
}

async function handleRequest(request, env, context) {
  const url = new URL(request.url);
  const hostname = url.hostname.toLowerCase();
  const suppliedHost = normalizeHostHeader(request.headers.get("host"));

  if (!isAllowedHost(hostname) || (suppliedHost && suppliedHost !== hostname)) {
    return privateError(request, 421, "Misdirected request");
  }
  if (
    request.headers.has("authorization") ||
    hasSensitiveQuery(url) ||
    hasEncodedRequestSmuggling(request.url)
  ) {
    return privateError(request, 400, "Invalid public request");
  }

  const redirect = canonicalRedirectFor(request);
  if (redirect) return redirect;

  if (url.pathname === RETIRED_WECHAT_QR_PATH) {
    const upstream = Response.redirect(
      `${CANONICAL_ORIGIN}${VERIFIED_WECHAT_QR_PATH}`,
      301,
    );
    return finalizeResponse(request, upstream, "none");
  }

  if (url.pathname === ANALYTICS_EVENT_PATH) {
    return analyticsEventV1(request, env);
  }
  if (url.pathname === PAYMENT_HANDOFF_PATH) {
    if (!PUBLIC_READ_METHODS.has(request.method)) {
      return privateError(request, 405, "Method not allowed");
    }
    return paymentHandoffResponse(request);
  }
  if (!PUBLIC_READ_METHODS.has(request.method)) {
    return privateError(request, 405, "Method not allowed");
  }

  if (url.pathname === "/sitemap.xml") {
    const upstream = textResponse(
      request,
      sitemapXml(),
      200,
      "application/xml; charset=utf-8",
    );
    return finalizeResponse(request, upstream, "none");
  }
  if (url.pathname === "/llms-full.txt") {
    return privateError(request, 410, "This expanded machine-readable file has been retired.");
  }

  const normalizedPath = normalizePathname(url.pathname);
  if (routeFor(normalizedPath)) {
    return fetchStaticAsset(request, env, normalizedPath, context);
  }
  if (
    PUBLIC_STATIC_ASSETS.has(url.pathname)
    || OPTIONAL_PUBLIC_STATIC_ASSETS.has(url.pathname)
  ) {
    return fetchStaticAsset(request, env, url.pathname, context);
  }
  return privateError(request, 404, "Not found");
}

const worker = { fetch: handleRequest };
export default worker;
