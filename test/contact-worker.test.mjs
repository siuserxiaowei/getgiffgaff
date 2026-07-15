import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import worker, {
  CANONICAL_ORIGIN,
  PUBLIC_INDEXABLE_PATHS,
} from "../public/worker-logic.js";

const pitfallsHtml = await readFile(
  new URL("../public/guides/6-pitfalls-page.txt", import.meta.url),
  "utf8",
);
const researchHtml = await readFile(
  new URL("../public/research/index-page.txt", import.meta.url),
  "utf8",
);

function countOccurrences(text, pattern) {
  return (text.match(pattern) || []).length;
}

function assetEnv() {
  return {
    ASSETS: {
      async fetch(request) {
        const pathname = new URL(request.url).pathname;
        if (pathname === "/guides/6-pitfalls-page.txt") {
          return new Response(pitfallsHtml, {
            headers: {
              "content-type": "text/plain; charset=utf-8",
              "x-robots-tag": "noindex",
            },
          });
        }
        if (pathname === "/research/index-page.txt") {
          return new Response(researchHtml, {
            headers: {
              "content-type": "text/plain; charset=utf-8",
              "x-robots-tag": "noindex",
            },
          });
        }
        return new Response("missing", { status: 404 });
      },
    },
  };
}

test("serves Contact locally without inventory UI or a network fallback", async () => {
  const originalFetch = globalThis.fetch;
  let networkCalls = 0;
  globalThis.fetch = async () => {
    networkCalls += 1;
    throw new Error("network must not be used");
  };

  try {
    const response = await worker.fetch(
      new Request(`${CANONICAL_ORIGIN}/contact/`),
      {},
    );
    const html = await response.text();

    assert.equal(networkCalls, 0);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-getgiffgaff-render-mode"), "local-trust-page");
    assert.equal(
      response.headers.get("x-robots-tag"),
      "index, follow, max-snippet:-1, max-image-preview:large",
    );
    assert.match(html, /<title>联系 getgiffgaff｜订单、发货与使用支持<\/title>/);
    assert.match(html, /<h1>联系 getgiffgaff：订单、发货与使用支持<\/h1>/);
    assert.equal(countOccurrences(html, /<main\b/gi), 1);
    assert.equal(countOccurrences(html, /<h1\b/gi), 1);
    assert.match(html, /仅处理已有订单与使用问题/);
    assert.match(html, /非 giffgaff Limited 官方网站、官方客服或授权代表/);
    assert.match(html, /账户密码/);
    assert.match(html, /短信验证码/);
    assert.match(html, /完整支付卡/);
    assert.match(html, /eSIM 二维码/);
    assert.doesNotMatch(html, /ktt-giga-card|快团团|客服小玉/i);
    assert.doesNotMatch(html, /确认\s*G[02]\s*库存|立即购买|下单购买/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("ordinary query variants redirect and unknown documents fail locally", async () => {
  const redirect = await worker.fetch(
    new Request(`${CANONICAL_ORIGIN}/contact/?from=test`),
    {},
  );
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.get("location"), `${CANONICAL_ORIGIN}/contact/`);

  const missing = await worker.fetch(
    new Request(`${CANONICAL_ORIGIN}/tutorial/`),
    {},
  );
  assert.equal(missing.status, 404);
  assert.equal(
    missing.headers.get("x-robots-tag"),
    "noindex, nofollow, noarchive",
  );
  assert.doesNotMatch(await missing.text(), /rel="canonical"|property="og:url"/i);
});

test("serves the pitfalls guide as an immutable same-deployment HTML source", async () => {
  const response = await worker.fetch(
    new Request(`${CANONICAL_ORIGIN}/guides/6-pitfalls/`),
    assetEnv(),
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-getgiffgaff-render-mode"), "local-html-asset");
  assert.equal(
    response.headers.get("x-robots-tag"),
    "index, follow, max-snippet:-1, max-image-preview:large",
  );
  assert.match(html, /giffgaff 使用避坑总览/);
  assert.match(html, /G0\/G2 不是官方产品名称/);
  assert.match(html, /不提供 G2 销售或推荐/);
  assert.match(html, /不要上传到群聊、网盘、第三方写卡站/);
  assert.doesNotMatch(html, /确认库存|点此购买|立即购买|快团团/i);
});

test("redirects local HTML assets to their canonical trailing slash", async () => {
  for (const pathname of ["/guides/6-pitfalls", "/research"]) {
    const response = await worker.fetch(
      new Request(`${CANONICAL_ORIGIN}${pathname}`),
      assetEnv(),
    );
    assert.equal(response.status, 301, pathname);
    assert.equal(response.headers.get("location"), `${CANONICAL_ORIGIN}${pathname}/`);
  }
});

test("keeps the research registry public to users but out of search indexes", async () => {
  const response = await worker.fetch(
    new Request(`${CANONICAL_ORIGIN}/research/`),
    assetEnv(),
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-getgiffgaff-render-mode"), "local-html-asset");
  assert.equal(
    response.headers.get("x-robots-tag"),
    "noindex, follow, noarchive",
  );
  assert.match(html, /giffgaff 中文资料库与竞品研究/);
  assert.match(html, /40 个独立竞品页面/);
  assert.match(html, /不把第三方文章换词后重新发布/);
});

test("the local guide directory already contains every evidence-led route", async () => {
  const response = await worker.fetch(
    new Request(`${CANONICAL_ORIGIN}/guides/`),
    {},
  );
  const html = await response.text();

  assert.equal(response.headers.get("x-getgiffgaff-render-mode"), "local-core-page");
  for (const pathname of [
    "/guides/0-intro/",
    "/guides/2-activate/",
    "/guides/3-usage/",
    "/guides/4-signal/",
    "/guides/5-travel-data/",
    "/guides/6-pitfalls/",
  ]) {
    assert.match(html, new RegExp(`href="${pathname}"`), pathname);
  }
});

test("generates one unique sitemap entry per index route", async () => {
  const response = await worker.fetch(
    new Request(`${CANONICAL_ORIGIN}/sitemap.xml`),
    {},
  );
  const xml = await response.text();

  assert.equal(response.headers.get("x-getgiffgaff-render-mode"), "manifest-sitemap");
  assert.equal(countOccurrences(xml, /<url>/g), PUBLIC_INDEXABLE_PATHS.length);
  assert.equal(countOccurrences(xml, /https:\/\/getgiffgaff\.com\/guides\/6-pitfalls\//g), 1);
  assert.equal(countOccurrences(xml, /https:\/\/getgiffgaff\.com\/research\//g), 0);
  assert.match(xml, /<lastmod>2026-07-15<\/lastmod>/);
});
