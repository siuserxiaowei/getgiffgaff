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

test("privacy status page accurately discloses de-identified event-level funnel analytics", async () => {
  const html = await readFile(routeFile("/privacy/"), "utf8");
  for (const fact of [
    "Cloudflare Analytics Engine",
    "不使用 Cookie",
    "canonical 路径",
    "来源类别",
    "事件名称",
    "联系渠道",
  ]) {
    assert.match(html, new RegExp(fact), fact);
  }
  assert.match(html, /不含直接身份标识的事件级页面与咨询漏斗数据/);
  assert.doesNotMatch(html, /匿名、汇总式/);
  assert.match(html, /不(?:记录|保存|收集).*IP/i);
  assert.match(html, /不(?:记录|保存|收集).*User-Agent/i);
  assert.match(html, /不(?:记录|保存|收集).*完整 referrer/i);
  assert.match(html, /不(?:记录|保存|收集).*手机号/i);
  assert.match(html, /page_view|页面访问/);
  assert.match(html, /contact_click|咨询点击/);
  assert.match(html, /微信、Telegram.*白名单联系渠道/);
  assert.doesNotMatch(html, /微信、Telegram 或快团团这类白名单联系渠道/);
  assert.match(html, /utm_source/);
  assert.match(html, /固定白名单/);
  const attributionSources = [
    "dist_partner",
    "dist_private_share",
    "dist_wechat_group",
    "dist_wechat_official",
    "dist_xiaohongshu",
    "paid_google",
    "paid_microsoft",
  ];
  for (const source of attributionSources) {
    assert.match(html, new RegExp(source), source);
  }
  const disclosedAllowlist = html.match(/当前白名单仅包括 ([\s\S]*?)；其他值/)?.[1];
  assert.ok(disclosedAllowlist, "attribution allowlist disclosure");
  assert.deepEqual(
    [...disclosedAllowlist.matchAll(/<code>([^<]+)<\/code>/g)].map((match) => match[1]),
    attributionSources,
    "privacy page exposes exactly the implemented attribution allowlist",
  );
  assert.match(html, /当前标签页的 <code>sessionStorage<\/code>/);
  assert.match(html, /关闭该标签页后不用于跨会话识别/);
  assert.match(html, /其他值不会写入统计载荷或浏览器存储/);
  assert.match(html, /不会记录完整查询参数/);
});
