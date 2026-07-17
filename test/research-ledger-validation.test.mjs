import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  validateResearchLedger,
  validateResearchLedgerTexts,
} from "../scripts/validate-research-ledger.mjs";

const RESEARCH = new URL("../docs/research/seo-geo-hive-2026-07-17/", import.meta.url);

async function corpus() {
  const read = (name) => readFile(new URL(name, RESEARCH), "utf8");
  const [evidenceText, sourcesText, tasksText, ledgerText] = await Promise.all([
    read("evidence_cards.tsv"),
    read("sources.tsv"),
    read("agent_tasks.tsv"),
    read("agent_ledger.tsv"),
  ]);
  return { evidenceText, sourcesText, tasksText, ledgerText };
}

test("research task and curator statuses are derived from the 20-field evidence corpus", async () => {
  const result = await validateResearchLedger();
  assert.deepEqual(result.errors, []);
  assert.equal(result.taskCount, 60);
  assert.equal(result.evidenceCount, 212);
  assert.deepEqual(result.decisions, { accepted: 196, pending: 16 });
  assert.equal(result.lanesWithAcceptedCards, 29);
  assert.equal(result.fullyAcceptedLanes, 19);
  assert.equal(result.lanesWithCompleteCardSets, 29);
});

test("research validator does not accept a partially reconstructed historical lane", async () => {
  const current = await corpus();
  const sample = current.evidenceText.split(/\r?\n/u)[1].split("\t");
  sample[0] = "EC-R03-01";
  const evidenceText = `${current.evidenceText
    .split(/\r?\n/u)
    .filter((line) => !line.startsWith("EC-R03-"))
    .join("\n")
    .trimEnd()}\n${sample.join("\t")}\n`;
  const tasksText = current.tasksText.replace(
    /^(R03\tresearch\t[^\n]*\t)evidence-cards-missing\t/mu,
    "$1accepted\t",
  );
  const ledgerText = current.ledgerText.replace(
    /^(CURATOR-03\tCURATE-R03\tcurator\t[^\n]*\t)evidence-cards-missing\t/mu,
    "$1accepted\t",
  );
  const result = validateResearchLedgerTexts({
    ...current,
    evidenceText,
    tasksText,
    ledgerText,
  });
  assert.match(result.errors.join("\n"), /evidence-derived status evidence-cards-incomplete/);
});

test("research validator rejects accepted labels without cards and unresolved sources", async () => {
  const current = await corpus();
  const tasksText = current.tasksText.replace(
    /^(R03\tresearch\t[^\n]*\t)evidence-cards-missing\t/mu,
    "$1accepted\t",
  );
  const ledgerText = current.ledgerText.replace(
    /^(CURATOR-03\tCURATE-R03\tcurator\t[^\n]*\t)evidence-cards-missing\t/mu,
    "$1accepted\t",
  );
  const evidenceText = current.evidenceText
    .split(/\r?\n/u)
    .filter((line) => !line.startsWith("EC-R03-"))
    .join("\n")
    .replace(/\tSRC-R01-ROBOTS\t/u, "\tSRC-DOES-NOT-EXIST\t");
  const result = validateResearchLedgerTexts({
    ...current,
    tasksText,
    ledgerText,
    evidenceText,
  });
  assert.match(result.errors.join("\n"), /R03: task status .* conflicts with evidence-derived status evidence-cards-missing/);
  assert.match(result.errors.join("\n"), /R03: curator status .* conflicts with evidence-derived status evidence-cards-missing/);
  assert.match(result.errors.join("\n"), /unresolved source_id SRC-DOES-NOT-EXIST/);
});

test("research validator binds each evidence URL to its source manifest entry", async () => {
  const current = await corpus();
  const lines = current.evidenceText.split(/\r?\n/u);
  const fields = lines[1].split("\t");
  fields[7] = "https://unrelated.example/evidence";
  lines[1] = fields.join("\t");
  const result = validateResearchLedgerTexts({ ...current, evidenceText: lines.join("\n") });
  assert.match(result.errors.join("\n"), /source_url does not match source manifest/);
});

test("research validator rejects agent ledger source IDs that are absent from the source manifest", async () => {
  const current = await corpus();
  const ledgerText = current.ledgerText.replace(
    "SRC-R01-ROBOTS,SRC-R01-SITEMAP",
    "SRC-DOES-NOT-EXIST,SRC-R01-SITEMAP",
  );
  const result = validateResearchLedgerTexts({ ...current, ledgerText });
  assert.match(
    result.errors.join("\n"),
    /agent_ledger\.tsv:R01: unresolved source_id SRC-DOES-NOT-EXIST/,
  );
});

test("research validator rejects cross-check claims that cannot be rebuilt from independent cards", async () => {
  const current = await corpus();
  const fields = current.evidenceText.split(/\r?\n/u)[1].split("\t");
  fields[14] = "corroborated";
  fields[16] = "2";
  const evidenceText = current.evidenceText.replace(
    current.evidenceText.split(/\r?\n/u)[1],
    fields.join("\t"),
  );
  const result = validateResearchLedgerTexts({ ...current, evidenceText });
  const errors = result.errors.join("\n");
  assert.match(errors, /corroborated requires at least 2 independent source cards/);
  assert.match(errors, /independent_source_count 2 exceeds 1 auditable independent source/);
});

test("research validator checks corroborated and conflicting claim values", async () => {
  const current = await corpus();
  const lines = current.evidenceText.split(/\r?\n/u);
  const header = lines[0].split("\t");
  const groupIndex = header.indexOf("claim_group_id");
  const valueIndex = header.indexOf("claim_value");

  const corroborated = lines.map((line, index) => {
    if (index === 0 || !line.startsWith("EC-R17-03\t")) return line;
    const fields = line.split("\t");
    fields[valueIndex] = "different_value";
    return fields.join("\t");
  }).join("\n");
  let result = validateResearchLedgerTexts({ ...current, evidenceText: corroborated });
  assert.match(result.errors.join("\n"), /corroborated requires 2 independent cards with the same claim_value/);

  const conflicting = lines.map((line, index) => {
    if (index === 0 || !line.startsWith("EC-R28-05\t")) return line;
    const fields = line.split("\t");
    fields[valueIndex] = "recharge_risk_acknowledgement";
    assert.equal(fields[groupIndex], "credential-boundary");
    return fields.join("\t");
  }).join("\n");
  result = validateResearchLedgerTexts({ ...current, evidenceText: conflicting });
  assert.match(result.errors.join("\n"), /conflicting requires at least 2 distinct claim_value entries/);
});

test("research validator requires an independent gap-preserving R30 review", async () => {
  const current = await corpus();
  const ledgerText = current.ledgerText
    .split(/\r?\n/u)
    .filter((line) => !line.startsWith("CURATOR-30\t"))
    .join("\n");
  const result = validateResearchLedgerTexts({ ...current, ledgerText });
  assert.match(
    result.errors.join("\n"),
    /R30 requires exactly one accepted independent review that preserves 16 pending cards/,
  );
});

test("research validator rejects stale R30 pending counts after a card decision changes", async () => {
  const current = await corpus();
  const lines = current.evidenceText.split(/\r?\n/u);
  const header = lines[0].split("\t");
  const reviewerStatusIndex = header.indexOf("reviewer_status");
  const evidenceText = lines.map((line) => {
    if (!line.startsWith("EC-R03-12\t")) return line;
    const fields = line.split("\t");
    fields[reviewerStatusIndex] = "accepted";
    return fields.join("\t");
  }).join("\n");

  const result = validateResearchLedgerTexts({ ...current, evidenceText });
  const errors = result.errors.join("\n");
  assert.match(errors, /R30 requires exactly one curator-summary row/);
  assert.match(
    errors,
    /R30 requires exactly one accepted independent review that preserves 15 pending cards/,
  );
});
