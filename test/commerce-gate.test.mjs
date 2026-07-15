import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import worker, {
  CANONICAL_ORIGIN,
  PUBLIC_INDEXABLE_PATHS,
} from "../public/worker-logic.js";
import { routeFor } from "../public/route-manifest.js";
import { sanitizeCommerceHtml } from "../public/commerce-gate.js";

const BLOCKED_COMMERCE_PATHS = new Set([
  "/shop/",
  "/shop/giffgaff-g0/",
  "/shop/giffgaff-g2/",
  "/guides/1-order/",
  "/guides/4-recharge-service/",
]);

const pitfallsHtml = await readFile(
  new URL("../public/guides/6-pitfalls-page.txt", import.meta.url),
  "utf8",
);
const researchHtml = await readFile(
  new URL("../public/research/index-page.txt", import.meta.url),
  "utf8",
);

function legacySalesFixture(pathname) {
  const canonical = `${CANONICAL_ORIGIN}${pathname}`;
  return new Response(`<!doctype html><html lang="zh-CN"><head>
    <title>giffgaff 英国手机卡购买与中文教程</title>
    <meta name="description" content="本站主卖 G0 新卡和 G2 有余额卡。">
    <link rel="canonical" href="${canonical}">
    <meta property="og:url" content="${canonical}">
    <script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: "G2",
      offers: { "@type": "Offer", price: "99" },
    })}</script>
  </head><body>
    <header><small>独立第三方购买与教程</small>
      <a href="/shop/">点此购买</a>
      <a href="/guides/1-order/">查看购买教程</a>
      <a href="https://ktt.example.invalid/order">快团团下单</a>
    </header>
    <main><h1>帮助页</h1><p>G2 通常含 10-14 英镑余额，优先推荐第一次购买或急用。</p>
      <div class="doc-cta"><h2>需要购买 giffgaff 手机卡？</h2><div><a href="/shop/giffgaff-g2/">立即购买</a></div></div>
      <section class="doc-faq"><h2>相关问题</h2><p>自助内容。</p></section>
      <a href="/guides/4-recharge-service/">人工代充值</a>
      <a href="/contact/">购买前联系确认库存</a>
    </main>
  </body></html>`, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

const env = {
  ASSETS: {
    async fetch(request) {
      const pathname = new URL(request.url).pathname;
      if (pathname === "/guides/6-pitfalls-page.txt") {
        return new Response(pitfallsHtml, {
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }
      if (pathname === "/research/index-page.txt") {
        return new Response(researchHtml, {
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }
      return new Response("not found", { status: 404 });
    },
  },
};

async function withLegacyFetch(callback) {
  const original = globalThis.fetch;
  globalThis.fetch = async (request) => legacySalesFixture(new URL(request.url).pathname);
  try {
    return await callback();
  } finally {
    globalThis.fetch = original;
  }
}

function hrefs(html) {
  return [...html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi)].map(
    (match) => match[1],
  );
}

test("commerceAllowed=false removes every new-customer funnel from indexable HTML", async () => {
  await withLegacyFetch(async () => {
    for (const pathname of PUBLIC_INDEXABLE_PATHS) {
      assert.equal(routeFor(pathname)?.commerceAllowed, false, pathname);
      const response = await worker.fetch(
        new Request(`${CANONICAL_ORIGIN}${pathname}`),
        env,
      );
      const html = await response.text();

      assert.equal(response.status, 200, pathname);
      for (const href of hrefs(html)) {
        const target = new URL(href, CANONICAL_ORIGIN);
        assert.equal(
          BLOCKED_COMMERCE_PATHS.has(target.pathname),
          false,
          `${pathname} leaks commerce href ${href}`,
        );
        assert.doesNotMatch(target.hostname, /(?:^|\.)ktt\b|kuaituantuan/i, pathname);
      }

      assert.doesNotMatch(html, /class=["'][^"']*\bdoc-cta\b/i, pathname);
      assert.doesNotMatch(html, /10\s*[–—-]\s*14\s*英镑|G2[^<。]{0,50}优先推荐/i, pathname);
      assert.doesNotMatch(html, />\s*(?:点此购买|进入手机卡商城|购买前联系确认|立即购买)\s*</i, pathname);
      assert.doesNotMatch(html, /独立第三方购买与教程/i, pathname);
      assert.doesNotMatch(html, /"@type"\s*:\s*"(?:Product|FAQPage)"/i, pathname);
    }
  });
});

test("the migration-only commerce sanitizer fails closed on a legacy fixture", async () => {
  const fixture = await legacySalesFixture("/qa/00-username/").text();
  const html = sanitizeCommerceHtml(
    fixture,
    routeFor("/qa/00-username/"),
    new Date("2026-07-15T12:00:00.000Z"),
  );

  assert.match(html, /href="\/answers\/"[^>]*data-commerce-paused="true"[^>]*>G0\/G2 风险说明<\/a>/);
  assert.match(html, /href="\/qa\/02-topup\/"[^>]*data-commerce-paused="true"[^>]*>充值与余额自助说明<\/a>/);
  assert.match(html, /href="\/contact\/"[^>]*data-commerce-paused="true"[^>]*>既有订单与使用支持<\/a>/);
  assert.match(html, /交易与推荐保持暂停/);
  assert.doesNotMatch(html, /10\s*[–—-]\s*14\s*英镑|立即购买|快团团下单/);
});
