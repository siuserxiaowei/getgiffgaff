import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { ROUTE_MANIFEST } from "../public/route-manifest.js";
import { buildReleaseArtifact } from "../scripts/build-release-artifact.mjs";

const COMMERCE_SLOT = 'data-growth-slot="wechat-buying-guide-v1"';
const WECHAT_URL = "https://u.wechat.com/MOlSxFZ7nu5enWrw4HtvKC4";
const TELEGRAM_URL = "https://t.me/xiaoyuhuai";
const OLD_WECHAT_URL = "https://u.wechat.com/EDGrPuicwOsumDF_m3vVpEI?s=3";
const QR_ASSETS = Object.freeze({
  "/contact/wechat-qr.jpg": "751f8055949c3ee5d13a69dae6eef3aeef925a9e6f8dda1ca00b48e0399e1b43",
  "/contact/telegram-qr.jpg": "9a6ed7d1e30acc7dc35d2dabe2e1078cd2cd0b3ceaecd7bf1d716fa5c1b1b3fa",
});
const INTERNAL_TARGETS = Object.freeze([
  "/shop/giffgaff-g0/",
  "/shop/giffgaff-g2/",
  "/guides/1-order/",
  "/contact/#ktt-giga-card",
]);
const REQUIRED_ASSETS = Object.freeze([
  "/contact/wechat-qr.jpg",
  "/contact/telegram-qr.jpg",
  "/contact/ktt-giga-card.png",
  "/growth-assets/growth.css",
  "/growth-assets/commerce-ui.js",
  "/growth-assets/analytics.js",
]);

function routeFile(root, route) {
  return route === "/"
    ? path.join(root, "index.html")
    : path.join(root, route.slice(1), "index.html");
}

function publicAssetFile(root, publicPath) {
  return path.join(root, publicPath.slice(1));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function widgetMarkup(html, route) {
  const matches = html.match(
    /<aside\b(?=[^>]*\bdata-growth-slot=["']wechat-buying-guide-v1["'])[^>]*>[\s\S]*?<\/aside>/gi,
  );
  assert.equal(matches?.length || 0, 1, `${route} commerce widget count`);
  return matches[0];
}

test("commerce-relevant routes expose one safe, complete contact and purchase guide", async (t) => {
  const outputRoot = await mkdtemp(
    path.join(os.tmpdir(), "getgiffgaff-commerce-flow-"),
  );
  t.after(async () => rm(outputRoot, { recursive: true, force: true }));

  await buildReleaseArtifact(outputRoot);

  const routes = Object.keys(ROUTE_MANIFEST);
  assert.equal(routes.length, 56, "route manifest must contain all 56 public pages");

  for (const target of INTERNAL_TARGETS) {
    const targetRoute = target.split("#", 1)[0];
    assert.ok(ROUTE_MANIFEST[targetRoute], `${targetRoute} must exist in route manifest`);
    await access(routeFile(outputRoot, targetRoute));
  }

  const contactHtml = await readFile(routeFile(outputRoot, "/contact/"), "utf8");
  assert.match(
    contactHtml,
    /\bid=["']ktt-giga-card["']/i,
    "Contact fast-group-buy fragment must resolve",
  );

  for (const asset of REQUIRED_ASSETS) {
    const assetFile = publicAssetFile(outputRoot, asset);
    await access(assetFile);
    assert.ok((await stat(assetFile)).size > 0, `${asset} must not be empty`);
  }
  for (const [asset, expectedSha256] of Object.entries(QR_ASSETS)) {
    const bytes = await readFile(publicAssetFile(outputRoot, asset));
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      expectedSha256,
      `${asset} must remain the exact owner-provided QR image`,
    );
  }

  assert.match(contactHtml, new RegExp(`href=["']${escapeRegExp(WECHAT_URL)}["']`, "i"));
  assert.match(contactHtml, new RegExp(`href=["']${escapeRegExp(TELEGRAM_URL)}["']`, "i"));
  assert.match(contactHtml, /src=["']\/contact\/wechat-qr\.jpg["']/i);
  assert.match(contactHtml, /src=["']\/contact\/telegram-qr\.jpg["']/i);
  assert.doesNotMatch(contactHtml, new RegExp(escapeRegExp(OLD_WECHAT_URL)));

  for (const route of routes) {
    const html = await readFile(routeFile(outputRoot, route), "utf8");
    assert.doesNotMatch(html, /(?:src|href)=["']\/contact\/wechat-qr\.png["']/i, `${route} stale WeChat QR asset`);
    const editorialOnly = [
      "/guides/claude-identity-verification/",
      "/guides/claude-account-disabled-appeal/",
    ].includes(route);
    assert.equal(
      (html.match(new RegExp(COMMERCE_SLOT, "g")) || []).length,
      editorialOnly ? 0 : 1,
      `${route} commerce slot count`,
    );

    if (editorialOnly) {
      assert.doesNotMatch(html, /先选你的问题，再联系咨询|付款前请联系客服核对当前库存/);
      assert.match(html, /英国号码不能替代身份、年龄、地区资格或账号申诉/);
      continue;
    }

    const widget = widgetMarkup(html, route);
    assert.match(
      widget,
      /<h2\b[^>]*>\s*先选你的问题，再联系咨询\s*<\/h2>/i,
      `${route} dialog title`,
    );

    for (const href of [...INTERNAL_TARGETS, WECHAT_URL, TELEGRAM_URL]) {
      assert.match(
        widget,
        new RegExp(`href=["']${escapeRegExp(href)}["']`, "i"),
        `${route} link ${href}`,
      );
    }

    for (const image of [
      "/contact/wechat-qr.jpg",
      "/contact/telegram-qr.jpg",
      "/contact/ktt-giga-card.png",
    ]) {
      assert.match(
        widget,
        new RegExp(`<img\\b[^>]*\\bsrc=["']${escapeRegExp(image)}["']`, "i"),
        `${route} image ${image}`,
      );
    }

    assert.doesNotMatch(
      widget,
      /<(?:form|input|textarea|select)\b/i,
      `${route} widget must not collect purchase or account data`,
    );
    assert.doesNotMatch(widget, new RegExp(escapeRegExp(OLD_WECHAT_URL)), `${route} old WeChat URL`);
    assert.doesNotMatch(
      widget,
      /资料未补齐前请勿付款|未齐时请勿付款|不得仅凭二维码或口头说明判断可购买/,
      `${route} global purchase deterrent copy`,
    );
    assert.match(
      widget,
      /付款前请联系客服核对当前库存、价格、卡片来源与激活状态/,
      `${route} factual pre-order contact guidance`,
    );
    assert.match(widget, /先选最方便的咨询方式/, `${route} quick channel chooser`);
    assert.match(widget, /平台手机号与账号问题/, `${route} platform-verification reason`);
    assert.match(widget, /短信 OTP、身份核验与官方申诉/, `${route} platform-verification branches`);
    assert.ok(
      widget.indexOf('class="commerce-boundary-first"')
        < widget.indexOf('class="commerce-quick-channels"'),
      `${route} screen-reader safety boundary precedes contact shortcuts`,
    );
    assert.match(widget, /英国号码不等于通过 KYC/, `${route} KYC boundary`);
    assert.match(widget, /同一手机可改用 Telegram/, `${route} same-device WeChat fallback`);
    assert.match(widget, /Telegram 内搜索 @xiaoyuhuai/, `${route} Telegram search fallback`);
    assert.match(widget, /当前设备没有微信时，可先通过 Telegram 核对/, `${route} KTT no-WeChat fallback`);
    assert.ok(
      widget.indexOf('class="commerce-quick-channels"')
        < widget.indexOf('class="commerce-choice-section"'),
      `${route} quick channels must precede the longer choice guide`,
    );

    for (const [channel, href] of [
      ["wechat", WECHAT_URL],
      ["telegram", TELEGRAM_URL],
    ]) {
      assert.match(
        widget,
        new RegExp(
          `<a\\b(?=[^>]*\\bhref=["']${escapeRegExp(href)}["'])(?=[^>]*\\bdata-analytics-event=["']contact_click["'])(?=[^>]*\\bdata-analytics-channel=["']${channel}["'])[^>]*>`,
          "i",
        ),
        `${route} ${channel} anonymous contact event`,
      );
      assert.equal(
        (
          widget.match(
            new RegExp(
              `<a\\b(?=[^>]*\\bhref=["']${escapeRegExp(href)}["'])(?=[^>]*\\bdata-analytics-event=["']contact_click["'])(?=[^>]*\\bdata-analytics-channel=["']${channel}["'])[^>]*>`,
              "gi",
            ),
          ) || []
        ).length,
        2,
        `${route} ${channel} quick and detailed contact handoffs`,
      );
    }
    for (const [entry, fallback] of [
      ["quick-wechat", "telegram"],
      ["quick-telegram", "wechat-qr"],
      ["quick-ktt", "telegram"],
    ]) {
      assert.match(
        widget,
        new RegExp(
          `<a\\b(?=[^>]*\\bdata-consultation-entry=["']${entry}["'])(?=[^>]*\\bdata-channel-fallback=["']${fallback}["'])[^>]*>`,
          "i",
        ),
        `${route} ${entry} fallback metadata`,
      );
    }
    assert.match(
      html,
      /href=["']\/growth-assets\/growth\.css\?v=[a-f0-9]{16}["']/i,
      `${route} growth stylesheet`,
    );
    assert.match(
      widget,
      /src=["']\/growth-assets\/commerce-ui\.js["']/i,
      `${route} commerce interaction script`,
    );
    assert.match(
      widget,
      /src=["']\/growth-assets\/analytics\.js["']/i,
      `${route} privacy-safe analytics script`,
    );
  }
});

test("only real external contact handoffs emit channel-qualified contact clicks", async (t) => {
  const outputRoot = await mkdtemp(
    path.join(os.tmpdir(), "getgiffgaff-contact-events-"),
  );
  t.after(async () => rm(outputRoot, { recursive: true, force: true }));

  await buildReleaseArtifact(outputRoot);
  for (const route of Object.keys(ROUTE_MANIFEST)) {
    const html = await readFile(routeFile(outputRoot, route), "utf8");
    const contactEvents = Array.from(
      html.matchAll(/<a\b[^>]*data-analytics-event=["']contact_click["'][^>]*>/gi),
      (match) => match[0],
    );
    for (const anchor of contactEvents) {
      assert.match(
        anchor,
        /href=["']https:\/\/(?:u\.wechat\.com|t\.me)\//i,
        `${route} contact_click must be a real external handoff`,
      );
      assert.match(
        anchor,
        /data-analytics-channel=["'](?:wechat|telegram)["']/i,
        `${route} contact_click must name its channel`,
      );
    }
  }
});
