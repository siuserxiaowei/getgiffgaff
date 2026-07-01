import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = join(__dirname, "..");
const DEFAULT_SOURCE_FILES = [
  "docs/research/sources/official.json",
  "docs/research/sources/community.json",
];

const ALLOWED_ACCESS = new Set(["open", "search-result", "login-limited", "unstable"]);
const ALLOWED_SOURCE_TYPES = new Set([
  "official-rule",
  "community-guide",
  "forum-discussion",
  "video-search",
  "social-post",
  "search-entry",
  "blog-post",
]);

function hasLikelyCopiedBody(summary) {
  return summary.length > 280 || /(\n|。.*。.*。.*。.*。.*。.*。.*。.*。.*。.*。)/.test(summary);
}

export async function validateResearchSources({
  rootDir = DEFAULT_ROOT,
  sourceFiles = DEFAULT_SOURCE_FILES,
} = {}) {
  const errors = [];
  const ids = new Set();
  const platforms = new Set();
  let sourceCount = 0;

  for (const file of sourceFiles) {
    const raw = await readFile(join(rootDir, file), "utf8");
    const entries = JSON.parse(raw);
    if (!Array.isArray(entries)) {
      errors.push(`${file}: expected a JSON array`);
      continue;
    }

    for (const entry of entries) {
      sourceCount += 1;
      const label = `${file}:${entry.id || "missing-id"}`;

      for (const key of ["id", "platform", "title", "url", "topics", "sourceType", "publicAccess", "summary", "verification"]) {
        if (!(key in entry)) errors.push(`${label}: missing ${key}`);
      }

      if (typeof entry.id === "string") {
        if (!/^[a-z0-9-]+$/.test(entry.id)) errors.push(`${label}: id must be lowercase kebab-case`);
        if (ids.has(entry.id)) errors.push(`${label}: duplicate id`);
        ids.add(entry.id);
      }

      if (typeof entry.platform === "string") platforms.add(entry.platform);
      if (!Array.isArray(entry.topics) || entry.topics.length === 0) errors.push(`${label}: topics must be a non-empty array`);
      if (!ALLOWED_SOURCE_TYPES.has(entry.sourceType)) errors.push(`${label}: invalid sourceType`);
      if (!ALLOWED_ACCESS.has(entry.publicAccess)) errors.push(`${label}: invalid publicAccess`);

      try {
        new URL(entry.url);
      } catch {
        errors.push(`${label}: invalid url`);
      }

      if (typeof entry.summary !== "string" || entry.summary.length < 12) errors.push(`${label}: summary too short`);
      if (typeof entry.summary === "string" && hasLikelyCopiedBody(entry.summary)) errors.push(`${label}: summary looks too long or copied`);
      if (typeof entry.verification !== "string" || entry.verification.length < 12) errors.push(`${label}: verification too short`);
    }
  }

  return { errors, sourceCount, platforms };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await validateResearchSources();
  if (result.errors.length > 0) {
    console.error(result.errors.join("\n"));
    process.exit(1);
  }
  console.log(`research sources ok: ${result.sourceCount} sources, ${result.platforms.size} platforms`);
}
