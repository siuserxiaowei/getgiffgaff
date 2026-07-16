const BASELINE_DATE = "2026-06-11";
const EVIDENCE_DATE = "2026-07-15";
const GROWTH_DATE = "2026-07-16";

export const LEGACY_ROUTES = Object.freeze([
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

export const INDEXABLE_GROWTH_ROUTES = Object.freeze([
  "/guides/7-arrival-checklist/",
  "/guides/8-uk-sim-choice/",
  "/tools/keep-number-reminder/",
  "/tools/china-roaming-cost/",
  "/tools/g0-g2-total-cost/",
]);

export const NOINDEX_GROWTH_ROUTES = Object.freeze([
  "/tools/esim-compatibility/",
  "/research/china-network-sms/",
  "/research/otp-status/",
]);

// Exact public files that are not HTML routes. Keeping this list beside the
// route manifest prevents Cloudflare Pages' SPA fallback from turning unknown
// paths into a 200 response containing the home page.
export const PUBLIC_STATIC_ASSET_PATHS = Object.freeze([
  "/assets/site.css",
  "/gg-card-hero.png",
  "/favicon.svg",
  "/contact/wechat-qr.png",
  "/contact/ktt-giga-card.png",
  "/contact/getgiffgaff-contact-og.png",
  "/growth-assets/growth.css",
  "/growth-assets/growth-ui.js",
  "/growth-assets/tools.js",
  "/growth-assets/commerce-ui.js",
  "/growth-assets/analytics.js",
  "/indexnow-key.txt",
  "/robots.txt",
  "/llms.txt",
]);

const EVIDENCE_LEGACY_ROUTES = new Set([
  "/answers/",
  "/guides/2-activate/",
  "/guides/3-usage/",
  "/guides/4-signal/",
  "/more/03-esim/",
  "/more/04-esim-qrcode/",
  "/guides/6-pitfalls/",
  "/research/",
]);

const COLLECTION_ROUTES = new Set([
  "/shop/",
  "/guides/",
  "/more/",
  "/qa/",
  "/research/",
]);

const PRODUCT_ROUTES = new Set([
  "/shop/giffgaff-g0/",
  "/shop/giffgaff-g2/",
]);

const TOOL_ROUTES = new Set([
  "/tools/keep-number-reminder/",
  "/tools/china-roaming-cost/",
  "/tools/g0-g2-total-cost/",
  "/tools/esim-compatibility/",
]);

function schemaTypeFor(pathname) {
  if (pathname === "/") return "WebPage";
  if (PRODUCT_ROUTES.has(pathname)) return "Product";
  if (pathname === "/contact/") return "ContactPage";
  if (COLLECTION_ROUTES.has(pathname) || pathname.startsWith("/research/")) {
    return "CollectionPage";
  }
  if (TOOL_ROUTES.has(pathname)) return "WebApplication";
  return "Article";
}

function commerceFor(pathname) {
  if (pathname === "/shop/" || PRODUCT_ROUTES.has(pathname)) return "direct";
  if (pathname === "/contact/") return "support";
  if (pathname.startsWith("/research/")) return "none";
  return "contextual";
}

function legacyRecord(pathname) {
  return Object.freeze({
    pathname,
    canonicalPath: pathname,
    assetPath: pathname,
    indexPolicy: "index",
    sitemap: true,
    cachePolicy: "public",
    schemaType: schemaTypeFor(pathname),
    contentSource: "legacy",
    lastModified: EVIDENCE_LEGACY_ROUTES.has(pathname)
      ? EVIDENCE_DATE
      : BASELINE_DATE,
    commerce: commerceFor(pathname),
  });
}

function growthRecord(pathname, indexPolicy) {
  return Object.freeze({
    pathname,
    canonicalPath: pathname,
    assetPath: pathname,
    indexPolicy,
    sitemap: indexPolicy === "index",
    cachePolicy: "public",
    schemaType: schemaTypeFor(pathname),
    contentSource: "growth",
    lastModified: GROWTH_DATE,
    commerce: commerceFor(pathname),
  });
}

const records = Object.freeze([
  ...LEGACY_ROUTES.map(legacyRecord),
  ...INDEXABLE_GROWTH_ROUTES.map((pathname) => growthRecord(pathname, "index")),
  ...NOINDEX_GROWTH_ROUTES.map((pathname) => growthRecord(pathname, "noindex")),
]);

export const ROUTE_MANIFEST = Object.freeze(
  Object.fromEntries(records.map((record) => [record.pathname, record])),
);

export const PUBLIC_INDEXABLE_PATHS = Object.freeze(
  records.filter((record) => record.indexPolicy === "index").map((record) => record.pathname),
);

export function routeFor(pathname) {
  return ROUTE_MANIFEST[pathname] || null;
}
