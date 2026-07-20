import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildReleaseArtifact } from "../scripts/build-release-artifact.mjs";
import {
  INDEXABLE_GROWTH_ROUTES,
  PUBLIC_INDEXABLE_PATHS,
  ROUTE_MANIFEST,
  routeFor,
} from "../public/route-manifest.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const CORE_OWNER_PATHS = Object.freeze([
  "/answers/",
  "/guides/2-activate/",
  "/guides/3-usage/",
  "/guides/4-signal/",
  "/more/03-esim/",
]);

const APPROVED_LEGACY_EDGES = Object.freeze({
  "/": ["/guides/6-pitfalls/", "/guides/8-uk-sim-choice/"],
  "/shop/": ["/guides/6-pitfalls/", "/tools/g0-g2-total-cost/", "/guides/7-arrival-checklist/"],
  "/guides/3-app/": ["/guides/6-pitfalls/", "/guides/3-account/", "/guides/9-number-balance-data-check/", "/more/03-esim/", "/more/esim-new-phone/"],
  "/qa/07-voicemail-switch/": ["/guides/6-pitfalls/", "/guides/4-signal/", "/guides/3-usage/", "/tools/china-roaming-cost/", "/contact/"],
});

function routeFile(root, route) {
  return route === "/"
    ? path.join(root, "index.html")
    : path.join(root, route.slice(1), "index.html");
}

function internalRoutes(html, sourceRoute) {
  const routes = new Set();
  for (const match of html.matchAll(/<a\b[^>]*\bhref=(?:"([^"]*)"|'([^']*)')[^>]*>/gi)) {
    const href = match[1] ?? match[2];
    if (!href || href.startsWith("#") || href.startsWith("//")) continue;
    const target = new URL(href, `https://getgiffgaff.com${sourceRoute}`);
    if (target.hostname !== "getgiffgaff.com") continue;
    if (routeFor(target.pathname)) routes.add(target.pathname);
  }
  return routes;
}

function thematicHtml(html) {
  return html
    .replace(/<header\b[\s\S]*?<\/header>/gi, "")
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside\b(?=[^>]*class=["'][^"']*docs-sidebar)[^>]*>[\s\S]*?<\/aside>/gi, "")
    .replace(/<details\b(?=[^>]*class=["'][^"']*docs-mobile-nav)[^>]*>[\s\S]*?<\/details>/gi, "")
    .replace(/<aside\b(?=[^>]*data-growth-slot=["']wechat-buying-guide-v1["'])[^>]*>[\s\S]*?<\/aside>/gi, "");
}

test("approved legacy growth slots link high-value pages with semantic, duplicate-free exits", async () => {
  const related = JSON.parse(
    await readFile(path.join(ROOT, "site", "growth", "related-links.json"), "utf8"),
  );
  for (const [source, targets] of Object.entries(APPROVED_LEGACY_EDGES)) {
    const entries = related[source];
    assert.ok(entries.length >= 3 && entries.length <= 5, `${source} must keep 3-5 links`);
    assert.equal(new Set(entries.map((entry) => entry.href)).size, entries.length, `${source} duplicate href`);
    for (const target of targets) {
      assert.ok(entries.some((entry) => entry.href === target), `${source} must link ${target}`);
    }
  }

  const pillarEntries = related["/guides/6-pitfalls/"];
  assert.equal(pillarEntries.filter((entry) => Object.hasOwn(entry, "intent")).length, 2);
  assert.equal(pillarEntries.filter((entry) => !Object.hasOwn(entry, "intent")).length, 5);
  for (const target of CORE_OWNER_PATHS) {
    assert.ok(pillarEntries.some((entry) => entry.href === target), `pillar must link ${target}`);
  }

  const content = JSON.parse(
    await readFile(path.join(ROOT, "site", "growth", "content-manifest.json"), "utf8"),
  );
  for (const page of content.pages) {
    assert.equal(
      new Set(page.relatedRoutes).size,
      page.relatedRoutes.length,
      `${page.path} has duplicate relatedRoutes`,
    );
  }
});

test("all indexable growth pages have inbound links and are reachable from home", async (t) => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-link-graph-"));
  t.after(() => rm(outputRoot, { recursive: true, force: true }));
  await buildReleaseArtifact(outputRoot);

  const graph = new Map();
  const inbound = new Map(Object.keys(ROUTE_MANIFEST).map((route) => [route, 0]));
  for (const route of Object.keys(ROUTE_MANIFEST)) {
    const html = await readFile(routeFile(outputRoot, route), "utf8");
    const targets = internalRoutes(html, route);
    graph.set(route, targets);
    for (const target of targets) {
      if (target !== route) inbound.set(target, (inbound.get(target) || 0) + 1);
    }
  }

  const reachable = new Set(["/"]);
  const queue = ["/"];
  while (queue.length > 0) {
    const source = queue.shift();
    for (const target of graph.get(source) || []) {
      if (reachable.has(target)) continue;
      reachable.add(target);
      queue.push(target);
    }
  }

  for (const route of INDEXABLE_GROWTH_ROUTES) {
    assert.ok((inbound.get(route) || 0) >= 1, `${route} needs at least one inbound link`);
    assert.ok(reachable.has(route), `${route} must be reachable from /`);
  }
});

test("approved slots create a shallow thematic graph without counting sitewide templates", async (t) => {
  const related = JSON.parse(
    await readFile(path.join(ROOT, "site", "growth", "related-links.json"), "utf8"),
  );
  const approvedEdges = {
    "/guides/6-pitfalls/": [
      ...CORE_OWNER_PATHS,
    ],
    "/guides/4-signal/": ["/guides/6-pitfalls/", "/qa/07-voicemail-switch/", "/tools/china-roaming-cost/"],
    "/guides/1-order/": ["/guides/6-pitfalls/", "/tools/g0-g2-total-cost/", "/guides/7-arrival-checklist/"],
    "/guides/2-activate/": ["/guides/6-pitfalls/", "/guides/3-app/", "/guides/7-arrival-checklist/"],
  };
  for (const [source, targets] of Object.entries(approvedEdges)) {
    const entries = related[source] || [];
    const tutorialEntries = entries.filter((entry) => !Object.hasOwn(entry, "intent"));
    assert.ok(tutorialEntries.length >= 3 && tutorialEntries.length <= 5, `${source} keeps 3-5 tutorial links`);
    assert.equal(new Set(entries.map((entry) => entry.href)).size, entries.length, `${source} no duplicate href`);
    for (const target of targets) {
      assert.ok(entries.some((entry) => entry.href === target), `${source} links ${target}`);
    }
  }

  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-thematic-graph-"));
  t.after(() => rm(outputRoot, { recursive: true, force: true }));
  await buildReleaseArtifact(outputRoot);

  const indexable = new Set(PUBLIC_INDEXABLE_PATHS);
  const graph = new Map();
  const inbound = new Map(PUBLIC_INDEXABLE_PATHS.map((route) => [route, new Set()]));
  for (const route of PUBLIC_INDEXABLE_PATHS) {
    const html = thematicHtml(await readFile(routeFile(outputRoot, route), "utf8"));
    const targets = new Set(
      [...internalRoutes(html, route)].filter((target) => indexable.has(target) && target !== route),
    );
    graph.set(route, targets);
    for (const target of targets) inbound.get(target).add(route);
  }

  const depth = new Map([["/", 0]]);
  const queue = ["/"];
  while (queue.length > 0) {
    const source = queue.shift();
    for (const target of graph.get(source) || []) {
      if (depth.has(target)) continue;
      depth.set(target, depth.get(source) + 1);
      queue.push(target);
    }
  }

  for (const route of INDEXABLE_GROWTH_ROUTES) {
    assert.ok(inbound.get(route).size >= 2, `${route} has two independent thematic inbound sources`);
    assert.ok(depth.has(route), `${route} is thematically reachable from home`);
    assert.ok(depth.get(route) <= 2, `${route} thematic crawl depth is at most two`);
  }
});

test("Feishu seed is explicitly access-limited and uses the registry verification date", async () => {
  const registry = JSON.parse(
    await readFile(path.join(ROOT, "docs", "research", "source-cards-v1.json"), "utf8"),
  );
  const card = registry.cards.find((entry) => entry.id === "seed-feishu-aiyanxishe");

  assert.ok(card, "Feishu seed card is required");
  assert.equal(card.verifiedAt, "2026-07-16");
  assert.equal(card.sourceLastModified, "2024-07-28");
  assert.match(card.accessStatus, /受限|部分|登录/);
  assert.doesNotMatch(card.accessStatus, /公开可读/);
  assert.match(card.accessStatus, /登录|trap|不完整|不稳定/i);
});
