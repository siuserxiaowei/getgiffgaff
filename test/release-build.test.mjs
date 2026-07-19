import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  applyLegacySafetyOverrides,
  applyReleaseConversionOverrides,
  buildReleaseArtifact,
  ensureGrowthStylesheet,
  injectCommerceWidget,
  injectRelatedTutorials,
  injectVerifiedContactChannels,
  replaceRetiredWechatQr,
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
const POLICY_STATUS_ROUTES = new Set([
  "/privacy/",
  "/terms/",
  "/refund/",
  "/shipping/",
]);
const BLANKET_PAYMENT_DETERRENT =
  /(?:资料补齐前请勿付款|证据补齐前请勿付款|当前证据未齐，请勿付款|未核验[^。；]{0,24}(?:请勿|不要)付款|缺少(?:书面订单说明|逐批证据)时不要付款|请暂停付款|无法取得时请勿付款)/u;
const ACTIONABLE_PREPAYMENT_COPY =
  "付款前请联系客服核对当前库存、价格、卡片来源与激活状态、账号登记和控制权、余额、交付内容、售后边界及发货安排；无法核对关键事项时不要付款；以支付页面和书面确认信息为准。";

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
  assert.match(output, /英国卡咨询指南/);
  assert.match(output, /href=["']\/shop\/giffgaff-g0\//);
  assert.match(output, /href=["']\/shop\/giffgaff-g2\//);
  assert.equal(visibleTextSignature(output), visibleTextSignature(source));
  assert.equal(legacyDomSignature(output), legacyDomSignature(source));
  assert.equal(injectCommerceWidget(output), output);
});

test("verified Contact channels are a route-scoped, fail-closed release addition", async () => {
  const source = await readFile(routeFile(LEGACY_ROOT, "/contact/"), "utf8");
  const output = injectVerifiedContactChannels(source);
  assert.match(output, /data-release-slot=["']verified-contact-channels-v1["']/);
  assert.match(output, /https:\/\/u\.wechat\.com\/MOlSxFZ7nu5enWrw4HtvKC4/);
  assert.match(output, /https:\/\/t\.me\/xiaoyuhuai/);
  assert.equal(injectVerifiedContactChannels(output), output, "idempotent");
  assert.throws(
    () => injectVerifiedContactChannels("<main>no approved anchor</main>"),
    /no verified insertion anchor/,
  );
});

test("retired WeChat QR references are upgraded only in the release transform", () => {
  const html = '<img src="/contact/wechat-qr.png"><a href="/contact/wechat-qr.png">QR</a>';
  const output = replaceRetiredWechatQr(html);
  assert.doesNotMatch(output, /wechat-qr\.png/);
  assert.equal((output.match(/\/contact\/wechat-qr\.jpg/g) || []).length, 2);
  assert.equal(replaceRetiredWechatQr(output), output, "idempotent");
});

test("release-only conversion override reclassifies internal Contact navigation without touching real channels", () => {
  const internal = '<a href="/contact/" data-analytics-event="contact_click">先联系确认</a>';
  const external = '<a href="https://t.me/xiaoyuhuai" data-analytics-event="contact_click" data-analytics-channel="telegram">Telegram</a>';
  const output = applyReleaseConversionOverrides(`${internal}${external}`, "/privacy/", {
    expectedInternalContactClicks: 1,
  });

  assert.match(output, /href="\/contact\/" data-analytics-event="commerce_click"/u);
  assert.match(output, /data-analytics-event="contact_click" data-analytics-channel="telegram"/u);
  assert.throws(
    () => applyReleaseConversionOverrides(`${internal}${internal}`, "/privacy/", {
      expectedInternalContactClicks: 1,
    }),
    /1 time\(s\), found 2 \(internal Contact analytics marker\)/i,
  );
});

test("release conversion pages replace blanket payment deterrents with actionable confirmation", async (t) => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-conversion-copy-"));
  t.after(() => rm(outputRoot, { recursive: true, force: true }));
  await buildReleaseArtifact(outputRoot);

  const routes = [
    ...LEGACY_ROUTES,
    ...INDEXABLE_GROWTH_ROUTES,
    ...NOINDEX_GROWTH_ROUTES,
  ];
  for (const route of routes) {
    const html = await readFile(routeFile(outputRoot, route), "utf8");
    assert.doesNotMatch(
      html,
      /href=["']\/contact\/["'][^>]*data-analytics-event=["']contact_click["']/iu,
      `${route} internal Contact navigation is not a real contact click`,
    );
    if (POLICY_STATUS_ROUTES.has(route)) {
      assert.match(html, /如果具体订单需要依赖本页尚未确认的信息，请暂停付款/u, `${route} narrow policy warning`);
      assert.match(html, /无法取得时请勿付款/u, `${route} unresolved-order warning`);
    } else {
      assert.doesNotMatch(html, BLANKET_PAYMENT_DETERRENT, `${route} blanket payment deterrent`);
    }
  }

  for (const route of [
    "/",
    "/shop/",
    "/shop/giffgaff-g0/",
    "/shop/giffgaff-g2/",
    "/guides/1-order/",
  ]) {
    const html = await readFile(routeFile(outputRoot, route), "utf8");
    assert.match(
      html,
      new RegExp(ACTIONABLE_PREPAYMENT_COPY.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `${route} actionable prepayment guidance`,
    );
  }

  const llms = await readFile(path.join(outputRoot, "llms.txt"), "utf8");
  assert.doesNotMatch(llms, BLANKET_PAYMENT_DETERRENT, "llms.txt blanket payment deterrent");
  assert.match(llms, /付款前请联系客服核对/u);
  assert.match(llms, /支付页面和书面确认信息/u);
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
    expected = replaceRetiredWechatQr(expected);
    if (route === "/contact/") expected = injectVerifiedContactChannels(expected);
    expected = applyLegacySafetyOverrides(expected, route).html;
    expected = applyReleaseConversionOverrides(expected, route);
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
    if (asset.path === "contact/wechat-qr.png") {
      await assert.rejects(readFile(path.join(outputRoot, asset.path)), { code: "ENOENT" });
      continue;
    }
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
  assert.doesNotMatch(llms, BLANKET_PAYMENT_DETERRENT);
  assert.match(llms, /付款前请联系客服核对/);
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
