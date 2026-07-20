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

test("growth registry owns nine indexable pages and seven evidence-gated pages", () => {
  assert.equal(GROWTH_PAGES.length, 16);
  assert.deepEqual(
    GROWTH_PAGES.filter((page) => page.indexPolicy === "index").map((page) => page.path),
    INDEXABLE_GROWTH_ROUTES,
  );
  assert.deepEqual(
    GROWTH_PAGES.filter((page) => page.indexPolicy === "noindex").map((page) => page.path),
    NOINDEX_GROWTH_ROUTES,
  );
  assert.equal(new Set(GROWTH_PAGES.map((page) => page.title)).size, 16);
  assert.equal(new Set(GROWTH_PAGES.map((page) => page.intent)).size, 16);

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
    if (["/privacy/", "/terms/", "/refund/", "/shipping/"].includes(page.path)) {
      assert.equal(page.sources.length, 0, `${page.path} business-policy evidence remains absent`);
    } else {
      assert.ok(page.sources.length >= 2, `${page.path} sources`);
    }
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

test("method-only research previews never imply that a current sample corpus exists", async () => {
  for (const pathname of ["/research/china-network-sms/", "/research/otp-status/"]) {
    const page = GROWTH_PAGES.find((entry) => entry.path === pathname);
    const html = await readFile(routeFile(pathname), "utf8");
    assert.equal(page.indexPolicy, "noindex", pathname);
    assert.match(`${page.deck} ${page.directAnswer}`, /当前.*没有.*样本/u, pathname);
    assert.doesNotMatch(page.title, /近期实测|实测矩阵/u, pathname);
    assert.doesNotMatch(page.description, /展示近期|近期样本/u, pathname);
    assert.doesNotMatch(html, /<title>[^<]*(?:近期实测|实测矩阵)/u, pathname);
    assert.match(html, /当前只发布.*方法|当前没有可发布的近期实测样本/u, pathname);
  }
});

test("key growth claims keep their official source and review date in the same passage", async () => {
  const claims = [
    ["/guides/7-arrival-checklist/", "seven-steps", "https://help.giffgaff.com/en/articles/240393-activating-your-giffgaff-sim"],
    ["/guides/7-arrival-checklist/", "seven-steps", "https://help.giffgaff.com/en/articles/240847-everything-to-know-about-credit"],
    ["/guides/7-arrival-checklist/", "seven-steps", "https://help.giffgaff.com/en/articles/639659-network-service-troubleshooting"],
    ["/guides/7-arrival-checklist/", "seven-steps", "https://help.giffgaff.com/en/articles/246074-policy-to-manage-illegitimate-sms-usage"],
    ["/guides/8-uk-sim-choice/", "fit", "https://www.giffgaff.com/boiler-plate/terms"],
    ["/guides/8-uk-sim-choice/", "fit", "https://www.ofcom.org.uk/mobile-coverage-checker?language=en"],
    ["/guides/8-uk-sim-choice/", "sim-or-esim", "https://help.giffgaff.com/en/articles/261570-switching-to-an-esim-with-giffgaff"],
    ["/guides/8-uk-sim-choice/", "cost", "https://help.giffgaff.com/en/articles/240676-ordering-a-sim-in-the-uk-or-abroad"],
    ["/guides/8-uk-sim-choice/", "cost", "https://help.giffgaff.com/en/articles/246074-policy-to-manage-illegitimate-sms-usage"],
    ["/tools/keep-number-reminder/", "expired", "https://help.giffgaff.com/en/articles/242797-understanding-why-your-number-has-been-deactivated"],
    ["/tools/china-roaming-cost/", "status", "https://www.giffgaff.com/roaming/china"],
    ["/tools/china-roaming-cost/", "method", "https://help.giffgaff.com/en/articles/365501-giffgaff-travel-data-add-ons-and-how-they-work"],
  ];

  for (const [pathname, sectionId, sourceUrl] of claims) {
    const page = GROWTH_PAGES.find((entry) => entry.path === pathname);
    const section = page?.sections.find((entry) => entry.id === sectionId);
    assert.ok(section, `${pathname}#${sectionId} exists`);
    assert.ok(section.html.includes(sourceUrl), `${pathname}#${sectionId} cites ${sourceUrl}`);
    assert.ok(
      section.html.includes(`核验 ${page.reviewedAt}`),
      `${pathname}#${sectionId} shows review date beside its claims`,
    );
    assert.ok(
      page.sources.some((source) => source.url === sourceUrl),
      `${pathname} source registry includes ${sourceUrl}`,
    );

    const html = await readFile(routeFile(pathname), "utf8");
    const renderedSection = (
      html.match(new RegExp(`<section\\s+id=["']${sectionId}["'][^>]*>([\\s\\S]*?)<\\/section>`, "i"))
      || []
    )[1];
    assert.ok(renderedSection, `${pathname}#${sectionId} is rendered`);
    assert.ok(renderedSection.includes(sourceUrl), `${pathname}#${sectionId} renders ${sourceUrl}`);
    assert.ok(
      renderedSection.includes(`核验 ${page.reviewedAt}`),
      `${pathname}#${sectionId} renders its review date`,
    );
  }
});

test("Article image is real while WebApplication schema stays semantic and non-commercial", async () => {
  const image = await readFile(path.join(ROOT, "site", "legacy", "gg-card-hero.png"));
  assert.equal(image.subarray(1, 4).toString(), "PNG", "social image is a PNG");
  assert.equal(image.readUInt32BE(16), 1400, "social image width");
  assert.equal(image.readUInt32BE(20), 1000, "social image height");

  for (const page of GROWTH_PAGES) {
    const html = await readFile(routeFile(page.path), "utf8");
    const nodes = allNodes(jsonLd(html));
    const pageNode = nodes.find((node) => node?.["@id"] === `https://getgiffgaff.com${page.path}#page`);
    assert.ok(pageNode, `${page.path} page node`);
    assert.equal(pageNode["@type"], page.schemaType, `${page.path} schema type`);

    if (page.schemaType === "Article") {
      assert.deepEqual(pageNode.image, {
        "@type": "ImageObject",
        url: "https://getgiffgaff.com/gg-card-hero.png",
        width: 1400,
        height: 1000,
      }, `${page.path} verified Article image`);
      assert.ok(!("datePublished" in pageNode), `${page.path} has no invented publication date`);
      continue;
    }

    if (page.schemaType !== "WebApplication") continue;
    assert.equal(pageNode["@type"], "WebApplication", page.path);
    assert.equal(pageNode.applicationCategory, "UtilitiesApplication", page.path);
    assert.equal(pageNode.isAccessibleForFree, true, page.path);
    for (const property of [
      "offers",
      "review",
      "reviews",
      "aggregateRating",
      "price",
      "priceCurrency",
    ]) {
      assert.ok(!(property in pageNode), `${page.path} must not assert ${property}`);
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
  assert.match(
    calendar,
    /^URL:https:\/\/help\.giffgaff\.com\/en\/articles\/242797-understanding-why-your-number-has-been-deactivated$/m,
  );
  assert.doesNotMatch(calendar, /^(?:ATTENDEE|CONTACT|ORGANIZER|TEL):/gim);
  assert.doesNotMatch(calendar, /13800000000|user@example\.com|ACCOUNT_CANARY/i);
  assert.equal((calendar.match(/^URL:/gm) || []).length, 1, "one fixed official URL only");
  assert.equal(tools.keepNumberReminderDate("2025-09-30"), "2026-02-28");
  assert.equal(tools.keepNumberReminderDate("2024-09-30"), "2025-02-28");
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
