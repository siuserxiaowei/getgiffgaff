export const INDEX_POLICIES = Object.freeze([
  "index",
  "noindex",
  "private",
  "redirect",
  "gone",
]);

const LAST_REVIEWED = "2026-07-15";
const DEFAULT_CONTENT_OWNER = "getgiffgaff-editorial";
const PENDING_BUSINESS_OWNER = "business-owner-pending";

function route(
  path,
  indexPolicy,
  {
    lastModified = LAST_REVIEWED,
    cachePolicy = indexPolicy === "index" ? "public" : "public-noindex",
    schemaTypes = [],
    redirectTo = null,
    contentOwner = DEFAULT_CONTENT_OWNER,
    renderSource = "local",
  } = {},
) {
  return Object.freeze({
    path,
    indexPolicy,
    canonicalPath: path,
    redirectTo,
    contentOwner,
    renderSource,
    lastModified,
    cachePolicy,
    schemaTypes: Object.freeze([...schemaTypes]),
    commerceAllowed: false,
  });
}

const indexRoutes = [
  route("/", "index", { schemaTypes: ["Organization", "WebSite"] }),
  route("/answers/", "index", { schemaTypes: ["Article", "BreadcrumbList"] }),
  route("/guides/", "index", { schemaTypes: ["CollectionPage", "ItemList"] }),
  route("/guides/0-intro/", "index", { schemaTypes: ["Article", "BreadcrumbList"] }),
  route("/guides/2-activate/", "index", { schemaTypes: ["Article", "BreadcrumbList"] }),
  route("/guides/3-account/", "index", { schemaTypes: ["Article", "BreadcrumbList"] }),
  route("/guides/3-usage/", "index", {
    cachePolicy: "evidence-sensitive",
    schemaTypes: ["Article", "BreadcrumbList"],
  }),
  route("/guides/4-signal/", "index", { schemaTypes: ["Article", "BreadcrumbList"] }),
  route("/guides/5-travel-data/", "index", {
    cachePolicy: "evidence-sensitive",
    schemaTypes: ["Article", "BreadcrumbList"],
  }),
  route("/guides/6-pitfalls/", "index", { schemaTypes: ["Article", "BreadcrumbList"] }),
  route("/more/", "index", { schemaTypes: ["CollectionPage", "ItemList"] }),
  route("/more/03-esim/", "index", { schemaTypes: ["Article", "BreadcrumbList"] }),
  route("/more/04-esim-qrcode/", "index", { schemaTypes: ["Article", "BreadcrumbList"] }),
  route("/qa/", "index", { schemaTypes: ["CollectionPage", "ItemList"] }),
  route("/qa/00-username/", "index", { schemaTypes: ["Article", "BreadcrumbList"] }),
  route("/qa/01-change-number/", "index", { schemaTypes: ["Article", "BreadcrumbList"] }),
  route("/qa/02-topup/", "index", { schemaTypes: ["Article", "BreadcrumbList"] }),
  route("/qa/03-reissue/", "index", { schemaTypes: ["Article", "BreadcrumbList"] }),
  route("/qa/04-choose-number/", "index", { schemaTypes: ["Article", "BreadcrumbList"] }),
  route("/qa/05-multiple-number/", "index", { schemaTypes: ["Article", "BreadcrumbList"] }),
  route("/qa/07-voicemail-switch/", "index", { schemaTypes: ["Article", "BreadcrumbList"] }),
  route("/qa/09-spread/", "index", { schemaTypes: ["Article", "BreadcrumbList"] }),
  route("/contact/", "index", { schemaTypes: ["Organization", "WebSite", "ContactPage"] }),
  route("/about/", "index", { schemaTypes: ["Organization", "WebSite", "AboutPage"] }),
  route("/shipping/", "index", { schemaTypes: ["WebPage"] }),
  route("/returns/", "index", { schemaTypes: ["WebPage"] }),
  route("/editorial-policy/", "index", { schemaTypes: ["WebPage"] }),
  route("/disclaimer/", "index", { schemaTypes: ["WebPage"] }),
];

const noindexRoutes = [
  route("/shop/", "noindex", { contentOwner: PENDING_BUSINESS_OWNER }),
  route("/shop/giffgaff-g0/", "noindex", { contentOwner: PENDING_BUSINESS_OWNER }),
  route("/shop/giffgaff-g2/", "noindex", { contentOwner: PENDING_BUSINESS_OWNER }),
  route("/guides/1-order/", "noindex", { contentOwner: PENDING_BUSINESS_OWNER }),
  route("/guides/3-app/", "noindex"),
  route("/guides/4-recharge-service/", "noindex", {
    contentOwner: PENDING_BUSINESS_OWNER,
  }),
  route("/more/00-wechat/", "noindex"),
  route("/more/02-telegram/", "noindex"),
  route("/qa/06-activation-expiration/", "noindex"),
  route("/qa/08-gv/", "noindex"),
  route("/research/", "noindex"),
  route("/privacy/", "noindex", { schemaTypes: ["WebPage"] }),
  route("/terms/", "noindex", { schemaTypes: ["WebPage"] }),
  route("/llms.txt", "noindex", {
    lastModified: LAST_REVIEWED,
    cachePolicy: "public-noindex",
  }),
];

const retiredRoutes = [
  route("/llms-full.txt", "gone", {
    lastModified: LAST_REVIEWED,
    cachePolicy: "no-store",
  }),
];

export const ROUTE_MANIFEST = Object.freeze(
  Object.fromEntries(
    [...indexRoutes, ...noindexRoutes, ...retiredRoutes].map((entry) => [entry.path, entry]),
  ),
);

export const PUBLIC_INDEXABLE_PATHS = Object.freeze(
  Object.values(ROUTE_MANIFEST)
    .filter((entry) => entry.indexPolicy === "index")
    .map((entry) => entry.path),
);

export const SUPPORTING_NOINDEX_PATHS = Object.freeze(
  Object.values(ROUTE_MANIFEST)
    .filter((entry) => entry.indexPolicy === "noindex")
    .map((entry) => entry.path),
);

export function routeFor(pathname) {
  return ROUTE_MANIFEST[pathname] || null;
}
