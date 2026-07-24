const BASELINE_DATE = "2026-06-11";
const EVIDENCE_DATE = "2026-07-15";
const GROWTH_DATE = "2026-07-17";
const CONSULTATION_RECOVERY_DATE = "2026-07-19";
const INTERNAL_LINK_REFINEMENT_DATE = "2026-07-19T15:35:26Z";
const SEARCH_CONTENT_EXPANSION_DATE = "2026-07-20";
const ACCOUNT_VERIFICATION_EXPANSION_DATE = "2026-07-20T06:15:00Z";
const HOMEPAGE_PLATFORM_HUB_DATE = "2026-07-20T06:51:08Z";
const TOOL_PRODUCTIZATION_DATE = "2026-07-24";
const LOCAL_SEARCH_EXPANSION_DATE = "2026-07-24";

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
  "/guides/claude-identity-verification/",
  "/guides/claude-phone-verification/",
  "/guides/claude-account-disabled-appeal/",
  "/guides/7-arrival-checklist/",
  "/guides/8-uk-sim-choice/",
  "/guides/uk-sim-at-heathrow/",
  "/guides/manchester-student-sim/",
  "/guides/london-student-sim/",
  "/guides/9-number-balance-data-check/",
  "/guides/apn-settings/",
  "/more/esim-new-phone/",
  "/more/esim-deleted/",
  "/tools/keep-number-reminder/",
  "/tools/china-roaming-cost/",
  "/tools/g0-g2-total-cost/",
]);

export const NOINDEX_GROWTH_ROUTES = Object.freeze([
  "/tools/esim-compatibility/",
  "/research/china-network-sms/",
  "/research/otp-status/",
  "/privacy/",
  "/terms/",
  "/refund/",
  "/shipping/",
]);

// Exact public files that are not HTML routes. Keeping this list beside the
// route manifest prevents Cloudflare Pages' SPA fallback from turning unknown
// paths into a 200 response containing the home page.
export const PUBLIC_STATIC_ASSET_PATHS = Object.freeze([
  "/assets/site.css",
  "/assets/legacy-palette.css",
  "/gg-card-hero.png",
  "/favicon.ico",
  "/favicon.svg",
  "/favicon-48x48.png",
  "/apple-touch-icon.png",
  "/contact/wechat-qr.jpg",
  "/contact/telegram-qr.jpg",
  "/contact/ktt-giga-card.png",
  "/contact/getgiffgaff-contact-og.png",
  "/growth-assets/growth.css",
  "/growth-assets/growth-ui.js",
  "/growth-assets/tools.js",
  "/growth-assets/commerce-ui.js",
  "/growth-assets/analytics.js",
  "/growth-assets/keep-number-reminder-og.png",
  "/growth-assets/china-roaming-cost-og.png",
  "/growth-assets/china-roaming-cost-screenshot.png",
  "/release-provenance.json",
  "/indexnow-key.txt",
  "/robots.txt",
  "/llms.txt",
]);

// Optional ownership-verification artifact. It is allowlisted at the edge but
// is generated only when a real publisher ID is supplied during the build.
export const OPTIONAL_PUBLIC_STATIC_ASSET_PATHS = Object.freeze([
  "/ads.txt",
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

// The consultation-recovery release materially changed the search-facing
// sales guidance or the primary contact path on these pages. Other pages only
// inherited a shared widget/analytics change, which is not a reason to claim a
// newer document-level lastmod in the sitemap.
const CONSULTATION_RECOVERY_ROUTES = new Set([
  "/",
  "/guides/0-intro/",
  "/guides/1-order/",
  "/guides/3-account/",
  "/guides/3-app/",
  "/guides/4-recharge-service/",
  "/guides/5-travel-data/",
  "/guides/6-pitfalls/",
  "/guides/7-arrival-checklist/",
  "/guides/8-uk-sim-choice/",
  "/more/00-wechat/",
  "/more/02-telegram/",
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
  "/shop/",
  "/shop/giffgaff-g0/",
  "/shop/giffgaff-g2/",
  "/contact/",
  "/tools/keep-number-reminder/",
  "/tools/china-roaming-cost/",
  "/tools/g0-g2-total-cost/",
]);

// These pages received substantive, route-specific internal-link or related
// content changes in commit 3675247 at the timestamp below. A date-only
// sitemap value hid the second release made on the same day, so retain the
// precise W3C DateTime value rather than claiming a later calendar date.
const INTERNAL_LINK_REFINEMENT_ROUTES = new Set([
  "/",
  "/shop/",
  "/guides/0-intro/",
  "/guides/1-order/",
  "/answers/",
  "/guides/2-activate/",
  "/guides/3-account/",
  "/guides/3-app/",
  "/guides/3-usage/",
  "/guides/4-recharge-service/",
  "/guides/4-signal/",
  "/guides/5-travel-data/",
  "/more/03-esim/",
  "/qa/02-topup/",
  "/qa/07-voicemail-switch/",
  "/guides/6-pitfalls/",
  "/guides/7-arrival-checklist/",
  "/guides/8-uk-sim-choice/",
  "/tools/keep-number-reminder/",
  "/tools/china-roaming-cost/",
  "/tools/g0-g2-total-cost/",
]);

// These routes received new evidence-led content for distinct, high-intent
// troubleshooting queries. Do not make unrelated pages appear freshly edited.
const SEARCH_CONTENT_EXPANSION_ROUTES = new Set([
  "/guides/9-number-balance-data-check/",
  "/guides/apn-settings/",
  "/more/esim-new-phone/",
  "/more/esim-deleted/",
]);

const LOCAL_SEARCH_EXPANSION_ROUTES = new Set([
  "/guides/uk-sim-at-heathrow/",
  "/guides/manchester-student-sim/",
  "/guides/london-student-sim/",
]);

const ACCOUNT_VERIFICATION_EXPANSION_ROUTES = new Set([
  "/",
  "/shop/",
  "/guides/3-account/",
  "/guides/4-signal/",
  "/guides/6-pitfalls/",
  "/guides/claude-identity-verification/",
  "/guides/claude-phone-verification/",
  "/guides/claude-account-disabled-appeal/",
]);

const COLLECTION_ROUTES = new Set([
  "/shop/",
  "/guides/",
  "/more/",
  "/qa/",
  "/research/",
]);

const COMMERCE_DETAIL_ROUTES = new Set([
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
  if (["/privacy/", "/terms/", "/refund/", "/shipping/"].includes(pathname)) {
    return "WebPage";
  }
  if (COMMERCE_DETAIL_ROUTES.has(pathname)) return "WebPage";
  if (pathname === "/contact/") return "ContactPage";
  if (COLLECTION_ROUTES.has(pathname) || pathname.startsWith("/research/")) {
    return "CollectionPage";
  }
  if (TOOL_ROUTES.has(pathname)) return "WebApplication";
  return "Article";
}

function commerceFor(pathname) {
  if (pathname === "/shop/" || COMMERCE_DETAIL_ROUTES.has(pathname)) return "direct";
  if (pathname === "/contact/") return "support";
  if ([
    "/guides/claude-identity-verification/",
    "/guides/claude-account-disabled-appeal/",
  ].includes(pathname)) return "none";
  if (pathname.startsWith("/research/")) return "none";
  return "contextual";
}

function lastModifiedFor(pathname, contentSource) {
  if ([
    "/tools/keep-number-reminder/",
    "/tools/china-roaming-cost/",
  ].includes(pathname)) {
    return TOOL_PRODUCTIZATION_DATE;
  }
  if (pathname === "/") {
    return HOMEPAGE_PLATFORM_HUB_DATE;
  }
  if (ACCOUNT_VERIFICATION_EXPANSION_ROUTES.has(pathname)) {
    return ACCOUNT_VERIFICATION_EXPANSION_DATE;
  }
  if (LOCAL_SEARCH_EXPANSION_ROUTES.has(pathname)) {
    return LOCAL_SEARCH_EXPANSION_DATE;
  }
  if (SEARCH_CONTENT_EXPANSION_ROUTES.has(pathname)) {
    return SEARCH_CONTENT_EXPANSION_DATE;
  }
  if (INTERNAL_LINK_REFINEMENT_ROUTES.has(pathname)) {
    return INTERNAL_LINK_REFINEMENT_DATE;
  }
  if (CONSULTATION_RECOVERY_ROUTES.has(pathname)) {
    return CONSULTATION_RECOVERY_DATE;
  }
  if (contentSource === "legacy") {
    return EVIDENCE_LEGACY_ROUTES.has(pathname) ? EVIDENCE_DATE : BASELINE_DATE;
  }
  return GROWTH_DATE;
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
    lastModified: lastModifiedFor(pathname, "legacy"),
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
    lastModified: lastModifiedFor(pathname, "growth"),
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
