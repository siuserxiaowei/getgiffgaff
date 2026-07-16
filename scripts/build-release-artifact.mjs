import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  INDEXABLE_GROWTH_ROUTES,
  LEGACY_ROUTES,
  NOINDEX_GROWTH_ROUTES,
  PUBLIC_INDEXABLE_PATHS,
  routeFor,
} from "../public/route-manifest.js";
import {
  legacyDomSignature,
  staticizeLegacyHtml,
  visibleTextSignature,
} from "./capture-legacy-site.mjs";
import { renderCommerceWidget } from "../site/growth/commerce-widget.js";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const LEGACY_ROOT = path.join(ROOT, "site", "legacy");
const GROWTH_ROOT = path.join(ROOT, "site", "growth");
const PUBLIC_ROOT = path.join(ROOT, "public");
const DEFAULT_OUTPUT = path.join(ROOT, ".release");
const GROWTH_MARKER = 'data-growth-slot="related-tutorials-v1"';
const COMMERCE_MARKER = 'data-growth-slot="wechat-buying-guide-v1"';

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function routeFile(root, route) {
  return route === "/"
    ? path.join(root, "index.html")
    : path.join(root, route.slice(1), "index.html");
}

function growthModule(links) {
  const items = links
    .map(
      ({ label, href }) =>
        `<li><a href="${escapeHtml(href)}" data-analytics-event="growth_related_click">${escapeHtml(label)}</a></li>`,
    )
    .join("");
  return `<section class="growth-related-slot" ${GROWTH_MARKER} aria-labelledby="growth-related-title"><div class="growth-related-inner"><p class="growth-eyebrow">继续阅读</p><h2 id="growth-related-title">相关教程与下一步</h2><ul>${items}</ul></div></section>`;
}

export function ensureGrowthStylesheet(html) {
  let output = html;
  if (!/href=["']\/growth-assets\/growth\.css["']/i.test(output)) {
    const stylesheet = '<link rel="stylesheet" href="/growth-assets/growth.css">';
    if (!/<\/head>/i.test(output)) throw new Error("Legacy page has no closing head");
    output = output.replace(/<\/head>/i, `${stylesheet}</head>`);
  }
  return output;
}

export function injectRelatedTutorials(html, links) {
  if (!Array.isArray(links) || links.length === 0) return html;
  if (html.includes(GROWTH_MARKER)) return html;

  const output = ensureGrowthStylesheet(html);

  const closingMain = output.toLowerCase().lastIndexOf("</main>");
  if (closingMain === -1) throw new Error("Legacy page has no closing main");
  return `${output.slice(0, closingMain)}${growthModule(links)}${output.slice(closingMain)}`;
}

export function injectCommerceWidget(html) {
  if (html.includes(COMMERCE_MARKER)) return html;
  const output = ensureGrowthStylesheet(html);
  const closingBody = output.toLowerCase().lastIndexOf("</body>");
  if (closingBody === -1) throw new Error("Page has no closing body");
  return `${output.slice(0, closingBody)}${renderCommerceWidget()}${output.slice(closingBody)}`;
}

async function copyTree(source, destination, { exclude = new Set() } = {}) {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (exclude.has(entry.name)) continue;
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      await copyTree(from, to, { exclude: new Set() });
    } else if (entry.isFile()) {
      await mkdir(path.dirname(to), { recursive: true });
      await copyFile(from, to);
    }
  }
}

function sitemapXml() {
  const entries = PUBLIC_INDEXABLE_PATHS.map((pathname) => {
    const route = routeFor(pathname);
    return `  <url>\n    <loc>https://getgiffgaff.com${pathname}</loc>\n    <lastmod>${route.lastModified}</lastmod>\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
}

function shortLlmsText() {
  return [
    "# getgiffgaff",
    "",
    "> 独立第三方中文教程与销售服务站，不代表 giffgaff 官方。",
    "",
    ...PUBLIC_INDEXABLE_PATHS.map((pathname) => `- https://getgiffgaff.com${pathname}`),
    "",
  ].join("\n");
}

export async function buildReleaseArtifact(options = DEFAULT_OUTPUT) {
  const outputRoot =
    typeof options === "string" ? options : options?.outputRoot || DEFAULT_OUTPUT;
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });

  await copyTree(LEGACY_ROOT, outputRoot, {
    exclude: new Set(["capture.lock.json", "legacy-freeze-manifest.json"]),
  });

  const related = JSON.parse(
    await readFile(path.join(GROWTH_ROOT, "related-links.json"), "utf8"),
  );
  const freeze = JSON.parse(
    await readFile(path.join(LEGACY_ROOT, "legacy-freeze-manifest.json"), "utf8"),
  );
  if (freeze.schemaVersion !== "legacy-freeze-v2") {
    throw new Error("legacy freeze manifest must use legacy-freeze-v2");
  }
  const frozenByRoute = new Map(freeze.pages.map((page) => [page.route, page]));

  let injectedPages = 0;
  let commerceWidgets = 0;
  for (const route of LEGACY_ROUTES) {
    const filename = routeFile(outputRoot, route);
    const original = staticizeLegacyHtml(await readFile(filename, "utf8"));
    const links = related[route];
    let built = ensureGrowthStylesheet(original);
    if (links) built = injectRelatedTutorials(built, links);
    built = injectCommerceWidget(built);
    const frozen = frozenByRoute.get(route);
    if (!frozen) {
      throw new Error(`${route} is missing from the legacy freeze manifest`);
    }
    if (visibleTextSignature(built) !== frozen.visibleTextSha256) {
      throw new Error(`${route} visible copy changed outside the approved growth slot`);
    }
    if (
      !/^[a-f0-9]{64}$/.test(frozen.domSha256 || "") ||
      legacyDomSignature(built) !== frozen.domSha256
    ) {
      throw new Error(`${route} DOM changed outside the approved growth slot`);
    }
    if (links) injectedPages += 1;
    commerceWidgets += 1;
    await writeFile(filename, built);
  }

  for (const route of [...INDEXABLE_GROWTH_ROUTES, ...NOINDEX_GROWTH_ROUTES]) {
    const source = routeFile(GROWTH_ROOT, route);
    const destination = routeFile(outputRoot, route);
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(source, destination);
  }
  await copyTree(
    path.join(GROWTH_ROOT, "assets"),
    path.join(outputRoot, "growth-assets"),
  );

  for (const filename of ["robots.txt", "_worker.js", "worker-logic.js", "route-manifest.js"]) {
    await copyFile(path.join(PUBLIC_ROOT, filename), path.join(outputRoot, filename));
  }
  await writeFile(path.join(outputRoot, "sitemap.xml"), sitemapXml());
  await writeFile(path.join(outputRoot, "llms.txt"), shortLlmsText());

  return {
    outputRoot,
    legacyPages: LEGACY_ROUTES.length,
    growthPages: INDEXABLE_GROWTH_ROUTES.length + NOINDEX_GROWTH_ROUTES.length,
    injectedPages,
    commerceWidgets,
    indexablePages: PUBLIC_INDEXABLE_PATHS.length,
  };
}

const invokedDirectly =
  process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (invokedDirectly) {
  const outputRoot = process.argv[2]
    ? path.resolve(process.argv[2])
    : DEFAULT_OUTPUT;
  const report = await buildReleaseArtifact(outputRoot);
  process.stdout.write(`${JSON.stringify(report)}\n`);
}
