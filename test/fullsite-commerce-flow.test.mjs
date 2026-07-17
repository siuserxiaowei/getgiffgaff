import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { ROUTE_MANIFEST } from "../public/route-manifest.js";
import { buildReleaseArtifact } from "../scripts/build-release-artifact.mjs";

const COMMERCE_SLOT = 'data-growth-slot="wechat-buying-guide-v1"';
const WECHAT_URL = "https://u.wechat.com/EDGrPuicwOsumDF_m3vVpEI?s=3";
const INTERNAL_TARGETS = Object.freeze([
  "/shop/giffgaff-g0/",
  "/shop/giffgaff-g2/",
  "/guides/1-order/",
  "/contact/#ktt-giga-card",
]);
const REQUIRED_ASSETS = Object.freeze([
  "/contact/wechat-qr.png",
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

test("all 46 release routes expose one safe, complete WeChat purchase guide", async (t) => {
  const outputRoot = await mkdtemp(
    path.join(os.tmpdir(), "getgiffgaff-commerce-flow-"),
  );
  t.after(async () => rm(outputRoot, { recursive: true, force: true }));

  await buildReleaseArtifact(outputRoot);

  const routes = Object.keys(ROUTE_MANIFEST);
  assert.equal(routes.length, 46, "route manifest must contain all 46 public pages");

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

  for (const route of routes) {
    const html = await readFile(routeFile(outputRoot, route), "utf8");
    assert.equal(
      (html.match(new RegExp(COMMERCE_SLOT, "g")) || []).length,
      1,
      `${route} commerce slot count`,
    );

    const widget = widgetMarkup(html, route);
    assert.match(
      widget,
      /<h2\b[^>]*>\s*\u82f1\u56fd\u5361\u8d2d\u4e70\u6307\u5357\s*<\/h2>/i,
      `${route} dialog title`,
    );

    for (const href of [...INTERNAL_TARGETS, WECHAT_URL]) {
      assert.match(
        widget,
        new RegExp(`href=["']${escapeRegExp(href)}["']`, "i"),
        `${route} link ${href}`,
      );
    }

    for (const image of [
      "/contact/wechat-qr.png",
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
    assert.match(
      html,
      /href=["']\/growth-assets\/growth\.css["']/i,
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
