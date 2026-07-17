import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildReleaseArtifact,
  injectCommerceWidget,
  injectRelatedTutorials,
} from "../scripts/build-release-artifact.mjs";
import {
  INDEXABLE_GROWTH_ROUTES,
  LEGACY_ROUTES,
  NOINDEX_GROWTH_ROUTES,
} from "../public/route-manifest.js";
import {
  legacyDomSignature,
  visibleTextSignature,
} from "../scripts/capture-legacy-site.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEGACY_ROOT = path.join(ROOT, "site", "legacy");
const GROWTH_SLOT = 'data-growth-slot="related-tutorials-v1"';
const COMMERCE_SLOT = 'data-growth-slot="wechat-buying-guide-v1"';

function routeFile(root, route) {
  return route === "/"
    ? path.join(root, "index.html")
    : path.join(root, route.slice(1), "index.html");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function collectSchemaTypes(value, types = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectSchemaTypes(item, types);
    return types;
  }
  if (!value || typeof value !== "object") return types;
  if (typeof value["@type"] === "string") types.push(value["@type"]);
  for (const nested of Object.values(value)) collectSchemaTypes(nested, types);
  return types;
}

function jsonLdDocuments(html) {
  return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => JSON.parse(match[1]));
}

test("related tutorial injection is append-only, exact, and idempotent", async () => {
  const source = await readFile(
    routeFile(LEGACY_ROOT, "/guides/0-intro/"),
    "utf8",
  );
  const links = [
    { label: "购买流程", href: "/guides/1-order/" },
    { label: "G0 与 G2 对比", href: "/answers/" },
    { label: "查看 G0", href: "/shop/giffgaff-g0/" },
  ];

  const output = injectRelatedTutorials(source, links);
  assert.equal((output.match(/data-growth-slot=/g) || []).length, 1);
  assert.match(output, /class=["']growth-related-slot["']/);
  assert.match(output, /相关教程与下一步/);
  for (const link of links) {
    assert.match(output, new RegExp(`href=["']${link.href.replaceAll("/", "\\/")}`));
  }
  assert.match(output, /href=["']\/growth-assets\/growth\.css["']/);
  assert.equal(visibleTextSignature(output), visibleTextSignature(source));
  assert.equal(legacyDomSignature(output), legacyDomSignature(source));
  assert.equal(injectRelatedTutorials(output, links), output);
});

test("commerce widget injection is append-only and idempotent", async () => {
  const source = await readFile(routeFile(LEGACY_ROOT, "/"), "utf8");
  const output = injectCommerceWidget(source);
  assert.equal((output.match(new RegExp(COMMERCE_SLOT, "g")) || []).length, 1);
  assert.match(output, /英国卡购买指南/);
  assert.match(output, /href=["']\/shop\/giffgaff-g0\//);
  assert.match(output, /href=["']\/shop\/giffgaff-g2\//);
  assert.equal(visibleTextSignature(output), visibleTextSignature(source));
  assert.equal(legacyDomSignature(output), legacyDomSignature(source));
  assert.equal(injectCommerceWidget(output), output);
});

test("release does not advertise unsupported Product rich results", async (t) => {
  const affectedRoutes = [
    "/",
    "/shop/",
    "/shop/giffgaff-g0/",
    "/shop/giffgaff-g2/",
  ];
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-schema-hotfix-"));
  t.after(() => rm(outputRoot, { recursive: true, force: true }));

  const sourceChecks = await Promise.all(
    affectedRoutes.map(async (route) =>
      (await readFile(routeFile(LEGACY_ROOT, route), "utf8")).includes('"@type":"Product"')
    ),
  );
  assert.equal(
    sourceChecks.every(Boolean),
    true,
    "frozen production source remains unchanged for auditability",
  );

  await buildReleaseArtifact(outputRoot);
  for (const route of affectedRoutes) {
    const html = await readFile(routeFile(outputRoot, route), "utf8");
    const types = jsonLdDocuments(html).flatMap((document) => collectSchemaTypes(document));
    assert.ok(types.length > 0, `${route} keeps valid JSON-LD`);
    assert.equal(types.includes("Product"), false, `${route} must not expose Product`);
    assert.doesNotMatch(html, /"sku":"g[02]-(?:new-card|credit-card)"/u, route);
  }
});

test("release build contains 34 frozen pages, 8 new pages, 8 related slots, and 42 commerce widgets", async (t) => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-release-"));
  t.after(() => rm(outputRoot, { recursive: true, force: true }));
  const report = await buildReleaseArtifact(outputRoot);

  assert.equal(report.legacyPages, 34);
  assert.equal(report.growthPages, 8);
  assert.equal(report.injectedPages, 8);
  assert.equal(report.commerceWidgets, 34);

  const related = JSON.parse(
    await readFile(path.join(ROOT, "site", "growth", "related-links.json"), "utf8"),
  );
  const freeze = JSON.parse(
    await readFile(path.join(LEGACY_ROOT, "legacy-freeze-manifest.json"), "utf8"),
  );
  assert.equal(freeze.schemaVersion, "legacy-freeze-v2");
  const frozenByRoute = new Map(freeze.pages.map((page) => [page.route, page]));

  for (const route of LEGACY_ROUTES) {
    const html = await readFile(routeFile(outputRoot, route), "utf8");
    const expectedSlots = Object.hasOwn(related, route) ? 2 : 1;
    assert.equal((html.match(/data-growth-slot=/g) || []).length, expectedSlots, route);
    assert.equal((html.match(new RegExp(COMMERCE_SLOT, "g")) || []).length, 1, route);
    assert.equal(
      visibleTextSignature(html),
      frozenByRoute.get(route).visibleTextSha256,
      `${route} legacy copy`,
    );
    assert.equal(
      legacyDomSignature(html),
      frozenByRoute.get(route).domSha256,
      `${route} legacy DOM`,
    );
    assert.doesNotMatch(html, /(?:src|href)=["']\/_next\//i, route);
  }

  for (const route of [...INDEXABLE_GROWTH_ROUTES, ...NOINDEX_GROWTH_ROUTES]) {
    const html = await readFile(routeFile(outputRoot, route), "utf8");
    assert.equal((html.match(new RegExp(COMMERCE_SLOT, "g")) || []).length, 1, route);
    assert.doesNotMatch(html, /(?:src|href)=["']\/_next\//i, route);
  }

  for (const filename of [
    "_worker.js",
    "worker-logic.js",
    "route-manifest.js",
    "sitemap.xml",
    "robots.txt",
    "growth-assets/growth.css",
    "growth-assets/growth-ui.js",
    "growth-assets/tools.js",
    "growth-assets/commerce-ui.js",
    "growth-assets/analytics.js",
  ]) {
    assert.ok((await readFile(path.join(outputRoot, filename))).length > 0, filename);
  }

  const sitemap = await readFile(path.join(outputRoot, "sitemap.xml"), "utf8");
  assert.equal((sitemap.match(/<url>/g) || []).length, 39);
  for (const route of NOINDEX_GROWTH_ROUTES) {
    assert.doesNotMatch(sitemap, new RegExp(route.replaceAll("/", "\\/")), route);
  }

  const robots = await readFile(path.join(outputRoot, "robots.txt"), "utf8");
  const sourceRobots = await readFile(path.join(ROOT, "public", "robots.txt"), "utf8");
  assert.equal(robots, sourceRobots, "release robots.txt must have one owned source");
  assert.match(robots, /User-agent:\s*OAI-SearchBot[\s\S]*?Allow:\s*\//i);
  assert.match(robots, /User-agent:\s*GPTBot[\s\S]*?Disallow:\s*\//i);
  assert.doesNotMatch(robots, /BEGIN Cloudflare Managed content/i);

  for (const asset of Object.values(freeze.assets)) {
    const source = await readFile(path.join(LEGACY_ROOT, asset.path));
    const built = await readFile(path.join(outputRoot, asset.path));
    assert.equal(sha256(built), sha256(source), asset.path);
  }
});
