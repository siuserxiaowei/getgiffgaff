import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import worker from "../public/worker-logic.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const imagePath = join(projectRoot, "public", "contact", "ktt-giga-card.png");
const ogImagePath = join(
  projectRoot,
  "public",
  "contact",
  "getgiffgaff-contact-og.png",
);

function anchorForLabel(html, label) {
  const labelIndex = html.indexOf(label);
  assert.notEqual(labelIndex, -1, `Missing label: ${label}`);

  const anchorStart = html.lastIndexOf("<a ", labelIndex);
  const anchorEnd = html.indexOf("</a>", labelIndex);
  assert.notEqual(anchorStart, -1, `Missing anchor start for ${label}`);
  assert.notEqual(anchorEnd, -1, `Missing anchor end for ${label}`);

  return html.slice(anchorStart, anchorEnd + 4);
}

const response = await worker.fetch(new Request("https://getgiffgaff.com/contact/"), {});
const html = await response.text();

assert.equal(response.status, 200);
assert.equal(response.headers.get("x-getgiffgaff-hotfix"), "contact-ktt-modal");
assert.equal(
  response.headers.get("x-robots-tag"),
  "index, follow, max-snippet:-1, max-image-preview:large",
);
assert.match(html, /<title>联系 getgiffgaff｜G0\/G2 库存、下单与售后支持<\/title>/);
assert.match(html, /<h1>联系 getgiffgaff：库存、下单与售后支持<\/h1>/);
assert.match(html, /<link rel="canonical" href="https:\/\/getgiffgaff\.com\/contact\/">/);
assert.match(html, /<meta property="og:url" content="https:\/\/getgiffgaff\.com\/contact\/">/);
assert.doesNotMatch(html, /<meta\b(?=[^>]*name=["']keywords["'])[^>]*>/i);
assert.match(html, /独立第三方服务站/);
assert.match(html, /非 giffgaff Limited 官方网站、官方客服或授权代表/);
assert.match(html, /id="ktt-giga-card"/);
assert.match(html, /快团团下单/);
assert.match(html, /客服小玉/);
assert.match(html, /\/contact\/ktt-giga-card\.png/);
assert.match(html, /width="720" height="540"/);
assert.match(html, /event\.key === "Escape"/);

const renderedNanoBananaLinks = html.match(
  /<a\b(?=[^>]*href=["'][^"']*nano-banana[^"']*["'])[^>]*>/gi,
);
assert.equal(renderedNanoBananaLinks, null, "sitewide rendered navigation must omit Nano Banana");

const jsonLd = [...html.matchAll(
  /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
)].map((match) => JSON.parse(match[1]));
assert.ok(jsonLd.length > 0, "Contact should expose a valid entity graph");
const serializedJsonLd = JSON.stringify(jsonLd);
assert.doesNotMatch(serializedJsonLd, /pages\.dev/i);
assert.doesNotMatch(serializedJsonLd, /"(?:sameAs|parentOrganization)"\s*:/);

for (const label of ["确认 G0 库存", "确认 G2 库存"]) {
  const anchor = anchorForLabel(html, label);
  assert.match(anchor, /href="#ktt-giga-card"/, `${label} should open the modal`);
  assert.doesNotMatch(anchor, /href="\/contact\/"/, `${label} must not loop to /contact/`);
  assert.match(anchor, /aria-haspopup="dialog"/, `${label} should announce dialog behavior`);
}

const imageStat = await stat(imagePath);
assert.ok(imageStat.size > 10_000, "Kuaituantuan QR image should be present");

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
assert.equal(sitemapUrls.length, 34);
assert.equal(new Set(sitemapUrls).size, 34);
assert.equal(sitemapResponse.headers.has("x-robots-tag"), false);

console.log(
  "SEO edge verified: Contact metadata/entity/accessibility, 34 sitemap URLs, robots policy and canonical redirects pass",
);
