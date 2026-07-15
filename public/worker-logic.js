import { renderTutorialPage, TUTORIAL_PAGES } from "./tutorial-pages.js";

export const HOTFIX_ORIGIN = "https://3c237a37.getgiffgaff.pages.dev";
export const CANONICAL_ORIGIN = "https://getgiffgaff.com";

export const PUBLIC_INDEXABLE_PATHS = Object.freeze([
  "/",
  "/answers/",
  "/shop/",
  "/shop/giffgaff-g0/",
  "/shop/giffgaff-g2/",
  "/guides/",
  "/guides/0-intro/",
  "/guides/1-order/",
  "/guides/2-activate/",
  "/guides/3-account/",
  "/guides/3-app/",
  "/guides/3-usage/",
  "/guides/4-recharge-service/",
  "/guides/4-signal/",
  "/guides/5-travel-data/",
  "/more/",
  "/more/00-wechat/",
  "/more/02-telegram/",
  "/more/03-esim/",
  "/more/04-esim-qrcode/",
  "/qa/",
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
  "/contact/",
  "/guides/6-pitfalls/",
  "/research/",
]);

const PUBLIC_INDEXABLE_SET = new Set(PUBLIC_INDEXABLE_PATHS);
const SUPPORTING_NOINDEX_PATHS = new Set([
  "/llms.txt",
  "/llms-full.txt",
  "/privacy/",
  "/terms/",
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

const ROBOTS_DIRECTIVES = Object.freeze({
  indexable: "index, follow, max-snippet:-1, max-image-preview:large",
  "supporting-noindex": "noindex, follow, noarchive",
  "private-noindex": "noindex, nofollow, noarchive",
});

const CONTACT_PATHS = new Set(["/contact", "/contact/"]);
const CONTACT_TITLE = "联系 getgiffgaff｜G0/G2 库存、下单与售后支持";
const CONTACT_DESCRIPTION =
  "联系 getgiffgaff，咨询 G0/G2 库存、下单、发货与订单售后；请准备订单号、SKU 和问题截图。本站为独立第三方服务站。";
const CONTACT_OG_IMAGE = `${CANONICAL_ORIGIN}/contact/getgiffgaff-contact-og.png`;
const KTT_MODAL_ID = "ktt-giga-card";
const KTT_IMAGE_PATH = "/contact/ktt-giga-card.png";
const KTT_OG_IMAGE_PATH = "/contact/getgiffgaff-contact-og.png";
const BUTTON_TARGET = `#${KTT_MODAL_ID}`;
const PITFALLS_PATH = "/guides/6-pitfalls/";
const PITFALLS_ASSET_PATH = "/guides/6-pitfalls-page.txt";
const RESEARCH_PATH = "/research/";
const RESEARCH_ASSET_PATH = "/research/index-page.txt";
const TUTORIAL_PATHS = new Set(Object.keys(TUTORIAL_PAGES));
const LOCALLY_MANAGED_INDEXABLE_PATHS = new Set([
  PITFALLS_PATH,
  RESEARCH_PATH,
  ...TUTORIAL_PATHS,
]);
const LOCAL_ASSET_PATHS = new Set([KTT_IMAGE_PATH, KTT_OG_IMAGE_PATH, "/robots.txt"]);
const PUBLIC_READ_METHODS = new Set(["GET", "HEAD"]);
const BODYLESS_STATUSES = new Set([101, 204, 205, 304]);
const SENSITIVE_QUERY_PARAMETERS = new Set([
  "access_token",
  "auth",
  "authorization",
  "code",
  "email",
  "key",
  "mobile",
  "order",
  "order_id",
  "pass",
  "password",
  "phone",
  "secret",
  "session",
  "session_id",
  "token",
]);

const PITFALLS_NAV_ITEM =
  '<li><a href="/guides/6-pitfalls/">giffgaff 使用教程和避坑清单</a></li>';
const PITFALLS_DOC_LIST_ITEM = `<a class="doc-list-item" href="/guides/6-pitfalls/"><span>giffgaff 使用教程和避坑清单</span><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg></a>`;
const TUTORIAL_DIRECTORY_BLOCK = `<section id="evidence-led-guides" class="doc-section" aria-labelledby="evidence-led-guides-title"><h2 id="evidence-led-guides-title">证据型专题教程</h2><p>每篇都列出官方来源、适用边界、复核日期和修订记录。</p><div class="doc-list">${Object.entries(
  TUTORIAL_PAGES,
)
  .map(
    ([pathname, page]) =>
      `<a class="doc-list-item" href="${pathname}"><span>${page.headline}</span><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg></a>`,
  )
  .join("")}</div></section>`;

function routePath(pathname) {
  if (pathname === "/") return pathname;
  if (PUBLIC_INDEXABLE_SET.has(pathname)) return pathname;
  if (SUPPORTING_NOINDEX_PATHS.has(pathname)) return pathname;

  const withSlash = `${pathname}/`;
  if (PUBLIC_INDEXABLE_SET.has(withSlash) || SUPPORTING_NOINDEX_PATHS.has(withSlash)) {
    return withSlash;
  }

  return pathname;
}

function matchesRoutePrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function policyFor(pathname, status, contentType = "") {
  const normalizedPath = routePath(pathname);
  const normalizedType = contentType.toLowerCase();

  if (status >= 400) return "private-noindex";
  if (SUPPORTING_NOINDEX_PATHS.has(normalizedPath)) return "supporting-noindex";
  if (PRIVATE_ROUTE_PREFIXES.some((prefix) => matchesRoutePrefix(pathname, prefix))) {
    return "private-noindex";
  }
  if (status >= 200 && status < 300 && normalizedType.includes("text/html")) {
    return PUBLIC_INDEXABLE_SET.has(normalizedPath)
      ? "indexable"
      : "private-noindex";
  }

  return "none";
}

function isPreviewHostname(hostname) {
  return hostname === "pages.dev" || hostname.endsWith(".pages.dev");
}

export function finalizeResponse(request, upstream, policy) {
  const headers = new Headers(upstream.headers);
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

  if (robotsDirectives) {
    headers.set("x-robots-tag", robotsDirectives);
  }

  if (effectivePolicy === "indexable" && ["GET", "HEAD"].includes(request.method)) {
    if (headers.has("set-cookie")) {
      headers.set("cache-control", "private, no-store");
    } else {
      headers.set(
        "cache-control",
        "public, max-age=0, s-maxage=600, stale-while-revalidate=86400",
      );
    }
  } else if (effectivePolicy === "private-noindex") {
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

  if (!changed) return null;

  return Response.redirect(
    canonical.toString(),
    ["GET", "HEAD"].includes(request.method) ? 301 : 308,
  );
}

function upstreamRequestFor(request) {
  const requestUrl = new URL(request.url);
  const upstreamUrl = new URL(requestUrl.pathname + requestUrl.search, HOTFIX_ORIGIN);
  return new Request(upstreamUrl.toString(), request);
}

function assetRequestFor(request, pathname) {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = pathname;
  assetUrl.search = "";
  return new Request(assetUrl.toString(), request);
}

function rewrittenResponse(body, upstreamResponse, contentType, extraHeaders = {}) {
  const headers = new Headers(upstreamResponse.headers);
  for (const header of [
    "content-length",
    "content-encoding",
    "content-md5",
    "etag",
  ]) {
    headers.delete(header);
  }
  headers.set("content-type", contentType);

  for (const [key, value] of Object.entries(extraHeaders)) {
    headers.set(key, value);
  }

  return new Response(body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers,
  });
}

function htmlResponse(html, upstreamResponse, extraHeaders = {}) {
  return rewrittenResponse(
    html,
    upstreamResponse,
    "text/html; charset=utf-8",
    extraHeaders,
  );
}

function replaceAnchorHrefNearLabel(html, label, target) {
  const labelIndex = html.indexOf(label);
  if (labelIndex === -1) return html;

  const anchorStart = html.lastIndexOf("<a ", labelIndex);
  const anchorEnd = html.indexOf("</a>", labelIndex);
  if (anchorStart === -1 || anchorEnd === -1 || anchorEnd < labelIndex) return html;

  const before = html.slice(0, anchorStart);
  const anchor = html.slice(anchorStart, anchorEnd + 4);
  const after = html.slice(anchorEnd + 4);
  const updatedAnchor = anchor
    .replace(/\saria-haspopup="[^"]*"/, "")
    .replace(/\shref="[^"]*"/, ` href="${target}" aria-haspopup="dialog"`);

  return `${before}${updatedAnchor}${after}`;
}

function normalizeXiaoyuLabel(html) {
  return html.replace(/>小玉</g, ">客服小玉<").replace(/小玉客服/g, "客服小玉");
}

function upsertHeadTag(html, matcher, markup) {
  if (matcher.test(html)) return html.replace(matcher, markup);
  if (html.includes("</head>")) return html.replace("</head>", `${markup}</head>`);
  return html;
}

function removeMetaKeywords(html) {
  return html.replace(
    /<meta\b(?=[^>]*\bname\s*=\s*["']keywords["'])[^>]*>\s*/gi,
    "",
  );
}

function setCanonical(html, canonicalUrl) {
  return upsertHeadTag(
    html,
    /<link\b(?=[^>]*\brel\s*=\s*["'][^"']*\bcanonical\b[^"']*["'])[^>]*>/i,
    `<link rel="canonical" href="${canonicalUrl}">`,
  );
}

function setMetaByName(html, name, content) {
  const matcher = new RegExp(
    `<meta\\b(?=[^>]*\\bname\\s*=\\s*["']${name}["'])[^>]*>`,
    "i",
  );
  return upsertHeadTag(html, matcher, `<meta name="${name}" content="${content}">`);
}

function setMetaByProperty(html, property, content) {
  const escapedProperty = property.replace(":", "\\:");
  const matcher = new RegExp(
    `<meta\\b(?=[^>]*\\bproperty\\s*=\\s*["']${escapedProperty}["'])[^>]*>`,
    "i",
  );
  return upsertHeadTag(
    html,
    matcher,
    `<meta property="${property}" content="${content}">`,
  );
}

function setDocumentTitle(html, title) {
  if (/<title\b[^>]*>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  }
  if (html.includes("</head>")) return html.replace("</head>", `<title>${title}</title></head>`);
  return html;
}

function injectBeforeClosingTag(html, tagName, markup) {
  const closingTag = `</${tagName}>`;
  if (!html.includes(closingTag)) return html;
  return html.replace(closingTag, `${markup}${closingTag}`);
}

function removeNanoBananaLinks(html) {
  let rewritten = html.replace(
    /<p\b[^>]*class=["'][^"']*footer-contact[^"']*["'][^>]*>\s*AI\s*订阅购买：[\s\S]*?<\/p>/gi,
    "",
  );
  rewritten = rewritten.replace(
    /<a\b(?=[^>]*href=["'][^"']*nano-banana[^"']*["'])[^>]*>[\s\S]*?<\/a>/gi,
    "",
  );
  return rewritten;
}

function schemaTypes(value) {
  const types = Array.isArray(value?.["@type"])
    ? value["@type"]
    : [value?.["@type"]];
  return new Set(types.filter((type) => typeof type === "string"));
}

function belongsToCanonicalSite(value) {
  try {
    return new URL(value || CANONICAL_ORIGIN, CANONICAL_ORIGIN).origin === CANONICAL_ORIGIN;
  } catch {
    return false;
  }
}

function sanitizeStructuredDataValue(value) {
  if (Array.isArray(value)) return value.map(sanitizeStructuredDataValue);
  if (!value || typeof value !== "object") return value;

  const types = schemaTypes(value);
  const sanitized = {};
  const unsupportedEvidenceKeys = new Set([
    "aggregateRating",
    "offers",
    "review",
    "reviews",
  ]);
  const unsupportedOfferKeys = new Set([
    "availability",
    "inventoryLevel",
    "price",
    "priceCurrency",
    "priceSpecification",
    "priceValidUntil",
  ]);

  for (const [key, entry] of Object.entries(value)) {
    if (unsupportedEvidenceKeys.has(key)) continue;
    if (types.has("Offer") && unsupportedOfferKeys.has(key)) continue;
    sanitized[key] = sanitizeStructuredDataValue(entry);
  }

  if (
    types.has("Organization") &&
    String(sanitized.name || "").toLowerCase() === "getgiffgaff"
  ) {
    sanitized["@id"] ||= `${CANONICAL_ORIGIN}/#organization`;
    sanitized.url = `${CANONICAL_ORIGIN}/`;
  }
  if (types.has("WebSite") && belongsToCanonicalSite(sanitized.url)) {
    sanitized["@id"] ||= `${CANONICAL_ORIGIN}/#website`;
    sanitized.url = `${CANONICAL_ORIGIN}/`;
    sanitized.publisher = { "@id": `${CANONICAL_ORIGIN}/#organization` };
  }
  if (
    types.has("Brand") &&
    String(sanitized.name || "").toLowerCase() === "giffgaff"
  ) {
    sanitized["@id"] ||= "https://www.giffgaff.com/#brand";
    sanitized.url ||= "https://www.giffgaff.com/";
  }

  return sanitized;
}

function sanitizeStructuredDataHtml(html) {
  return html.replace(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
    (script, attributes, source) => {
      if (!/\btype\s*=\s*["']application\/ld\+json(?:;[^"']*)?["']/i.test(attributes)) {
        return script;
      }

      try {
        const sanitized = sanitizeStructuredDataValue(JSON.parse(source));
        return `<script${attributes}>${JSON.stringify(sanitized).replace(/</g, "\\u003c")}</script>`;
      } catch {
        return script;
      }
    },
  );
}

function globalBrandCleanupScript(canonicalUrl) {
  return `<script id="getgiffgaff-brand-cleanup">
(() => {
  const blockedHostPart = ["nano", "banana"].join("-");
  const canonicalUrl = ${JSON.stringify(canonicalUrl)};
  const unsupportedEvidenceKeys = new Set(["aggregateRating", "offers", "review", "reviews"]);
  const unsupportedOfferKeys = new Set(["availability", "inventoryLevel", "price", "priceCurrency", "priceSpecification", "priceValidUntil"]);
  const sanitizeSchemaValue = (value) => {
    if (Array.isArray(value)) return value.map(sanitizeSchemaValue);
    if (!value || typeof value !== "object") return value;
    const rawTypes = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
    const isOffer = rawTypes.includes("Offer");
    const sanitized = {};
    for (const [key, entry] of Object.entries(value)) {
      if (unsupportedEvidenceKeys.has(key)) continue;
      if (isOffer && unsupportedOfferKeys.has(key)) continue;
      sanitized[key] = sanitizeSchemaValue(entry);
    }
    return sanitized;
  };
  const enforceEdgeMetadata = () => {
    for (const link of document.querySelectorAll("a[href]")) {
      if (!link.getAttribute("href").includes(blockedHostPart)) continue;
      const footerLine = link.closest("p.footer-contact");
      (footerLine || link).remove();
    }
    for (const keywords of document.querySelectorAll('meta[name="keywords" i]')) {
      keywords.remove();
    }
    const canonical = document.querySelector('link[rel="canonical" i]');
    if (canonical && canonical.getAttribute("href") !== canonicalUrl) {
      canonical.setAttribute("href", canonicalUrl);
    }
    const openGraphUrl = document.querySelector('meta[property="og:url" i]');
    if (openGraphUrl && openGraphUrl.getAttribute("content") !== canonicalUrl) {
      openGraphUrl.setAttribute("content", canonicalUrl);
    }
    for (const script of document.querySelectorAll('script[type="application/ld+json" i]')) {
      try {
        const sanitized = JSON.stringify(sanitizeSchemaValue(JSON.parse(script.textContent)));
        if (script.textContent.trim() !== sanitized) script.textContent = sanitized;
      } catch {}
    }
  };
  enforceEdgeMetadata();
  new MutationObserver(enforceEdgeMetadata).observe(document.documentElement, {
    attributes: true,
    childList: true,
    subtree: true,
  });
})();
</script>`;
}

function rewriteGlobalSeoHtml(html, pathname) {
  const canonicalPath = routePath(pathname);
  const canonicalUrl = `${CANONICAL_ORIGIN}${canonicalPath}`;
  let rewritten = removeMetaKeywords(html)
    .replace(/giffgaff\s*官方教程/g, "giffgaff 独立第三方教程")
    .replace(/getgiffgaff\s*官网/g, "getgiffgaff 独立服务站");

  rewritten = removeNanoBananaLinks(rewritten);
  rewritten = sanitizeStructuredDataHtml(rewritten);
  rewritten = setCanonical(rewritten, canonicalUrl);
  rewritten = setMetaByProperty(rewritten, "og:url", canonicalUrl);
  rewritten = setMetaByName(
    rewritten,
    "robots",
    "index, follow, max-snippet:-1, max-image-preview:large",
  );

  if (!rewritten.includes('id="getgiffgaff-brand-cleanup"')) {
    rewritten = injectBeforeClosingTag(
      rewritten,
      "body",
      globalBrandCleanupScript(canonicalUrl),
    );
  }

  return rewritten;
}

function contactEntityGraphMarkup() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${CANONICAL_ORIGIN}/#organization`,
        name: "getgiffgaff",
        url: `${CANONICAL_ORIGIN}/`,
        description: "面向中文用户提供购买沟通与使用信息的独立第三方服务站。",
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          url: `${CANONICAL_ORIGIN}/contact/`,
          availableLanguage: ["zh-CN"],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${CANONICAL_ORIGIN}/#website`,
        name: "getgiffgaff",
        url: `${CANONICAL_ORIGIN}/`,
        publisher: { "@id": `${CANONICAL_ORIGIN}/#organization` },
        inLanguage: "zh-CN",
      },
      {
        "@type": "Brand",
        "@id": "https://www.giffgaff.com/#brand",
        name: "giffgaff",
        url: "https://www.giffgaff.com/",
      },
      {
        "@type": "ContactPage",
        "@id": `${CANONICAL_ORIGIN}/contact/#webpage`,
        name: CONTACT_TITLE,
        url: `${CANONICAL_ORIGIN}/contact/`,
        description: CONTACT_DESCRIPTION,
        isPartOf: { "@id": `${CANONICAL_ORIGIN}/#website` },
        mainEntity: { "@id": `${CANONICAL_ORIGIN}/#organization` },
        about: { "@id": "https://www.giffgaff.com/#brand" },
        inLanguage: "zh-CN",
      },
    ],
  };

  return `<script id="getgiffgaff-contact-entities" type="application/ld+json">${JSON.stringify(
    graph,
  ).replace(/</g, "\\u003c")}</script>`;
}

function contactSupportScopeMarkup() {
  return `
<section class="contact-support-scope" id="contact-support-scope" aria-labelledby="contact-support-scope-title">
  <h2 id="contact-support-scope-title">独立第三方身份与支持范围</h2>
  <p><strong>getgiffgaff 是独立第三方服务站，非 giffgaff Limited 官方网站、官方客服或授权代表。</strong></p>
  <div class="contact-support-scope-grid">
    <section>
      <h2>可以协助的问题</h2>
      <p>G0/G2 库存与下单前确认、本站订单和发货沟通，以及已购订单的激活、充值、信号和短信问题初步排查。</p>
    </section>
    <section>
      <h2>无法处理或承诺的事项</h2>
      <p>无法处理运营商账户权限、号码状态或网络控制，也不能承诺长期保号、任何平台验证码送达或即时回复。</p>
    </section>
  </div>
  <p><strong>联系渠道：</strong>微信客服“客服小玉”，二维码见本页；当前未公布固定在线时段，请以会话中的实际回复为准。</p>
  <p><strong>咨询资料：</strong>请准备订单号、SKU、卡片类型、问题截图和已经尝试过的步骤。请勿发送账户密码、短信验证码或完整支付卡信息。</p>
  <p><strong>升级路径：</strong>本站订单问题继续通过本页沟通；运营商账户、计费或安全问题请前往 <a href="https://help.giffgaff.com/" target="_blank" rel="noopener noreferrer">giffgaff 官方帮助中心</a>。</p>
</section>`;
}

function contactSupportStyles() {
  return `<style id="contact-support-scope-style">
  .contact-support-scope {
    margin: 22px 0;
    border: 1px solid rgba(47, 94, 65, 0.2);
    border-radius: 16px;
    background: #f6faf6;
    padding: 20px;
  }
  .contact-support-scope > h2 { margin-top: 0; }
  .contact-support-scope-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    margin: 16px 0;
  }
  .contact-support-scope-grid section {
    border-radius: 12px;
    background: #fff;
    padding: 16px;
  }
  .contact-support-scope-grid h2 { margin: 0 0 8px; font-size: 18px; }
  @media (max-width: 680px) {
    .contact-support-scope-grid { grid-template-columns: 1fr; }
  }
</style>`;
}

function kttModalMarkup() {
  return `
<style id="${KTT_MODAL_ID}-style">
  #${KTT_MODAL_ID} {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(17, 24, 39, 0.54);
  }
  #${KTT_MODAL_ID}:target { display: flex; }
  .ktt-modal-backdrop { position: absolute; inset: 0; }
  .ktt-modal-panel {
    position: relative;
    width: min(440px, 100%);
    max-height: min(720px, calc(100vh - 40px));
    overflow: auto;
    border: 1px solid rgba(47, 94, 65, 0.2);
    border-radius: 18px;
    background: #fff;
    box-shadow: 0 28px 70px rgba(12, 31, 23, 0.24);
    padding: 24px;
    color: #1f2933;
    outline: none;
  }
  .ktt-modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    padding: 0 12px;
    border: 1px solid rgba(47, 94, 65, 0.18);
    border-radius: 999px;
    color: #2f5e41;
    background: #f4f8f4;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
  }
  .ktt-modal-eyebrow { margin: 0 0 8px; color: #2f5e41; font-size: 14px; font-weight: 800; }
  .ktt-modal-title { margin: 0 56px 10px 0; color: #111827; font-size: 28px; line-height: 1.22; }
  .ktt-modal-copy { margin: 0 0 18px; color: #5f6b63; font-size: 16px; line-height: 1.75; }
  .ktt-modal-qr {
    display: block;
    width: min(320px, 100%);
    height: auto;
    margin: 0 auto;
    border: 1px solid #e7eee8;
    border-radius: 14px;
    background: #fff;
  }
  .ktt-modal-note {
    margin: 14px 0 0;
    border-radius: 12px;
    background: #eef7ef;
    padding: 12px 14px;
    color: #2f5e41;
    font-size: 15px;
    font-weight: 800;
    text-align: center;
  }
  @media (max-width: 640px) {
    #${KTT_MODAL_ID} { align-items: flex-end; padding: 14px; }
    .ktt-modal-panel { border-radius: 18px 18px 14px 14px; padding: 22px 18px 18px; }
    .ktt-modal-title { font-size: 24px; }
  }
</style>
<section id="${KTT_MODAL_ID}" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="${KTT_MODAL_ID}-title" aria-describedby="${KTT_MODAL_ID}-description">
  <a class="ktt-modal-backdrop" href="#" tabindex="-1" aria-label="关闭快团团入口"></a>
  <div class="ktt-modal-panel" tabindex="-1">
    <a class="ktt-modal-close" href="#" aria-label="关闭快团团入口">关闭</a>
    <p class="ktt-modal-eyebrow">快团团下单</p>
    <h2 class="ktt-modal-title" id="${KTT_MODAL_ID}-title">进入 Giga卡快团团店铺</h2>
    <p class="ktt-modal-copy" id="${KTT_MODAL_ID}-description">点 G0/G2 后，先在快团团确认库存、余额范围和发货方式；付款或售后问题找客服小玉。</p>
    <img class="ktt-modal-qr" src="${KTT_IMAGE_PATH}" alt="Giga卡快团团小程序码" width="720" height="540" loading="lazy" decoding="async">
    <p class="ktt-modal-note">长按识别小程序码，进店确认库存</p>
  </div>
</section>
<script id="${KTT_MODAL_ID}-a11y">
(() => {
  const modalId = "${KTT_MODAL_ID}";
  const modal = document.getElementById(modalId);
  if (!modal) return;
  const panel = modal.querySelector(".ktt-modal-panel");
  let returnFocus = null;

  const isOpen = () => window.location.hash === "#" + modalId;
  const syncModal = () => {
    modal.setAttribute("aria-hidden", String(!isOpen()));
    if (isOpen()) window.requestAnimationFrame(() => panel.focus());
  };
  const closeModal = () => {
    history.replaceState(null, "", window.location.pathname + window.location.search);
    modal.setAttribute("aria-hidden", "true");
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus();
  };

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest('a[href="#' + modalId + '"]');
    if (trigger) {
      returnFocus = document.activeElement;
      window.requestAnimationFrame(syncModal);
      return;
    }
    if (event.target.closest(".ktt-modal-close, .ktt-modal-backdrop")) {
      event.preventDefault();
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!isOpen()) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...modal.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')];
    if (!focusable.length) {
      event.preventDefault();
      panel.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener("hashchange", syncModal);
  syncModal();
})();
</script>`;
}

function repairNestedMainLandmarks(html) {
  const stack = [];
  let cursor = 0;
  let result = "";
  const tagPattern = /<\/?main\b[^>]*>/gi;

  for (const match of html.matchAll(tagPattern)) {
    result += html.slice(cursor, match.index);
    const tag = match[0];
    const isClosing = /^<\//.test(tag);

    if (!isClosing) {
      const replaceWithDiv = stack.length > 0;
      stack.push(replaceWithDiv);
      result += replaceWithDiv ? tag.replace(/^<main/i, "<div") : tag;
    } else {
      const replacedWithDiv = stack.pop() ?? false;
      result += replacedWithDiv ? "</div>" : tag;
    }

    cursor = match.index + tag.length;
  }

  return result + html.slice(cursor);
}

function stripContactNextHydration(html) {
  let rewritten = html.replace(
    /<link\b(?=[^>]*\brel=["'](?:preload|modulepreload)["'])(?=[^>]*\bhref=["']\/_next\/[^"']*["'])[^>]*>\s*/gi,
    "",
  );

  rewritten = rewritten.replace(
    /<script\b([^>]*)>([\s\S]*?)<\/script>\s*/gi,
    (script, attributes, body) => {
      const source = attributes.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1] || "";
      const isNextRuntime = source.startsWith("/_next/");
      const isNextFlightPayload = /(?:self\.)?__next_(?:f|s|require|router)\b/.test(body);
      return isNextRuntime || isNextFlightPayload ? "" : script;
    },
  );

  return rewritten;
}

function rewriteContactHead(html) {
  let rewritten = setDocumentTitle(html, CONTACT_TITLE);
  rewritten = setMetaByName(rewritten, "description", CONTACT_DESCRIPTION);
  rewritten = setMetaByProperty(rewritten, "og:title", CONTACT_TITLE);
  rewritten = setMetaByProperty(rewritten, "og:description", CONTACT_DESCRIPTION);
  rewritten = setMetaByProperty(rewritten, "og:url", `${CANONICAL_ORIGIN}/contact/`);
  rewritten = setMetaByProperty(rewritten, "og:type", "website");
  rewritten = setMetaByProperty(rewritten, "og:locale", "zh_CN");
  rewritten = setMetaByProperty(rewritten, "og:image", CONTACT_OG_IMAGE);
  rewritten = setMetaByProperty(rewritten, "og:image:width", "1200");
  rewritten = setMetaByProperty(rewritten, "og:image:height", "630");
  rewritten = setMetaByName(rewritten, "twitter:card", "summary_large_image");
  rewritten = setMetaByName(rewritten, "twitter:title", CONTACT_TITLE);
  rewritten = setMetaByName(rewritten, "twitter:description", CONTACT_DESCRIPTION);
  rewritten = setMetaByName(rewritten, "twitter:image", CONTACT_OG_IMAGE);

  if (!rewritten.includes('id="getgiffgaff-contact-entities"')) {
    rewritten = injectBeforeClosingTag(rewritten, "head", contactEntityGraphMarkup());
  }

  return rewritten;
}

export function rewriteContactHtml(html) {
  let rewritten = normalizeXiaoyuLabel(html);
  rewritten = rewriteContactHead(rewritten);
  rewritten = rewritten
    .replace(/<p\b([^>]*)class=["']doc-kicker["']([^>]*)>[^<]*<\/p>/i, '<p$1class="doc-kicker"$2>giffgaff 独立第三方教程</p>')
    .replace(/<h1\b[^>]*>\s*联系我\s*<\/h1>/i, `<h1>联系 getgiffgaff：库存、下单与售后支持</h1>`)
    .replace(/<h3\b([^>]*)>/gi, "<h2$1>")
    .replace(/<\/h3>/gi, "</h2>");

  if (!rewritten.includes('id="contact-support-scope"')) {
    rewritten = rewritten.replace(
      /(<h1\b[^>]*>联系 getgiffgaff：库存、下单与售后支持<\/h1>)/i,
      `$1${contactSupportStyles()}${contactSupportScopeMarkup()}`,
    );
  }

  for (const label of ["确认 G0 库存", "确认 G2 库存"]) {
    rewritten = replaceAnchorHrefNearLabel(rewritten, label, BUTTON_TARGET);
  }

  rewritten = repairNestedMainLandmarks(rewritten);
  // The upstream Next.js Flight payload still contains the legacy Contact tree.
  // Until this page is merged into the real Next.js source, keep Contact as a
  // static edge-rendered page so hydration cannot restore misleading metadata
  // or remove the independently reviewed support disclosure.
  rewritten = stripContactNextHydration(rewritten);

  if (rewritten.includes(`id="${KTT_MODAL_ID}"`)) return rewritten;

  return injectBeforeClosingTag(rewritten, "body", kttModalMarkup());
}

function injectPitfallsGuideLinks(html) {
  let rewritten = html;
  if (!rewritten.includes('href="/guides/6-pitfalls/"')) {
    rewritten = rewritten.replace(
      /(<li><a(?: aria-current="page")? href="\/guides\/5-travel-data\/">giffgaff 旅行流量包使用指南<\/a><\/li>)/g,
      `$1${PITFALLS_NAV_ITEM}`,
    );

    rewritten = rewritten.replace(
      /(<a class="doc-list-item" href="\/guides\/5-travel-data\/">[\s\S]*?<\/a>)/g,
      `$1${PITFALLS_DOC_LIST_ITEM}`,
    );
  }

  if (!rewritten.includes('id="evidence-led-guides"')) {
    rewritten = injectBeforeClosingTag(rewritten, "main", TUTORIAL_DIRECTORY_BLOCK);
  }

  return rewritten
    .replace(/>9 篇教程</g, ">10 篇教程<")
    .replace(/\[9," 篇教程"\]/g, '[10," 篇教程"]');
}

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function defaultSitemapEntry(pathname) {
  const extras =
    pathname === PITFALLS_PATH
      ? "<lastmod>2026-07-15T00:00:00.000Z</lastmod><changefreq>monthly</changefreq><priority>0.78</priority>"
      : pathname === RESEARCH_PATH
        ? "<lastmod>2026-07-15T00:00:00.000Z</lastmod><changefreq>monthly</changefreq><priority>0.7</priority>"
        : TUTORIAL_PATHS.has(pathname)
          ? "<lastmod>2026-07-15T00:00:00.000Z</lastmod><changefreq>monthly</changefreq><priority>0.8</priority>"
        : "";
  return `<url><loc>${escapeXml(`${CANONICAL_ORIGIN}${pathname}`)}</loc>${extras}</url>`;
}

export function reconcileSitemap(xml) {
  const existingEntries = new Map();
  for (const match of xml.matchAll(/<url\b[^>]*>[\s\S]*?<\/url>/gi)) {
    const location = match[0].match(/<loc\b[^>]*>([\s\S]*?)<\/loc>/i)?.[1]?.trim();
    if (!location) continue;
    try {
      const url = new URL(location.replace(/&amp;/g, "&"));
      if (url.origin !== CANONICAL_ORIGIN || !PUBLIC_INDEXABLE_SET.has(url.pathname)) continue;
      if (!existingEntries.has(url.pathname)) {
        const canonicalLocation = escapeXml(`${CANONICAL_ORIGIN}${url.pathname}`);
        const canonicalEntry = match[0].replace(
          /<loc\b[^>]*>[\s\S]*?<\/loc>/i,
          `<loc>${canonicalLocation}</loc>`,
        );
        existingEntries.set(url.pathname, canonicalEntry);
      }
    } catch {
      // Invalid upstream entries are intentionally dropped from the production sitemap.
    }
  }

  const entries = PUBLIC_INDEXABLE_PATHS.map((pathname) =>
    LOCALLY_MANAGED_INDEXABLE_PATHS.has(pathname)
      ? defaultSitemapEntry(pathname)
      : existingEntries.get(pathname) || defaultSitemapEntry(pathname),
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
}

function shouldRewriteHtmlPath(pathname) {
  return PUBLIC_INDEXABLE_SET.has(routePath(pathname));
}

async function routeRequest(request, env) {
  const url = new URL(request.url);

  if (TUTORIAL_PATHS.has(url.pathname)) {
    if (!PUBLIC_READ_METHODS.has(request.method)) {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: {
          allow: "GET, HEAD",
          "content-type": "text/plain; charset=utf-8",
        },
      });
    }
    const html = renderTutorialPage(url.pathname);
    return new Response(request.method === "HEAD" ? null : html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "x-getgiffgaff-hotfix": "tutorial-library",
        "x-getgiffgaff-render-mode": "edge-static-tutorial",
      },
    });
  }

  if (LOCAL_ASSET_PATHS.has(url.pathname) && env?.ASSETS) {
    return env.ASSETS.fetch(assetRequestFor(request, url.pathname));
  }

  if (url.pathname === PITFALLS_PATH && env?.ASSETS) {
    const response = await env.ASSETS.fetch(assetRequestFor(request, PITFALLS_ASSET_PATH));
    if (request.method === "GET" && response.status === 200) {
      const html = rewriteGlobalSeoHtml(await response.text(), PITFALLS_PATH);
      return htmlResponse(html, response, {
        "x-getgiffgaff-hotfix": "pitfalls-guide",
      });
    }
    return rewrittenResponse(response.body, response, "text/html; charset=utf-8", {
      "x-getgiffgaff-hotfix": "pitfalls-guide",
    });
  }

  if (url.pathname === RESEARCH_PATH && env?.ASSETS) {
    const response = await env.ASSETS.fetch(assetRequestFor(request, RESEARCH_ASSET_PATH));
    if (request.method === "GET" && response.status === 200) {
      const html = rewriteGlobalSeoHtml(await response.text(), RESEARCH_PATH);
      return htmlResponse(html, response, {
        "x-getgiffgaff-hotfix": "research-hub",
      });
    }
    return rewrittenResponse(response.body, response, "text/html; charset=utf-8", {
      "x-getgiffgaff-hotfix": "research-hub",
    });
  }

  const upstreamResponse = await fetch(upstreamRequestFor(request));
  const contentType = upstreamResponse.headers.get("content-type") || "";

  if (request.method === "HEAD") return upstreamResponse;

  if (url.pathname === "/sitemap.xml" && contentType.includes("xml")) {
    const xml = reconcileSitemap(await upstreamResponse.text());
    return rewrittenResponse(xml, upstreamResponse, "application/xml; charset=utf-8", {
      "x-getgiffgaff-hotfix": "sitemap-hotfix-routes",
    });
  }

  if (!contentType.includes("text/html") || !shouldRewriteHtmlPath(url.pathname)) {
    return upstreamResponse;
  }

  let html = rewriteGlobalSeoHtml(await upstreamResponse.text(), url.pathname);
  if (url.pathname === "/guides/") html = injectPitfallsGuideLinks(html);
  const isContactPage = CONTACT_PATHS.has(url.pathname);
  if (isContactPage) html = rewriteContactHtml(html);

  return htmlResponse(html, upstreamResponse, {
    "x-getgiffgaff-hotfix": isContactPage
      ? "contact-ktt-modal"
      : url.pathname === "/guides/"
        ? "guide-pitfalls-link"
        : "seo-response-policy",
    ...(isContactPage ? { "x-getgiffgaff-render-mode": "edge-static-contact" } : {}),
  });
}

export default {
  async fetch(request, env) {
    let response;

    try {
      response = canonicalRedirectFor(request) || (await routeRequest(request, env));
    } catch {
      response = new Response("Temporary upstream error", {
        status: 502,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "x-getgiffgaff-error": "upstream-failure",
        },
      });
    }

    const url = new URL(request.url);
    const contentType = response.headers.get("content-type") || "";
    const policy = policyFor(url.pathname, response.status, contentType);
    return finalizeResponse(request, response, policy);
  },
};
