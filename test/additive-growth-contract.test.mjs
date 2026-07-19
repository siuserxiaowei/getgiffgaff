import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { GROWTH_PAGES } from "../site/growth/content-registry.js";

import { legacyDomSignature } from "../scripts/capture-legacy-site.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEGACY_ROOT = path.join(ROOT, "site", "legacy");
const GROWTH_ROOT = path.join(ROOT, "site", "growth");

const LEGACY_ROUTES = Object.freeze([
  "/",
  "/answers/",
  "/shop/",
  "/shop/giffgaff-g0/",
  "/shop/giffgaff-g2/",
  "/guides/",
  "/guides/0-intro/",
  "/guides/1-order/",
  "/guides/2-activate/",
  "/guides/3-account/",
  "/guides/3-app/",
  "/guides/3-usage/",
  "/guides/4-recharge-service/",
  "/guides/4-signal/",
  "/guides/5-travel-data/",
  "/more/",
  "/more/00-wechat/",
  "/more/02-telegram/",
  "/more/03-esim/",
  "/more/04-esim-qrcode/",
  "/qa/",
  "/qa/00-username/",
  "/qa/01-change-number/",
  "/qa/02-topup/",
  "/qa/03-reissue/",
  "/qa/04-choose-number/",
  "/qa/05-multiple-number/",
  "/qa/06-activation-expiration/",
  "/qa/07-voicemail-switch/",
  "/qa/08-gv/",
  "/qa/09-spread/",
  "/contact/",
  "/guides/6-pitfalls/",
  "/research/",
]);

const INDEXABLE_GROWTH_ROUTES = Object.freeze([
  "/guides/7-arrival-checklist/",
  "/guides/8-uk-sim-choice/",
  "/tools/keep-number-reminder/",
  "/tools/china-roaming-cost/",
  "/tools/g0-g2-total-cost/",
]);

const NOINDEX_GROWTH_ROUTES = Object.freeze([
  "/tools/esim-compatibility/",
  "/research/china-network-sms/",
  "/research/otp-status/",
  "/privacy/",
  "/terms/",
  "/refund/",
  "/shipping/",
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function routeFile(root, route) {
  return route === "/"
    ? path.join(root, "index.html")
    : path.join(root, route.slice(1), "index.html");
}

async function jsonFile(filename) {
  return JSON.parse(await readFile(path.join(ROOT, filename), "utf8"));
}

function attribute(tag, name) {
  const match = String(tag).match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"),
  );
  return match ? match[1] ?? match[2] ?? match[3] ?? "" : "";
}

function title(html) {
  return (html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.trim() || "";
}

function meta(html, kind, key) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    if (attribute(tag, kind).toLowerCase() === key.toLowerCase()) {
      return attribute(tag, "content");
    }
  }
  return "";
}

function canonical(html) {
  const tag = (html.match(/<link\b(?=[^>]*\brel=["'][^"']*canonical[^"']*["'])[^>]*>/i) || [])[0];
  return tag ? attribute(tag, "href") : "";
}

function firstHeading(html) {
  return (html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]
    ?.replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "";
}

function navigationSignature(html) {
  const nav = (html.match(/<nav\b(?=[^>]*aria-label=["']主导航["'])[^>]*>([\s\S]*?)<\/nav>/i) || [])[1] || "";
  const normalized = nav
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return sha256(normalized);
}

function originalVisibleSignature(html) {
  let source = html
    .replace(/<section\b(?=[^>]*data-growth-slot=["']related-tutorials-v1["'])[^>]*>[\s\S]*?<\/section>/gi, "")
    .replace(/<aside\b(?=[^>]*data-growth-slot=["']wechat-buying-guide-v1["'])[^>]*>[\s\S]*?<\/aside>/gi, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<head\b[\s\S]*?<\/head>/gi, "");
  const tokens = [];
  for (const match of source.matchAll(/<(h[1-6]|p|li|td|th|button|a)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const text = match[2]
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/\s+/g, " ")
      .trim();
    if (text) tokens.push(`${match[1].toLowerCase()}:${text}`);
  }
  return sha256(tokens.join("\n"));
}

function internalHrefs(html) {
  return [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1])
    .filter((href) => href.startsWith("/") && !href.startsWith("//"));
}

test("route manifest keeps 34 frozen pages and adds five index plus seven noindex pages", async () => {
  const modulePath = path.join(ROOT, "public", "route-manifest.js");
  await access(modulePath);
  const manifest = await import(`${pathToFileURL(modulePath).href}?t=${Date.now()}`);

  assert.deepEqual(manifest.LEGACY_ROUTES, LEGACY_ROUTES);
  assert.deepEqual(manifest.INDEXABLE_GROWTH_ROUTES, INDEXABLE_GROWTH_ROUTES);
  assert.deepEqual(manifest.NOINDEX_GROWTH_ROUTES, NOINDEX_GROWTH_ROUTES);
  assert.equal(manifest.PUBLIC_INDEXABLE_PATHS.length, 39);
  assert.equal(Object.keys(manifest.ROUTE_MANIFEST).length, 46);

  for (const route of LEGACY_ROUTES) {
    const record = manifest.routeFor(route);
    assert.equal(record?.indexPolicy, "index", route);
    assert.equal(record?.contentSource, "legacy", route);
    assert.match(record?.lastModified || "", /^\d{4}-\d{2}-\d{2}$/, route);
  }
  for (const route of INDEXABLE_GROWTH_ROUTES) {
    assert.equal(manifest.routeFor(route)?.indexPolicy, "index", route);
    assert.equal(manifest.routeFor(route)?.contentSource, "growth", route);
  }
  for (const route of NOINDEX_GROWTH_ROUTES) {
    assert.equal(manifest.routeFor(route)?.indexPolicy, "noindex", route);
    assert.equal(manifest.routeFor(route)?.sitemap, false, route);
  }
  assert.equal(manifest.routeFor("/")?.schemaType, "WebPage");
  assert.equal(manifest.routeFor("/shop/giffgaff-g0/")?.schemaType, "WebPage");
  assert.equal(manifest.routeFor("/shop/giffgaff-g2/")?.schemaType, "WebPage");
  assert.equal(
    manifest.routeFor("/research/china-network-sms/")?.schemaType,
    "CollectionPage",
  );
  assert.equal(
    manifest.routeFor("/research/otp-status/")?.schemaType,
    "CollectionPage",
  );
});

test("legacy source pages exactly match the freeze manifest and contain no growth module", async () => {
  const freeze = await jsonFile("site/legacy/legacy-freeze-manifest.json");
  assert.equal(freeze.schemaVersion, "legacy-freeze-v2");
  assert.equal(freeze.baseline.commit, "7cac06f");
  assert.equal(freeze.baseline.origin, "https://getgiffgaff.com");
  assert.equal(freeze.pages.length, 34);

  for (const record of freeze.pages) {
    const html = await readFile(routeFile(LEGACY_ROOT, record.route), "utf8");
    assert.doesNotMatch(html, /data-growth-slot=["']related-tutorials-v1["']/i, record.route);
    assert.equal(title(html), record.title, `${record.route} title`);
    assert.equal(meta(html, "name", "description"), record.description, `${record.route} description`);
    assert.equal(firstHeading(html), record.h1, `${record.route} h1`);
    assert.equal(navigationSignature(html), record.navigationSha256, `${record.route} nav`);
    assert.equal(originalVisibleSignature(html), record.visibleTextSha256, `${record.route} copy`);
    assert.match(record.domSha256 || "", /^[a-f0-9]{64}$/, `${record.route} DOM hash`);
    assert.equal(legacyDomSignature(html), record.domSha256, `${record.route} DOM`);
    const hrefs = new Set(internalHrefs(html));
    for (const href of record.legacyInternalHrefs) {
      assert.ok(hrefs.has(href), `${record.route} keeps ${href}`);
    }
  }

  const assets = freeze.assets;
  for (const record of Object.values(assets)) {
    const bytes = await readFile(path.join(LEGACY_ROOT, record.path));
    assert.equal(sha256(bytes), record.sha256, record.path);
  }
});

test("related link registry is append-only and targets valid routes", async () => {
  const links = await jsonFile("site/growth/related-links.json");

  const manifest = await import(
    `${pathToFileURL(path.join(ROOT, "public", "route-manifest.js")).href}?links=${Date.now()}`
  );
  assert.ok(Object.keys(links).length >= 16, "semantic growth slots cover high-value legacy sources");
  for (const [route, entries] of Object.entries(links)) {
    assert.ok(LEGACY_ROUTES.includes(route), route);
    const intentCount = entries.filter((entry) => Object.hasOwn(entry, "intent")).length;
    const tutorialCount = entries.length - intentCount;
    assert.ok(tutorialCount >= 3 && tutorialCount <= 5, `${route} tutorial link count`);
    assert.equal(new Set(entries.map((entry) => entry.href)).size, entries.length, `${route} duplicate href`);
    for (const entry of entries) {
      assert.match(entry.label, /\S/, `${route} label`);
      assert.notEqual(entry.label, "点击这里");
      const target = manifest.routeFor(entry.href);
      assert.ok(target, `${route} -> ${entry.href}`);
      assert.equal(target.indexPolicy, "index", `${route} -> ${entry.href} stays indexable`);
    }
  }
});

test("growth pages are original static pages with correct index policy and commerce exits", async () => {
  const allRoutes = [...INDEXABLE_GROWTH_ROUTES, ...NOINDEX_GROWTH_ROUTES];
  for (const route of allRoutes) {
    const page = GROWTH_PAGES.find((entry) => entry.path === route);
    assert.ok(page, `${route} registry entry`);
    const html = await readFile(routeFile(GROWTH_ROOT, route), "utf8");
    const expectedUrl = `https://getgiffgaff.com${route}`;
    assert.equal(canonical(html), expectedUrl, route);
    assert.equal(meta(html, "property", "og:url"), expectedUrl, route);
    assert.ok(title(html), `${route} title`);
    assert.ok(firstHeading(html), `${route} h1`);
    assert.match(html, /核验日期|方法与边界/, route);
    if (page.sources.length > 0) {
      assert.match(html, /https:\/\/(?:help\.)?giffgaff\.com\//i, `${route} official source`);
    } else {
      assert.match(html, /缺少经营负责人确认|不能替代完整政策/, `${route} business evidence gap`);
    }
    assert.match(html, /href=["']\/(?:shop|answers|contact|guides)\//i, `${route} funnel exit`);
    assert.ok(new Set(internalHrefs(html)).size >= 3, `${route} internal links`);
    assert.doesNotMatch(
      html,
      /保证永久保号|可以永久保号|所有平台都(?:能|可)|官方中文网|giffgaff\s*官网/i,
      route,
    );

    const robots = meta(html, "name", "robots").toLowerCase();
    if (INDEXABLE_GROWTH_ROUTES.includes(route)) {
      assert.match(robots, /^index,\s*follow/, route);
    } else {
      assert.match(robots, /^noindex,\s*follow/, route);
      assert.match(html, /证据不足|开放索引门槛/, route);
    }
  }
});

test("client-side tools fail closed and never collect account identifiers", async () => {
  const modulePath = path.join(GROWTH_ROOT, "assets", "tools.js");
  const source = await readFile(modulePath, "utf8");
  const uiSource = await readFile(path.join(GROWTH_ROOT, "assets", "growth-ui.js"), "utf8");
  assert.doesNotMatch(source, /fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/i);
  assert.doesNotMatch(uiSource, /fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB/i);
  assert.doesNotMatch(uiSource, /FormData|addEventListener\(["']submit|querySelectorAll\(["']form/i);
  assert.doesNotMatch(source, /phone|mobile|email|password|authorization|cookie|order_id/i);

  for (const page of GROWTH_PAGES.filter(({ tool }) => tool)) {
    const toolHtml = page.sections.find(({ id }) => id === "tool")?.html || "";
    assert.match(toolHtml, /<div\b[^>]*data-tool=/i, `${page.path} local-only tool root`);
    assert.doesNotMatch(toolHtml, /<form\b|\baction\s*=|\bmethod\s*=/i, `${page.path} no native submission`);
    for (const button of toolHtml.match(/<button\b[^>]*>/gi) || []) {
      assert.match(button, /\btype=["']button["']/i, `${page.path} explicit inert button`);
    }
  }

  const tools = await import(`${pathToFileURL(modulePath).href}?tools=${Date.now()}`);
  assert.equal(tools.keepNumberReminderDate("2026-07-16"), "2026-12-16");
  assert.equal(tools.keepNumberReminderDate("2026-02-31"), null);
  assert.equal(tools.keepNumberReminderDate("2024-02-29"), "2024-07-29");
  assert.match(tools.keepNumberCalendar("2026-07-16"), /BEGIN:VCALENDAR/);
  assert.match(tools.keepNumberCalendar("2026-07-16"), /DTSTART;VALUE=DATE:20261216/);
  assert.equal(tools.keepNumberCalendar("2026-02-31"), null);
  assert.equal(tools.evidenceIsCurrent({ expiresAt: "2026-08-15", now: "2026-07-16" }), true);
  assert.equal(tools.evidenceIsCurrent({ expiresAt: "2026-02-31", now: "2026-02-01" }), false);
  assert.equal(tools.evidenceIsCurrent({ expiresAt: "2026-08-15", now: "" }), false);
  assert.equal(
    tools.roamingCost({
      megabytes: 100,
      sms: 0,
      outgoingMinutes: 0,
      incomingMinutes: 0,
      ratePerMegabyte: 0.2,
      ratePerSms: 0.3,
      ratePerOutgoingMinute: 1,
      ratePerIncomingMinute: 1,
      expiresAt: "2026-07-15",
      now: "2026-07-16",
    }),
    null,
  );
  assert.equal(
    tools.roamingCost({
      megabytes: 10,
      sms: 2,
      outgoingMinutes: 3,
      incomingMinutes: 4,
      ratePerMegabyte: 0.2,
      ratePerSms: 0.3,
      ratePerOutgoingMinute: 1,
      ratePerIncomingMinute: 1,
      expiresAt: "2026-08-15",
      now: "2026-07-16",
    }),
    9.6,
  );
  assert.equal(
    tools.roamingCost({
      megabytes: " ",
      sms: 0,
      outgoingMinutes: 0,
      incomingMinutes: 0,
      ratePerMegabyte: 0.2,
      ratePerSms: 0.3,
      ratePerOutgoingMinute: 1,
      ratePerIncomingMinute: 1,
      expiresAt: "2026-08-15",
      now: "2026-07-16",
    }),
    null,
  );
  assert.deepEqual(
    tools.totalCost({ card: 20, balance: 10, shipping: 8, topup: 10, expectedUsage: 6 }),
    { gross: 44, usableBalance: 10, cashOutlay: 44 },
  );
  assert.equal(
    tools.totalCost({ card: "", balance: 10, shipping: 8, topup: 10, expectedUsage: 6 }),
    null,
  );
});

test("source cards contain six seeds and forty independent competitors without copied bodies", async () => {
  const registry = await jsonFile("docs/research/source-cards-v1.json");
  assert.equal(registry.schemaVersion, "source-card-v1");
  assert.equal(registry.cards.length, 46);
  assert.equal(registry.cards.filter((card) => card.kind === "seed").length, 6);
  assert.equal(registry.cards.filter((card) => card.kind === "competitor").length, 40);

  const competitorHosts = new Set();
  for (const card of registry.cards) {
    for (const key of [
      "url",
      "site",
      "verifiedAt",
      "accessStatus",
      "searchIntent",
      "headingOutline",
      "internalLinkPattern",
      "externalLinkPattern",
      "ctaPattern",
      "learnablePattern",
      "riskNotes",
      "licenseStatus",
      "originalTopic",
    ]) {
      assert.ok(card[key] !== undefined, `${card.id} missing ${key}`);
    }
    assert.ok(!Object.hasOwn(card, "fullText"), `${card.id} fullText forbidden`);
    assert.ok(!Object.hasOwn(card, "bodyHtml"), `${card.id} bodyHtml forbidden`);
    assert.ok(!Object.hasOwn(card, "screenshots"), `${card.id} screenshots forbidden`);
    if (card.kind === "competitor") {
      const host = new URL(card.url).hostname.toLowerCase();
      assert.ok(!competitorHosts.has(host), `duplicate competitor host ${host}`);
      competitorHosts.add(host);
    }
  }
});

test("backlink outreach tracker is ready without fabricated placements", async () => {
  const csv = await readFile(path.join(ROOT, "docs", "outreach", "backlink-prospects.csv"), "utf8");
  const [header, ...rows] = csv.trimEnd().split(/\r?\n/);
  const fields = header.split(",");
  for (const required of [
    "policy_url", "checked_at", "contact_scope", "acceptance_evidence", "relationship",
    "asset_readiness", "blocker", "qualification", "reason", "next_safe_action",
    "first_contact", "next_follow_up", "live_url", "live_evidence_url",
  ]) assert.ok(fields.includes(required), `missing ${required}`);

  const records = rows.map((row) => Object.fromEntries(fields.map((field, index) => [field, row.split(",")[index]])));
  assert.equal(new Set(records.map(({ prospect_url }) => prospect_url)).size, records.length);
  const hostCounts = records.reduce((counts, { prospect_url }) => {
    const host = new URL(prospect_url).hostname;
    counts.set(host, (counts.get(host) || 0) + 1);
    return counts;
  }, new Map());
  assert.equal(hostCounts.size, 22);
  assert.deepEqual(
    [...hostCounts.entries()].filter(([, count]) => count > 1),
    [["github.com", 2]],
    "only two separately governed GitHub repositories may share a platform hostname",
  );
  for (const record of records) {
    assert.equal(record.first_contact, "", `${record.prospect_url} fabricated contact`);
    assert.equal(record.next_follow_up, "", `${record.prospect_url} fabricated follow-up`);
    assert.equal(record.live_url, "", `${record.prospect_url} fabricated live URL`);
    assert.equal(record.live_evidence_url, "", `${record.prospect_url} fabricated evidence`);
    assert.notEqual(record.acceptance_evidence, "public_contact", record.prospect_url);
    if (record.qualification === "reject") {
      assert.equal(record.status, "reject", `${record.prospect_url} reject status`);
      assert.match(record.next_safe_action, /^Do not contact/, record.prospect_url);
    }
    if (record.status === "live") {
      assert.match(record.live_url, /^https:\/\//);
      assert.match(record.live_evidence_url, /^https:\/\//);
    }
  }
});
