import {
  PUBLIC_STATIC_ASSET_PATHS,
  ROUTE_MANIFEST,
} from "../public/route-manifest.js";

const CANONICAL_ORIGIN = "https://getgiffgaff.com";
const MAX_ATTEMPTS = 4;

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

function attribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(tag).match(
    new RegExp(`\\b${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"),
  );
  return match ? match[1] ?? match[2] ?? match[3] ?? "" : "";
}

function canonicalHref(html) {
  for (const tag of String(html).match(/<link\b[^>]*>/gi) || []) {
    if (attribute(tag, "rel").toLowerCase().split(/\s+/).includes("canonical")) {
      return attribute(tag, "href");
    }
  }
  return "";
}

function ogUrl(html) {
  for (const tag of String(html).match(/<meta\b[^>]*>/gi) || []) {
    if (attribute(tag, "property").toLowerCase() === "og:url") {
      return attribute(tag, "content");
    }
  }
  return "";
}

function commerceWidgetCount(html) {
  return (
    String(html).match(
      /<aside\b(?=[^>]*\bdata-growth-slot=["']wechat-buying-guide-v1["'])[^>]*>/gi,
    ) || []
  ).length;
}

function hasPrivatePreviewPolicy(response) {
  const robots = response.headers.get("x-robots-tag")?.toLowerCase() || "";
  const cache = response.headers.get("cache-control")?.toLowerCase() || "";
  return (
    robots.includes("noindex") &&
    robots.includes("nofollow") &&
    robots.includes("noarchive") &&
    cache.includes("private") &&
    cache.includes("no-store")
  );
}

async function fetchWithPropagationRetry(url, init) {
  let response;
  let error;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      response = await fetch(url, {
        ...init,
        redirect: "manual",
        signal: AbortSignal.timeout(15_000),
      });
      if (response.status !== 404 || attempt === MAX_ATTEMPTS) return response;
    } catch (caught) {
      error = caught;
      if (attempt === MAX_ATTEMPTS) throw caught;
    }
    await new Promise((resolve) => setTimeout(resolve, 750 * attempt));
  }
  if (response) return response;
  throw error || new Error(`Unable to fetch ${url}`);
}

export async function verifyPreviewRelease(baseUrl) {
  const base = String(baseUrl || "").replace(/\/+$/, "");
  if (!/^https:\/\/[a-z0-9-]+\.getgiffgaff\.pages\.dev$/i.test(base)) {
    throw new Error("--base-url must be an https://*.getgiffgaff.pages.dev preview URL");
  }

  const failures = [];
  for (const pathname of Object.keys(ROUTE_MANIFEST)) {
    const response = await fetchWithPropagationRetry(`${base}${pathname}`);
    const html = await response.text();
    if (response.status !== 200) failures.push(`${pathname}: GET ${response.status}`);
    if (canonicalHref(html) !== `${CANONICAL_ORIGIN}${pathname}`) {
      failures.push(`${pathname}: canonical ${canonicalHref(html) || "missing"}`);
    }
    if (ogUrl(html) !== `${CANONICAL_ORIGIN}${pathname}`) {
      failures.push(`${pathname}: og:url ${ogUrl(html) || "missing"}`);
    }
    if (commerceWidgetCount(html) !== 1) {
      failures.push(`${pathname}: buying-guide widget count ${commerceWidgetCount(html)}`);
    }
    if (!hasPrivatePreviewPolicy(response)) {
      failures.push(`${pathname}: preview indexing/cache policy is not private`);
    }

    const head = await fetchWithPropagationRetry(`${base}${pathname}`, { method: "HEAD" });
    if (head.status !== 200) failures.push(`${pathname}: HEAD ${head.status}`);
    if (!hasPrivatePreviewPolicy(head)) {
      failures.push(`${pathname}: HEAD preview policy is not private`);
    }
  }

  for (const pathname of PUBLIC_STATIC_ASSET_PATHS) {
    const response = await fetchWithPropagationRetry(`${base}${pathname}`);
    const bytes = (await response.arrayBuffer()).byteLength;
    if (response.status !== 200 || bytes === 0) {
      failures.push(`${pathname}: asset ${response.status}, ${bytes} bytes`);
    }
    if (!hasPrivatePreviewPolicy(response)) {
      failures.push(`${pathname}: preview asset policy is not private`);
    }
  }

  const sitemap = await fetchWithPropagationRetry(`${base}/sitemap.xml`);
  const sitemapXml = await sitemap.text();
  const sitemapUrls = sitemapXml.match(/<loc\b[^>]*>/gi) || [];
  if (sitemap.status !== 200 || sitemapUrls.length !== 39) {
    failures.push(`/sitemap.xml: ${sitemap.status}, ${sitemapUrls.length} URLs`);
  }
  if (!hasPrivatePreviewPolicy(sitemap)) {
    failures.push("/sitemap.xml: preview policy is not private");
  }

  for (const pathname of ["/__preview-404-probe__/", "/growth-assets/not-real.js"]) {
    const response = await fetchWithPropagationRetry(`${base}${pathname}`);
    const html = await response.text();
    if (response.status !== 404) failures.push(`${pathname}: expected 404, got ${response.status}`);
    if (canonicalHref(html) || ogUrl(html)) failures.push(`${pathname}: error carries canonical metadata`);
    if (!hasPrivatePreviewPolicy(response)) failures.push(`${pathname}: error policy is not private`);
  }

  const retired = await fetchWithPropagationRetry(`${base}/llms-full.txt`);
  if (retired.status !== 410) failures.push(`/llms-full.txt: expected 410, got ${retired.status}`);
  if (!hasPrivatePreviewPolicy(retired)) failures.push("/llms-full.txt: policy is not private");

  return {
    baseUrl: base,
    routes: Object.keys(ROUTE_MANIFEST).length,
    assets: PUBLIC_STATIC_ASSET_PATHS.length,
    sitemapUrls: 39,
    failures,
  };
}

const baseUrl = option("--base-url") || process.env.PREVIEW_BASE_URL;
try {
  const report = await verifyPreviewRelease(baseUrl);
  process.stdout.write(`${JSON.stringify(report)}\n`);
  if (report.failures.length) process.exitCode = 1;
} catch (error) {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exitCode = 1;
}
