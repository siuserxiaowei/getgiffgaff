import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_FILES = [
  "docs/research/competitors/competitors-01-20.json",
  "docs/research/competitors/competitors-21-40.json",
];

const REQUIRED_FIELDS = [
  "id",
  "name",
  "url",
  "type",
  "directness",
  "target_query",
  "title",
  "h1",
  "source_urls",
  "date",
];

function normalizedUrl(value) {
  const url = new URL(value);
  url.hash = "";
  url.search = "";
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
  return url.href;
}

function directnessKind(value) {
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "indirect" || normalized.startsWith("间接")) return "indirect";
  if (normalized === "direct" || normalized.startsWith("直接")) return "direct";
  return "other";
}

export async function validateCompetitorResearch({
  rootDir = DEFAULT_ROOT,
  files = DEFAULT_FILES,
} = {}) {
  const errors = [];
  const ids = new Set();
  const urls = new Set();
  const queries = new Set();
  let competitorCount = 0;
  let directCount = 0;
  let indirectCount = 0;

  for (const file of files) {
    let parsed;
    try {
      parsed = JSON.parse(await readFile(join(rootDir, file), "utf8"));
    } catch (error) {
      errors.push(`${file}: ${error.message}`);
      continue;
    }

    if (!Array.isArray(parsed.competitors)) {
      errors.push(`${file}: competitors must be an array`);
      continue;
    }
    if (!parsed.methodology?.copyright_boundary) {
      errors.push(`${file}: methodology.copyright_boundary is required`);
    }

    for (const [index, competitor] of parsed.competitors.entries()) {
      competitorCount += 1;
      const label = `${file}:competitors[${index}]`;

      for (const field of REQUIRED_FIELDS) {
        if (!(field in competitor)) errors.push(`${label}: missing ${field}`);
      }

      const id = String(competitor.id ?? "");
      if (!id) errors.push(`${label}: empty id`);
      if (ids.has(id)) errors.push(`${label}: duplicate id ${id}`);
      ids.add(id);

      try {
        const url = normalizedUrl(competitor.url);
        if (urls.has(url)) errors.push(`${label}: duplicate competitor URL ${url}`);
        urls.add(url);
      } catch {
        errors.push(`${label}: invalid url`);
      }

      if (!Array.isArray(competitor.target_query) || competitor.target_query.length === 0) {
        errors.push(`${label}: target_query must be a non-empty array`);
      } else {
        competitor.target_query.forEach((query) => queries.add(String(query).trim()));
      }

      if (!Array.isArray(competitor.source_urls) || competitor.source_urls.length === 0) {
        errors.push(`${label}: source_urls must be a non-empty array`);
      } else {
        for (const sourceUrl of competitor.source_urls) {
          try {
            new URL(sourceUrl);
          } catch {
            errors.push(`${label}: invalid source URL ${sourceUrl}`);
          }
        }
      }

      const checkedDate = competitor.date?.evidence_checked || competitor.date?.retrieved;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(checkedDate || "")) {
        errors.push(`${label}: a YYYY-MM-DD evidence checked date is required`);
      }

      const kind = directnessKind(competitor.directness);
      if (kind === "direct") directCount += 1;
      if (kind === "indirect") indirectCount += 1;

      for (const forbiddenField of [
        "ranking_position",
        "estimated_traffic",
        "domain_authority",
      ]) {
        if (forbiddenField in competitor) {
          errors.push(`${label}: unsupported guessed metric ${forbiddenField}`);
        }
      }
    }
  }

  return {
    errors,
    competitorCount,
    uniqueUrls: urls.size,
    directCount,
    indirectCount,
    queries,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await validateCompetitorResearch();
  if (result.errors.length) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(
      `competitor research ok: ${result.competitorCount} pages, ${result.uniqueUrls} unique URLs, ${result.queries.size} queries`,
    );
  }
}
