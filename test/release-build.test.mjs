import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  applyLegacySafetyOverrides,
  buildReleaseArtifact,
  ensureGrowthStylesheet,
  injectCommerceWidget,
  injectRelatedTutorials,
} from "../scripts/build-release-artifact.mjs";
import {
  INDEXABLE_GROWTH_ROUTES,
  LEGACY_ROUTES,
  NOINDEX_GROWTH_ROUTES,
  PUBLIC_INDEXABLE_PATHS,
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

function robotsGroups(value) {
  const groups = [];
  let agents = [];
  let directives = [];

  const flush = () => {
    if (agents.length > 0) groups.push({ agents, directives });
    agents = [];
    directives = [];
  };

  for (const rawLine of value.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) {
      if (directives.length > 0) flush();
      continue;
    }
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const field = line.slice(0, separator).trim().toLowerCase();
    const content = line.slice(separator + 1).trim();
    if (field === "user-agent") {
      if (directives.length > 0) flush();
      agents.push(content);
    } else if (agents.length > 0) {
      directives.push(`${field}:${content}`);
    }
  }
  flush();
  return groups;
}

function directivesFor(groups, agent) {
  const group = groups.find(({ agents }) => agents.includes(agent));
  assert.ok(group, `missing robots group for ${agent}`);
  return new Set(group.directives);
}

function plainText(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/\s+/g, " ")
    .trim();
}

function htmlTitle(html) {
  return plainText((html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1]);
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

test("release build contains 34 frozen pages, 12 growth pages, 9 related slots, and 46 commerce widgets", async (t) => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-release-"));
  t.after(() => rm(outputRoot, { recursive: true, force: true }));
  const report = await buildReleaseArtifact(outputRoot);

  assert.equal(report.legacyPages, 34);
  assert.equal(report.growthPages, 12);
  assert.equal(report.injectedPages, 9);
  assert.equal(report.commerceWidgets, 34);

  const related = JSON.parse(
    await readFile(path.join(ROOT, "site", "growth", "related-links.json"), "utf8"),
  );
  const freeze = JSON.parse(
    await readFile(path.join(LEGACY_ROOT, "legacy-freeze-manifest.json"), "utf8"),
  );
  assert.equal(freeze.schemaVersion, "legacy-freeze-v2");
  for (const route of LEGACY_ROUTES) {
    const html = await readFile(routeFile(outputRoot, route), "utf8");
    const source = await readFile(routeFile(LEGACY_ROOT, route), "utf8");
    let expected = ensureGrowthStylesheet(source);
    if (Object.hasOwn(related, route)) {
      expected = injectRelatedTutorials(expected, related[route]);
    }
    expected = injectCommerceWidget(expected);
    expected = applyLegacySafetyOverrides(expected, route).html;
    const expectedSlots = Object.hasOwn(related, route) ? 2 : 1;
    assert.equal((html.match(/data-growth-slot=/g) || []).length, expectedSlots, route);
    assert.equal((html.match(new RegExp(COMMERCE_SLOT, "g")) || []).length, 1, route);
    assert.equal(html, expected, `${route} only approved release transformations`);
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
  const groups = robotsGroups(robots);
  for (const agent of [
    "OAI-SearchBot",
    "ChatGPT-User",
    "Claude-SearchBot",
    "Claude-User",
    "PerplexityBot",
    "Perplexity-User",
  ]) {
    assert.deepEqual(directivesFor(groups, agent), new Set(["allow:/"]), agent);
  }
  for (const agent of ["GPTBot", "ClaudeBot", "Google-Extended"]) {
    assert.deepEqual(directivesFor(groups, agent), new Set(["disallow:/"]), agent);
  }
  assert.match(robots, /Google-Extended covers both some Gemini grounding and generative-AI training/i);
  assert.match(robots, /Content-Signal field is a non-standard policy signal/i);
  assert.doesNotMatch(robots, /BEGIN Cloudflare Managed content/i);

  for (const asset of Object.values(freeze.assets)) {
    const source = await readFile(path.join(LEGACY_ROOT, asset.path));
    const built = await readFile(path.join(outputRoot, asset.path));
    assert.equal(sha256(built), sha256(source), asset.path);
  }
});

test("llms.txt is a curated task index for exactly the 39 indexable pages", async (t) => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-llms-"));
  t.after(() => rm(outputRoot, { recursive: true, force: true }));
  await buildReleaseArtifact(outputRoot);

  const llms = await readFile(path.join(outputRoot, "llms.txt"), "utf8");
  assert.equal((llms.match(/^# /gm) || []).length, 1, "exactly one H1");
  assert.ok((llms.match(/^## /gm) || []).length >= 4, "task-oriented H2 sections");
  assert.doesNotMatch(llms, /^### /m, "flat task index needs no deeper headings");
  assert.match(llms, /独立第三方/);
  assert.match(llms, /不代表 giffgaff 官方/);
  assert.match(llms, /运营商规则/);
  assert.match(llms, /库存、价格/);
  assert.match(llms, /不保证.*(?:收录|排名|引用)/);
  assert.match(llms, /当前无已核验 SKU 或交易证据，请勿付款/);
  assert.match(llms, /联系入口不等于 SKU、支付或履约证据/);

  const entries = [...llms.matchAll(/^- \[([^\]]+)\]\((https:\/\/getgiffgaff\.com\/[^)]*)\)：([^\n]+)$/gm)]
    .map((match) => ({ title: match[1], url: match[2], purpose: match[3].trim() }));
  assert.equal(entries.length, 39, "one titled purpose entry per indexable page");
  assert.deepEqual(
    entries.map((entry) => new URL(entry.url).pathname).sort(),
    [...PUBLIC_INDEXABLE_PATHS].sort(),
  );

  for (const entry of entries) {
    const pathname = new URL(entry.url).pathname;
    const html = await readFile(routeFile(outputRoot, pathname), "utf8");
    assert.equal(entry.title, htmlTitle(html), `${pathname} exact HTML title`);
    assert.match(entry.purpose, /。$/, `${pathname} purpose ends as one sentence`);
    assert.equal((entry.purpose.match(/。/g) || []).length, 1, `${pathname} one-sentence purpose`);
  }

  for (const pathname of NOINDEX_GROWTH_ROUTES) {
    assert.ok(!llms.includes(`https://getgiffgaff.com${pathname}`), pathname);
  }
  await assert.rejects(
    readFile(path.join(outputRoot, "llms-full.txt")),
    { code: "ENOENT" },
    "retired llms-full must not be generated",
  );
});
