import { readFile, readdir } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUTREACH_DIR = "docs/outreach";
const LEDGER_PATH = `${OUTREACH_DIR}/backlink-prospects.csv`;
const REQUIRED_LEDGER_FIELDS = [
  "target_page",
  "prospect_url",
  "policy_url",
  "checked_at",
  "contact_scope",
  "acceptance_evidence",
  "relationship",
  "asset_readiness",
  "blocker",
  "qualification",
  "reason",
  "next_safe_action",
  "relevance",
  "pitch_angle",
  "first_contact",
  "next_follow_up",
  "status",
  "live_url",
  "live_evidence_url",
  "notes",
];
const RESULT_FIELDS = [
  "first_contact",
  "next_follow_up",
  "live_url",
  "live_evidence_url",
];
const DRAFT_GATE_PATTERN =
  /DO NOT SEND|DO NOT OPEN UNTIL PERMISSION|DRAFT NOT PUBLISHED|BLOCKED|未发布/u;
const DISCLOSURE_PATTERN = /independent third-party|独立第三方/iu;

const LINK_SCHEME_PATTERNS = [
  /\b(?:we\s+)?(?:request|require|expect|want|need|ask\s+for)\b.{0,80}\b(?:dofollow|backlink|specified\s+anchor|exact[- ]match\s+anchor|keyword[- ]rich\s+anchor|reciprocal\s+link|endorsement)\b/iu,
  /\b(?:please\s+)?(?:add|insert|place|publish|retain|provide|give|use|make)\b.{0,80}\b(?:dofollow|backlink|exact[- ]match\s+anchor|keyword[- ]rich\s+anchor|reciprocal\s+link|endorsement)\b/iu,
  /(?:请|要求|希望|务必|必须).{0,40}(?:dofollow|外链|互链|背书|(?:指定|关键词|精准|固定).{0,8}锚文本)/iu,
];
const UNSUPPORTED_CLAIM_PATTERNS = [
  /\b(?:we|i|getgiffgaff|our\s+(?:team|site|service)|the\s+(?:editor|publisher))\b.{0,60}\b(?:already\s+)?(?:contacted|emailed|messaged|sent|published|posted|placed|secured|obtained|earned|paid|partnered|endorsed)\b/iu,
  /\b(?:already|successfully)\s+(?:contacted|emailed|messaged|sent|published|posted|placed|secured|obtained|earned|paid)\b/iu,
  /(?:我们|本站|getgiffgaff|编辑|媒体).{0,40}(?:已(?:经)?(?:联系|发送|发布|投稿|放置|获得|拿到|支付|购买|收录|背书|合作))/u,
  /\b(?:we|getgiffgaff|our\s+(?:site|service))\s+(?:are|is)\s+(?:an?\s+)?(?:official|authorized|authorised)\s+(?:partner|representative|reseller)\b/iu,
  /(?:我们|本站|getgiffgaff).{0,20}(?:是|属于|获得).{0,12}(?:官方合作|官方授权|授权代表)/u,
  /\b(?:our|the|getgiffgaff)\s+(?:live|real[- ]time|current)\s+(?:price|inventory|stock)\b/iu,
  /(?:我们|本站|getgiffgaff).{0,20}(?:实时|当前)(?:价格|库存|现货)/u,
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field === "") {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/u, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("unterminated quoted field");
  if (field !== "" || row.length) {
    row.push(field.replace(/\r$/u, ""));
    rows.push(row);
  }
  return rows.filter((values) => values.some((value) => value !== ""));
}

function matchIsNegated(line, matchIndex, matchText) {
  const prefix = line.slice(Math.max(0, matchIndex - 120), matchIndex);
  const phrase = `${prefix}${matchText}`;
  return /(?:\b(?:no|not|never|without|avoid|reject(?:s|ed|ing)?|prohibit(?:ed)?|forbid(?:den)?)\b|\b(?:do|would|will|must|should|can)\s+not\b|不|无|未|禁止|避免|不得|不能|不会|并非|拒绝|当前不能引用)/iu.test(phrase);
}

function findUnnegatedMatch(text, patterns) {
  const lines = text.split(/\r?\n/u);
  for (const [lineIndex, line] of lines.entries()) {
    for (const pattern of patterns) {
      const match = pattern.exec(line);
      if (match && !matchIsNegated(line, match.index, match[0])) {
        return { line: lineIndex + 1, excerpt: match[0].trim() };
      }
    }
  }
  return null;
}

export function validateOutreachLedger(csvText, { expectedCandidateCount = 25 } = {}) {
  const errors = [];
  let csvRows;
  try {
    csvRows = parseCsv(csvText.replace(/^\uFEFF/u, ""));
  } catch (error) {
    return { errors: [`${LEDGER_PATH}: ${error.message}`], candidateCount: 0 };
  }

  if (!csvRows.length) {
    return { errors: [`${LEDGER_PATH}: ledger is empty`], candidateCount: 0 };
  }

  const headers = csvRows[0];
  for (const field of REQUIRED_LEDGER_FIELDS) {
    if (!headers.includes(field)) errors.push(`${LEDGER_PATH}: missing ${field} column`);
  }
  if (new Set(headers).size !== headers.length) {
    errors.push(`${LEDGER_PATH}: duplicate column name`);
  }

  const records = [];
  for (const [index, values] of csvRows.slice(1).entries()) {
    const lineNumber = index + 2;
    if (values.length !== headers.length) {
      errors.push(
        `${LEDGER_PATH}:${lineNumber}: expected ${headers.length} columns, got ${values.length}`,
      );
      continue;
    }
    records.push({
      lineNumber,
      row: Object.fromEntries(headers.map((header, fieldIndex) => [header, values[fieldIndex]])),
    });
  }

  if (expectedCandidateCount !== null && records.length !== expectedCandidateCount) {
    errors.push(
      `${LEDGER_PATH}: expected ${expectedCandidateCount} candidates, got ${records.length}`,
    );
  }

  const seenProspects = new Set();
  for (const { lineNumber, row } of records) {
    const label = `${LEDGER_PATH}:${lineNumber}`;
    if (!row.prospect_url) errors.push(`${label}: prospect_url is required`);
    if (seenProspects.has(row.prospect_url)) errors.push(`${label}: duplicate prospect_url`);
    seenProspects.add(row.prospect_url);

    if (!new Set(["qualified", "research", "reject"]).has(row.qualification)) {
      errors.push(`${label}: unsupported qualification ${JSON.stringify(row.qualification)}`);
    }
    if (!new Set(["research", "reject", "live"]).has(row.status)) {
      errors.push(`${label}: unsupported status ${JSON.stringify(row.status)}`);
    }

    if (row.qualification === "reject" || row.status === "reject") {
      if (row.qualification !== "reject" || row.status !== "reject") {
        errors.push(`${label}: reject qualification and status must agree`);
      }
      if (!/^Do not contact\b/iu.test(row.next_safe_action || "")) {
        errors.push(`${label}: reject row next_safe_action must start with Do not contact`);
      }
    }

    if (row.status === "live") {
      if (!row.live_url || !row.live_evidence_url) {
        errors.push(`${label}: live status requires live_url and live_evidence_url`);
      }
    } else if (row.live_url || row.live_evidence_url) {
      errors.push(`${label}: non-live row must not contain live evidence fields`);
    }

    if (["research", "reject"].includes(row.status)) {
      for (const field of RESULT_FIELDS) {
        if (row[field]) errors.push(`${label}: pre-action ${field} must remain empty`);
      }
      if (headers.includes("contacted") && row.contacted) {
        errors.push(`${label}: pre-action contacted must remain empty`);
      }
    }

    if (
      row.acceptance_evidence &&
      row.acceptance_evidence !== "none_found" &&
      /contact|email|form|message|profile|issue|button|公开联系|联系页/iu.test(
        row.acceptance_evidence,
      )
    ) {
      errors.push(`${label}: public contact route is not acceptance_evidence`);
    }

    if (
      row.policy_url &&
      row.policy_url === row.prospect_url &&
      row.acceptance_evidence === "none_found"
    ) {
      errors.push(`${label}: target page without acceptance evidence is not a policy_url`);
    }
  }

  return { errors, candidateCount: records.length, headers, records };
}

export function validateOutreachDocuments({ drafts = {}, markdownFiles = drafts } = {}) {
  const errors = [];
  for (const [path, text] of Object.entries(drafts)) {
    const gateHeader = text.split(/\r?\n/u).slice(0, 20).join("\n");
    if (!DRAFT_GATE_PATTERN.test(gateHeader)) {
      errors.push(`${path}: missing a visible do-not-send/publish or permission gate`);
    }
    if (!DISCLOSURE_PATTERN.test(text)) {
      errors.push(`${path}: missing independent third-party disclosure`);
    }
  }

  for (const [path, text] of Object.entries(markdownFiles)) {
    const linkScheme = findUnnegatedMatch(text, LINK_SCHEME_PATTERNS);
    if (linkScheme) {
      errors.push(
        `${path}:${linkScheme.line}: positive link-scheme request: ${linkScheme.excerpt}`,
      );
    }
    const unsupportedClaim = findUnnegatedMatch(text, UNSUPPORTED_CLAIM_PATTERNS);
    if (unsupportedClaim) {
      errors.push(
        `${path}:${unsupportedClaim.line}: unsupported external-result or relationship claim: ${unsupportedClaim.excerpt}`,
      );
    }
  }

  return { errors, draftCount: Object.keys(drafts).length };
}

async function collectMarkdownFiles(rootDir, relativeDirectory) {
  const absoluteDirectory = join(rootDir, relativeDirectory);
  const entries = await readdir(absoluteDirectory, { withFileTypes: true });
  const files = {};
  for (const entry of entries) {
    const relativePath = join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      Object.assign(files, await collectMarkdownFiles(rootDir, relativePath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files[relativePath] = await readFile(join(rootDir, relativePath), "utf8");
    }
  }
  return files;
}

export async function validateOutreachAssets({ rootDir = DEFAULT_ROOT } = {}) {
  const errors = [];
  let ledgerResult = { errors: [], candidateCount: 0 };
  let markdownFiles = {};

  try {
    const ledgerText = await readFile(join(rootDir, LEDGER_PATH), "utf8");
    ledgerResult = validateOutreachLedger(ledgerText);
    errors.push(...ledgerResult.errors);
  } catch (error) {
    errors.push(`${LEDGER_PATH}: ${error.message}`);
  }

  try {
    markdownFiles = await collectMarkdownFiles(rootDir, OUTREACH_DIR);
  } catch (error) {
    errors.push(`${OUTREACH_DIR}: ${error.message}`);
  }

  const draftPaths = Object.keys(markdownFiles).filter(
    (path) => path.startsWith(`${OUTREACH_DIR}/drafts/`) || path === `${OUTREACH_DIR}/pitch-templates.md`,
  );
  const drafts = Object.fromEntries(draftPaths.map((path) => [path, markdownFiles[path]]));
  const documentResult = validateOutreachDocuments({ drafts, markdownFiles });
  errors.push(...documentResult.errors);

  return {
    errors,
    candidateCount: ledgerResult.candidateCount,
    draftCount: documentResult.draftCount,
    markdownCount: Object.keys(markdownFiles).length,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await validateOutreachAssets();
  if (result.errors.length) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(
      `outreach assets ok: ${result.candidateCount} candidates, ${result.draftCount} gated drafts, ${result.markdownCount} markdown files`,
    );
  }
}
