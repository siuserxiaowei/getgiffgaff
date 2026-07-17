import assert from "node:assert/strict";
import test from "node:test";

import {
  applyGrowthSafetyOverrides,
  renderGrowthPage,
} from "../scripts/build-growth-pages.mjs";
import { GROWTH_PAGES } from "../site/growth/content-registry.js";

function graphNodes(html) {
  const match = html.match(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i,
  );
  assert.ok(match, "JSON-LD exists");
  const document = JSON.parse(match[1]);
  return document["@graph"] || [];
}

test("every growth direct answer carries an adjacent primary-source citation", () => {
  for (const page of GROWTH_PAGES) {
    const html = renderGrowthPage(page);
    const answer = html.match(
      /<div class="legacy-answer">[\s\S]*?<\/div>\s*(<p class="growth-inline-source"[^>]*>[\s\S]*?<\/p>)/i,
    );
    assert.ok(answer, `${page.path} adjacent source block`);
    const answerSources = page.answerSources ?? page.sources.slice(0, 1);
    if (answerSources.length === 0 && page.sources.length === 0) {
      assert.match(answer[1], /缺少经营负责人确认/);
      assert.match(answer[1], /不能替代完整政策/);
    } else if (answerSources.length === 0) {
      assert.match(answer[1], /本站公开(?:方法与用户输入公式|的用户输入公式)/);
      assert.match(answer[1], /不证明库存、价格、支付或交易结果/);
    } else {
      for (const source of answerSources) {
        assert.match(answer[1], new RegExp(source.url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      }
      assert.match(answer[1], new RegExp(page.reviewedAt));
      assert.match(answer[1], /官方(?:规则|资料|来源)/);
    }
  }
});

test("all five indexable growth answers declare route-specific evidence instead of a first-source fallback", () => {
  const expectations = new Map([
    [
      "/guides/7-arrival-checklist/",
      {
        kind: "mixed",
        method: /本站验收与问题分流方法/,
        sources: ["240393-activating", "240847-everything", "639659-network", "246074-policy"],
      },
    ],
    [
      "/guides/8-uk-sim-choice/",
      {
        kind: "official",
        sources: ["boiler-plate/terms", "ofcom.org.uk/mobile-coverage-checker", "261570-switching"],
      },
    ],
    [
      "/tools/keep-number-reminder/",
      {
        kind: "mixed",
        method: /本站提醒日期计算方法/,
        sources: ["242797-understanding"],
      },
    ],
    [
      "/tools/china-roaming-cost/",
      {
        kind: "mixed",
        method: /本站漫游费用计算方法/,
        sources: ["giffgaff.com/roaming/china", "365501-giffgaff-travel"],
      },
    ],
    [
      "/tools/g0-g2-total-cost/",
      {
        kind: "method",
        method: /本站公开的用户输入公式/,
        sources: [],
      },
    ],
  ]);
  const pages = GROWTH_PAGES.filter((page) => page.indexPolicy === "index");
  assert.equal(pages.length, expectations.size);

  for (const page of pages) {
    const expected = expectations.get(page.path);
    assert.ok(expected, `${page.path} route-specific answer evidence contract`);
    const html = renderGrowthPage(page);
    const evidence = html.match(
      /<p class="growth-inline-source" data-answer-evidence="([^"]+)">([\s\S]*?)<\/p>/i,
    );
    assert.ok(evidence, `${page.path} explicit adjacent evidence`);
    assert.equal(evidence[1], expected.kind, page.path);
    if (expected.method) assert.match(evidence[2], expected.method, page.path);
    for (const sourceFragment of expected.sources) {
      assert.match(evidence[2], new RegExp(sourceFragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), page.path);
    }
    assert.equal(
      (evidence[2].match(/data-source-role="official"/g) || []).length,
      expected.sources.length,
      `${page.path} exact answer source count`,
    );
  }
});

test("growth rendering removes unsupported positive commerce and fulfillment assertions", () => {
  const unsupported = /主卖|国内发货|浙江发货|圆通包邮|顺丰可到付|5 张起卖|5 张起发|适合第一次购买或急用|全新未激活|购买保障|省去首次充值麻烦|常规库存/u;
  for (const page of GROWTH_PAGES) {
    assert.doesNotMatch(renderGrowthPage(page), unsupported, page.path);
  }
});

test("growth commerce safety override is route-scoped, exact and fail closed", () => {
  const source =
    "G0 用于描述全新未激活卡，G2 用于描述本站当前有余额卡库存。它们不是 giffgaff 官方套餐或官方产品名称；每批卡状态、余额范围、价格和发货安排应在付款前确认。";
  const result = applyGrowthSafetyOverrides(source, "/tools/g0-g2-total-cost/");
  assert.doesNotMatch(result, /全新未激活|当前有余额卡库存/);
  assert.match(result, /当前缺少 SKU 与交易证据/);
  assert.equal(
    applyGrowthSafetyOverrides(result, "/tools/g0-g2-total-cost/"),
    result,
    "already-safe generated HTML remains idempotent",
  );
  assert.equal(
    applyGrowthSafetyOverrides(source, "/guides/7-arrival-checklist/"),
    source,
    "rule never applies to another route",
  );
  assert.throws(
    () => applyGrowthSafetyOverrides(
      source.replace("全新未激活卡", "未登记状态的卡"),
      "/tools/g0-g2-total-cost/",
    ),
    /expected growth safety source text/,
  );
});

test("every growth page shows the same independent-site and G0/G2 scope disclosure above its answer", () => {
  for (const page of GROWTH_PAGES) {
    const html = renderGrowthPage(page);
    const disclosure = html.match(/<p class="growth-disclosure">([\s\S]*?)<\/p>/i);
    assert.ok(disclosure, `${page.path} visible disclosure`);
    assert.match(disclosure[1], /独立第三方/);
    assert.match(disclosure[1], /不代表 giffgaff 官方/);
    assert.match(disclosure[1], /G0 \/ G2 是本站.*库存分类/);
    assert.match(disclosure[1], /不是 giffgaff 官方产品名/);
    assert.ok(
      html.indexOf(disclosure[0]) < html.indexOf('<div class="legacy-answer">'),
      `${page.path} disclosure must precede the direct answer`,
    );
  }
});

test("growth breadcrumbs never duplicate the current page as a fake tools hub", () => {
  for (const page of GROWTH_PAGES) {
    const html = renderGrowthPage(page);
    const breadcrumb = graphNodes(html).find((node) => node["@type"] === "BreadcrumbList");
    assert.ok(breadcrumb, `${page.path} breadcrumb`);
    const items = breadcrumb.itemListElement;
    assert.deepEqual(
      items.map((item) => item.position),
      items.map((_, index) => index + 1),
      `${page.path} positions`,
    );
    assert.equal(new Set(items.map((item) => item.item)).size, items.length, `${page.path} unique URLs`);
    assert.equal(items.at(-1).item, `https://getgiffgaff.com${page.path}`);
    if (page.path.startsWith("/tools/")) assert.equal(items.length, 2, page.path);
  }
});

test("growth funnels use the anonymous event interface without changing destinations", () => {
  for (const page of GROWTH_PAGES) {
    const html = renderGrowthPage(page);
    assert.match(html, /src="\/growth-assets\/analytics\.js"/);
    assert.match(html, /data-analytics-event="growth_related_click"/);
    assert.match(html, /data-analytics-event="(?:commerce_click|contact_click|shop_click)"/);
    for (const related of page.relatedRoutes) {
      assert.match(html, new RegExp(`href="${related.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
    }
  }
});
