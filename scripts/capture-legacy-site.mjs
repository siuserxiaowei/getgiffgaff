import { createHash } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { LEGACY_ROUTES } from "../public/route-manifest.js";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const OUTPUT_ROOT = path.join(ROOT, "site", "legacy");
const ORIGIN = "https://getgiffgaff.com";
const BASELINE_COMMIT = "7cac06f";
const USER_AGENT = "getgiffgaff-additive-growth-capture/1.0";
const APPROVED_GROWTH_SLOT_PATTERN =
  /<section\b(?=[^>]*data-growth-slot=["']related-tutorials-v1["'])[^>]*>[\s\S]*?<\/section>|<aside\b(?=[^>]*data-growth-slot=["']wechat-buying-guide-v1["'])[^>]*>[\s\S]*?<\/aside>/gi;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function attribute(tag, name) {
  const match = String(tag).match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"),
  );
  return match ? match[1] ?? match[2] ?? match[3] ?? "" : "";
}

function pageTitle(html) {
  return (html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.trim() || "";
}

function metaContent(html, kind, key) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    if (attribute(tag, kind).toLowerCase() === key.toLowerCase()) {
      return attribute(tag, "content");
    }
  }
  return "";
}

function firstHeading(html) {
  return (html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]
    ?.replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "";
}

function runtimeCleanupHtml(html) {
  // The static capture must not make editorial decisions. In particular, Nano
  // Banana is part of the approved legacy baseline and must remain byte-for-byte
  // represented in the frozen DOM. Runtime-only dependencies are removed by
  // staticizeLegacyHtml below, where each allowed transform is explicit.
  return String(html);
}

export function navigationSignature(html) {
  const nav = (html.match(/<nav\b(?=[^>]*aria-label=["']主导航["'])[^>]*>([\s\S]*?)<\/nav>/i) || [])[1] || "";
  return sha256(
    nav
      .replace(/<script\b[\s\S]*?<\/script>/gi, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

export function visibleTextSignature(html, { applyRuntimeCleanup = false } = {}) {
  let source = applyRuntimeCleanup ? runtimeCleanupHtml(html) : html;
  source = source
    .replace(APPROVED_GROWTH_SLOT_PATTERN, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<head\b[\s\S]*?<\/head>/gi, "");
  const tokens = [];
  for (const match of source.matchAll(/<(h[1-6]|p|li|td|th|button|a)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const text = match[2]
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/\s+/g, " ")
      .trim();
    if (text) tokens.push(`${match[1].toLowerCase()}:${text}`);
  }
  return sha256(tokens.join("\n"));
}

function stripIgnoredDomAdditions(html) {
  let source = String(html);
  source = source.replace(APPROVED_GROWTH_SLOT_PATTERN, "");
  source = source.replace(
    /<link\b(?=[^>]*\bhref=["'](?:https:\/\/getgiffgaff\.com)?\/growth-assets\/growth\.css(?:\?[^"']*)?["'])[^>]*>/gi,
    "",
  );
  source = source.replace(
    /<script\b([^>]*)>[\s\S]*?<\/script>/gi,
    (script, attributes) => {
      const type = attribute(attributes, "type")
        .toLowerCase()
        .split(";", 1)[0]
        .trim();
      const src = attribute(attributes, "src").toLowerCase();
      const isJsonLd = type === "application/ld+json";
      const isCloudflareBeacon =
        src.includes("static.cloudflareinsights.com/") ||
        /\bdata-cf-beacon\s*=/.test(attributes) ||
        /(?:static\.cloudflareinsights\.com\/beacon(?:\.min)?\.js|\b__cfBeacon\s*=)/i.test(script);
      return isJsonLd || isCloudflareBeacon ? "" : script;
    },
  );
  return source.replace(/<!--[\s\S]*?-->/g, "");
}

/**
 * Hash the complete approved legacy markup, not just visible copy.
 *
 * The signature deliberately retains element/attribute order, hrefs, images,
 * inline styles, and non-runtime inline scripts. Only generated metadata and the
 * the explicitly approved additive growth slots are ignored. Whitespace between
 * tags is formatting-only and normalized so a pretty-printer cannot invalidate
 * the content lock.
 */
export function legacyDomSignature(html) {
  const normalized = stripIgnoredDomAdditions(html)
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/>\s+</g, "><")
    .trim();
  return sha256(normalized);
}

export function staticizeLegacyHtml(html, { stylesheetPath = "/assets/site.css" } = {}) {
  let output = runtimeCleanupHtml(html);
  output = output.replace(
    /<link\b(?=[^>]*\brel=["'](?:preload|modulepreload)["'])(?=[^>]*\bas=["']script["'])[^>]*>\s*/gi,
    "",
  );
  let stylesheetWritten = false;
  output = output.replace(
    /<link\b(?=[^>]*\brel=["']stylesheet["'])(?=[^>]*\bhref=["']\/_next\/[^"']+["'])[^>]*>/gi,
    () => {
      if (stylesheetWritten) return "";
      stylesheetWritten = true;
      return `<link rel="stylesheet" href="${stylesheetPath}">`;
    },
  );
  output = output.replace(
    /<script\b([^>]*)>([\s\S]*?)<\/script>\s*/gi,
    (script, attributes, body) => {
      const src = attribute(attributes, "src");
      if (
        src.startsWith("/_next/") ||
        src.startsWith("https://static.cloudflareinsights.com/beacon.min.js") ||
        /\bdata-cf-beacon\s*=/.test(attributes) ||
        /(?:self\.)?__next_(?:f|s|require|router)\b/.test(body) ||
        /\bid=["']getgiffgaff-brand-cleanup["']/.test(attributes)
      ) {
        return "";
      }
      return script;
    },
  );
  output = output
    .replace(/<meta\b(?=[^>]*\bname=["']keywords["'])[^>]*>\s*/gi, "")
    .replace(/<div\b[^>]*hidden=["']["'][^>]*>\s*(?:<!--[^>]*-->\s*)*<\/div>/gi, "")
    .replace(/<!--\/?\$[^>]*-->/g, "")
    .replace(/<!--\s*-->/g, "");
  return output;
}

function routeFile(route) {
  return route === "/" ? "index.html" : `${route.slice(1)}index.html`;
}

function internalHrefs(html) {
  return [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1])
    .filter((href) => href.startsWith("/") && !href.startsWith("//"));
}

function sameOriginAssets(html) {
  const urls = new Set();
  const candidates = [];
  for (const tag of html.match(/<(?:img|link|meta)\b[^>]*>/gi) || []) {
    for (const name of ["src", "href", "content"]) {
      const value = attribute(tag, name);
      if (value) candidates.push(value);
    }
  }
  for (const value of candidates) {
    try {
      const url = new URL(value, ORIGIN);
      if (url.origin !== ORIGIN || url.pathname.startsWith("/_next/")) continue;
      if (!/\.(?:png|jpe?g|webp|avif|svg|ico)$/i.test(url.pathname)) continue;
      urls.add(url.pathname);
    } catch {}
  }
  return urls;
}

function stylesheetUrls(html) {
  return (html.match(/<link\b(?=[^>]*\brel=["']stylesheet["'])[^>]*>/gi) || [])
    .map((tag) => attribute(tag, "href"))
    .filter(Boolean)
    .map((href) => new URL(href, ORIGIN).toString());
}

function sitemapEntries(xml) {
  const entries = new Map();
  for (const match of xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>[\s\S]*?<lastmod>([^<]+)<\/lastmod>[\s\S]*?<\/url>/gi)) {
    const url = new URL(match[1].replaceAll("&amp;", "&"));
    if (url.origin === ORIGIN) entries.set(url.pathname, match[2]);
  }
  return entries;
}

async function fetchResponse(url) {
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "cache-control": "no-cache",
      "user-agent": USER_AGENT,
    },
    redirect: "error",
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response;
}

async function writeOutput(relative, bytes) {
  const destination = path.join(OUTPUT_ROOT, relative);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, bytes);
}

export async function captureLegacySite() {
  const sitemapResponse = await fetchResponse(`${ORIGIN}/sitemap.xml`);
  const sitemapXml = await sitemapResponse.text();
  const lastModified = sitemapEntries(sitemapXml);
  assertExpectedRoutes(lastModified);

  const pages = [];
  const stylesheets = new Set();
  const assetPaths = new Set(["/robots.txt"]);

  for (const route of LEGACY_ROUTES) {
    const response = await fetchResponse(`${ORIGIN}${route}`);
    const sourceHtml = await response.text();
    for (const stylesheet of stylesheetUrls(sourceHtml)) stylesheets.add(stylesheet);
    for (const asset of sameOriginAssets(sourceHtml)) assetPaths.add(asset);
    const html = staticizeLegacyHtml(sourceHtml, {
      route,
      stylesheetPath: "/assets/site.css",
    });
    const localPath = routeFile(route);
    pages.push({
      route,
      localPath,
      sourceSha256: sha256(sourceHtml),
      staticSha256: sha256(html),
      lastModified: String(lastModified.get(route)).slice(0, 10),
      title: pageTitle(html),
      description: metaContent(html, "name", "description"),
      h1: firstHeading(html),
      navigationSha256: navigationSignature(html),
      visibleTextSha256: visibleTextSignature(html),
      domSha256: legacyDomSignature(html),
      legacyInternalHrefs: [...new Set(internalHrefs(html))].sort(),
      html,
    });
  }

  if (stylesheets.size !== 1) {
    throw new Error(`expected one production stylesheet, found ${stylesheets.size}`);
  }
  const stylesheetResponse = await fetchResponse([...stylesheets][0]);
  const stylesheet = Buffer.from(await stylesheetResponse.arrayBuffer());

  await rm(OUTPUT_ROOT, { recursive: true, force: true });
  const publicFiles = [];
  for (const page of pages) {
    const bytes = Buffer.from(page.html);
    await writeOutput(page.localPath, bytes);
    publicFiles.push(fileRecord(page.localPath, bytes, "page"));
  }
  await writeOutput("assets/site.css", stylesheet);
  publicFiles.push(fileRecord("assets/site.css", stylesheet, "stylesheet"));

  const assets = {};
  for (const pathname of [...assetPaths].sort()) {
    const response = await fetchResponse(`${ORIGIN}${pathname}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const relative = pathname.slice(1);
    await writeOutput(relative, bytes);
    publicFiles.push(fileRecord(relative, bytes, pathname === "/robots.txt" ? "robots" : "asset"));
    if (pathname !== "/robots.txt") {
      assets[pathname] = { path: relative, sha256: sha256(bytes), bytes: bytes.length };
    }
  }

  assets["/assets/site.css"] = {
    path: "assets/site.css",
    sha256: sha256(stylesheet),
    bytes: stylesheet.length,
  };

  const freeze = {
    schemaVersion: "legacy-freeze-v2",
    capturedAt: new Date().toISOString(),
    baseline: { commit: BASELINE_COMMIT, origin: ORIGIN },
    pages: pages.map(({ html, sourceSha256, staticSha256, localPath, lastModified, ...record }) => record),
    assets,
  };
  await writeOutput("legacy-freeze-manifest.json", `${JSON.stringify(freeze, null, 2)}\n`);

  const lock = {
    schemaVersion: "legacy-site-capture-v2",
    capturedAt: freeze.capturedAt,
    source: {
      origin: ORIGIN,
      contentBaseline: BASELINE_COMMIT,
      sitemapSha256: sha256(sitemapXml),
    },
    pageCount: pages.length,
    pages: pages.map(({ html, ...record }) => record),
    publicFiles: publicFiles.sort((a, b) => a.path.localeCompare(b.path)),
  };
  await writeOutput("capture.lock.json", `${JSON.stringify(lock, null, 2)}\n`);
  return lock;
}

function fileRecord(relativePath, bytes, kind) {
  return { path: relativePath, bytes: bytes.length, sha256: sha256(bytes), kind };
}

function assertExpectedRoutes(lastModified) {
  const actual = [...lastModified.keys()].sort();
  const expected = [...LEGACY_ROUTES].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `production sitemap does not match the 34-page baseline\nexpected: ${expected.join(", ")}\nactual: ${actual.join(", ")}`,
    );
  }
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invoked === fileURLToPath(import.meta.url)) {
  captureLegacySite()
    .then((lock) => {
      process.stdout.write(`${JSON.stringify({ pages: lock.pageCount, files: lock.publicFiles.length })}\n`);
    })
    .catch((error) => {
      process.stderr.write(`${error.stack || error}\n`);
      process.exitCode = 1;
    });
}
