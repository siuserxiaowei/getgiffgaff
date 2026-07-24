import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { renderGrowthPage } from "../scripts/build-growth-pages.mjs";
import { GROWTH_PAGES } from "../site/growth/content-registry.js";
import { keepNumberCalendar } from "../site/growth/assets/tools.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("keep-number tool exposes an English launch surface without changing its canonical route", () => {
  const page = GROWTH_PAGES.find(({ path: route }) => route === "/tools/keep-number-reminder/");
  const html = renderGrowthPage(page);

  assert.match(html, /<link rel="canonical" href="https:\/\/getgiffgaff\.com\/tools\/keep-number-reminder\/">/);
  assert.match(html, /id="english-overview" lang="en"/);
  assert.match(html, /UK SIM Keep-Number Reminder/);
  assert.match(html, /<title>UK SIM Keep-Number Reminder/);
  assert.match(html, /Free browser tool · no sign-up · local-only/);
  assert.match(html, /data-locale="bilingual"/);
  assert.match(html, /growth-assets\/keep-number-reminder-og\.png/);
  assert.match(html, /data-tool-success-actions hidden/);
  assert.match(html, /View purchase options/);
});

test("keep-number social launch card is a 1200 by 630 PNG", async () => {
  const image = await readFile(path.join(
    ROOT,
    "site",
    "growth",
    "assets",
    "keep-number-reminder-og.png",
  ));
  assert.equal(image.subarray(1, 4).toString(), "PNG");
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
});

test("downloaded reminder is bilingual and contains no user-entered identifier", () => {
  const calendar = keepNumberCalendar("2026-07-23");
  assert.match(calendar, /Check giffgaff number activity/);
  assert.match(calendar, /not a service guarantee/);
  assert.match(calendar, /DTSTART;VALUE=DATE:20261223/);
  assert.doesNotMatch(calendar, /phone number|account details/i);
});
