import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const PUBLISHER_ID_PATTERN = /^pub-(\d{16})$/;
const ACCOUNT_META_PATTERN =
  /<meta\b(?=[^>]*\bname\s*=\s*["']google-adsense-account["'])[^>]*>\s*/gi;
const ACCOUNT_CONTENT_PATTERN = /\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;

export const ADSENSE_AD_ELIGIBLE_ROUTES = Object.freeze([]);

function publisherIdError(value) {
  return new Error(
    `Invalid AdSense publisher ID ${JSON.stringify(value)}; expected pub- followed by 16 digits`,
  );
}

export function normalizeAdsensePublisherId(value) {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const trimmed = String(value).trim();
  const normalized = trimmed.startsWith("ca-pub-") ? trimmed.slice(3) : trimmed;
  const match = normalized.match(PUBLISHER_ID_PATTERN);
  if (!match || /^0{16}$/.test(match[1])) throw publisherIdError(value);
  return normalized;
}

export function adsenseAccountId(value) {
  const publisherId = normalizeAdsensePublisherId(value);
  if (!publisherId) throw publisherIdError(value);
  return `ca-${publisherId}`;
}

export function adsenseSellerLine(value) {
  const publisherId = normalizeAdsensePublisherId(value);
  if (!publisherId) throw publisherIdError(value);
  return `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0`;
}

function metaAccountId(tag) {
  const match = String(tag).match(ACCOUNT_CONTENT_PATTERN);
  return match ? match[1] ?? match[2] ?? match[3] ?? "" : "";
}

export function injectAdsenseVerificationMeta(html, value) {
  const accountId = adsenseAccountId(value);
  const tags = String(html).match(ACCOUNT_META_PATTERN) || [];
  if (tags.length > 1) {
    throw new Error("Duplicate google-adsense-account meta tags are not allowed");
  }
  if (tags.length === 1) {
    if (metaAccountId(tags[0]) !== accountId) {
      throw new Error("Conflicting google-adsense-account meta tag");
    }
    return html;
  }
  if (!/<\/head>/i.test(html)) {
    throw new Error("Cannot inject AdSense verification meta: page has no closing head");
  }
  const tag = `<meta name="google-adsense-account" content="${accountId}">`;
  return String(html).replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function removeAdsenseVerificationMeta(html) {
  return String(html).replace(ACCOUNT_META_PATTERN, "");
}

function routeFile(root, route) {
  return route === "/"
    ? path.join(root, "index.html")
    : path.join(root, route.slice(1), "index.html");
}

export async function configureAdsenseVerification({
  outputRoot,
  publisherId,
  routes,
}) {
  if (!outputRoot) throw new Error("AdSense verification requires an outputRoot");
  if (!Array.isArray(routes)) throw new Error("AdSense verification requires a route list");
  const normalized = normalizeAdsensePublisherId(publisherId);
  const adsTxtPath = path.join(outputRoot, "ads.txt");

  if (!normalized) {
    await rm(adsTxtPath, { force: true });
    for (const route of routes) {
      const filename = routeFile(outputRoot, route);
      const html = await readFile(filename, "utf8");
      const cleaned = removeAdsenseVerificationMeta(html);
      if (cleaned !== html) await writeFile(filename, cleaned);
    }
    return { enabled: false, pages: 0, adsTxt: false };
  }

  let pages = 0;
  for (const route of routes) {
    const filename = routeFile(outputRoot, route);
    const html = await readFile(filename, "utf8");
    const configured = injectAdsenseVerificationMeta(html, normalized);
    if (configured !== html) await writeFile(filename, configured);
    pages += 1;
  }
  await writeFile(adsTxtPath, `${adsenseSellerLine(normalized)}\n`);
  return { enabled: true, pages, adsTxt: true };
}
