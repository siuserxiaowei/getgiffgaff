import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildReleaseArtifact } from "../scripts/build-release-artifact.mjs";
import { injectRelatedTutorials } from "../scripts/build-release-artifact.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("pitfalls overview splits pre-purchase consultation from post-purchase diagnosis", async (t) => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-pitfalls-intent-"));
  t.after(() => rm(outputRoot, { recursive: true, force: true }));
  await buildReleaseArtifact(outputRoot);

  const html = await readFile(
    path.join(outputRoot, "guides", "6-pitfalls", "index.html"),
    "utf8",
  );
  const slot = html.match(
    /<section\b(?=[^>]*data-growth-slot="related-tutorials-v1")[^>]*>[\s\S]*?<\/section>/i,
  )?.[0];
  assert.ok(slot, "release-only intent slot exists");
  assert.match(slot, /你现在要解决哪一步？/);
  assert.match(slot, /未购卡：先咨询选卡与当前信息/);
  assert.match(slot, /已购卡：按症状排查信号与短信/);
  assert.match(slot, /仍无法判断可联系咨询/);
  assert.equal((slot.match(/class="growth-intent-card"/g) || []).length, 2);

  for (const [href, intent] of [
    ["/contact/", "before-purchase"],
    ["/guides/4-signal/", "after-purchase"],
  ]) {
    assert.match(
      slot,
      new RegExp(
        `<a\\b(?=[^>]*\\bclass="growth-intent-card")(?=[^>]*\\bhref="${href.replaceAll("/", "\\/")}")(?=[^>]*\\bdata-funnel-intent="${intent}")(?=[^>]*\\bdata-analytics-event="commerce_click")[^>]*>`,
      ),
      `${href} is internal intent navigation`,
    );
  }
  assert.doesNotMatch(
    slot,
    /<a\b(?=[^>]*\bdata-analytics-event="contact_click")[^>]*>/,
    "no internal intent card claims a completed contact handoff",
  );
  assert.match(slot, /href="\/guides\/8-uk-sim-choice\/"/);
  assert.match(slot, /href="\/tools\/keep-number-reminder\/"/);

  const legacy = await readFile(
    path.join(ROOT, "site", "legacy", "guides", "6-pitfalls", "index.html"),
    "utf8",
  );
  assert.doesNotMatch(legacy, /growth-intent-card|你现在要解决哪一步/);
});

test("pitfalls intent injection fails closed on unknown, duplicate or incomplete choices", () => {
  const shell = "<html><head></head><body><main></main></body></html>";
  const before = {
    label: "before",
    href: "/contact/",
    intent: "before-purchase",
    description: "before",
  };
  const after = {
    label: "after",
    href: "/guides/4-signal/",
    intent: "after-purchase",
    description: "after",
  };

  assert.doesNotThrow(() => injectRelatedTutorials(shell, [before, after]));
  for (const invalidLinks of [
    [before],
    [before, before],
    [before, { ...after, intent: "arbitrary-private-value" }],
  ]) {
    assert.throws(
      () => injectRelatedTutorials(shell, invalidLinks),
      /intent/i,
    );
  }
});
