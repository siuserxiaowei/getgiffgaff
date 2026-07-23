import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { GROWTH_PAGES } from "../site/growth/content-registry.js";
import { renderCommerceWidget } from "../site/growth/commerce-widget.js";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const OUTPUT_ROOT = path.join(ROOT, "site", "growth");
const ORIGIN = "https://getgiffgaff.com";
const SOCIAL_IMAGE = `${ORIGIN}/gg-card-hero.png`;

function socialImageFor(page) {
  if (!page.socialImage) return SOCIAL_IMAGE;
  return new URL(page.socialImage, ORIGIN).href;
}

const INDEXABLE_ANSWER_EVIDENCE = Object.freeze({
  "/guides/claude-identity-verification/": Object.freeze({
    kind: "official",
    sourceUrls: Object.freeze([
      "https://support.claude.com/en/articles/14328960-identity-verification-on-claude",
    ]),
  }),
  "/guides/claude-phone-verification/": Object.freeze({
    kind: "official",
    sourceUrls: Object.freeze([
      "https://support.claude.com/en/articles/8287232-verify-your-phone-number",
      "https://support.claude.com/en/articles/8461763-where-can-i-access-claude",
    ]),
  }),
  "/guides/claude-account-disabled-appeal/": Object.freeze({
    kind: "official",
    sourceUrls: Object.freeze([
      "https://support.claude.com/en/articles/8241253-safeguards-warnings-and-appeals",
      "https://support.claude.com/en/articles/13189465-log-in-to-your-claude-account",
    ]),
  }),
  "/guides/7-arrival-checklist/": Object.freeze({
    kind: "mixed",
    method: "本站验收与问题分流方法",
    sourceUrls: Object.freeze([
      "https://help.giffgaff.com/en/articles/240393-activating-your-giffgaff-sim",
      "https://help.giffgaff.com/en/articles/240847-everything-to-know-about-credit",
      "https://help.giffgaff.com/en/articles/639659-network-service-troubleshooting",
      "https://help.giffgaff.com/en/articles/246074-policy-to-manage-illegitimate-sms-usage",
    ]),
  }),
  "/guides/8-uk-sim-choice/": Object.freeze({
    kind: "official",
    sourceUrls: Object.freeze([
      "https://www.giffgaff.com/boiler-plate/terms",
      "https://www.ofcom.org.uk/mobile-coverage-checker?language=en",
      "https://help.giffgaff.com/en/articles/261570-switching-to-an-esim-with-giffgaff",
    ]),
  }),
  "/guides/uk-sim-at-heathrow/": Object.freeze({
    kind: "mixed",
    method: "本站机场落地通信分流方法",
    sourceUrls: Object.freeze([
      "https://www.heathrow.com/zh/at-the-airport/airport-services/uk-sims-and-phones",
      "https://help.giffgaff.com/en/articles/639659-network-service-troubleshooting",
      "https://www.ofcom.org.uk/mobile-coverage-checker?language=en",
    ]),
  }),
  "/guides/manchester-student-sim/": Object.freeze({
    kind: "mixed",
    method: "本站宿舍、校区与通勤地点比较方法",
    sourceUrls: Object.freeze([
      "https://www.manchester.ac.uk/study/international/finance-and-scholarships/communications/",
      "https://www.ofcom.org.uk/mobile-coverage-checker?language=en",
      "https://www.giffgaff.com/boiler-plate/terms",
    ]),
  }),
  "/guides/london-student-sim/": Object.freeze({
    kind: "mixed",
    method: "本站住宿、校区与地下通勤地点比较方法",
    sourceUrls: Object.freeze([
      "https://www.ofcom.org.uk/mobile-coverage-checker?language=en",
      "https://tfl.gov.uk/modes/tube/station-wifi",
      "https://www.giffgaff.com/boiler-plate/terms",
    ]),
  }),
  "/guides/9-number-balance-data-check/": Object.freeze({
    kind: "official",
    sourceUrls: Object.freeze([
      "https://help.giffgaff.com/en/articles/240393-activating-your-giffgaff-sim",
      "https://help.giffgaff.com/en/articles/240847-everything-to-know-about-credit",
      "https://help.giffgaff.com/en/articles/258872-guide-to-the-usage-statement",
    ]),
  }),
  "/guides/apn-settings/": Object.freeze({
    kind: "official",
    sourceUrls: Object.freeze([
      "https://help.giffgaff.com/en/articles/245215-internet-apn-settings-guide",
      "https://help.giffgaff.com/en/articles/639659-network-service-troubleshooting",
    ]),
  }),
  "/more/esim-new-phone/": Object.freeze({
    kind: "official",
    sourceUrls: Object.freeze([
      "https://help.giffgaff.com/en/articles/240399-continuing-to-use-your-esim-if-you-switch-to-a-different-phone",
      "https://help.giffgaff.com/en/articles/261570-switching-to-an-esim-with-giffgaff",
    ]),
  }),
  "/more/esim-deleted/": Object.freeze({
    kind: "official",
    sourceUrls: Object.freeze([
      "https://help.giffgaff.com/en/articles/240403-what-to-do-if-you-delete-your-esim",
      "https://help.giffgaff.com/en/articles/240393-activating-your-giffgaff-sim",
    ]),
  }),
  "/tools/keep-number-reminder/": Object.freeze({
    kind: "mixed",
    method: "本站提醒日期计算方法",
    sourceUrls: Object.freeze([
      "https://help.giffgaff.com/en/articles/242797-understanding-why-your-number-has-been-deactivated",
    ]),
  }),
  "/tools/china-roaming-cost/": Object.freeze({
    kind: "mixed",
    method: "本站漫游费用计算方法",
    sourceUrls: Object.freeze([
      "https://www.giffgaff.com/roaming/china",
      "https://help.giffgaff.com/en/articles/365501-giffgaff-travel-data-add-ons-and-how-they-work",
    ]),
  }),
  "/tools/g0-g2-total-cost/": Object.freeze({
    kind: "method",
    method: "本站公开的用户输入公式",
    sourceUrls: Object.freeze([]),
  }),
});

const GROWTH_SAFETY_OVERRIDE_MANIFEST = Object.freeze([
  Object.freeze({
    route: "/tools/g0-g2-total-cost/",
    issueId: "SAFE-GROWTH-COMMERCE-CLASSIFICATION",
    source:
      "G0 用于描述全新未激活卡，G2 用于描述本站当前有余额卡库存。它们不是 giffgaff 官方套餐或官方产品名称；每批卡状态、余额范围、价格和发货安排应在付款前确认。",
    replacement:
      "G0 和 G2 仅是本站内部分类，不能据此推断卡片状态、余额、库存或可售性。它们不是 giffgaff 官方套餐或官方产品名称；当前缺少 SKU 与交易证据，资料补齐前请勿付款。",
    expectedOccurrences: 1,
  }),
]);

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
    about: page.path.startsWith("/guides/claude-")
      ? { "@type": "Thing", name: "Claude account verification and recovery" }
      : { "@id": "https://www.giffgaff.com/#brand" },
    citation: page.sources.map((source) => source.url),
  };
  if (page.schemaType === "Article") {
    pageNode.author = { "@id": `${ORIGIN}/#organization` };
    pageNode.publisher = { "@id": `${ORIGIN}/#organization` };
    pageNode.mainEntityOfPage = url;
    pageNode.image = {
      "@type": "ImageObject",
      url: SOCIAL_IMAGE,
      width: 1400,
      height: 1000,
    };
    if (page.location) {
      pageNode.contentLocation = {
        "@type": "Place",
        name: page.location.name,
        address: {
          "@type": "PostalAddress",
          addressCountry: page.location.addressCountry,
        },
      };
    }
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

function header(page) {
  const purchase = page.commerceWidget === false
    ? ""
    : '<a class="btn btn-primary btn-compact" href="/shop/">点此购买</a>';
  return `<header class="site-header"><a class="brand" aria-label="getgiffgaff 首页" href="/"><span class="brand-mark">GG</span><span><strong>getgiffgaff</strong><small>英国手机卡购买与教程</small></span></a><nav aria-label="主导航"><a href="/shop/">手机卡</a><a href="/guides/">教程</a><a href="/more/">更多玩法</a><a href="/qa/">常见问题</a><a href="/contact/">联系我</a>${purchase}</nav></header>`;
}

function footer() {
  return `<footer class="site-footer"><div><h3>getgiffgaff</h3><p>面向中文用户的 giffgaff 英国手机卡购买与教程站。G0/G2 仅是本站分类；是否有货以及订单、支付和履约安排均须逐批核对。</p></div><div><h3>常用入口</h3><ul><li><a href="/guides/">中文教程</a></li><li><a href="/shop/">手机卡分类</a></li><li><a href="/contact/">微信或 Telegram 联系咨询</a></li></ul></div><p class="footer-warning">本站为独立第三方中文教程与销售服务站，不代表 giffgaff 官方。运营商规则与费用请以核验当日官方页面为准。</p></footer>`;
}

function classifySectionSourceLinks(html, sources) {
  let output = html;
  for (const source of sources) {
    output = output.replaceAll(
      `<a href="${source.url}"`,
      `<a data-source-role="official" href="${source.url}"`,
    );
  }
  return output;
}

function renderSources(page) {
  if (page.sources.length === 0) {
    return `<section class="growth-sources" id="official-sources"><h2>事实来源与审核状态</h2><p class="growth-review"><strong>当前状态：</strong>本站尚未取得足以发布完整政策的经营事实和负责人审核。本页只公开缺口，不以运营商条款代替本站政策。</p></section>`;
  }
  return `<section class="growth-sources" id="official-sources"><h2>官方来源、核验日期与方法边界</h2><p class="growth-review"><strong>核验日期：</strong>${escapeHtml(page.reviewedAt)}。页面由 getgiffgaff 作为 Organization 负责；没有真实个人资料时不使用虚构署名。竞品只用于发现问题，事实结论回到官方来源。</p><div class="growth-source-list">${page.sources
    .map(
      (source) => `<a data-source-role="official" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}<small>直接官方来源 · 核验 ${escapeHtml(page.reviewedAt)}</small></a>`,
    )
    .join("")}</div></section>`;
}

function explicitAnswerEvidence(page) {
  if (page.indexPolicy !== "index") return null;
  const contract = INDEXABLE_ANSWER_EVIDENCE[page.path];
  if (!contract) throw new Error(`${page.path} is missing an explicit answer evidence contract`);
  const sources = contract.sourceUrls.map((url) => {
    const matches = page.sources.filter((source) => source.url === url);
    if (matches.length !== 1) {
      throw new Error(
        `${page.path} answer evidence source ${url} must occur exactly once; found ${matches.length}`,
      );
    }
    return matches[0];
  });
  return { ...contract, sources };
}

function renderInlineEvidence(page) {
  const explicit = explicitAnswerEvidence(page);
  if (explicit) {
    const officialLinks = explicit.sources
      .map((source) => `<a data-source-role="official" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a>`)
      .join("；");
    if (explicit.kind === "method") {
      return `<p class="growth-inline-source" data-answer-evidence="method"><strong>答案依据：</strong>${escapeHtml(explicit.method)}；这段直接答案不引用运营商事实，也不证明库存、价格、支付或交易结果。<span>方法复核 · ${escapeHtml(page.reviewedAt)}</span></p>`;
    }
    if (explicit.kind === "mixed") {
      return `<p class="growth-inline-source" data-answer-evidence="mixed"><strong>答案依据：</strong>${escapeHtml(explicit.method)}；相关运营商事实见：${officialLinks}<span>本站方法 + 官方来源 · 核验 ${escapeHtml(page.reviewedAt)}</span></p>`;
    }
    return `<p class="growth-inline-source" data-answer-evidence="official"><strong>直接答案依据：</strong>${officialLinks}<span>官方来源 · 核验 ${escapeHtml(page.reviewedAt)}</span></p>`;
  }
  const answerSources = page.answerSources ?? page.sources.slice(0, 1);
  if (answerSources.length === 0 && page.sources.length === 0) {
    return `<p class="growth-inline-source"><strong>证据状态：</strong>缺少经营负责人确认的真实业务资料；本页不能替代完整政策。</p>`;
  }
  if (answerSources.length === 0) {
    return `<p class="growth-inline-source"><strong>依据类型：</strong>本站公开方法与用户输入公式；这段直接答案不引用运营商事实，也不证明库存、价格、支付或交易结果。<span>方法复核 · ${escapeHtml(page.reviewedAt)}</span></p>`;
  }
  return `<p class="growth-inline-source"><strong>直接答案依据：</strong>${answerSources
    .map((source) => `<a data-source-role="official" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a>`)
    .join("；")}<span>官方来源 · 核验 ${escapeHtml(page.reviewedAt)}</span></p>`;
}

export function applyGrowthSafetyOverrides(html, route) {
  let output = html;
  for (const rule of GROWTH_SAFETY_OVERRIDE_MANIFEST) {
    if (rule.route !== route) continue;
    const sourceOccurrences = output.split(rule.source).length - 1;
    const replacementOccurrences = output.split(rule.replacement).length - 1;
    const isUnapplied =
      sourceOccurrences === rule.expectedOccurrences && replacementOccurrences === 0;
    const isAlreadyApplied =
      sourceOccurrences === 0 && replacementOccurrences === rule.expectedOccurrences;
    if (!isUnapplied && !isAlreadyApplied) {
      throw new Error(
        `${route} expected growth safety source text ${JSON.stringify(rule.source)} `
        + `or replacement ${rule.expectedOccurrences} time(s), found source=${sourceOccurrences} `
        + `replacement=${replacementOccurrences} (${rule.issueId})`,
      );
    }
    if (isUnapplied) output = output.replaceAll(rule.source, rule.replacement);
  }
  return output;
}

function analyticsEventForHref(href) {
  if (href.startsWith("/shop/")) return "shop_click";
  return "commerce_click";
}

function renderRelated(page) {
  const heading = page.commerceHeading ?? "需要确认卡片分类、订单或售后？";
  const description = page.commerceDescription
    ?? "可通过微信或 Telegram 联系咨询；敏感账号资料不要发送给本站。联系入口不代表库存、订单、支付或履约已经确认。";
  return `<section class="growth-related" aria-labelledby="related-title"><h2 id="related-title">相关教程与下一步</h2><div class="growth-related-grid">${page.relatedRoutes
    .map((entry) => `<a href="${escapeHtml(entry.href)}" data-analytics-event="growth_related_click">${escapeHtml(entry.label)}</a>`)
    .join("")}</div></section><section class="growth-commerce"><div><strong>${escapeHtml(heading)}</strong><p>${escapeHtml(description)}</p></div><a class="btn btn-primary" href="${escapeHtml(page.commerceTarget.href)}" data-analytics-event="${analyticsEventForHref(page.commerceTarget.href)}">${escapeHtml(page.commerceTarget.label)}</a></section>`;
}

function disclosureFor(page) {
  if (page.path.startsWith("/guides/claude-")) {
    return "<strong>实体与范围说明：</strong>本站是独立第三方中文教程与销售服务站，不代表 Claude、Anthropic 或 giffgaff 官方。本文只解释官方验证与申诉路径；英国号码不能替代身份、年龄、地区资格或账号申诉。";
  }
  return "<strong>实体与范围说明：</strong>本站是独立第三方中文教程与销售服务站，不代表 giffgaff 官方。G0 / G2 是本站用于区分库存状态和交付方式的库存分类，不是 giffgaff 官方产品名。本文为独立原创内容，不复制竞品正文、截图或图片。";
}

export function renderGrowthPage(page) {
  const url = canonicalUrl(page);
  const socialImage = socialImageFor(page);
  const socialImageDimensions = page.socialImage
    ? '\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">'
    : "";
  const robots =
    page.indexPolicy === "index"
      ? "index, follow, max-snippet:-1, max-image-preview:large"
      : "noindex, follow, noarchive";
  const threshold = page.threshold
    ? `<p class="growth-insufficient"><strong>证据不足 / 开放索引门槛：</strong>${escapeHtml(page.threshold)}</p>`
    : "";
  const sections = page.sections
    .map(
      (section) => `<section id="${escapeHtml(section.id)}"><h2>${escapeHtml(section.title)}</h2>${classifySectionSourceLinks(section.html, page.sources)}</section>`,
    )
    .join("");
  const toc = page.sections
    .map((section) => `<li><a href="#${escapeHtml(section.id)}">${escapeHtml(section.title)}</a></li>`)
    .join("");
  const toolScript = page.tool
    ? '  <script type="module" src="/growth-assets/growth-ui.js"></script>\n'
    : "";
  const html = `<!doctype html>
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
  <meta property="og:image" content="${socialImage}">${socialImageDimensions}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(page.title)}">
  <meta name="twitter:description" content="${escapeHtml(page.description)}">
  <meta name="twitter:image" content="${socialImage}">
  <link rel="icon" href="/favicon.svg">
  <link rel="stylesheet" href="/assets/site.css">
  <link rel="stylesheet" href="/growth-assets/growth.css">
  <script type="application/ld+json">${JSON.stringify(schemaFor(page)).replace(/</g, "\\u003c")}</script>
</head>
<body>
  ${header(page)}
  <main class="growth-page">
    <article class="article-section">
      <header class="article-head">
        <p class="eyebrow">Original guide · ${escapeHtml(page.intent)}</p>
        <h1>${escapeHtml(page.h1)}</h1>
        <p>${escapeHtml(page.deck)}</p>
        <div class="growth-meta"><span>更新 ${escapeHtml(page.updatedAt)}</span><span>核验 ${escapeHtml(page.reviewedAt)}</span><span>${page.indexPolicy === "index" ? "原创教程/工具" : "方法预览 · noindex"}</span></div>
      </header>
${page.productIntroHtml ? `      ${page.productIntroHtml}\n` : ""}      <p class="growth-disclosure">${disclosureFor(page)}</p>
      <div class="legacy-answer"><strong>直接答案</strong><p>${escapeHtml(page.directAnswer)}</p></div>
      ${renderInlineEvidence(page)}
${threshold ? `      ${threshold}\n` : ""}
      <nav class="doc-toc" aria-label="本页目录"><strong>本页目录</strong><ol>${toc}<li><a href="#official-sources">官方来源与核验日期</a></li></ol></nav>
      <div class="article-body">${sections}</div>
      ${renderSources(page)}
      ${renderRelated(page)}
    </article>
  </main>
  ${footer()}
  ${page.commerceWidget === false ? '  <script type="module" src="/growth-assets/analytics.js"></script>' : renderCommerceWidget()}
${toolScript}</body>
</html>
`;
  return applyGrowthSafetyOverrides(html, page.path);
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
