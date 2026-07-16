import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { GROWTH_PAGES } from "../site/growth/content-registry.js";
import { renderCommerceWidget } from "../site/growth/commerce-widget.js";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const OUTPUT_ROOT = path.join(ROOT, "site", "growth");
const ORIGIN = "https://getgiffgaff.com";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function canonicalUrl(page) {
  return `${ORIGIN}${page.path}`;
}

function breadcrumbItems(page) {
  const items = [
    { name: "首页", item: `${ORIGIN}/` },
  ];
  if (page.path.startsWith("/guides/")) {
    items.push({ name: "教程", item: `${ORIGIN}/guides/` });
  } else if (page.path.startsWith("/research/")) {
    items.push({ name: "资料库", item: `${ORIGIN}/research/` });
  }
  items.push({ name: page.h1, item: canonicalUrl(page) });
  return items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    ...item,
  }));
}

function schemaFor(page) {
  const url = canonicalUrl(page);
  const pageNode = {
    "@type": page.schemaType,
    "@id": `${url}#page`,
    url,
    name: page.h1,
    headline: page.h1,
    description: page.description,
    inLanguage: "zh-CN",
    dateModified: page.updatedAt,
    isPartOf: { "@id": `${ORIGIN}/#website` },
    about: { "@id": "https://www.giffgaff.com/#brand" },
    citation: page.sources.map((source) => source.url),
  };
  if (page.schemaType === "Article") {
    pageNode.author = { "@id": `${ORIGIN}/#organization` };
    pageNode.publisher = { "@id": `${ORIGIN}/#organization` };
    pageNode.mainEntityOfPage = url;
  }
  if (page.schemaType === "WebApplication") {
    pageNode.applicationCategory = "UtilitiesApplication";
    pageNode.operatingSystem = "Any";
    pageNode.isAccessibleForFree = true;
  }
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${ORIGIN}/#organization`,
        name: "getgiffgaff",
        url: `${ORIGIN}/`,
      },
      {
        "@type": "WebSite",
        "@id": `${ORIGIN}/#website`,
        name: "getgiffgaff",
        url: `${ORIGIN}/`,
        publisher: { "@id": `${ORIGIN}/#organization` },
        inLanguage: "zh-CN",
      },
      {
        "@type": "Brand",
        "@id": "https://www.giffgaff.com/#brand",
        name: "giffgaff",
        url: "https://www.giffgaff.com/",
      },
      pageNode,
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems(page),
      },
    ],
  };
}

function header() {
  return `<header class="site-header"><a class="brand" aria-label="getgiffgaff 首页" href="/"><span class="brand-mark">GG</span><span><strong>getgiffgaff</strong><small>英国手机卡购买与教程</small></span></a><nav aria-label="主导航"><a href="/shop/">手机卡</a><a href="/guides/">教程</a><a href="/more/">更多玩法</a><a href="/qa/">常见问题</a><a href="/contact/">联系我</a><a class="btn btn-primary btn-compact" href="/shop/">点此购买</a></nav></header>`;
}

function footer() {
  return `<footer class="site-footer"><div><h3>getgiffgaff</h3><p>面向中文用户的 giffgaff 英国手机卡购买与教程站。现有 G0/G2 商品、微信小玉和快团团入口继续保留。</p></div><div><h3>常用入口</h3><ul><li><a href="/guides/">中文教程</a></li><li><a href="/shop/">手机卡商城</a></li><li><a href="/contact/">微信联系小玉</a></li></ul></div><p class="footer-warning">本站为独立第三方中文教程与销售服务站，不代表 giffgaff 官方。运营商规则与费用请以核验当日官方页面为准。</p></footer>`;
}

function renderSources(page) {
  return `<section class="growth-sources" id="official-sources"><h2>官方来源、核验日期与方法边界</h2><p class="growth-review"><strong>核验日期：</strong>${escapeHtml(page.reviewedAt)}。页面由 getgiffgaff 作为 Organization 负责；没有真实个人资料时不使用虚构署名。竞品只用于发现问题，事实结论回到官方来源。</p><div class="growth-source-list">${page.sources
    .map(
      (source) => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}<small>直接官方来源 · 核验 ${escapeHtml(page.reviewedAt)}</small></a>`,
    )
    .join("")}</div></section>`;
}

function renderInlineEvidence(page) {
  const primary = page.sources[0];
  return `<p class="growth-inline-source"><strong>主要依据：</strong><a href="${escapeHtml(primary.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(primary.label)}</a><span>官方来源 · 核验 ${escapeHtml(page.reviewedAt)}</span></p>`;
}

function analyticsEventForHref(href) {
  if (href.startsWith("/contact/")) return "contact_click";
  if (href.startsWith("/shop/")) return "shop_click";
  return "commerce_click";
}

function renderRelated(page) {
  return `<section class="growth-related" aria-labelledby="related-title"><h2 id="related-title">相关教程与下一步</h2><div class="growth-related-grid">${page.relatedRoutes
    .map((entry) => `<a href="${escapeHtml(entry.href)}" data-analytics-event="growth_related_click">${escapeHtml(entry.label)}</a>`)
    .join("")}</div></section><section class="growth-commerce"><div><strong>需要确认库存、订单或售后？</strong><p>保留现有微信小玉与快团团购买路径；敏感账号资料不要发送给本站。</p></div><a class="btn btn-primary" href="${escapeHtml(page.commerceTarget.href)}" data-analytics-event="${analyticsEventForHref(page.commerceTarget.href)}">${escapeHtml(page.commerceTarget.label)}</a></section>`;
}

export function renderGrowthPage(page) {
  const url = canonicalUrl(page);
  const robots =
    page.indexPolicy === "index"
      ? "index, follow, max-snippet:-1, max-image-preview:large"
      : "noindex, follow, noarchive";
  const threshold = page.threshold
    ? `<p class="growth-insufficient"><strong>证据不足 / 开放索引门槛：</strong>${escapeHtml(page.threshold)}</p>`
    : "";
  const sections = page.sections
    .map(
      (section) => `<section id="${escapeHtml(section.id)}"><h2>${escapeHtml(section.title)}</h2>${section.html}</section>`,
    )
    .join("");
  const toc = page.sections
    .map((section) => `<li><a href="#${escapeHtml(section.id)}">${escapeHtml(section.title)}</a></li>`)
    .join("");
  const toolScript = page.tool
    ? '<script type="module" src="/growth-assets/growth-ui.js"></script>'
    : "";
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(page.title)} | getgiffgaff</title>
  <meta name="description" content="${escapeHtml(page.description)}">
  <meta name="robots" content="${robots}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="${page.schemaType === "Article" ? "article" : "website"}">
  <meta property="og:locale" content="zh_CN">
  <meta property="og:site_name" content="getgiffgaff">
  <meta property="og:title" content="${escapeHtml(page.title)}">
  <meta property="og:description" content="${escapeHtml(page.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${ORIGIN}/gg-card-hero.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(page.title)}">
  <meta name="twitter:description" content="${escapeHtml(page.description)}">
  <meta name="twitter:image" content="${ORIGIN}/gg-card-hero.png">
  <link rel="icon" href="/favicon.svg">
  <link rel="stylesheet" href="/assets/site.css">
  <link rel="stylesheet" href="/growth-assets/growth.css">
  <script type="application/ld+json">${JSON.stringify(schemaFor(page)).replace(/</g, "\\u003c")}</script>
</head>
<body>
  ${header()}
  <main class="growth-page">
    <article class="article-section">
      <header class="article-head">
        <p class="eyebrow">Original guide · ${escapeHtml(page.intent)}</p>
        <h1>${escapeHtml(page.h1)}</h1>
        <p>${escapeHtml(page.deck)}</p>
        <div class="growth-meta"><span>更新 ${escapeHtml(page.updatedAt)}</span><span>核验 ${escapeHtml(page.reviewedAt)}</span><span>${page.indexPolicy === "index" ? "原创教程/工具" : "方法预览 · noindex"}</span></div>
      </header>
      <p class="growth-disclosure">本站是独立第三方中文教程与销售服务站，不代表 giffgaff 官方。本文为独立原创内容，不复制竞品正文、截图或图片。</p>
      <div class="legacy-answer"><strong>直接答案</strong><p>${escapeHtml(page.directAnswer)}</p></div>
      ${renderInlineEvidence(page)}
      ${threshold}
      <nav class="doc-toc" aria-label="本页目录"><strong>本页目录</strong><ol>${toc}<li><a href="#official-sources">官方来源与核验日期</a></li></ol></nav>
      <div class="article-body">${sections}</div>
      ${renderSources(page)}
      ${renderRelated(page)}
    </article>
  </main>
  ${footer()}
  ${renderCommerceWidget()}
  ${toolScript}
</body>
</html>`;
}

function localPath(pathname) {
  return path.join(OUTPUT_ROOT, pathname.slice(1), "index.html");
}

export async function buildGrowthPages() {
  const records = [];
  for (const page of GROWTH_PAGES) {
    const destination = localPath(page.path);
    const html = renderGrowthPage(page);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, html);
    records.push({
      path: page.path,
      title: page.title,
      description: page.description,
      intent: page.intent,
      updatedAt: page.updatedAt,
      reviewedAt: page.reviewedAt,
      sources: page.sources.map((source) => source.url),
      relatedRoutes: page.relatedRoutes.map((entry) => entry.href),
      commerceTarget: page.commerceTarget.href,
      indexPolicy: page.indexPolicy,
    });
  }
  await writeFile(
    path.join(OUTPUT_ROOT, "content-manifest.json"),
    `${JSON.stringify({ schemaVersion: "growth-frontmatter-v1", pages: records }, null, 2)}\n`,
  );
  return records;
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invoked === fileURLToPath(import.meta.url)) {
  buildGrowthPages()
    .then((records) => process.stdout.write(`built ${records.length} growth pages\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack || error}\n`);
      process.exitCode = 1;
    });
}
