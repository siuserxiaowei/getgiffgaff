import assert from "node:assert/strict";
import test from "node:test";

import { renderGrowthPage } from "../scripts/build-growth-pages.mjs";
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
      /<div class="legacy-answer">[\s\S]*?<\/div>\s*(<p class="growth-inline-source">[\s\S]*?<\/p>)/i,
    );
    assert.ok(answer, `${page.path} adjacent source block`);
    assert.match(answer[1], new RegExp(page.sources[0].url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(answer[1], new RegExp(page.reviewedAt));
    assert.match(answer[1], /官方(?:规则|资料|来源)/);
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
