import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { renderCommerceWidget } from "../site/growth/commerce-widget.js";
import { GROWTH_PAGES } from "../site/growth/content-registry.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE_ORIGIN = "https://getgiffgaff.com";
const OFFICIAL_HOSTS = new Set([
  "help.giffgaff.com",
  "www.giffgaff.com",
  "www.ofcom.org.uk",
]);

function attributes(value) {
  const result = new Map();
  for (const match of value.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    result.set(match[1].toLowerCase(), match[2] ?? match[3]);
  }
  return result;
}

function externalAnchors(html) {
  const anchors = [];
  for (const match of html.matchAll(/<a\b([^>]*)>/gi)) {
    const attrs = attributes(match[1]);
    const href = attrs.get("href");
    if (!href) continue;
    const url = new URL(href, SITE_ORIGIN);
    if (url.origin === SITE_ORIGIN) continue;
    anchors.push({ attrs, href, url });
  }
  return anchors;
}

function assertSafeExternalAnchors(html, label) {
  const anchors = externalAnchors(html);
  assert.ok(anchors.length > 0, `${label} has an external link`);

  for (const { attrs, href, url } of anchors) {
    assert.equal(attrs.get("target"), "_blank", `${label} ${href} opens explicitly`);
    const rel = new Set((attrs.get("rel") || "").toLowerCase().split(/\s+/).filter(Boolean));
    assert.ok(rel.has("noopener"), `${label} ${href} uses noopener`);
    assert.ok(rel.has("noreferrer"), `${label} ${href} uses noreferrer`);

    if (OFFICIAL_HOSTS.has(url.hostname)) {
      assert.equal(attrs.get("data-source-role"), "official", `${label} ${href} is official evidence`);
      for (const token of ["nofollow", "sponsored", "ugc"]) {
        assert.ok(!rel.has(token), `${label} ${href} must not mislabel official evidence as ${token}`);
      }
      continue;
    }

    if (["u.wechat.com", "t.me"].includes(url.hostname) || url.protocol === "mailto:") {
      assert.equal(
        attrs.get("data-link-role"),
        "contact-channel",
        `${label} ${href} is an external contact channel`,
      );
      continue;
    }

    assert.fail(`${label} has an unclassified external runtime link: ${href}`);
  }
}

test("all eight generated growth pages classify and secure runtime external links", async () => {
  for (const page of GROWTH_PAGES) {
    const filename = path.join(ROOT, "site", "growth", page.path.slice(1), "index.html");
    const html = await readFile(filename, "utf8");
    assertSafeExternalAnchors(html, page.path);
  }
});

test("commerce widget secures quick and detailed links to both contact destinations", () => {
  const html = renderCommerceWidget();
  assertSafeExternalAnchors(html, "commerce widget");
  const links = externalAnchors(html);
  assert.equal(links.length, 4, "widget has quick and detailed contact handoffs");
  assert.deepEqual(
    [...new Set(links.map(({ url }) => url.href))].sort(),
    [
      "https://t.me/xiaoyuhuai",
      "https://u.wechat.com/MOlSxFZ7nu5enWrw4HtvKC4",
    ],
    "widget still has exactly two external contact destinations",
  );
  for (const destination of new Set(links.map(({ url }) => url.href))) {
    assert.equal(
      links.filter(({ url }) => url.href === destination).length,
      2,
      `${destination} has one quick and one detailed handoff`,
    );
  }
});
