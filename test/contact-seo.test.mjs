import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const CONTACT_CANONICAL = "https://getgiffgaff.com/contact/";
const EXPECTED_TITLE = "联系 getgiffgaff｜G0/G2 库存、下单与售后支持";
const EXPECTED_H1 = "联系 getgiffgaff：库存、下单与售后支持";
const WECHAT_URL = "https://u.wechat.com/MOlSxFZ7nu5enWrw4HtvKC4";
const TELEGRAM_URL = "https://t.me/xiaoyuhuai";
const OLD_WECHAT_URL = "https://u.wechat.com/EDGrPuicwOsumDF_m3vVpEI?s=3";

// This deliberately mirrors the important problems in the production Contact
// document while staying small enough for a focused Worker regression test.
const legacyContactHtml = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <title>联系我 · getgiffgaff</title>
    <meta name="description" content="getgiffgaff 联系方式。">
    <meta name="keywords" content="giffgaff客服,giffgaff官方客服,getgiffgaff官网">
    <link rel="canonical" href="https://getgiffgaff.com/contact/">
    <meta property="og:title" content="getgiffgaff">
    <meta property="og:description" content="giffgaff 中文教程与服务">
    <meta property="og:url" content="https://getgiffgaff.com/">
    <meta property="og:image" content="https://getgiffgaff.com/og-image.png">
  </head>
  <body>
    <header>
      <nav aria-label="主导航">
        <a href="/guides/">教程</a>
        <a href="https://nano-banana.example/">Nano Banana</a>
      </nav>
    </header>
    <main id="content">
      <main class="docs-content">
        <p class="doc-kicker">giffgaff 官方教程</p>
        <h1>联系我</h1>
        <p>扫码联系小玉。</p>
        <h3>下单前咨询</h3>
        <p>先确认库存。</p>
        <h3>售后排查</h3>
        <p>准备订单资料。</p>
        <a class="btn contact-action-button" href="/contact/"><span>确认 G0 库存</span></a>
        <a class="btn contact-action-button" href="/contact/"><span>确认 G2 库存</span></a>
      </main>
    </main>
    <footer>
      <span>getgiffgaff 官网</span>
      <a href="https://nano-banana.example/docs/">Nano Banana 服务</a>
    </footer>
    <script src="/_next/static/chunks/app.js" async></script>
    <script>self.__next_f = self.__next_f || []; self.__next_f.push([1, "legacy contact tree"]);</script>
  </body>
</html>`;

function parseAttributes(tag) {
  const attributes = new Map();
  const pattern = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

  for (const match of tag.matchAll(pattern)) {
    attributes.set(match[1].toLowerCase(), match[2] ?? match[3] ?? "");
  }

  return attributes;
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map(
    (match) => match[0],
  );
}

function metaContent(html, attributeName, attributeValue) {
  const tag = tags(html, "meta").find((candidate) => {
    const attributes = parseAttributes(candidate);
    return attributes.get(attributeName) === attributeValue;
  });

  return tag ? parseAttributes(tag).get("content") : undefined;
}

function canonicalHref(html) {
  const tag = tags(html, "link").find(
    (candidate) => parseAttributes(candidate).get("rel")?.toLowerCase() === "canonical",
  );

  return tag ? parseAttributes(tag).get("href") : undefined;
}

function elementText(html, tagName) {
  const match = html.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\/${tagName}>`, "i"));
  return match?.[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function jsonLdNodes(html) {
  const nodes = [];
  const pattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(pattern)) {
    const value = JSON.parse(match[1]);
    const documents = Array.isArray(value) ? value : [value];

    for (const document of documents) {
      if (Array.isArray(document?.["@graph"])) {
        nodes.push(...document["@graph"]);
      } else {
        nodes.push(document);
      }
    }
  }

  return nodes;
}

function hasType(node, expectedType) {
  const types = Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]];
  return types.includes(expectedType);
}

function referenceId(value) {
  if (typeof value === "string") return value;
  return value?.["@id"];
}

function references(value, expectedId) {
  const values = Array.isArray(value) ? value : [value];
  return values.some((candidate) => referenceId(candidate) === expectedId);
}

async function renderContact() {
  const html = await readFile(
    new URL("../site/legacy/contact/index.html", import.meta.url),
    "utf8",
  );
  return { html };
}

test("preserves the frozen indexable Contact support and commerce page", async (t) => {
  const { html } = await renderContact();

  await t.test("uses unique Contact metadata and a 1200x630 social image", () => {
    assert.equal(elementText(html, "title"), EXPECTED_TITLE);
    assert.equal(elementText(html, "h1"), EXPECTED_H1);

    const description = metaContent(html, "name", "description");
    assert.match(description ?? "", /G0\/G2/);
    assert.match(description ?? "", /库存/);
    assert.match(description ?? "", /下单/);
    assert.match(description ?? "", /售后/);

    assert.equal(canonicalHref(html), CONTACT_CANONICAL);
    assert.equal(metaContent(html, "property", "og:url"), CONTACT_CANONICAL);
    assert.equal(metaContent(html, "property", "og:title"), EXPECTED_TITLE);
    assert.match(metaContent(html, "property", "og:description") ?? "", /库存/);

    const ogImage = metaContent(html, "property", "og:image");
    assert.match(ogImage ?? "", /^https:\/\/getgiffgaff\.com\/contact\//);
    assert.match(ogImage ?? "", /\.(?:png|jpe?g|webp)$/i);
    assert.equal(metaContent(html, "property", "og:image:width"), "1200");
    assert.equal(metaContent(html, "property", "og:image:height"), "630");

    assert.equal(metaContent(html, "name", "keywords"), undefined);
  });

  await t.test("states the independent role and honest support boundaries", () => {
    assert.match(html, /独立第三方/);
    assert.match(html, /非\s*giffgaff Limited\s*官方网站、官方客服或授权代表/);
    assert.match(html, /(?:可以|可)协助/);
    assert.match(html, /(?:无法|不能)(?:代办|处理|承诺)/);
    assert.match(html, /订单号/);
    assert.match(html, /问题截图/);
  });

  await t.test("keeps verified contact channels outside the frozen source", () => {
    assert.doesNotMatch(html, new RegExp(`href=["']${WECHAT_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`));
    assert.doesNotMatch(html, new RegExp(`href=["']${TELEGRAM_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`));
    assert.doesNotMatch(html, /data-release-slot=["']verified-contact-channels-v1["']/);
    assert.doesNotMatch(html, new RegExp(OLD_WECHAT_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  });

  await t.test("publishes a conservative Organization, WebSite and ContactPage graph", () => {
    const nodes = jsonLdNodes(html);
    assert.ok(nodes.length > 0, "expected at least one valid JSON-LD document");

    const organization = nodes.find(
      (node) => hasType(node, "Organization") && /getgiffgaff/i.test(node.name ?? ""),
    );
    const website = nodes.find((node) => hasType(node, "WebSite"));
    const contactPage = nodes.find((node) => hasType(node, "ContactPage"));
    const brand = nodes.find(
      (node) => hasType(node, "Brand") && node.name?.toLowerCase() === "giffgaff",
    );

    assert.ok(organization?.["@id"], "expected an independent getgiffgaff Organization");
    assert.ok(website?.["@id"], "expected a WebSite entity");
    assert.ok(contactPage?.["@id"], "expected a ContactPage entity");
    assert.ok(brand?.["@id"], "expected giffgaff to be represented only as a Brand");
    assert.equal(referenceId(website.publisher), organization["@id"]);
    assert.equal(referenceId(contactPage.isPartOf), website["@id"]);
    assert.ok(references(contactPage.about, brand["@id"]));

    const exactGiffgaffEntities = nodes.filter(
      (node) => node.name?.trim().toLowerCase() === "giffgaff",
    );
    assert.ok(exactGiffgaffEntities.length > 0);
    assert.ok(exactGiffgaffEntities.every((node) => hasType(node, "Brand")));

    const serialized = JSON.stringify(nodes);
    assert.doesNotMatch(serialized, /pages\.dev/i);
    assert.doesNotMatch(serialized, /官方/);
    assert.doesNotMatch(serialized, /"(?:sameAs|parentOrganization)"\s*:/);
  });

  await t.test("preserves landmarks, modal accessibility and sitewide branding", () => {
    assert.equal(tags(html, "main").length, 1, "Contact must contain one main landmark");
    assert.equal(tags(html, "h3").length, 0, "Contact section headings should not skip h2");
    assert.match(html, /<h2\b[^>]*>快团团下单<\/h2>/i);
    assert.match(html, /<h2\b[^>]*>扫码确认库存<\/h2>/i);

    const qrImage = tags(html, "img").find((candidate) =>
      parseAttributes(candidate).get("class")?.split(/\s+/).includes("ktt-modal-qr"),
    );
    assert.ok(qrImage, "expected the Kuaituantuan modal image");
    assert.equal(parseAttributes(qrImage).get("width"), "720");
    assert.equal(parseAttributes(qrImage).get("height"), "540");

    const modalScript = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
      .map((match) => match[1])
      .find((source) => source.includes("ktt-giga-card"));
    assert.ok(modalScript, "expected a modal accessibility script");
    assert.match(modalScript, /keydown/);
    assert.match(modalScript, /Escape/);
    assert.match(modalScript, /document\.activeElement|returnFocus|previouslyFocused/i);
    assert.match(modalScript, /\.focus\(\)/);
    assert.match(
      modalScript,
      /event\.shiftKey\s*&&\s*\(document\.activeElement === first \|\| document\.activeElement === panel\)/,
    );

    assert.doesNotMatch(html, /Nano\s*Banana|nano-banana/i);
    assert.doesNotMatch(html, /giffgaff\s*官方教程/i);
    assert.doesNotMatch(html, /getgiffgaff\s*官网/i);
    assert.match(html, /giffgaff\s*独立第三方教程/i);
    assert.match(html, /getgiffgaff\s*独立服务站/i);
    assert.doesNotMatch(
      html,
      /<script\b[^>]*src=["']\/_next\/|self\.__next_f/,
      "Contact edge fallback must not let Next hydration restore legacy content",
    );
  });
});
