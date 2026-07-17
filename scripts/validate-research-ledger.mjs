import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RESEARCH_DIR = "docs/research/seo-geo-hive-2026-07-17";

const EVIDENCE_FIELDS = [
  "evidence_id",
  "claim_group_id",
  "claim",
  "claim_value",
  "entity",
  "timeframe",
  "source_id",
  "source_url",
  "source_type",
  "access_date",
  "excerpt_or_observation",
  "evidence_grade",
  "supports",
  "counter_evidence",
  "verification_status",
  "confidence",
  "independent_source_count",
  "source_independence",
  "reviewer_status",
  "review_notes",
];

// These minima come from the IDs/counts originally declared by each worker lane.
// They prevent a partially reconstructed lane from becoming `accepted` merely
// because one narrow card was later added to the master evidence file.
const EXPECTED_RESEARCH_CARD_COUNTS = new Map([
  ["R01", 7], ["R02", 10], ["R03", 13], ["R04", 8], ["R05", 8],
  ["R06", 11], ["R07", 10], ["R08", 12], ["R09", 12], ["R10", 11],
  ["R11", 10], ["R12", 9], ["R13", 9], ["R14", 6], ["R15", 9],
  ["R16", 3], ["R17", 7], ["R18", 4], ["R19", 5], ["R20", 10],
  ["R21", 5], ["R22", 3], ["R23", 3], ["R24", 3], ["R25", 5],
  ["R26", 4], ["R27", 5], ["R28", 5], ["R29", 5],
]);

function parseTsv(text, label) {
  const lines = text.replace(/^\uFEFF/u, "").trimEnd().split(/\r?\n/u);
  if (!lines[0]) return { headers: [], rows: [], errors: [`${label}: empty TSV`] };
  const headers = lines[0].split("\t");
  const errors = [];
  if (new Set(headers).size !== headers.length) errors.push(`${label}: duplicate header`);
  const rows = [];
  for (const [index, line] of lines.slice(1).entries()) {
    if (!line) continue;
    const values = line.split("\t");
    if (values.length !== headers.length) {
      errors.push(`${label}:${index + 2}: expected ${headers.length} fields, got ${values.length}`);
      continue;
    }
    rows.push(Object.fromEntries(headers.map((header, fieldIndex) => [header, values[fieldIndex]])));
  }
  return { headers, rows, errors };
}

function expectedResearchStatus(cards, lane) {
  if (lane === "R30") return "curator-summary";
  if (!cards.length) return "evidence-cards-missing";
  if (cards.length < (EXPECTED_RESEARCH_CARD_COUNTS.get(lane) || 1)) {
    return "evidence-cards-incomplete";
  }
  return cards.every((card) => card.reviewer_status === "accepted")
    ? "accepted"
    : "partially-curated-open-cards";
}

function countBy(rows, field) {
  return rows.reduce((counts, row) => {
    counts[row[field]] = (counts[row[field]] || 0) + 1;
    return counts;
  }, {});
}

function sourceUrlMatches(manifestUrl, evidenceUrl) {
  if (manifestUrl === evidenceUrl) return true;
  if (/^https?:\/\//u.test(manifestUrl) && /^https?:\/\//u.test(evidenceUrl)) {
    try {
      const narrowed = new URL(evidenceUrl);
      narrowed.hash = "";
      return narrowed.href === new URL(manifestUrl).href;
    } catch {
      return false;
    }
  }
  if (manifestUrl.startsWith("file:") && manifestUrl.endsWith("/")) {
    const relative = evidenceUrl.slice(manifestUrl.length);
    return evidenceUrl.startsWith(manifestUrl)
      && relative.length > 0
      && !relative.split("/").includes("..");
  }
  return false;
}

export function validateResearchLedgerTexts({
  evidenceText,
  sourcesText,
  tasksText,
  ledgerText,
}) {
  const evidence = parseTsv(evidenceText, "evidence_cards.tsv");
  const sources = parseTsv(sourcesText, "sources.tsv");
  const tasks = parseTsv(tasksText, "agent_tasks.tsv");
  const ledger = parseTsv(ledgerText, "agent_ledger.tsv");
  const errors = [...evidence.errors, ...sources.errors, ...tasks.errors, ...ledger.errors];

  if (evidence.headers.join("\t") !== EVIDENCE_FIELDS.join("\t")) {
    errors.push("evidence_cards.tsv: header must match the 20-field evidence-card contract exactly");
  }

  const sourceIds = new Set();
  const sourceById = new Map();
  for (const source of sources.rows) {
    if (!source.source_id) errors.push("sources.tsv: source_id is required");
    if (sourceIds.has(source.source_id)) errors.push(`sources.tsv: duplicate ${source.source_id}`);
    sourceIds.add(source.source_id);
    sourceById.set(source.source_id, source);
  }

  for (const row of ledger.rows) {
    for (const sourceId of row.source_ids.split(",").map((value) => value.trim())) {
      if (sourceId.startsWith("SRC-") && !sourceIds.has(sourceId)) {
        errors.push(
          `agent_ledger.tsv:${row.agent_id || row.task_id}: unresolved source_id ${sourceId}`,
        );
      }
    }
  }

  const evidenceIds = new Set();
  const cardsByLane = new Map();
  const cardsByClaimGroup = new Map();
  for (const card of evidence.rows) {
    if (evidenceIds.has(card.evidence_id)) {
      errors.push(`evidence_cards.tsv: duplicate ${card.evidence_id}`);
    }
    evidenceIds.add(card.evidence_id);
    if (!sourceIds.has(card.source_id)) {
      errors.push(`${card.evidence_id}: unresolved source_id ${card.source_id}`);
    } else if (!sourceUrlMatches(sourceById.get(card.source_id).url, card.source_url)) {
      errors.push(
        `${card.evidence_id}: source_url does not match source manifest entry for ${card.source_id}`,
      );
    }
    const lane = card.evidence_id.match(/^EC-(R\d{2})-/u)?.[1];
    if (!lane || Number(lane.slice(1)) < 1 || Number(lane.slice(1)) > 30) {
      errors.push(`${card.evidence_id}: evidence_id must identify R01-R30`);
      continue;
    }
    if (!cardsByLane.has(lane)) cardsByLane.set(lane, []);
    cardsByLane.get(lane).push(card);
    if (!cardsByClaimGroup.has(card.claim_group_id)) cardsByClaimGroup.set(card.claim_group_id, []);
    cardsByClaimGroup.get(card.claim_group_id).push(card);
  }

  for (const [claimGroupId, cards] of cardsByClaimGroup) {
    const independentCards = cards.filter((card) => card.source_independence === "independent");
    const independentSourceIds = new Set(independentCards.map((card) => card.source_id));
    const independentClaimValues = new Set(independentCards.map((card) => card.claim_value));
    for (const card of cards) {
      const declaredCount = Number(card.independent_source_count);
      if (!Number.isInteger(declaredCount) || declaredCount < 0) {
        errors.push(`${card.evidence_id}: independent_source_count must be a non-negative integer`);
        continue;
      }
      if (declaredCount > independentSourceIds.size) {
        errors.push(
          `${card.evidence_id}: independent_source_count ${declaredCount} exceeds ${independentSourceIds.size} auditable independent source(s) in claim group ${claimGroupId}`,
        );
      }
      if (
        ["corroborated", "conflicting"].includes(card.verification_status)
        && independentSourceIds.size < 2
      ) {
        errors.push(
          `${card.evidence_id}: ${card.verification_status} requires at least 2 independent source cards in claim group ${claimGroupId}`,
        );
      }
      if (card.verification_status === "corroborated") {
        const matchingSources = new Set(
          independentCards
            .filter((candidate) => candidate.claim_value === card.claim_value)
            .map((candidate) => candidate.source_id),
        );
        if (matchingSources.size < 2) {
          errors.push(
            `${card.evidence_id}: corroborated requires 2 independent cards with the same claim_value in claim group ${claimGroupId}`,
          );
        }
      }
      if (
        card.verification_status === "conflicting"
        && independentClaimValues.size < 2
      ) {
        errors.push(
          `${card.evidence_id}: conflicting requires at least 2 distinct claim_value entries in claim group ${claimGroupId}`,
        );
      }
    }
  }

  const taskById = new Map();
  for (const task of tasks.rows) {
    if (taskById.has(task.agent_id)) errors.push(`agent_tasks.tsv: duplicate ${task.agent_id}`);
    taskById.set(task.agent_id, task);
  }

  for (let index = 1; index <= 30; index += 1) {
    const lane = `R${String(index).padStart(2, "0")}`;
    const executionLane = `E${String(index).padStart(2, "0")}`;
    const task = taskById.get(lane);
    const executionTask = taskById.get(executionLane);
    if (!task || task.phase !== "research") {
      errors.push(`agent_tasks.tsv: missing research task ${lane}`);
    }
    if (!executionTask || executionTask.phase !== "execute") {
      errors.push(`agent_tasks.tsv: missing execution task ${executionLane}`);
    }

    const cards = cardsByLane.get(lane) || [];
    const expectedStatus = expectedResearchStatus(cards, lane);
    if (task && task.status !== expectedStatus) {
      errors.push(
        `${lane}: task status ${task.status} conflicts with evidence-derived status ${expectedStatus}`,
      );
    }

    if (lane === "R30") {
      const pendingCount = evidence.rows.filter(
        (card) => card.reviewer_status === "pending",
      ).length;
      const expectedReviewStatus = `bounded-synthesis-accepted-with-${pendingCount}-pending`;
      const summaryRows = ledger.rows.filter(
        (row) => row.task_id === "R30-SYNTHESIS" && row.lane === "curator-summary",
      );
      if (
        summaryRows.length !== 1
        || summaryRows[0]?.status !== "curator-summary"
        || summaryRows[0]?.verification_status !== expectedReviewStatus
      ) {
        errors.push("agent_ledger.tsv: R30 requires exactly one curator-summary row");
      }
      const independentReviewRows = ledger.rows.filter(
        (row) => row.task_id === "CURATE-R30" && row.lane === "independent-review",
      );
      if (
        independentReviewRows.length !== 1
        || independentReviewRows[0]?.status !== "accepted"
        || independentReviewRows[0]?.verification_status !== expectedReviewStatus
      ) {
        errors.push(
          `agent_ledger.tsv: R30 requires exactly one accepted independent review that preserves ${pendingCount} pending cards`,
        );
      }
      continue;
    }

    const curatorRows = ledger.rows.filter(
      (row) => row.task_id === `CURATE-${lane}` && row.lane === "curator",
    );
    if (curatorRows.length !== 1) {
      errors.push(`agent_ledger.tsv: ${lane} requires exactly one curator row`);
    } else if (curatorRows[0].status !== expectedStatus) {
      errors.push(
        `${lane}: curator status ${curatorRows[0].status} conflicts with evidence-derived status ${expectedStatus}`,
      );
    }
  }

  if (tasks.rows.length !== 60) errors.push(`agent_tasks.tsv: expected 60 task rows, got ${tasks.rows.length}`);

  return {
    errors,
    taskCount: tasks.rows.length,
    ledgerCount: ledger.rows.length,
    sourceCount: sources.rows.length,
    evidenceCount: evidence.rows.length,
    decisions: countBy(evidence.rows, "reviewer_status"),
    lanesWithAcceptedCards: [...cardsByLane.values()].filter((cards) =>
      cards.some((card) => card.reviewer_status === "accepted")
    ).length,
    fullyAcceptedLanes: [...cardsByLane.values()].filter((cards) =>
      cards.length > 0 && cards.every((card) => card.reviewer_status === "accepted")
    ).length,
    lanesWithCompleteCardSets: [...EXPECTED_RESEARCH_CARD_COUNTS].filter(
      ([lane, expectedCount]) => (cardsByLane.get(lane) || []).length >= expectedCount,
    ).length,
  };
}

export async function validateResearchLedger({ rootDir = DEFAULT_ROOT } = {}) {
  const read = (name) => readFile(join(rootDir, RESEARCH_DIR, name), "utf8");
  const [evidenceText, sourcesText, tasksText, ledgerText] = await Promise.all([
    read("evidence_cards.tsv"),
    read("sources.tsv"),
    read("agent_tasks.tsv"),
    read("agent_ledger.tsv"),
  ]);
  return validateResearchLedgerTexts({ evidenceText, sourcesText, tasksText, ledgerText });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await validateResearchLedger();
  if (result.errors.length) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
  } else {
    const { accepted = 0, pending = 0, rejected = 0 } = result.decisions;
    console.log(
      `research ledger ok: ${result.evidenceCount} cards (${accepted} accepted, ${pending} pending, ${rejected} rejected), ${result.lanesWithCompleteCardSets}/29 lanes with complete declared card sets, ${result.lanesWithAcceptedCards}/30 lanes with accepted evidence, ${result.fullyAcceptedLanes}/30 fully accepted`,
    );
  }
}
