import assert from "node:assert/strict";
import test from "node:test";

import {
  TRUST_PAGE_PATHS,
  isTrustPage,
  renderTrustPage,
} from "../public/trust-pages.js";

const CANONICAL_ORIGIN = "https://getgiffgaff.com";
const EXPECTED_PATHS = [
  "/contact/",
  "/about/",
  "/shipping/",
  "/returns/",
  "/editorial-policy/",
  "/disclaimer/",
  "/privacy/",
  "/terms/",
];

function occurrences(value, pattern) {
  return (value.match(pattern) || []).length;
}

function elementText(html, tagName) {
  const match = html.match(
    new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"),
  );
  return match?.[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function attribute(html, tagName, identifyingAttribute, identifyingValue, wantedAttribute) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>`, "gi");
  const tag = [...html.matchAll(pattern)]
    .map((match) => match[0])
    .find((candidate) => {
      const identifyingPattern = new RegExp(
        `${identifyingAttribute}=["']${identifyingValue}["']`,
        "i",
      );
      return identifyingPattern.test(candidate);
    });
  if (!tag) return undefined;
  return tag.match(new RegExp(`${wantedAttribute}=["']([^"']*)["']`, "i"))?.[1];
}

function jsonLdNodes(html) {
  const nodes = [];
  const pattern =
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(pattern)) {
    const document = JSON.parse(match[1]);
    if (Array.isArray(document?.["@graph"])) nodes.push(...document["@graph"]);
    else nodes.push(document);
  }

  return nodes;
}

function hasType(node, expectedType) {
  const types = Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]];
  return types.includes(expectedType);
}

test("registers exactly the formal trust and support pages", () => {
  assert.deepEqual([...TRUST_PAGE_PATHS], EXPECTED_PATHS);

  for (const pathname of EXPECTED_PATHS) {
    assert.equal(isTrustPage(pathname), true, pathname);
    assert.equal(typeof renderTrustPage(pathname), "string", pathname);
  }

  assert.equal(isTrustPage("/contact"), false);
  assert.equal(isTrustPage("/shop/"), false);
  assert.equal(renderTrustPage("/contact"), null);
  assert.equal(renderTrustPage("/shop/"), null);
});

test("renders unique, canonical and accessible standalone documents", () => {
  const titles = new Set();
  const descriptions = new Set();

  for (const pathname of EXPECTED_PATHS) {
    const html = renderTrustPage(pathname);
    const canonical = `${CANONICAL_ORIGIN}${pathname}`;
    const title = elementText(html, "title");
    const h1 = elementText(html, "h1");
    const description = attribute(html, "meta", "name", "description", "content");

    assert.ok(html.startsWith("<!doctype html>"), pathname);
    assert.ok(title, `${pathname}: title`);
    assert.ok(h1, `${pathname}: h1`);
    assert.ok(description, `${pathname}: description`);
    assert.equal(titles.has(title), false, `${pathname}: duplicate title`);
    assert.equal(descriptions.has(description), false, `${pathname}: duplicate description`);
    titles.add(title);
    descriptions.add(description);

    assert.equal(
      attribute(html, "link", "rel", "canonical", "href"),
      canonical,
      `${pathname}: canonical`,
    );
    assert.equal(
      attribute(html, "meta", "property", "og:url", "content"),
      canonical,
      `${pathname}: og:url`,
    );
    assert.equal(
      attribute(html, "meta", "property", "og:title", "content"),
      title,
      `${pathname}: og:title`,
    );
    assert.equal(
      attribute(html, "meta", "property", "og:description", "content"),
      description,
      `${pathname}: og:description`,
    );
    assert.equal(occurrences(html, /<main\b/gi), 1, `${pathname}: one main`);
    assert.equal(occurrences(html, /<h1\b/gi), 1, `${pathname}: one H1`);
    assert.match(html, /<a class="skip-link" href="#main-content">跳到主要内容<\/a>/);
    assert.match(html, /<main id="main-content" tabindex="-1">/);
    assert.match(html, /<nav\b[^>]*aria-label="主导航"/);
    assert.match(html, /<footer\b/);
    assert.doesNotMatch(html, /<meta\b[^>]*name=["']keywords["']/i);
    assert.doesNotMatch(html, /pages\.dev|Nano\s*Banana/i);
  }
});

test("uses the exact support-first Contact title and honest service boundaries", () => {
  const html = renderTrustPage("/contact/");

  assert.equal(elementText(html, "title"), "联系 getgiffgaff｜订单、发货与使用支持");
  assert.equal(elementText(html, "h1"), "联系 getgiffgaff：订单、发货与使用支持");
  assert.match(html, /仅处理已有订单与使用问题/);
  assert.match(html, /交易暂停/);
  assert.match(html, /待经营主体确认/);
  assert.match(html, /独立第三方/);
  assert.match(html, /非\s*giffgaff Limited\s*官方网站、官方客服或授权代表/);
  assert.match(html, /订单号/);
  assert.match(html, /经打码的问题截图/);
  assert.match(html, /不要发送/);
  assert.match(html, /密码/);
  assert.match(html, /短信验证码/);
  assert.match(html, /完整支付卡/);
  assert.match(html, /eSIM\s*二维码|LPA/i);
  assert.doesNotMatch(html, /确认\s*G[02]\s*库存|立即购买|下单购买/);
  assert.doesNotMatch(html, /服务时间[:：]\s*\d|小时内回复|SLA\s*[:：]?\s*\d/i);
});

test("publishes an independent Organization, WebSite and ContactPage graph", () => {
  const html = renderTrustPage("/contact/");
  const nodes = jsonLdNodes(html);
  const organization = nodes.find(
    (node) => hasType(node, "Organization") && node.name === "getgiffgaff",
  );
  const website = nodes.find((node) => hasType(node, "WebSite"));
  const contactPage = nodes.find((node) => hasType(node, "ContactPage"));
  const brand = nodes.find(
    (node) => hasType(node, "Brand") && node.name === "giffgaff",
  );

  assert.ok(organization?.["@id"]);
  assert.ok(website?.["@id"]);
  assert.ok(contactPage?.["@id"]);
  assert.ok(brand?.["@id"]);
  assert.equal(website.publisher?.["@id"], organization["@id"]);
  assert.equal(contactPage.isPartOf?.["@id"], website["@id"]);
  assert.equal(contactPage.about?.["@id"], brand["@id"]);

  const namedGiffgaff = nodes.filter(
    (node) => node.name?.trim().toLowerCase() === "giffgaff",
  );
  assert.ok(namedGiffgaff.length > 0);
  assert.ok(namedGiffgaff.every((node) => hasType(node, "Brand")));

  const serialized = JSON.stringify(nodes);
  assert.doesNotMatch(serialized, /"(?:sameAs|parentOrganization|legalName|address|telephone)"\s*:/);
  assert.doesNotMatch(serialized, /pages\.dev/i);
});

test("keeps identity and commercial facts explicitly pending instead of inventing them", () => {
  for (const pathname of EXPECTED_PATHS) {
    const html = renderTrustPage(pathname);
    assert.match(html, /独立第三方/, pathname);
    assert.match(html, /待经营主体确认/, pathname);
    assert.match(html, /交易暂停/, pathname);
    assert.doesNotMatch(html, /有限公司|统一社会信用代码|法定代表人|注册地址/, pathname);
    assert.doesNotMatch(html, /\b1[3-9]\d{9}\b|\b400[-\s]?\d{3}[-\s]?\d{4}\b/, pathname);
  }
});

test("privacy and terms accurately describe the current minimal collection state", () => {
  const privacy = renderTrustPage("/privacy/");
  const terms = renderTrustPage("/terms/");

  assert.equal(
    attribute(privacy, "meta", "name", "robots", "content"),
    "noindex, follow, noarchive",
  );
  assert.equal(
    attribute(terms, "meta", "name", "robots", "content"),
    "noindex, follow, noarchive",
  );
  assert.match(privacy, /当前未提供站内联系表单/);
  assert.match(privacy, /不上传号码、账户或支付资料/);
  assert.match(privacy, /原始查询参数、Cookie\s*或\s*Authorization/i);
  assert.match(privacy, /聊天渠道可能按其自身政策处理信息/);
  assert.match(terms, /当前网站主要提供公开信息与既有订单支持/);
  assert.match(terms, /不构成\s*giffgaff\s*的官方承诺/i);
  assert.match(terms, /交易暂停/);
});

test("editorial policy exposes a real corrections destination", () => {
  const html = renderTrustPage("/editorial-policy/");

  assert.match(html, /<section id="corrections"[^>]*>/);
  assert.match(html, /<h2>纠错流程<\/h2>/);
  assert.match(html, /href="\/editorial-policy\/#corrections"/);
  assert.match(html, /不使用虚构作者或审核人/);
  assert.match(html, /来源、适用条件、核验日期与失效边界/);
});
