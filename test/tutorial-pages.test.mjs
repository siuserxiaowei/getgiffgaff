import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import worker, {
  PUBLIC_INDEXABLE_PATHS,
  reconcileSitemap,
} from "../public/worker-logic.js";
import { TUTORIAL_PAGES } from "../public/tutorial-pages.js";

const REQUIRED_TUTORIAL_PATHS = [
  "/guides/2-activate/",
  "/guides/3-usage/",
  "/more/03-esim/",
  "/more/04-esim-qrcode/",
  "/guides/4-signal/",
  "/answers/",
];

function occurrences(value, pattern) {
  return (value.match(pattern) || []).length;
}

function jsonLdEntries(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map(
    (match) => JSON.parse(match[1]),
  );
}

function isOfficialGiffgaffUrl(value) {
  const hostname = new URL(value).hostname;
  return hostname === "giffgaff.com" || hostname.endsWith(".giffgaff.com");
}

test("publishes six evidence-led tutorial routes from one content registry", () => {
  assert.deepEqual(Object.keys(TUTORIAL_PAGES).sort(), REQUIRED_TUTORIAL_PATHS.sort());

  for (const pathname of REQUIRED_TUTORIAL_PATHS) {
    assert.ok(PUBLIC_INDEXABLE_PATHS.includes(pathname), `${pathname} must be indexable`);
  }
});

test("keeps the static pillar guide synchronized with the tutorial registry", async () => {
  const pillar = await readFile(
    new URL("../public/guides/6-pitfalls-page.txt", import.meta.url),
    "utf8",
  );
  const deepGuides = pillar.match(/<section id="deep-guides">([\s\S]*?)<\/section>/)?.[1] ?? "";
  const linkedTutorials = [...deepGuides.matchAll(/href="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((pathname) => pathname in TUTORIAL_PAGES);

  assert.match(deepGuides, /下面 6 篇/);
  assert.deepEqual(linkedTutorials.sort(), Object.keys(TUTORIAL_PAGES).sort());
  assert.equal(new Set(linkedTutorials).size, Object.keys(TUTORIAL_PAGES).length);
});

test("each tutorial has unique intent, sources, revision metadata, and internal links", () => {
  const primaryKeywords = new Set();

  for (const [pathname, page] of Object.entries(TUTORIAL_PAGES)) {
    assert.ok(page.primaryKeyword, `${pathname}: primaryKeyword is required`);
    assert.equal(
      primaryKeywords.has(page.primaryKeyword),
      false,
      `${pathname}: duplicate primary keyword ${page.primaryKeyword}`,
    );
    primaryKeywords.add(page.primaryKeyword);

    assert.ok(page.answer?.length >= 40, `${pathname}: answer-first summary is too short`);
    assert.ok(page.sections?.length >= 4, `${pathname}: expected at least four sections`);
    assert.ok(page.sources?.length >= 2, `${pathname}: expected at least two sources`);
    assert.ok(
      page.sources.some(({ url }) => isOfficialGiffgaffUrl(url)),
      `${pathname}: an official giffgaff source is required`,
    );
    assert.ok(page.related?.length >= 3, `${pathname}: expected at least three related links`);
    assert.ok(page.author, `${pathname}: author is required`);
    assert.ok(page.reviewMethod, `${pathname}: review method is required`);
    assert.match(page.dateModified, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(page.revisions?.length >= 1, `${pathname}: revision log is required`);
  }
});

test("serves standalone, citation-ready tutorial HTML with safe entity markup", async () => {
  for (const pathname of REQUIRED_TUTORIAL_PATHS) {
    const response = await worker.fetch(
      new Request(`https://getgiffgaff.com${pathname}`),
      {},
    );
    const html = await response.text();

    assert.equal(response.status, 200, pathname);
    assert.equal(
      response.headers.get("x-robots-tag"),
      "index, follow, max-snippet:-1, max-image-preview:large",
      pathname,
    );
    assert.equal(response.headers.get("x-getgiffgaff-render-mode"), "local-tutorial-page");
    assert.match(html, new RegExp(`<link rel="canonical" href="https://getgiffgaff\\.com${pathname}">`));
    assert.match(html, new RegExp(`<meta property="og:url" content="https://getgiffgaff\\.com${pathname}">`));
    assert.equal(occurrences(html, /<h1\b/gi), 1, `${pathname}: expected one H1`);
    assert.equal(occurrences(html, /<main\b/gi), 1, `${pathname}: expected one main`);
    assert.doesNotMatch(html, /<meta\b[^>]*name=["']keywords["']/i, pathname);
    const schemas = jsonLdEntries(html);
    const article = schemas.find((entry) => entry["@type"] === "Article");
    const breadcrumbs = schemas.find((entry) => entry["@type"] === "BreadcrumbList");
    assert.ok(article, `${pathname}: Article schema is required`);
    assert.ok(breadcrumbs, `${pathname}: BreadcrumbList schema is required`);
    assert.equal(article.author?.["@id"], "https://getgiffgaff.com/#organization");
    assert.equal(article.author?.name, "getgiffgaff");
    assert.equal(article.publisher?.["@id"], "https://getgiffgaff.com/#organization");
    assert.equal(article.datePublished, undefined);
    assert.equal(article.dateModified, "2026-07-15");
    assert.equal(article.reviewedBy, undefined);
    assert.equal(article.about?.["@type"], "Brand");
    assert.equal(article.about?.url, "https://www.giffgaff.com/");

    const breadcrumbUrls = breadcrumbs.itemListElement.map(({ item }) => item);
    const expectedBreadcrumbs = pathname === "/answers/"
      ? ["https://getgiffgaff.com/", `https://getgiffgaff.com${pathname}`]
      : pathname.startsWith("/more/")
        ? ["https://getgiffgaff.com/", "https://getgiffgaff.com/more/", `https://getgiffgaff.com${pathname}`]
        : ["https://getgiffgaff.com/", "https://getgiffgaff.com/guides/", `https://getgiffgaff.com${pathname}`];
    assert.deepEqual(breadcrumbUrls, expectedBreadcrumbs, `${pathname}: breadcrumb hierarchy`);
    assert.match(html, /getgiffgaff 是独立第三方服务站/, pathname);
    assert.match(html, /编辑责任与复核方法/, pathname);
    assert.doesNotMatch(html, /undefined|"reviewedBy"/, pathname);
    assert.match(html, /官方来源/, pathname);
    assert.match(html, /href="\/guides\/6-pitfalls\/"/, pathname);
  }
});

test("serves tutorials only for safe public read methods", async () => {
  const pathname = "/guides/2-activate/";
  const head = await worker.fetch(
    new Request(`https://getgiffgaff.com${pathname}`, { method: "HEAD" }),
    {},
  );
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  assert.equal(
    head.headers.get("x-robots-tag"),
    "index, follow, max-snippet:-1, max-image-preview:large",
  );

  for (const method of ["POST", "PUT", "OPTIONS"]) {
    const response = await worker.fetch(
      new Request(`https://getgiffgaff.com${pathname}`, { method }),
      {},
    );
    assert.equal(response.status, 405, method);
    assert.equal(response.headers.get("allow"), "GET, HEAD", method);
    assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow, noarchive", method);
    assert.match(response.headers.get("cache-control") ?? "", /no-store/, method);
    assert.equal(await response.text(), "Method Not Allowed", method);
  }
});

test("eSIM QR boundary page never teaches credential extraction or upload", async () => {
  const response = await worker.fetch(
    new Request("https://getgiffgaff.com/more/04-esim-qrcode/"),
    {},
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /不提供抓取 LPA 凭证/);
  assert.match(html, /遇到这些要求，应立即停止/);
  assert.match(html, /要求上传二维码截图/);
  assert.doesNotMatch(html, /(?:第\s*[一二三四五六七八九十0-9]+\s*步|step\s*\d+).*(?:提取|导出|上传).*(?:LPA|Cookie|二维码)/i);
});

test("answers is a risk explanation with no commerce funnel or purchase recommendation", async () => {
  const response = await worker.fetch(
    new Request("https://getgiffgaff.com/answers/"),
    {},
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /搜索意图：风险解释 \/ 决策边界/);
  assert.match(html, /当前结论：不做购买推荐/);
  assert.match(html, /既有订单与使用支持/);
  assert.doesNotMatch(html, /href=["']\/(?:shop|guides\/1-order|guides\/4-recharge-service)\//i);
  assert.doesNotMatch(html, /商业调研|优先评估|确认\s*G[02]\s*库存|库存、下单/i);
});

test("redirects tutorial paths without a trailing slash in one worker hop", async () => {
  for (const pathname of REQUIRED_TUTORIAL_PATHS) {
    const withoutSlash = pathname.slice(0, -1);
    const response = await worker.fetch(
      new Request(`https://getgiffgaff.com${withoutSlash}`),
      {},
    );

    assert.equal(response.status, 301, withoutSlash);
    assert.equal(response.headers.get("location"), `https://getgiffgaff.com${pathname}`);
  }
});

test("reconciles every tutorial into the public sitemap exactly once", () => {
  const staleEntries = REQUIRED_TUTORIAL_PATHS.map(
    (pathname) => `<url><loc>https://getgiffgaff.com${pathname}</loc><lastmod>2026-06-11T00:00:00.000Z</lastmod></url>`,
  ).join("");
  const xml = reconcileSitemap(`<?xml version="1.0"?><urlset>${staleEntries}</urlset>`);

  assert.equal(occurrences(xml, /<url>/g), PUBLIC_INDEXABLE_PATHS.length);
  for (const pathname of REQUIRED_TUTORIAL_PATHS) {
    assert.equal(
      occurrences(xml, new RegExp(`https:\\/\\/getgiffgaff\\.com${pathname}`, "g")),
      1,
      pathname,
    );
    const entry = xml.match(
      new RegExp(`<url><loc>https:\\/\\/getgiffgaff\\.com${pathname}<\\/loc>([\\s\\S]*?)<\\/url>`),
    )?.[0];
    assert.match(entry ?? "", /<lastmod>2026-07-15(?:T00:00:00\.000Z)?<\/lastmod>/, pathname);
  }
});
