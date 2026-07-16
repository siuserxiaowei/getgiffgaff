import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { GROWTH_PAGES } from "../site/growth/content-registry.js";
import {
  INDEXABLE_GROWTH_ROUTES,
  NOINDEX_GROWTH_ROUTES,
} from "../public/route-manifest.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function routeFile(route) {
  return path.join(ROOT, "site", "growth", route.slice(1), "index.html");
}

function jsonLd(html) {
  const documents = [];
  for (const match of html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    documents.push(JSON.parse(match[1]));
  }
  return documents;
}

function allNodes(documents) {
  return documents.flatMap((document) =>
    Array.isArray(document?.["@graph"])
      ? document["@graph"]
      : Array.isArray(document)
        ? document
        : [document],
  );
}

test("growth registry owns five indexable pages and three evidence-gated previews", () => {
  assert.equal(GROWTH_PAGES.length, 8);
  assert.deepEqual(
    GROWTH_PAGES.filter((page) => page.indexPolicy === "index").map((page) => page.path),
    INDEXABLE_GROWTH_ROUTES,
  );
  assert.deepEqual(
    GROWTH_PAGES.filter((page) => page.indexPolicy === "noindex").map((page) => page.path),
    NOINDEX_GROWTH_ROUTES,
  );
  assert.equal(new Set(GROWTH_PAGES.map((page) => page.title)).size, 8);
  assert.equal(new Set(GROWTH_PAGES.map((page) => page.intent)).size, 8);

  for (const page of GROWTH_PAGES) {
    for (const key of [
      "path",
      "title",
      "description",
      "intent",
      "updatedAt",
      "reviewedAt",
      "sources",
      "relatedRoutes",
      "commerceTarget",
    ]) {
      assert.ok(page[key] !== undefined, `${page.path} missing ${key}`);
    }
    assert.ok(page.sources.length >= 2, `${page.path} sources`);
    assert.ok(page.relatedRoutes.length >= 3, `${page.path} related routes`);
    assert.equal(page.author?.type, "Organization", `${page.path} honest author`);
  }
});

test("new pages publish parseable conservative schema and explicit evidence boundaries", async () => {
  for (const page of GROWTH_PAGES) {
    const html = await readFile(routeFile(page.path), "utf8");
    const documents = jsonLd(html);
    const nodes = allNodes(documents);
    assert.ok(documents.length > 0, `${page.path} JSON-LD`);
    const serialized = JSON.stringify(nodes);

    assert.doesNotMatch(serialized, /pages\.dev/i, page.path);
    assert.doesNotMatch(
      serialized,
      /"@type":"(?:Offer|Review|AggregateRating|FAQPage)"/i,
      page.path,
    );
    assert.doesNotMatch(serialized, /"sameAs"|"parentOrganization"/i, page.path);
    assert.match(html, /独立第三方/, page.path);
    assert.match(html, /核验日期|方法与边界/, page.path);

    if (page.indexPolicy === "noindex") {
      assert.match(html, /证据不足|开放索引门槛/, page.path);
      assert.match(html, /<meta\b[^>]*name=["']robots["'][^>]*noindex/i, page.path);
    }
  }
});

test("local tools calculate without network state and fail closed when evidence expires", async () => {
  const filename = path.join(ROOT, "site", "growth", "assets", "tools.js");
  const source = await readFile(filename, "utf8");
  const uiSource = await readFile(path.join(ROOT, "site", "growth", "assets", "growth-ui.js"), "utf8");
  const tools = await import(`${pathToFileURL(filename).href}?tutorial=${Date.now()}`);

  assert.doesNotMatch(source, /fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/i);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB/i);
  assert.doesNotMatch(uiSource, /fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/i);
  assert.doesNotMatch(uiSource, /localStorage|sessionStorage|indexedDB|FormData/i);
  const calendar = tools.keepNumberCalendar("2026-07-16");
  assert.match(calendar, /BEGIN:VCALENDAR/);
  assert.doesNotMatch(calendar, /^(?:ATTENDEE|CONTACT|ORGANIZER|TEL|URL):/gim);
  assert.doesNotMatch(calendar, /13800000000|user@example\.com|ACCOUNT_CANARY/i);
  assert.equal(tools.keepNumberReminderDate("2026-02-31"), null);
  assert.equal(
    tools.roamingCost({
      megabytes: 20,
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
      sms: 1,
      outgoingMinutes: 1,
      incomingMinutes: 2,
      ratePerMegabyte: 0.2,
      ratePerSms: 0.3,
      ratePerOutgoingMinute: 1,
      ratePerIncomingMinute: 1,
      expiresAt: "2026-08-15",
      now: "2026-07-16",
    }),
    5.3,
  );
  assert.equal(
    tools.totalCost({ card: 20, balance: 10, shipping: 8, topup: " ", expectedUsage: 6 }),
    null,
  );
  assert.deepEqual(
    tools.totalCost({ card: 20, balance: 10, shipping: 8, topup: 10, expectedUsage: 6 }),
    { gross: 44, usableBalance: 10, cashOutlay: 44 },
  );
});
