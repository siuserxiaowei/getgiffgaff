import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  validateOutreachAssets,
  validateOutreachDocuments,
  validateOutreachLedger,
} from "../scripts/validate-outreach-assets.mjs";

test("outreach ledger and external-content drafts remain pre-action and safely gated", async () => {
  const result = await validateOutreachAssets();

  assert.equal(result.errors.length, 0, result.errors.join("\n"));
  assert.equal(result.candidateCount, 25);
  assert.equal(result.draftCount, 7);
  assert.ok(result.markdownCount >= 14);
});

test("ledger validator fails closed on unsafe state transitions and contact-as-permission", async () => {
  const current = await readFile(
    new URL("../docs/outreach/backlink-prospects.csv", import.meta.url),
    "utf8",
  );
  const [header, first, second, third] = current.trimEnd().split(/\r?\n/u);
  const fields = header.split(",");
  const mutate = (line, changes) => {
    const values = line.split(",");
    for (const [field, value] of Object.entries(changes)) values[fields.indexOf(field)] = value;
    return values.join(",");
  };
  const unsafe = [
    header,
    mutate(first, { first_contact: "2026-07-17", status: "research" }),
    mutate(second, {
      qualification: "reject",
      status: "research",
      next_safe_action: "Research a contact",
    }),
    mutate(third, {
      acceptance_evidence: "public contact form",
      qualification: "research",
      status: "live",
      live_url: "https://publisher.example/resource",
      live_evidence_url: "",
    }),
  ].join("\n");

  const result = validateOutreachLedger(unsafe, { expectedCandidateCount: 3 });
  assert.match(result.errors.join("\n"), /pre-action first_contact must remain empty/);
  assert.match(result.errors.join("\n"), /reject qualification and status must agree/);
  assert.match(result.errors.join("\n"), /next_safe_action must start with Do not contact/);
  assert.match(result.errors.join("\n"), /live status requires live_url and live_evidence_url/);
  assert.match(result.errors.join("\n"), /public contact route is not acceptance_evidence/);
});

test("document validator rejects publish-ready drafts, link schemes and fabricated outcomes", () => {
  const riskyDraft = [
    "# Publisher pitch",
    "getgiffgaff is an independent third-party site.",
    "Please add a dofollow backlink with an exact-match anchor.",
    "We already contacted the editor and successfully published the article.",
    "getgiffgaff is an official partner.",
  ].join("\n");
  const result = validateOutreachDocuments({
    drafts: { "docs/outreach/drafts/risky.md": riskyDraft },
  });

  assert.match(result.errors.join("\n"), /missing a visible do-not-send\/publish/);
  assert.match(result.errors.join("\n"), /positive link-scheme request/);
  assert.match(result.errors.join("\n"), /unsupported external-result or relationship claim/);
});

test("document validator permits explicit negative SEO and anti-spam constraints", () => {
  const safeDraft = [
    "# DO NOT SEND — internal draft",
    "getgiffgaff is an independent third-party site.",
    "We do not request a specified anchor, dofollow treatment, reciprocal link, or endorsement.",
    "No editor was contacted and nothing was published.",
    "We are not an official partner or authorised representative.",
  ].join("\n");
  const result = validateOutreachDocuments({
    drafts: { "docs/outreach/drafts/safe.md": safeDraft },
  });

  assert.deepEqual(result.errors, []);
});

test("document validator does not let a gated heading negate a later link-scheme request", () => {
  const riskyDraft = [
    "# DO NOT SEND — internal draft",
    "getgiffgaff is an independent third-party site.",
    "",
    "Please add a dofollow backlink with an exact-match anchor.",
  ].join("\n");
  const result = validateOutreachDocuments({
    drafts: { "docs/outreach/drafts/header-bypass.md": riskyDraft },
  });

  assert.match(result.errors.join("\n"), /positive link-scheme request/);
});
