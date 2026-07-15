import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import worker, { PUBLIC_INDEXABLE_PATHS } from "../public/worker-logic.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const ogImagePath = join(
  projectRoot,
  "public",
  "contact",
  "getgiffgaff-contact-og.png",
);

function occurrences(value, pattern) {
  return (value.match(pattern) || []).length;
}

function hasType(node, expectedType) {
  const types = Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]];
  return types.includes(expectedType);
}

const response = await worker.fetch(new Request("https://getgiffgaff.com/contact/"), {});
const html = await response.text();

assert.equal(response.status, 200);
assert.equal(response.headers.get("x-getgiffgaff-render-mode"), "local-trust-page");
assert.equal(response.headers.has("x-getgiffgaff-hotfix"), false);
assert.equal(
  response.headers.get("x-robots-tag"),
  "index, follow, max-snippet:-1, max-image-preview:large",
);
assert.match(html, /<title>联系 getgiffgaff｜订单、发货与使用支持<\/title>/);
assert.match(html, /<h1>联系 getgiffgaff：订单、发货与使用支持<\/h1>/);
assert.match(html, /<link rel="canonical" href="https:\/\/getgiffgaff\.com\/contact\/">/);
assert.match(html, /<meta property="og:url" content="https:\/\/getgiffgaff\.com\/contact\/">/);
assert.doesNotMatch(html, /<meta\b(?=[^>]*name=["']keywords["'])[^>]*>/i);
assert.match(html, /独立第三方信息与支持网站/);
assert.match(html, /非 giffgaff Limited 官方网站、官方客服或授权代表/);
assert.match(html, /仅处理已有订单与使用问题/);
assert.match(html, /新交易暂停/);
assert.match(html, /不要发送的敏感信息/);
assert.match(html, /账户密码/);
assert.match(html, /短信验证码/);
assert.match(html, /完整支付卡/);
assert.match(html, /eSIM 二维码/);
assert.equal(occurrences(html, /<main\b/gi), 1);
assert.equal(occurrences(html, /<h1\b/gi), 1);
assert.doesNotMatch(html, /ktt-giga-card|快团团|客服小玉/i);
assert.doesNotMatch(html, /确认\s*G[02]\s*库存|立即购买|下单购买/);

const renderedNanoBananaLinks = html.match(
  /<a\b(?=[^>]*href=["'][^"']*nano-banana[^"']*["'])[^>]*>/gi,
);
assert.equal(renderedNanoBananaLinks, null, "sitewide rendered navigation must omit Nano Banana");

const jsonLd = [...html.matchAll(
  /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
)].map((match) => JSON.parse(match[1]));
assert.ok(jsonLd.length > 0, "Contact should expose a valid entity graph");
const nodes = jsonLd.flatMap((document) => document?.["@graph"] || [document]);
const organization = nodes.find(
  (node) => hasType(node, "Organization") && node.name === "getgiffgaff",
);
const website = nodes.find((node) => hasType(node, "WebSite"));
const contactPage = nodes.find((node) => hasType(node, "ContactPage"));
const brand = nodes.find(
  (node) => hasType(node, "Brand") && node.name === "giffgaff",
);
assert.ok(organization?.["@id"], "Contact should expose an independent Organization");
assert.equal(website?.publisher?.["@id"], organization["@id"]);
assert.equal(contactPage?.isPartOf?.["@id"], website?.["@id"]);
assert.equal(contactPage?.about?.["@id"], brand?.["@id"]);
const serializedJsonLd = JSON.stringify(nodes);
assert.doesNotMatch(serializedJsonLd, /pages\.dev/i);
assert.doesNotMatch(
  serializedJsonLd,
  /"(?:sameAs|parentOrganization|legalName|address|telephone)"\s*:/,
);

const ogImage = await readFile(ogImagePath);
assert.equal(ogImage.toString("ascii", 1, 4), "PNG");
assert.equal(ogImage.readUInt32BE(16), 1200, "Contact OG image width must be 1200");
assert.equal(ogImage.readUInt32BE(20), 630, "Contact OG image height must be 630");

for (const variant of [
  "http://getgiffgaff.com/contact/",
  "https://www.getgiffgaff.com/contact/",
  "https://getgiffgaff.com/contact",
]) {
  const redirect = await worker.fetch(new Request(variant), {});
  assert.ok([301, 308].includes(redirect.status), `${variant} must redirect permanently`);
  assert.equal(redirect.headers.get("location"), "https://getgiffgaff.com/contact/");
}

const sitemapResponse = await worker.fetch(
  new Request("https://getgiffgaff.com/sitemap.xml"),
  {},
);
const sitemap = await sitemapResponse.text();
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.equal(sitemapUrls.length, PUBLIC_INDEXABLE_PATHS.length);
assert.equal(new Set(sitemapUrls).size, PUBLIC_INDEXABLE_PATHS.length);
assert.deepEqual(
  sitemapUrls,
  PUBLIC_INDEXABLE_PATHS.map((pathname) => `https://getgiffgaff.com${pathname}`),
);
assert.equal(sitemapResponse.headers.has("x-robots-tag"), false);

console.log(
  `SEO edge verified: local non-commercial Contact metadata/entity/accessibility, ${PUBLIC_INDEXABLE_PATHS.length} manifest sitemap URLs, robots policy and canonical redirects pass`,
);
