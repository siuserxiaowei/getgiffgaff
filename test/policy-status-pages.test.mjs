import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { GROWTH_PAGES } from "../site/growth/content-registry.js";
import {
  NOINDEX_GROWTH_ROUTES,
  ROUTE_MANIFEST,
} from "../public/route-manifest.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const POLICY_ROUTES = Object.freeze([
  "/privacy/",
  "/terms/",
  "/refund/",
  "/shipping/",
]);

function routeFile(route) {
  return path.join(ROOT, "site", "growth", route.slice(1), "index.html");
}

test("four consumer-policy paths are explicit noindex status pages", async () => {
  for (const route of POLICY_ROUTES) {
    assert.ok(NOINDEX_GROWTH_ROUTES.includes(route), route);
    assert.equal(ROUTE_MANIFEST[route]?.indexPolicy, "noindex", route);
    assert.equal(ROUTE_MANIFEST[route]?.sitemap, false, route);

    const page = GROWTH_PAGES.find((entry) => entry.path === route);
    assert.ok(page, `${route} registry page`);
    assert.equal(page.schemaType, "WebPage", route);
    assert.equal(page.commerceTarget.href, "/contact/", route);

    const html = await readFile(routeFile(route), "utf8");
    assert.match(html, /name="robots" content="noindex, follow, noarchive"/, route);
    assert.match(html, /信息待经营负责人确认/, route);
    assert.match(html, /不是完整(?:的)?(?:隐私政策|交易条款|退款政策|物流政策)/, route);
    assert.match(html, /请勿付款|暂停付款/, route);
    assert.doesNotMatch(
      html,
      /(?:七|7|十四|14|三十|30)天无理由|默认(?:退款|包邮)|承诺(?:退款|发货)|经营主体[:：]\s*getgiffgaff/,
      route,
    );
  }
});

test("policy status pages cannot silently become indexable", () => {
  const pages = GROWTH_PAGES.filter((entry) => POLICY_ROUTES.includes(entry.path));
  assert.equal(pages.length, POLICY_ROUTES.length);
  for (const page of pages) {
    assert.equal(page.indexPolicy, "noindex", page.path);
    assert.match(page.threshold, /经营负责人|真实流程|审核/, page.path);
    assert.equal(page.sources.length, 0, `${page.path} does not cite carrier policy as seller policy`);
  }
});
