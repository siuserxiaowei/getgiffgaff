import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { PUBLIC_INDEXABLE_PATHS } from "../public/route-manifest.js";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const DEFAULT_ORIGIN = "https://getgiffgaff.com";
const DEFAULT_ENDPOINT = "https://api.indexnow.org/indexnow";
const KEY_PATH = "/indexnow-key.txt";
const DEFAULT_RELEASE_ROOT = path.join(ROOT, ".release");
const SEARCH_CHANGES_PATH = path.join(DEFAULT_RELEASE_ROOT, "release-search-changes.json");
const SITEMAP_PATH = path.join(DEFAULT_RELEASE_ROOT, "sitemap.xml");
const SEARCH_CHANGES_SCHEMA = "getgiffgaff_search_changes_v1";

function normalizePaths(pathnames, { allowEmpty = false } = {}) {
  if (!Array.isArray(pathnames)) throw new TypeError("IndexNow paths must be an array");
  const normalized = pathnames.map((pathname) => String(pathname || "").trim());
  if (!allowEmpty && normalized.length === 0) {
    throw new Error("IndexNow has no changed URLs to submit");
  }
  if (new Set(normalized).size !== normalized.length) {
    throw new Error("IndexNow paths must not contain duplicates");
  }
  for (const pathname of normalized) {
    if (!PUBLIC_INDEXABLE_PATHS.includes(pathname)) {
      throw new Error(`IndexNow path is not an indexable canonical route: ${pathname}`);
    }
  }
  return normalized;
}

export function parseIndexNowCliOptions(args = []) {
  let all = false;
  let help = false;
  for (const argument of args) {
    if (argument === "--all") {
      if (all) throw new TypeError("--all may only be specified once");
      all = true;
    } else if (argument === "--help" || argument === "-h") help = true;
    else throw new TypeError(`Unknown option: ${argument}`);
  }
  return { all, help };
}

export async function readReleaseChangedPaths({
  changesPath = SEARCH_CHANGES_PATH,
  sitemapPath = SITEMAP_PATH,
} = {}) {
  const [changesText, sitemap] = await Promise.all([
    readFile(changesPath, "utf8"),
    readFile(sitemapPath, "utf8"),
  ]);
  const changes = JSON.parse(changesText);
  if (changes?.schema !== SEARCH_CHANGES_SCHEMA) {
    throw new Error(`Unsupported release search-changes schema: ${changes?.schema || "missing"}`);
  }
  const sitemapSha256 = createHash("sha256").update(sitemap).digest("hex");
  if (changes.sitemapSha256 !== sitemapSha256) {
    throw new Error("Release search changes do not match the built sitemap");
  }
  return normalizePaths(changes.changedPaths, { allowEmpty: true });
}

export function createIndexNowPayload(
  key,
  origin = DEFAULT_ORIGIN,
  pathnames,
) {
  const normalizedOrigin = String(origin).replace(/\/+$/, "");
  if (normalizedOrigin !== DEFAULT_ORIGIN) {
    throw new Error(`IndexNow submission origin must be ${DEFAULT_ORIGIN}`);
  }
  if (!/^[a-z0-9-]{8,128}$/i.test(key)) {
    throw new Error("IndexNow key must contain 8-128 letters, numbers, or hyphens");
  }

  return Object.freeze({
    host: new URL(normalizedOrigin).hostname,
    key,
    keyLocation: `${normalizedOrigin}${KEY_PATH}`,
    urlList: normalizePaths(pathnames).map((pathname) => `${normalizedOrigin}${pathname}`),
  });
}

export async function submitIndexNow({
  key,
  fetchImpl = globalThis.fetch,
  endpoint = DEFAULT_ENDPOINT,
  origin = DEFAULT_ORIGIN,
  pathnames,
} = {}) {
  const payload = createIndexNowPayload(String(key || "").trim(), origin, pathnames);
  const keyResponse = await fetchImpl(payload.keyLocation, {
    headers: { accept: "text/plain" },
    redirect: "error",
  });
  const publishedKey = (await keyResponse.text()).trim();
  if (!keyResponse.ok || publishedKey !== payload.key) {
    throw new Error(`Published IndexNow key verification failed with HTTP ${keyResponse.status}`);
  }

  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      accept: "application/json, text/plain;q=0.9, */*;q=0.1",
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
    redirect: "error",
  });
  if (![200, 202].includes(response.status)) {
    throw new Error(`IndexNow rejected the URL batch with HTTP ${response.status}`);
  }

  return Object.freeze({
    outcome: "accepted",
    endpoint,
    status: response.status,
    submittedUrls: payload.urlList.length,
    keyLocation: payload.keyLocation,
  });
}

export async function runIndexNowCli(args = process.argv.slice(2), {
  readChangedPaths = readReleaseChangedPaths,
  readKey = () => readFile(path.join(ROOT, "public", "indexnow-key.txt"), "utf8"),
  submit = submitIndexNow,
  write = (value) => process.stdout.write(value),
} = {}) {
  const options = parseIndexNowCliOptions(args);
  if (options.help) {
    write(
      "Usage: npm run submit:indexnow [-- --all]\n\n"
      + "Default: submit only the current release's verified changed URL set.\n"
      + "--all: explicitly submit every indexable canonical URL.\n",
    );
    return { help: true };
  }
  const pathnames = options.all ? PUBLIC_INDEXABLE_PATHS : await readChangedPaths();
  if (pathnames.length === 0) {
    const report = Object.freeze({
      outcome: "no_changes",
      status: "noop",
      submittedUrls: 0,
    });
    write(`${JSON.stringify(report)}\n`);
    return report;
  }
  const key = await readKey();
  const report = await submit({ key, pathnames });
  write(`${JSON.stringify(report)}\n`);
  return report;
}

const invokedDirectly =
  process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (invokedDirectly) {
  runIndexNowCli().catch((error) => {
    process.stderr.write(`${error?.message || error}\n`);
    process.exitCode = 1;
  });
}
