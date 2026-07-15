import assert from "node:assert/strict";
import test from "node:test";

import {
  CORE_PAGES,
  CORE_PAGE_PATHS,
  renderCorePage,
} from "../public/core-pages.js";
import { routeFor } from "../public/route-manifest.js";
import worker, { CANONICAL_ORIGIN } from "../public/worker-logic.js";

const EXPECTED_LOCAL_REBUILDS = [
  "/",
  "/guides/",
  "/guides/0-intro/",
  "/guides/3-account/",
  "/guides/5-travel-data/",
  "/more/",
  "/qa/",
  "/qa/00-username/",
  "/qa/01-change-number/",
  "/qa/02-topup/",
  "/qa/03-reissue/",
  "/qa/04-choose-number/",
  "/qa/05-multiple-number/",
  "/qa/07-voicemail-switch/",
  "/qa/09-spread/",
];

function valueOfMeta(html, attribute, value) {
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\b${attribute}=["']${value.replace(":", "\\:")}["'])[^>]*\\bcontent=["']([^"']+)["'][^>]*>`, "i");
  return html.match(pattern)?.[1] || null;
}

function hrefs(html) {
  return [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)].map(
    (match) => match[1],
  );
}

function jsonLd(html) {
  return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => JSON.parse(match[1]));
}

test("rebuilds every former preview-dependent index route from one local registry", () => {
  assert.deepEqual([...CORE_PAGE_PATHS].sort(), [...EXPECTED_LOCAL_REBUILDS].sort());
  assert.equal(Object.keys(CORE_PAGES).length, 15);

  for (const pathname of CORE_PAGE_PATHS) {
    const route = routeFor(pathname);
    assert.equal(route?.indexPolicy, "index", pathname);
    assert.equal(route?.renderSource, "local", pathname);
  }
});

test("core documents are unique, accessible, source-backed and non-commercial", () => {
  const titles = new Set();
  const descriptions = new Set();

  for (const pathname of CORE_PAGE_PATHS) {
    const html = renderCorePage(pathname);
    const canonical = `${CANONICAL_ORIGIN}${pathname}`;
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
    const description = valueOfMeta(html, "name", "description");

    assert.ok(title, pathname);
    assert.ok(description, pathname);
    assert.equal(titles.has(title), false, `${pathname}: duplicate title`);
    assert.equal(descriptions.has(description), false, `${pathname}: duplicate description`);
    titles.add(title);
    descriptions.add(description);

    assert.match(html, /<a[^>]+class="skip-link"[^>]+href="#main-content"/i, pathname);
    assert.equal((html.match(/<main\b/gi) || []).length, 1, pathname);
    assert.equal((html.match(/<h1\b/gi) || []).length, 1, pathname);
    assert.match(html, new RegExp(`<link rel="canonical" href="${canonical.replaceAll(".", "\\.")}">`), pathname);
    assert.equal(valueOfMeta(html, "property", "og:url"), canonical, pathname);
    assert.ok(jsonLd(html).length >= 2, pathname);
    assert.doesNotThrow(() => jsonLd(html), pathname);

    for (const href of hrefs(html)) {
      const target = new URL(href, CANONICAL_ORIGIN);
      assert.doesNotMatch(target.pathname, /^\/(?:shop|guides\/(?:1-order|4-recharge-service))\//, pathname);
      assert.doesNotMatch(target.hostname, /(?:^|\.)ktt\b|kuaituantuan/i, pathname);
    }
    assert.doesNotMatch(html, /pages\.dev|\/_next\//i, pathname);
    assert.doesNotMatch(html, /10\s*[–—-]\s*14\s*英镑|5\s*张起卖|圆通包邮|顺丰到付|快团团/i, pathname);
    assert.doesNotMatch(html, /"@type"\s*:\s*"(?:Product|Offer|FAQPage)"/i, pathname);
    assert.match(html, /独立第三方|官方规则|本站风险建议|问题分流|选路建议|发布门禁|本站选路/, pathname);
  }
});

test("worker serves all rebuilt routes without touching the legacy preview", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    throw new Error("legacy preview must not be called");
  };
  try {
    for (const pathname of CORE_PAGE_PATHS) {
      const response = await worker.fetch(new Request(`${CANONICAL_ORIGIN}${pathname}`), {});
      const html = await response.text();
      assert.equal(response.status, 200, pathname);
      assert.equal(response.headers.get("x-getgiffgaff-render-mode"), "local-core-page", pathname);
      assert.match(html, /<main id="main-content"/i, pathname);
    }
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
  }
});

test("high-risk rebuilt pages stay inside their evidence boundaries", () => {
  const topup = renderCorePage("/qa/02-topup/");
  const payback = renderCorePage("/qa/09-spread/");
  const travel = renderCorePage("/guides/5-travel-data/");

  assert.match(topup, /不提供人工代充/);
  assert.doesNotMatch(topup, /到账\s*(?:SLA|保证)|外卡必过|代充入口/i);
  assert.match(payback, /不提供邀请码|不作为 Spread/);
  assert.doesNotMatch(payback, /[£¥￥]\s*\d|\d+\s*(?:英镑|积分)/i);
  assert.match(travel, /不返回任何静态数字/);
  assert.doesNotMatch(travel, /30\s*天|[£¥￥]\s*\d|\d+(?:\.\d+)?\s*(?:GBP|MB|GB)/i);
});
