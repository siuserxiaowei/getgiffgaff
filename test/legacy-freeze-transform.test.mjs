import assert from "node:assert/strict";
import test from "node:test";

import {
  legacyDomSignature,
  navigationSignature,
  staticizeLegacyHtml,
  visibleTextSignature,
} from "../scripts/capture-legacy-site.mjs";

const FIXTURE = `<!doctype html><html lang="zh-CN"><head>
  <title>旧标题 | getgiffgaff</title>
  <meta name="description" content="旧描述">
  <link rel="canonical" href="https://getgiffgaff.com/">
  <meta property="og:url" content="https://getgiffgaff.com/">
  <link rel="stylesheet" href="/_next/static/chunks/site.css" data-precedence="next">
  <link rel="preload" as="script" href="/_next/static/chunks/runtime.js">
  <style>.legacy-card{color:#6d28d9}</style>
  <script src="/_next/static/chunks/runtime.js" async></script>
  <script defer src="https://static.cloudflareinsights.com/beacon.min.js/v1" data-cf-beacon='{"token":"edge-only"}'></script>
</head><body>
  <header><a class="brand" href="/"><strong>getgiffgaff</strong><small>英国手机卡购买与教程</small></a>
    <nav aria-label="主导航"><a href="/shop/">手机卡</a><a href="/guides/">教程</a><a href="/contact/">联系我</a></nav>
  </header>
  <main><h1><span>giffgaff 英国手机卡</span><span>购买中心</span></h1>
    <p class="legacy-card" style="font-weight:700">原来的正文必须完整保留。</p>
    <img src="/gg-card-hero.png" alt="giffgaff 卡片" width="1200" height="630">
    <section><h2>Nano Banana AI 订阅购买</h2><p>原来的关联服务文案继续保留。</p><a href="https://nano-banana.lol/">前往 Nano Banana</a></section>
  </main>
  <script>window.legacyWechat = { enabled: true };</script>
  <script>self.__next_f.push([1,"flight payload"])</script>
  <script id="getgiffgaff-brand-cleanup">new MutationObserver(() => {}).observe(document.documentElement)</script>
</body></html>`;

test("static capture removes only runtime dependencies and preserves legacy copy and navigation", () => {
  const beforeCopy = visibleTextSignature(FIXTURE, { applyRuntimeCleanup: true });
  const beforeNavigation = navigationSignature(FIXTURE);
  const html = staticizeLegacyHtml(FIXTURE, {
    route: "/",
    stylesheetPath: "/assets/site.css",
  });

  assert.doesNotMatch(html, /\/_next\/|self\.__next_f|getgiffgaff-brand-cleanup|cloudflareinsights|data-cf-beacon/);
  assert.match(html, /href="\/assets\/site\.css"/);
  assert.equal(visibleTextSignature(html), beforeCopy);
  assert.equal(navigationSignature(html), beforeNavigation);
  assert.match(html, /giffgaff 英国手机卡/);
  assert.match(html, /购买中心/);
  assert.match(html, /Nano Banana AI 订阅购买/);
  assert.match(html, /原来的关联服务文案继续保留/);
  assert.match(html, /href="https:\/\/nano-banana\.lol\/"[^>]*>前往 Nano Banana</);
  assert.doesNotMatch(html, /data-growth-slot=/);
});

test("static capture does not rewrite legacy title, description, H1, brand label, or CTA order", () => {
  const html = staticizeLegacyHtml(FIXTURE, {
    route: "/",
    stylesheetPath: "/assets/site.css",
  });
  assert.match(html, /<title>旧标题 \| getgiffgaff<\/title>/);
  assert.match(html, /<meta name="description" content="旧描述">/);
  assert.match(html, /<small>英国手机卡购买与教程<\/small>/);
  assert.ok(html.indexOf('href="/shop/"') < html.indexOf('href="/guides/"'));
  assert.doesNotMatch(html, /独立第三方中文站|giffgaff 中文教程.*英国手机卡购买/);
});

test("DOM freeze ignores only approved generated metadata and catches legacy markup mutations", () => {
  const html = staticizeLegacyHtml(FIXTURE, {
    route: "/",
    stylesheetPath: "/assets/site.css",
  });
  const signature = legacyDomSignature(html);

  const approvedAdditions = html.replace(
    "</head>",
    `<script type="application/ld+json">{"@context":"https://schema.org"}</script>
     <script src="https://static.cloudflareinsights.com/beacon.min.js/v1" data-cf-beacon='{"token":"new"}'></script>
     <link data-build="growth" rel="stylesheet" href="/growth-assets/growth.css">
     <!--$--><!-- React marker --></head>`,
  ).replace(
    "</main>",
    `<section class="growth-related-slot" data-growth-slot="related-tutorials-v1"><h2>相关教程</h2><a href="/tools/example/">新链接</a></section></main>`,
  ).replace(
    "</body>",
    `<aside data-growth-slot="wechat-buying-guide-v1"><a href="#wechat-buying-guide">微信咨询</a><section id="wechat-buying-guide"><h2>英国卡购买指南</h2></section><script type="module" src="/growth-assets/commerce-ui.js"></script></aside></body>`,
  );
  assert.equal(legacyDomSignature(approvedAdditions), signature);
  assert.equal(visibleTextSignature(approvedAdditions), visibleTextSignature(html));

  const mutations = [
    html.replace('href="/shop/"', 'href="/answers/"'),
    html.replace("font-weight:700", "font-weight:400"),
    html.replace("#6d28d9", "#000000"),
    html.replace("window.legacyWechat = { enabled: true };", "window.legacyWechat = { enabled: false };"),
    html.replace("/gg-card-hero.png", "/contact/wechat-qr.png"),
    html.replace('alt="giffgaff 卡片"', 'alt="其他图片"'),
    html.replace('<a href="/shop/">手机卡</a><a href="/guides/">教程</a>', '<a href="/guides/">教程</a><a href="/shop/">手机卡</a>'),
  ];
  for (const mutated of mutations) {
    assert.notEqual(legacyDomSignature(mutated), signature);
  }
});
