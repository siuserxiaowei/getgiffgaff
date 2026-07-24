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
  bindReleaseSearchChanges,
  buildReleaseArtifact,
  ensureGrowthStylesheet,
  ensureSearchFaviconLinks,
  growthStylesheetVersion,
  injectCommerceWidget,
  injectRelatedTutorials,
  injectVerifiedContactChannels,
  improveShopHeroImageAccessibility,
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
import {
  BAIDU_SITE_VERIFICATION_CODE,
  injectBaiduVerificationMeta,
} from "../scripts/search-platform-verification.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEGACY_ROOT = path.join(ROOT, "site", "legacy");
const HEAD_SHA = "0123456789abcdef0123456789abcdef01234567";
const BASELINE_SHA = "89abcdef0123456789abcdef0123456789abcdef";
const NEXT_SHA = "fedcba9876543210fedcba9876543210fedcba98";
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

test("release ships search-compatible favicon assets", async () => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-favicon-release-"));
  try {
    await buildReleaseArtifact(outputRoot);
    const expectations = new Map([
      ["favicon.svg", 1],
      ["favicon.ico", 100],
      ["favicon-48x48.png", 100],
      ["apple-touch-icon.png", 100],
    ]);
    for (const [filename, minimumBytes] of expectations) {
      const bytes = await readFile(path.join(outputRoot, filename));
      assert.ok(bytes.byteLength >= minimumBytes, `${filename} is populated`);
    }
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});

test("favicon declarations cover SVG, 48px PNG, ICO and Apple touch", () => {
  const source = '<head><link rel="icon" href="/favicon.svg"></head>';
  const output = ensureSearchFaviconLinks(source);
  assert.match(output, /href="\/favicon\.svg" type="image\/svg\+xml"/u);
  assert.match(output, /href="\/favicon-48x48\.png" type="image\/png" sizes="48x48"/u);
  assert.match(output, /rel="shortcut icon" href="\/favicon\.ico"/u);
  assert.match(output, /rel="apple-touch-icon" href="\/apple-touch-icon\.png" sizes="180x180"/u);
  assert.equal(ensureSearchFaviconLinks(output), output, "idempotent");
});

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

test("growth stylesheet versions are deterministic content fingerprints", () => {
  const before = Buffer.from(".growth-platform-grid{display:block}");
  const after = Buffer.from(".growth-platform-grid{display:grid}");
  assert.match(growthStylesheetVersion(before), /^[a-f0-9]{16}$/);
  assert.equal(growthStylesheetVersion(before), growthStylesheetVersion(Buffer.from(before)));
  assert.notEqual(growthStylesheetVersion(before), growthStylesheetVersion(after));
});

test("homepage Claude hub uses one fail-closed additive slot before products", async () => {
  const source = await readFile(routeFile(LEGACY_ROOT, "/"), "utf8");
  const links = JSON.parse(
    await readFile(path.join(ROOT, "site", "growth", "related-links.json"), "utf8"),
  )["/"];
  const options = {
    homepage: true,
    insertionAnchor: '<section class="gg-products">',
  };
  const output = injectRelatedTutorials(source, links, options);
  const slot = output.match(
    /<section\b(?=[^>]*data-growth-slot="related-tutorials-v1")[^>]*>[\s\S]*?<\/section>/i,
  )?.[0] || "";

  assert.equal((output.match(new RegExp(GROWTH_SLOT, "g")) || []).length, 1);
  assert.ok(output.indexOf('class="gg-answer-hub"') < output.indexOf(GROWTH_SLOT));
  assert.ok(output.indexOf(GROWTH_SLOT) < output.indexOf('class="gg-products"'));
  assert.match(slot, /先分清身份 KYC、手机号验证和账号申诉/);
  assert.match(slot, /不能恢复被禁用的账号/);
  assert.match(slot, /不保证 Claude 接受号码或发送验证码/);
  for (const route of [
    "/guides/claude-identity-verification/",
    "/guides/claude-phone-verification/",
    "/guides/claude-account-disabled-appeal/",
  ]) {
    assert.match(slot, new RegExp(`href="${route.replaceAll("/", "\\/")}"`));
  }
  assert.doesNotMatch(slot, /href="\/(?:shop|contact)\//);
  assert.equal(visibleTextSignature(output), visibleTextSignature(source));
  assert.equal(legacyDomSignature(output), legacyDomSignature(source));
  assert.equal(injectRelatedTutorials(output, links, options), output);
  assert.throws(
    () => injectRelatedTutorials(source, links, { ...options, insertionAnchor: '<section class="missing">' }),
    /no related tutorial insertion anchor/,
  );
  assert.throws(
    () => injectRelatedTutorials(
      source.replace('<section class="gg-products">', '<section class="gg-products"><section class="gg-products">'),
      links,
      options,
    ),
    /multiple related tutorial insertion anchors/,
  );
});

test("commerce widget injection is append-only and idempotent", async () => {
  const source = await readFile(routeFile(LEGACY_ROOT, "/"), "utf8");
  const output = injectCommerceWidget(source);
  assert.equal((output.match(new RegExp(COMMERCE_SLOT, "g")) || []).length, 1);
  assert.match(output, /先选你的问题，再联系咨询/);
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

test("shop hero image gets descriptive alt text only in the release artifact", () => {
  const frozen = '<div class="shop-hero__visual" aria-hidden="true"><img alt="" width="620" height="420" decoding="async" data-nimg="1" class="shop-hero__image" style="color:transparent" src="/gg-card-hero.png"/></div>';
  const output = improveShopHeroImageAccessibility(frozen, "/shop/");
  assert.match(output, /<div class="shop-hero__visual">/);
  assert.match(output, /<img alt="giffgaff 英国手机卡购买页面示意图"/);
  assert.doesNotMatch(output, /aria-hidden="true"/);
  assert.equal(improveShopHeroImageAccessibility(output, "/shop/"), output, "idempotent");
  assert.equal(improveShopHeroImageAccessibility(frozen, "/guides/1-order/"), frozen);
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

test("release-only top-up override gives account lookups to the dedicated guide", async () => {
  const source = await readFile(routeFile(LEGACY_ROOT, "/qa/02-topup/"), "utf8");
  const output = applyReleaseConversionOverrides(source, "/qa/02-topup/");

  assert.match(source, /giffgaff 如何充值\/查询余额\/查消费记录/u, "frozen source stays unchanged");
  assert.match(output, /<title>giffgaff 充值、voucher 与支付失败 · getgiffgaff<\/title>/u);
  assert.match(output, /<h1>giffgaff 充值、voucher 与支付失败<\/h1>/u);
  assert.match(
    output,
    /<meta name="description" content="giffgaff 充值、voucher 充值券与支付失败处理；说明自助充值与第三方代充的边界。"\/>/u,
  );
  assert.match(output, /<h2>银行卡或 PayPal 支付失败时先核对什么<\/h2>/u);
  assert.match(output, /<h2>第三方代充的服务边界<\/h2>/u);
  assert.match(
    output,
    /<a href="\/guides\/9-number-balance-data-check\/">手机号、Credit、套餐和流量查询教程<\/a>/u,
  );
  assert.doesNotMatch(output, /查询余额和消费记录/u);
  assert.doesNotMatch(output, /接收短信会扣余额吗？/u);
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

test("release build contains frozen pages, growth pages, semantic related slots, and commerce widgets", async (t) => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-release-"));
  t.after(() => rm(outputRoot, { recursive: true, force: true }));
  const report = await buildReleaseArtifact(outputRoot);

  assert.equal(report.legacyPages, 34);
  assert.equal(report.growthPages, 22);
  assert.equal(report.injectedPages, 17);
  assert.equal(report.commerceWidgets, 34);

  const related = JSON.parse(
    await readFile(path.join(ROOT, "site", "growth", "related-links.json"), "utf8"),
  );
  const growthCssVersion = growthStylesheetVersion(
    await readFile(path.join(ROOT, "site", "growth", "assets", "growth.css")),
  );
  const freeze = JSON.parse(
    await readFile(path.join(LEGACY_ROOT, "legacy-freeze-manifest.json"), "utf8"),
  );
  assert.equal(freeze.schemaVersion, "legacy-freeze-v2");
  for (const route of LEGACY_ROUTES) {
    const html = await readFile(routeFile(outputRoot, route), "utf8");
    const source = await readFile(routeFile(LEGACY_ROOT, route), "utf8");
    let expected = ensureGrowthStylesheet(source, growthCssVersion);
    if (Object.hasOwn(related, route)) {
      expected = injectRelatedTutorials(
        expected,
        related[route],
        route === "/"
          ? { homepage: true, insertionAnchor: '<section class="gg-products">' }
          : {},
      );
    }
    expected = injectCommerceWidget(expected);
    expected = replaceRetiredWechatQr(expected);
    expected = ensureSearchFaviconLinks(expected);
    expected = improveShopHeroImageAccessibility(expected, route);
    if (route === "/contact/") expected = injectVerifiedContactChannels(expected);
    expected = applyLegacySafetyOverrides(expected, route).html;
    expected = applyReleaseConversionOverrides(expected, route);
    if (route === "/") {
      expected = injectBaiduVerificationMeta(
        expected,
        BAIDU_SITE_VERIFICATION_CODE,
      );
    }
    const expectedSlots = Object.hasOwn(related, route) ? 2 : 1;
    assert.equal((html.match(/data-growth-slot=/g) || []).length, expectedSlots, route);
    const expectedWidgets = [
      "/guides/claude-identity-verification/",
      "/guides/claude-account-disabled-appeal/",
    ].includes(route) ? 0 : 1;
    assert.equal((html.match(new RegExp(COMMERCE_SLOT, "g")) || []).length, expectedWidgets, route);
    assert.equal(html, expected, `${route} only approved release transformations`);
    assert.doesNotMatch(html, /(?:src|href)=["']\/_next\//i, route);
    const imageTags = html.match(/<img\b[^>]*>/gi) || [];
    for (const image of imageTags) {
      assert.match(image, /\balt\s*=\s*["'][^"']*["']/i, `${route} image alt`);
    }
    if (route === "/shop/") {
      assert.match(html, /<img alt="giffgaff 英国手机卡购买页面示意图"[^>]*src="\/gg-card-hero\.png"/);
      assert.doesNotMatch(html, /<div class="shop-hero__visual" aria-hidden="true">/);
    }
  }

  for (const route of [...INDEXABLE_GROWTH_ROUTES, ...NOINDEX_GROWTH_ROUTES]) {
    const html = await readFile(routeFile(outputRoot, route), "utf8");
    const expectedWidgets = [
      "/guides/claude-identity-verification/",
      "/guides/claude-account-disabled-appeal/",
    ].includes(route) ? 0 : 1;
    assert.equal((html.match(new RegExp(COMMERCE_SLOT, "g")) || []).length, expectedWidgets, route);
    assert.doesNotMatch(html, /(?:src|href)=["']\/_next\//i, route);
  }

  for (const filename of [
    "_worker.js",
    "worker-logic.js",
    "route-manifest.js",
    "sitemap.xml",
    "release-search-changes.json",
    "robots.txt",
    "favicon.ico",
    "favicon.svg",
    "favicon-48x48.png",
    "apple-touch-icon.png",
    "growth-assets/growth.css",
    "growth-assets/growth-ui.js",
    "growth-assets/tools.js",
    "growth-assets/commerce-ui.js",
    "growth-assets/analytics.js",
  ]) {
    assert.ok((await readFile(path.join(outputRoot, filename))).length > 0, filename);
  }
  const workerLogic = await readFile(path.join(outputRoot, "worker-logic.js"), "utf8");
  assert.match(
    workerLogic,
    /const EDGE_HTML_CACHE_VERSION = "__GETGIFFGAFF_RELEASE_COMMIT__";/,
    "the build artifact stays unbound until its exact release commit is known",
  );

  const sitemap = await readFile(path.join(outputRoot, "sitemap.xml"), "utf8");
  assert.equal((sitemap.match(/<url>/g) || []).length, 49);
  for (const route of NOINDEX_GROWTH_ROUTES) {
    assert.doesNotMatch(sitemap, new RegExp(route.replaceAll("/", "\\/")), route);
  }
  const searchChanges = JSON.parse(
    await readFile(path.join(outputRoot, "release-search-changes.json"), "utf8"),
  );
  assert.equal(searchChanges.schema, "getgiffgaff_search_changes_v1");
  assert.deepEqual(searchChanges.changedPaths, []);
  assert.equal(searchChanges.sitemapSha256, sha256(sitemap));

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

test("release search-change binding records only routes whose sitemap lastmod changed", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-search-changes-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await buildReleaseArtifact(path.join(root, ".release"));
  const baselineManifest = (await readFile(
    path.join(ROOT, "public", "route-manifest.js"),
    "utf8",
  )).replace(
    'const HOMEPAGE_PLATFORM_HUB_DATE = "2026-07-20T06:51:08Z";',
    'const HOMEPAGE_PLATFORM_HUB_DATE = "2026-07-20T06:15:00Z";',
  );

  const report = await bindReleaseSearchChanges({
    cwd: root,
    baselineRef: BASELINE_SHA,
    candidateCommit: HEAD_SHA,
    runGit: async (spec) => {
      assert.equal(spec, `${BASELINE_SHA}:public/route-manifest.js`);
      return baselineManifest;
    },
  });
  assert.deepEqual(report.changedPaths, ["/"]);
  const artifact = JSON.parse(
    await readFile(path.join(root, ".release", "release-search-changes.json"), "utf8"),
  );
  assert.deepEqual(artifact.changedPaths, report.changedPaths);
  assert.match(artifact.sitemapSha256, /^[a-f0-9]{64}$/u);

  const statePath = path.join(root, ".seo-cache", "release-search-state.json");
  const state = JSON.parse(await readFile(statePath, "utf8"));
  assert.equal(state.baselineCommit, BASELINE_SHA);
  assert.equal(state.candidateCommit, HEAD_SHA);
  assert.deepEqual(state.changedPaths, report.changedPaths);
  assert.equal(state.submissionReceipt, null);
  await assert.rejects(
    () => readFile(path.join(root, ".release", "release-search-state.json")),
    { code: "ENOENT" },
  );

  const reused = await bindReleaseSearchChanges({
    cwd: root,
    baselineRef: HEAD_SHA,
    candidateCommit: HEAD_SHA,
    runGit: async () => {
      throw new Error("a matching candidate must reuse the pre-upload baseline");
    },
  });
  assert.equal(reused.reused, true);
  assert.equal(reused.source, BASELINE_SHA);
  assert.deepEqual(reused.changedPaths, report.changedPaths);

  const currentManifest = await readFile(
    path.join(ROOT, "public", "route-manifest.js"),
    "utf8",
  );
  const nextCandidate = await bindReleaseSearchChanges({
    cwd: root,
    baselineRef: HEAD_SHA,
    candidateCommit: NEXT_SHA,
    runGit: async (spec) => {
      assert.equal(spec, `${HEAD_SHA}:public/route-manifest.js`);
      return currentManifest;
    },
  });
  assert.equal(nextCandidate.reused, false);
  assert.equal(nextCandidate.source, HEAD_SHA);
  assert.deepEqual(nextCandidate.changedPaths, []);
  const nextState = JSON.parse(await readFile(statePath, "utf8"));
  assert.equal(nextState.baselineCommit, HEAD_SHA);
  assert.equal(nextState.candidateCommit, NEXT_SHA);
  assert.deepEqual(nextState.submissionReceipt, {
    outcome: "no_changes",
    status: "noop",
    submittedUrls: 0,
  });
});

test("llms.txt is a curated task index for exactly the 49 indexable pages", async (t) => {
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
  assert.equal(entries.length, 49, "one titled purpose entry per indexable page");
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
