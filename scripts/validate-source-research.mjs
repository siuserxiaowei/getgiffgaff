import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_FILE = "docs/research/sources/six-source-teardown.json";

const EXPECTED_SOURCE_URLS = [
  "https://github.com/ssnhd/giffgaff",
  "https://giffgaff.us/",
  "https://www.wise-sim.org/guides/giffgaff-complete-guide",
  "https://sites.google.com/view/shiyongfangfa/%E8%8B%B1%E5%9B%BD-giffgaff-%E5%AE%9E%E4%BD%93%E5%8D%A1%E4%BF%9D%E5%8F%B7%E5%85%A8%E6%94%BB%E7%95%A5%E6%BF%80%E6%B4%BB%E5%85%85%E5%80%BC%E5%8F%8A%E4%BD%BF%E7%94%A8%E6%95%99%E7%A8%8B",
  "https://aibook.ren/archives/ai-resource-open-giffgaff-esim",
  "https://aiyanxishe.feishu.cn/wiki/Y7utw8thki1akSkkwr3cQNDvned",
];

const REQUIRED_SOURCE_FIELDS = [
  "id",
  "name",
  "url",
  "sourceType",
  "access",
  "searchIntent",
  "metadata",
  "structure",
  "technicalSeo",
  "trustSignals",
  "linksAndConversion",
  "copyright",
  "transferableLessons",
  "evidenceUrls",
];

function normalizeUrl(value) {
  const url = new URL(value);
  url.hash = "";
  return url.href;
}

function walkKeys(value, found = []) {
  if (!value || typeof value !== "object") return found;
  for (const [key, child] of Object.entries(value)) {
    found.push(key);
    walkKeys(child, found);
  }
  return found;
}

export async function validateSourceResearch({
  rootDir = DEFAULT_ROOT,
  file = DEFAULT_FILE,
} = {}) {
  const errors = [];
  let research;

  try {
    research = JSON.parse(await readFile(join(rootDir, file), "utf8"));
  } catch (error) {
    return { errors: [`${file}: ${error.message}`], sourceCount: 0, uniqueUrls: 0 };
  }

  if (!research.scope?.notIncluded?.length) {
    errors.push(`${file}: scope.notIncluded must document capture limits`);
  }
  if (!research.copyrightBoundary?.defaultRule) {
    errors.push(`${file}: copyrightBoundary.defaultRule is required`);
  }
  if (!Array.isArray(research.sources)) {
    return { errors: [...errors, `${file}: sources must be an array`], sourceCount: 0, uniqueUrls: 0 };
  }

  const ids = new Set();
  const urls = new Set();

  for (const [index, source] of research.sources.entries()) {
    const label = `${file}:sources[${index}]`;
    for (const field of REQUIRED_SOURCE_FIELDS) {
      if (!(field in source)) errors.push(`${label}: missing ${field}`);
    }

    if (!source.id) errors.push(`${label}: id is empty`);
    if (ids.has(source.id)) errors.push(`${label}: duplicate id ${source.id}`);
    ids.add(source.id);

    try {
      const url = normalizeUrl(source.url);
      if (urls.has(url)) errors.push(`${label}: duplicate source URL ${url}`);
      urls.add(url);
    } catch {
      errors.push(`${label}: invalid url`);
    }

    if (!source.access || typeof source.access.status !== "number") {
      errors.push(`${label}: numeric access.status is required`);
    }
    if (!source.copyright?.allowedCapture || !source.copyright?.doNotCopy?.length) {
      errors.push(`${label}: copyright capture and do-not-copy boundaries are required`);
    }
    if (!Array.isArray(source.transferableLessons) || source.transferableLessons.length < 2) {
      errors.push(`${label}: at least two transferable lessons are required`);
    }
    if (!Array.isArray(source.evidenceUrls) || source.evidenceUrls.length === 0) {
      errors.push(`${label}: evidenceUrls must be a non-empty array`);
    } else {
      for (const evidenceUrl of source.evidenceUrls) {
        try {
          new URL(evidenceUrl);
        } catch {
          errors.push(`${label}: invalid evidence URL ${evidenceUrl}`);
        }
      }
    }

    const forbiddenCaptureKeys = new Set([
      "articleBody",
      "bodyHtml",
      "fullText",
      "rawHtml",
      "screenshotArchive",
    ]);
    for (const key of walkKeys(source)) {
      if (forbiddenCaptureKeys.has(key)) {
        errors.push(`${label}: disallowed full-content capture field ${key}`);
      }
    }
  }

  const expected = new Set(EXPECTED_SOURCE_URLS.map(normalizeUrl));
  for (const url of expected) {
    if (!urls.has(url)) errors.push(`${file}: missing requested source ${url}`);
  }

  return {
    errors,
    sourceCount: research.sources.length,
    uniqueUrls: urls.size,
    sourceIds: ids,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await validateSourceResearch();
  if (result.errors.length) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(
      `source research ok: ${result.sourceCount} requested sources, ${result.uniqueUrls} unique URLs`,
    );
  }
}
