import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "site", "growth", "assets", "analytics.js");

test("client analytics reduces referrers to a fixed category and emits an allowlisted payload", async () => {
  const source = await readFile(SCRIPT, "utf8");
  const analytics = await import(`${pathToFileURL(SCRIPT).href}?test=${Date.now()}`);

  assert.equal(analytics.sourceCategory("", "https://getgiffgaff.com"), "direct");
  assert.equal(analytics.sourceCategory("https://getgiffgaff.com/guides/?q=secret", "https://getgiffgaff.com"), "internal");
  assert.equal(analytics.sourceCategory("https://www.google.com/search?q=secret", "https://getgiffgaff.com"), "search");
  assert.equal(analytics.sourceCategory("https://www.perplexity.ai/search?q=secret", "https://getgiffgaff.com"), "ai");
  assert.equal(analytics.sourceCategory("https://www.bilibili.com/video/1", "https://getgiffgaff.com"), "social");
  assert.equal(analytics.sourceCategory("https://example.org/post?phone=13800000000", "https://getgiffgaff.com"), "referral");
  assert.equal(analytics.sourceCategory("not a url", "https://getgiffgaff.com"), "unknown");

  assert.deepEqual(
    analytics.analyticsPayload("/guides/7-arrival-checklist/", "internal", "commerce_click"),
    {
      version: "analytics_event_v1",
      path: "/guides/7-arrival-checklist/",
      source: "internal",
      event: "commerce_click",
    },
  );
  assert.doesNotMatch(source, /document\.cookie|location\.search|URLSearchParams|localStorage|sessionStorage/i);
});
