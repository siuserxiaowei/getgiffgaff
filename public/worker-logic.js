import { renderTutorialPage, TUTORIAL_PAGES } from "./tutorial-pages.js";
import {
  PUBLIC_INDEXABLE_PATHS,
  ROUTE_MANIFEST,
  routeFor,
} from "./route-manifest.js";
import {
  activeClaims,
  CLAIM_REGISTRY,
  claimFor,
} from "./claim-registry.js";
import { isTrustPage, renderTrustPage } from "./trust-pages.js";
import {
  renderKeepNumberTool,
  renderRoamingCostTool,
} from "./evidence-tools.js";
import { isCorePage, renderCorePage } from "./core-pages.js";

export { PUBLIC_INDEXABLE_PATHS };

export const CANONICAL_ORIGIN = "https://getgiffgaff.com";
export const RENDER_SCHEMA_VERSION = "local-source-v2-2026-07-15";

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

const ROBOTS_DIRECTIVES = Object.freeze({
  indexable: "index, follow, max-snippet:-1, max-image-preview:large",
  "supporting-noindex": "noindex, follow, noarchive",
  "private-noindex": "noindex, nofollow, noarchive",
});

const LOCAL_HTML_ASSETS = new Map([
  ["/guides/6-pitfalls/", "/guides/6-pitfalls-page.txt"],
  ["/research/", "/research/index-page.txt"],
]);
const KNOWN_STATIC_ASSETS = new Set([
  "/contact/getgiffgaff-contact-og.png",
  "/contact/getgiffgaff-contact-og.svg",
  "/evidence-tools.css",
  "/evidence-tools.js",
  "/favicon.svg",
  "/robots.txt",
]);
const RETIRED_ASSET_PATHS = new Set(["/contact/ktt-giga-card.png"]);
const GENERATED_PATHS = new Set(["/sitemap.xml", "/llms.txt", "/llms-full.txt"]);
const TUTORIAL_PATHS = new Set(Object.keys(TUTORIAL_PAGES));
const PUBLIC_READ_METHODS = new Set(["GET", "HEAD"]);
const BODYLESS_STATUSES = new Set([101, 204, 205, 304]);
const SENSITIVE_QUERY_PARAMETERS = new Set([
  "access_token",
  "activation_code",
  "api_key",
  "auth",
  "auth_token",
  "authorization",
  "client_secret",
  "code",
  "code_verifier",
  "email",
  "esim",
  "id_token",
  "key",
  "lpa",
  "lpa_code",
  "mobile",
  "otp",
  "order",
  "order_id",
  "pass",
  "password",
  "phone",
  "qr_code",
  "refresh_token",
  "secret",
  "session",
  "session_id",
  "token",
]);

function routePath(pathname) {
  if (pathname === "/") return pathname;
  const collapsed = pathname.replace(/\/{2,}/g, "/");
  const withoutIndex = collapsed.replace(/\/index\.html$/i, "/");
  const direct = routeFor(withoutIndex);
  if (direct?.canonicalPath) return direct.canonicalPath;

  const withSlash = withoutIndex.endsWith("/")
    ? withoutIndex
    : `${withoutIndex}/`;
  return routeFor(withSlash)?.canonicalPath || pathname;
}

function matchesRoutePrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isPrivatePath(pathname) {
  return PRIVATE_ROUTE_PREFIXES.some((prefix) =>
    matchesRoutePrefix(pathname, prefix),
  );
}

function isPreviewHostname(hostname) {
  return hostname === "pages.dev" || hostname.endsWith(".pages.dev");
}

export function policyFor(pathname, status, contentType = "") {
  const normalizedPath = routePath(pathname);
  const normalizedType = contentType.toLowerCase();
  const route = routeFor(normalizedPath);

  if (status >= 400 || isPrivatePath(pathname)) return "private-noindex";
  if (route?.indexPolicy === "noindex") return "supporting-noindex";
  if (["private", "gone", "redirect"].includes(route?.indexPolicy)) {
    return "private-noindex";
  }
  if (status >= 200 && status < 300 && normalizedType.includes("text/html")) {
    return route?.indexPolicy === "index" ? "indexable" : "private-noindex";
  }
  return "none";
}

function publicCacheHeaders(cachePolicy) {
  if (cachePolicy === "evidence-sensitive") {
    return {
      browser: "public, max-age=0, s-maxage=60, must-revalidate",
      cdn: "max-age=60, must-revalidate",
    };
  }
  if (cachePolicy === "public-noindex") {
    return {
      browser: "public, max-age=0, s-maxage=300, must-revalidate",
      cdn: "max-age=300, must-revalidate",
    };
  }
  return {
    browser: "public, max-age=0, s-maxage=600, stale-while-revalidate=86400",
    cdn: "max-age=600, stale-while-revalidate=86400",
  };
}

export function finalizeResponse(request, response, policy) {
  const headers = new Headers(response.headers);
  headers.delete("x-robots-tag");

  const requestUrl = new URL(request.url);
  const hasSensitiveQuery = [...requestUrl.searchParams.keys()].some((key) =>
    SENSITIVE_QUERY_PARAMETERS.has(key.toLowerCase()),
  );
  const effectivePolicy =
    isPreviewHostname(requestUrl.hostname) || hasSensitiveQuery
      ? "private-noindex"
      : policy;
  const robotsDirectives = ROBOTS_DIRECTIVES[effectivePolicy];
  if (robotsDirectives) headers.set("x-robots-tag", robotsDirectives);

  if (requestUrl.protocol === "https:") {
    headers.set(
      "strict-transport-security",
      "max-age=31536000; includeSubDomains",
    );
  }
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("x-frame-options", "SAMEORIGIN");
  headers.set(
    "permissions-policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );

  const route = routeFor(routePath(requestUrl.pathname));
  const requestCarriesState =
    request.headers.has("cookie") || request.headers.has("authorization");
  const responseSetsState = headers.has("set-cookie");
  if (responseSetsState) headers.delete("set-cookie");

  if (
    effectivePolicy === "private-noindex" ||
    requestCarriesState ||
    responseSetsState ||
    route?.cachePolicy === "no-store"
  ) {
    headers.set("cache-control", "private, no-store");
    headers.delete("cdn-cache-control");
  } else if (
    ["indexable", "supporting-noindex"].includes(effectivePolicy) &&
    PUBLIC_READ_METHODS.has(request.method)
  ) {
    const cache = publicCacheHeaders(route?.cachePolicy);
    headers.set("cache-control", cache.browser);
    headers.set("cdn-cache-control", cache.cdn);
  }

  const body =
    request.method === "HEAD" || BODYLESS_STATUSES.has(response.status)
      ? null
      : response.body;

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function rejectedRequest(reason) {
  return new Response("Bad Request", {
    status: 400,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "private, no-store",
      "x-getgiffgaff-rejected": reason,
    },
  });
}

function methodNotAllowed() {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: {
      allow: "GET, HEAD",
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

export function preflightResponseFor(request) {
  const url = new URL(request.url);
  if (request.headers.has("authorization")) {
    return rejectedRequest("authorization");
  }
  if (/%(?:2f|5c|00)/i.test(url.pathname)) {
    return rejectedRequest("ambiguous-path");
  }
  const sensitiveKey = [...url.searchParams.keys()].find((key) =>
    SENSITIVE_QUERY_PARAMETERS.has(key.toLowerCase()),
  );
  return sensitiveKey ? rejectedRequest("sensitive-query") : null;
}

export function canonicalRedirectFor(request) {
  const original = new URL(request.url);
  const canonical = new URL(original.toString());
  let changed = false;

  if (canonical.hostname === "www.getgiffgaff.com") {
    canonical.hostname = "getgiffgaff.com";
    canonical.port = "";
    changed = true;
  }
  if (
    canonical.protocol === "http:" &&
    ["getgiffgaff.com", "www.getgiffgaff.com"].includes(original.hostname)
  ) {
    canonical.protocol = "https:";
    canonical.hostname = "getgiffgaff.com";
    canonical.port = "";
    changed = true;
  }

  const normalizedPath = routePath(canonical.pathname);
  if (normalizedPath !== canonical.pathname) {
    canonical.pathname = normalizedPath;
    changed = true;
  }
  if (canonical.search) {
    canonical.search = "";
    changed = true;
  }
  if (!changed) return null;

  return Response.redirect(
    canonical.toString(),
    PUBLIC_READ_METHODS.has(request.method) ? 301 : 308,
  );
}

function assetRequestFor(request, pathname) {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = pathname;
  assetUrl.search = "";
  const headers = new Headers(request.headers);
  headers.delete("authorization");
  headers.delete("cookie");
  return new Request(assetUrl.toString(), {
    method: request.method,
    headers,
  });
}

function rewrittenResponse(body, assetResponse, contentType, extraHeaders = {}) {
  const headers = new Headers(assetResponse.headers);
  for (const header of [
    "content-length",
    "content-encoding",
    "content-md5",
    "etag",
    "set-cookie",
  ]) {
    headers.delete(header);
  }
  headers.set("content-type", contentType);
  for (const [key, value] of Object.entries(extraHeaders)) headers.set(key, value);
  return new Response(body, {
    status: assetResponse.status,
    statusText: assetResponse.statusText,
    headers,
  });
}

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function defaultSitemapEntry(pathname) {
  const lastModified = routeFor(pathname)?.lastModified;
  const extras = lastModified
    ? `<lastmod>${escapeXml(lastModified)}</lastmod>`
    : "";
  return `<url><loc>${escapeXml(`${CANONICAL_ORIGIN}${pathname}`)}</loc>${extras}</url>`;
}

export function reconcileSitemap() {
  const entries = PUBLIC_INDEXABLE_PATHS.map(defaultSitemapEntry).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
}

function hashText(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function responseEtag(body) {
  return `W/\"${hashText(body)}-${new TextEncoder().encode(body).length}\"`;
}

function generatedResponse(
  request,
  body,
  { status = 200, contentType = "text/html; charset=utf-8", headers = {} } = {},
) {
  const byteLength = new TextEncoder().encode(body).length;
  return new Response(request.method === "HEAD" ? null : body, {
    status,
    headers: {
      "content-type": contentType,
      "content-length": String(byteLength),
      etag: responseEtag(body),
      ...headers,
    },
  });
}

function renderLlmsTxt(now = new Date()) {
  const routeLines = PUBLIC_INDEXABLE_PATHS.map(
    (pathname) => `- ${CANONICAL_ORIGIN}${pathname}`,
  );
  const claimLines = activeClaims(now)
    .map((claim) => claim.publicWording || claim.wording || claim.value)
    .filter((value) => typeof value === "string" && value.trim())
    .filter((value) => !/G2.*(?:购买|推荐)|10\s*[–-]\s*14/i.test(value))
    .map((value) => `- ${value.trim()}`);

  return `# getgiffgaff\n\n> Independent third-party Chinese-language information site. It is not giffgaff Limited's official website, support desk or authorised representative.\n\n## Public canonical pages\n${routeLines.join("\n")}\n${
    claimLines.length
      ? `\n## Current reviewed statements\n${claimLines.join("\n")}\n`
      : ""
  }\n## Boundaries\n- Commercial pages and G2 recommendations are paused pending written brand, supply and account-control evidence.\n- Carrier rules can change; follow the directly linked official sources on each guide.\n`;
}

function renderHoldPage(pathname) {
  const route = routeFor(pathname);
  const isCommerce =
    pathname.startsWith("/shop/") ||
    ["/shop/", "/guides/1-order/", "/guides/4-recharge-service/"].includes(
      pathname,
    );
  const title = isCommerce ? "交易页面暂停公开推广" : "内容证据复核中";
  const description = isCommerce
    ? "品牌、供货、账户控制权与经营资料通过发布门禁前，本页不提供新客交易或库存承诺。"
    : "本页缺少可复核的平台样本或当前政策证据，暂不作为搜索结果发布。";
  const canonical = `${CANONICAL_ORIGIN}${route?.canonicalPath || pathname}`;
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}｜getgiffgaff</title><meta name="description" content="${description}"><meta name="robots" content="noindex, follow, noarchive"><link rel="canonical" href="${canonical}"><meta property="og:url" content="${canonical}"><style>body{margin:0;color:#122019;background:#f7faf7;font-family:Inter,"Noto Sans SC","PingFang SC",system-ui,sans-serif}.skip-link{position:fixed;left:16px;top:12px;transform:translateY(-180%);background:#122019;color:#fff;padding:10px 14px}.skip-link:focus{transform:none}main{width:min(760px,calc(100% - 32px));margin:12vh auto;background:#fff;border:1px solid #dce7df;border-radius:18px;padding:32px;line-height:1.8}a{color:#2f5e41}h1{line-height:1.2}</style></head><body><a class="skip-link" href="#main-content">跳到主要内容</a><main id="main-content" tabindex="-1"><p>getgiffgaff · 独立第三方信息站</p><h1>${title}</h1><p>${description}</p><p><strong>当前状态：</strong>交易暂停；经营主体与相关授权待业务方确认。本站不是 giffgaff Limited 官方网站、官方客服或授权代表。</p><p>已有订单或使用问题可前往<a href="/contact/">联系与支持页</a>；信号与短信问题可查看<a href="/guides/4-signal/">排查指南</a>。</p></main></body></html>`;
}

function renderNotFound() {
  return "<!doctype html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>页面不存在｜getgiffgaff</title><meta name=\"robots\" content=\"noindex,nofollow,noarchive\"></head><body><main><h1>页面不存在</h1><p>这个地址没有公开内容。</p><p><a href=\"/\">返回首页</a></p></main></body></html>";
}

function evidenceRenderOptions(pathname, now = new Date()) {
  let articleAddon = "";
  if (pathname === "/guides/3-usage/") {
    articleAddon = renderKeepNumberTool(
      claimFor("retention.inactivity_window", now),
      { now },
    );
  } else if (pathname === "/guides/5-travel-data/") {
    articleAddon = renderRoamingCostTool(undefined);
  }
  return articleAddon
    ? {
        articleAddon,
        headAddon:
          '<link rel="stylesheet" href="/evidence-tools.css"><script type="module" src="/evidence-tools.js"></script>',
      }
    : {};
}

function isKnownPublicPath(pathname) {
  return Boolean(
    routeFor(pathname) ||
      GENERATED_PATHS.has(pathname) ||
      RETIRED_ASSET_PATHS.has(pathname) ||
      KNOWN_STATIC_ASSETS.has(pathname) ||
      LOCAL_HTML_ASSETS.has(pathname) ||
      pathname.startsWith("/og/"),
  );
}

async function localAssetResponse(request, env, pathname) {
  if (!env?.ASSETS) return null;
  const response = await env.ASSETS.fetch(assetRequestFor(request, pathname));
  return response.status >= 400 ? null : response;
}

async function routeRequest(request, env) {
  const url = new URL(request.url);
  if (!PUBLIC_READ_METHODS.has(request.method) && isKnownPublicPath(url.pathname)) {
    return methodNotAllowed();
  }

  if (url.pathname === "/sitemap.xml") {
    return generatedResponse(request, reconcileSitemap(), {
      contentType: "application/xml; charset=utf-8",
      headers: { "x-getgiffgaff-render-mode": "manifest-sitemap" },
    });
  }
  if (url.pathname === "/llms-full.txt") {
    return generatedResponse(request, "This expanded AI summary has been retired.\n", {
      status: 410,
      contentType: "text/plain; charset=utf-8",
      headers: { "x-getgiffgaff-render-mode": "retired-support-file" },
    });
  }
  if (url.pathname === "/llms.txt") {
    return generatedResponse(request, renderLlmsTxt(), {
      contentType: "text/plain; charset=utf-8",
      headers: { "x-getgiffgaff-render-mode": "manifest-llms" },
    });
  }
  if (RETIRED_ASSET_PATHS.has(url.pathname)) {
    return generatedResponse(request, "Retired asset\n", {
      status: 410,
      contentType: "text/plain; charset=utf-8",
      headers: { "x-getgiffgaff-render-mode": "retired-asset" },
    });
  }

  if (isTrustPage(url.pathname)) {
    return generatedResponse(request, renderTrustPage(url.pathname), {
      headers: { "x-getgiffgaff-render-mode": "local-trust-page" },
    });
  }
  if (isCorePage(url.pathname)) {
    return generatedResponse(
      request,
      renderCorePage(url.pathname, evidenceRenderOptions(url.pathname)),
      { headers: { "x-getgiffgaff-render-mode": "local-core-page" } },
    );
  }
  if (TUTORIAL_PATHS.has(url.pathname)) {
    return generatedResponse(
      request,
      renderTutorialPage(url.pathname, evidenceRenderOptions(url.pathname)),
      { headers: { "x-getgiffgaff-render-mode": "local-tutorial-page" } },
    );
  }

  const localHtmlAsset = LOCAL_HTML_ASSETS.get(url.pathname);
  if (localHtmlAsset) {
    const asset = await localAssetResponse(request, env, localHtmlAsset);
    if (asset) {
      return rewrittenResponse(asset.body, asset, "text/html; charset=utf-8", {
        "x-getgiffgaff-render-mode": "local-html-asset",
      });
    }
  }

  const manifestRoute = routeFor(url.pathname);
  if (manifestRoute?.indexPolicy === "noindex") {
    return generatedResponse(request, renderHoldPage(url.pathname), {
      headers: { "x-getgiffgaff-render-mode": "evidence-hold-page" },
    });
  }

  if (isPrivatePath(url.pathname) || url.pathname.startsWith("/_next/")) {
    return generatedResponse(request, renderNotFound(), { status: 404 });
  }

  if (PUBLIC_READ_METHODS.has(request.method) && env?.ASSETS) {
    const asset = await localAssetResponse(request, env, url.pathname);
    const contentType = asset?.headers.get("content-type") || "";
    if (asset && !contentType.toLowerCase().includes("text/html")) return asset;
  }

  return generatedResponse(request, renderNotFound(), { status: 404 });
}

function edgeCacheFor(request) {
  const url = new URL(request.url);
  const route = routeFor(url.pathname);
  if (
    request.method !== "GET" ||
    url.origin !== CANONICAL_ORIGIN ||
    url.search ||
    request.headers.has("authorization") ||
    request.headers.has("cookie") ||
    route?.indexPolicy !== "index"
  ) {
    return null;
  }
  return globalThis.caches?.default || null;
}

export function cacheVersionFor(pathname, now = new Date()) {
  const route = routeFor(routePath(pathname));
  const claimState = Object.values(CLAIM_REGISTRY).map((claim) => ({
    ...claim,
    currentlyPublic: claimFor(claim.claimId, now) !== null,
  }));
  return `${RENDER_SCHEMA_VERSION}-${hashText(
    JSON.stringify({ route, claimState }),
  )}`;
}

function cacheKeyFor(request, version) {
  const url = new URL(request.url);
  url.searchParams.set("__gg_cache_version", version);
  return new Request(url.toString(), { method: "GET" });
}

function withHeader(response, key, value) {
  const headers = new Headers(response.headers);
  headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env, context) {
    const preflight = preflightResponseFor(request);
    const redirect = preflight ? null : canonicalRedirectFor(request);
    const edgeCache = preflight || redirect ? null : edgeCacheFor(request);
    const url = new URL(request.url);
    const cacheVersion = edgeCache ? cacheVersionFor(url.pathname) : null;
    const cacheKey = edgeCache ? cacheKeyFor(request, cacheVersion) : null;

    if (edgeCache && cacheKey) {
      const cached = await edgeCache.match(cacheKey);
      if (
        cached?.headers.get("x-getgiffgaff-cache-version") === cacheVersion
      ) {
        const cachedPolicy = policyFor(
          url.pathname,
          cached.status,
          cached.headers.get("content-type") || "",
        );
        return withHeader(
          finalizeResponse(request, cached, cachedPolicy),
          "x-getgiffgaff-cache",
          "HIT",
        );
      }
    }

    let response;
    try {
      response = preflight || redirect || (await routeRequest(request, env));
    } catch {
      response = new Response("Local rendering error", {
        status: 500,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "x-getgiffgaff-error": "local-render-failure",
        },
      });
    }

    const policy = policyFor(
      url.pathname,
      response.status,
      response.headers.get("content-type") || "",
    );
    let finalized = finalizeResponse(request, response, policy);
    if (cacheVersion) {
      finalized = withHeader(
        finalized,
        "x-getgiffgaff-cache-version",
        cacheVersion,
      );
    }

    if (
      edgeCache &&
      cacheKey &&
      finalized.status === 200 &&
      /\bpublic\b/i.test(finalized.headers.get("cache-control") || "")
    ) {
      const cacheWrite = edgeCache.put(cacheKey, finalized.clone());
      if (context?.waitUntil) context.waitUntil(cacheWrite);
      else await cacheWrite;
    }

    return finalized;
  },
};
