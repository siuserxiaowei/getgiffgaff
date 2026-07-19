#!/usr/bin/env node

import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  bindReleaseSearchChanges,
  recordReleaseSearchSubmission,
} from "./build-release-artifact.mjs";

export { bindReleaseSearchChanges };

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const MODES = new Set(["maintenance", "commerce"]);
const PROJECT_NAME = "getgiffgaff";
const CANONICAL_ORIGIN = "https://getgiffgaff.com";
const ORIGIN_MAIN_REF = "refs/remotes/origin/main";
const RELEASE_PROVENANCE_PATH = "/release-provenance.json";
const RELEASE_PROVENANCE_SCHEMA = "getgiffgaff_release_provenance_v1";
const RELEASE_PROVENANCE_MAX_BYTES = 512;
const PRODUCTION_DEPLOYMENT_READY_ATTEMPTS = 8;
const CANONICAL_SEO_READY_ATTEMPTS = 6;
const CANONICAL_SEO_RETRY_DELAY_MS = 5_000;
const RELEASE_PROVENANCE_PLACEHOLDER = Object.freeze({
  schema: RELEASE_PROVENANCE_SCHEMA,
  commit: "unbound",
});

function help() {
  return `Usage:
  node scripts/deploy-release.mjs --mode commerce
  node scripts/deploy-release.mjs --mode maintenance

Production releases require a clean worktree, the selected release gate, a
fresh origin/main exactly equal to HEAD, new Cloudflare Production metadata
pinned to that HEAD, and successful deployment-URL and canonical-domain HTTP
verification. All checks run inside this command.`;
}

export function parseReleaseDeploymentCliOptions(args = []) {
  const options = { help: false, mode: "" };
  let modeSeen = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else if (argument === "--mode") {
      if (modeSeen) throw new TypeError("--mode may only be specified once");
      modeSeen = true;
      options.mode = args[index + 1] || "";
      index += 1;
    } else if (argument.startsWith("--mode=")) {
      if (modeSeen) throw new TypeError("--mode may only be specified once");
      modeSeen = true;
      options.mode = argument.slice("--mode=".length);
    } else {
      throw new TypeError(`Unknown option: ${argument}`);
    }
  }

  if (!options.help && !MODES.has(options.mode)) {
    throw new TypeError("--mode must be either maintenance or commerce");
  }
  return options;
}

export function executeReleaseCommand(
  command,
  args,
  { cwd = ROOT, env = process.env, captureStdout = false } = {},
) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: captureStdout ? ["inherit", "pipe", "inherit"] : "inherit",
    });
    const stdout = [];
    if (captureStdout) child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve({ stdout: captureStdout ? Buffer.concat(stdout).toString("utf8") : "" });
        return;
      }
      const suffix = signal ? `signal ${signal}` : `exit code ${code}`;
      reject(new Error(`Release command failed (${suffix}): ${[command, ...args].join(" ")}`));
    });
  });
}

function verifiedSha(result, label) {
  const sha = String(result?.stdout || "").trim().toLowerCase();
  if (!/^[0-9a-f]{40}$/u.test(sha)) {
    throw new Error(`Unable to resolve a full Git commit SHA for ${label}`);
  }
  return sha;
}

function fullCommitSha(value, label = "release commit") {
  const sha = String(value || "").trim().toLowerCase();
  if (!/^[0-9a-f]{40}$/u.test(sha)) {
    throw new Error(`Unable to resolve a full Git commit SHA for ${label}`);
  }
  return sha;
}

function provenanceBytes(commit) {
  return Buffer.from(`${JSON.stringify({
    schema: RELEASE_PROVENANCE_SCHEMA,
    commit,
  })}\n`, "utf8");
}

export async function bindReleaseProvenance({
  cwd = ROOT,
  headSha,
  readFileImpl = readFile,
  writeFileImpl = writeFile,
} = {}) {
  const releaseSha = fullCommitSha(headSha, "release provenance");
  const markerPath = path.join(cwd, ".release", RELEASE_PROVENANCE_PATH.slice(1));
  const placeholder = provenanceBytes(RELEASE_PROVENANCE_PLACEHOLDER.commit);
  const current = await readFileImpl(markerPath);
  if (!Buffer.from(current).equals(placeholder)) {
    throw new Error(
      `Refusing to bind release provenance: ${markerPath} is not the exact unbound build artifact`,
    );
  }

  const expected = provenanceBytes(releaseSha);
  await writeFileImpl(markerPath, expected);
  const rebound = await readFileImpl(markerPath);
  if (!Buffer.from(rebound).equals(expected)) {
    throw new Error(`Release provenance byte verification failed after writing ${markerPath}`);
  }
  return { markerPath, commit: releaseSha, bytes: expected.byteLength };
}

function releaseEnvironment(env, mode) {
  return Object.fromEntries(Object.entries(env).filter(([name]) => (
    name !== "ADSENSE_PUBLISHER_ID"
    && !(mode === "maintenance" && name === "COMMERCE_EVIDENCE_FILE")
    && name !== "WRANGLER_OUTPUT_FILE_PATH"
  )));
}

export function parseWranglerDetailedDeployment(text) {
  const records = String(text || "")
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Could not parse Wrangler deployment output: ${error.message}`);
      }
    })
    .filter((record) => record?.type === "pages-deploy-detailed");
  if (records.length !== 1) {
    throw new Error(`Expected exactly one pages-deploy-detailed Wrangler record, found ${records.length}`);
  }
  return records[0];
}

function deploymentId(record) {
  return String(record?.Id ?? record?.id ?? record?.deployment_id ?? "").trim();
}

function parseDeploymentList(result, label) {
  let records;
  try {
    records = JSON.parse(String(result?.stdout || ""));
  } catch (error) {
    throw new Error(`Could not parse ${label} deployment metadata: ${error.message}`);
  }
  if (!Array.isArray(records)) throw new Error(`${label} deployment metadata is not an array`);
  return records;
}

function normalizedUrl(value) {
  return String(value || "").trim().replace(/\/+$/u, "").toLowerCase();
}

function provenanceProbeUrl(origin, nonceFactory) {
  const nonce = String(nonceFactory()).toLowerCase();
  if (!/^[0-9a-f]{64}$/u.test(nonce)) {
    throw new Error("Release provenance probe nonce must contain 256 bits of hexadecimal entropy");
  }
  const url = new URL(RELEASE_PROVENANCE_PATH, `${normalizedUrl(origin)}/`);
  url.searchParams.set("release_provenance_probe", nonce);
  return url.href;
}

export function validateReleaseProvenanceResponse(response, bytes, {
  expectedCommit,
  label = RELEASE_PROVENANCE_PATH,
} = {}) {
  const expectedSha = expectedCommit === undefined
    ? ""
    : fullCommitSha(expectedCommit, "expected release provenance");
  const failures = [];
  const body = Buffer.from(bytes || []);
  const contentType = response?.headers?.get("content-type") || "";
  const mime = contentType.toLowerCase().split(";", 1)[0].trim();
  const cacheControl = response?.headers?.get("cache-control") || "";

  if (response?.status !== 200) failures.push(`expected status 200, got ${response?.status ?? "missing"}`);
  if (mime !== "application/json") {
    failures.push(`expected Content-Type application/json, got ${contentType || "missing"}`);
  }
  if (!/\bprivate\b/iu.test(cacheControl) || !/\bno-store\b/iu.test(cacheControl)) {
    failures.push(`expected Cache-Control private, no-store, got ${cacheControl || "missing"}`);
  }
  if (body.byteLength === 0) failures.push("response body is empty");
  if (body.byteLength > RELEASE_PROVENANCE_MAX_BYTES) {
    failures.push(`response body is ${body.byteLength} bytes, limit is ${RELEASE_PROVENANCE_MAX_BYTES}`);
  }

  let actualCommit = "";
  if (body.byteLength > 0 && body.byteLength <= RELEASE_PROVENANCE_MAX_BYTES) {
    try {
      const payload = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
      const keys = payload && !Array.isArray(payload) && typeof payload === "object"
        ? Object.keys(payload).sort()
        : [];
      if (keys.join(",") !== "commit,schema") {
        failures.push("payload must contain exactly the commit and schema fields");
      }
      if (payload?.schema !== RELEASE_PROVENANCE_SCHEMA) {
        failures.push(`schema is ${JSON.stringify(payload?.schema)}, expected ${RELEASE_PROVENANCE_SCHEMA}`);
      }
      if (typeof payload?.commit !== "string" || !/^[0-9a-f]{40}$/u.test(payload.commit)) {
        failures.push("commit is not a lowercase 40-character Git SHA");
      } else if (expectedSha && payload.commit !== expectedSha) {
        failures.push(`commit ${payload.commit} does not equal expected release ${expectedSha}`);
      } else {
        actualCommit = payload.commit;
      }
    } catch (error) {
      failures.push(`invalid JSON: ${error.message}`);
    }
  }

  if (failures.length) {
    throw new Error(`Release provenance verification failed for ${label}: ${failures.join("; ")}`);
  }
  return {
    status: response.status,
    contentType: mime,
    cacheControl,
    bytes: body.byteLength,
    commit: actualCommit,
  };
}

export async function verifyReleaseProvenance(origin, {
  expectedCommit,
  fetchImpl = globalThis.fetch,
  attempts = 1,
  delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  nonceFactory = () => randomBytes(32).toString("hex"),
  label = normalizedUrl(origin),
} = {}) {
  if (!Number.isSafeInteger(attempts) || attempts < 1 || attempts > 8) {
    throw new TypeError("Release provenance attempts must be an integer from 1 through 8");
  }
  let lastFailure = "no response";
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const url = provenanceProbeUrl(origin, nonceFactory);
    try {
      const response = await fetchImpl(url, {
        redirect: "manual",
        cache: "no-store",
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      });
      const bytes = await response.arrayBuffer();
      return {
        ...validateReleaseProvenanceResponse(response, bytes, { expectedCommit, label }),
        url,
        response,
      };
    } catch (error) {
      lastFailure = error.message;
    }
    if (attempt < attempts) await delay(750 * attempt);
  }
  throw new Error(
    `Release provenance probe failed for ${label} after ${attempts} attempt${attempts === 1 ? "" : "s"}: ${lastFailure}`,
  );
}

export async function resolveCanonicalSearchBaseline(options = {}) {
  const result = await verifyReleaseProvenance(CANONICAL_ORIGIN, {
    ...options,
    expectedCommit: undefined,
    attempts: options.attempts ?? 4,
    label: "canonical production search-change baseline",
  });
  return result.commit;
}

function indexNowReceipt(commandResult, expectedUrls) {
  const records = String(commandResult?.stdout || "")
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("{") && line.endsWith("}"))
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });
  const receipt = records.at(-1);
  if (
    !receipt
    || receipt.outcome !== "accepted"
    || receipt.endpoint !== "https://api.indexnow.org/indexnow"
    || ![200, 202].includes(receipt.status)
    || receipt.submittedUrls !== expectedUrls
    || receipt.keyLocation !== `${CANONICAL_ORIGIN}/indexnow-key.txt`
  ) {
    throw new Error("IndexNow command did not return an exact accepted submission receipt");
  }
  return receipt;
}

export function validateNewProductionDeployment({ before, after, detailed, headSha }) {
  const failures = [];
  const detailedId = deploymentId(detailed);
  const detailedUrl = normalizedUrl(detailed?.url);
  const detailedCommit = String(detailed?.deployment_trigger?.metadata?.commit_hash || "")
    .trim().toLowerCase();
  const beforeIds = new Set(before.map(deploymentId).filter(Boolean));
  const newRecords = after.filter((record) => {
    const id = deploymentId(record);
    return id && !beforeIds.has(id);
  });

  if (!detailedId) failures.push("Wrangler detailed metadata is missing deployment_id");
  if (String(detailed?.pages_project || "").trim() !== PROJECT_NAME) {
    failures.push(`Wrangler detailed metadata project is ${detailed?.pages_project || "missing"}, expected ${PROJECT_NAME}`);
  }
  if (String(detailed?.environment || "").trim().toLowerCase() !== "production") {
    failures.push(`Wrangler detailed metadata environment is ${detailed?.environment || "missing"}, expected production`);
  }
  if (String(detailed?.production_branch || "").trim() !== "main") {
    failures.push(`Wrangler detailed metadata production_branch is ${detailed?.production_branch || "missing"}, expected main`);
  }
  if (detailedCommit !== headSha) {
    failures.push(`Wrangler detailed metadata commit ${detailedCommit || "missing"} does not equal HEAD ${headSha}`);
  }
  if (!/^https:\/\/[a-z0-9-]+\.getgiffgaff\.pages\.dev$/u.test(detailedUrl)) {
    failures.push(`Wrangler detailed metadata has invalid deployment URL ${detailedUrl || "missing"}`);
  }
  if (newRecords.length !== 1) {
    failures.push(`expected exactly one new Production deployment record, found ${newRecords.length}`);
  }

  const record = newRecords.length === 1 ? newRecords[0] : undefined;
  if (record) {
    const source = String(record.Source || "").trim().toLowerCase();
    if (deploymentId(record) !== detailedId) failures.push("new Production record ID does not match Wrangler output");
    if (String(record.Environment || "").trim() !== "Production") {
      failures.push(`new deployment Environment is ${record.Environment || "missing"}, expected Production`);
    }
    if (String(record.Branch || "").trim() !== "main") {
      failures.push(`new deployment Branch is ${record.Branch || "missing"}, expected main`);
    }
    if (!/^[0-9a-f]{7,40}$/u.test(source) || !headSha.startsWith(source)) {
      failures.push(`new deployment Source ${source || "missing"} does not match HEAD ${headSha}`);
    }
    if (normalizedUrl(record.Deployment) !== detailedUrl) {
      failures.push("new Production record URL does not match Wrangler output");
    }
    if (String(record.Status || "").trim() === "Failure") failures.push("new Production deployment status is Failure");
  }

  if (failures.length) {
    throw new Error(`Production deployment provenance verification failed:\n${failures.join("\n")}`);
  }
  return { deploymentId: detailedId, deploymentUrl: detailedUrl };
}

function canonicalHref(html) {
  for (const tag of String(html).match(/<link\b[^>]*>/giu) || []) {
    if (!/\brel\s*=\s*["'][^"']*\bcanonical\b[^"']*["']/iu.test(tag)) continue;
    return tag.match(/\bhref\s*=\s*["']([^"']+)["']/iu)?.[1] || "";
  }
  return "";
}

export async function verifyProductionDeploymentUrl(deploymentUrl, {
  fetchImpl = globalThis.fetch,
  attempts = PRODUCTION_DEPLOYMENT_READY_ATTEMPTS,
  delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
  let lastFailure = "no response";
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchImpl(`${normalizedUrl(deploymentUrl)}/`, {
        redirect: "manual",
        signal: AbortSignal.timeout(15_000),
      });
      const html = await response.text();
      const canonical = canonicalHref(html);
      if (response.status === 200 && canonical === `${CANONICAL_ORIGIN}/`) {
        return { status: response.status, canonical };
      }
      lastFailure = `status ${response.status}, canonical ${canonical || "missing"}`;
    } catch (error) {
      lastFailure = error.message;
    }
    if (attempt < attempts) {
      await delay(Math.min(5_000, 1_000 * (2 ** Math.max(0, attempt - 1))));
    }
  }
  throw new Error(`Production deployment URL verification failed for ${deploymentUrl}: ${lastFailure}`);
}

export async function verifyCanonicalSeoAfterPropagation({
  runCommand,
  commandOptions,
  deploymentId,
  attempts = CANONICAL_SEO_READY_ATTEMPTS,
  delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  delayMs = CANONICAL_SEO_RETRY_DELAY_MS,
} = {}) {
  if (typeof runCommand !== "function") throw new TypeError("runCommand is required");
  if (!Number.isSafeInteger(attempts) || attempts < 1 || attempts > 8) {
    throw new TypeError("Canonical SEO propagation attempts must be an integer from 1 through 8");
  }
  if (!Number.isSafeInteger(delayMs) || delayMs < 0 || delayMs > 15_000) {
    throw new TypeError("Canonical SEO propagation delay must be from 0 through 15000 milliseconds");
  }

  let lastFailure = "no verifier result";
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await runCommand("npm", [
        "run", "verify:seo", "--", "--base-url", CANONICAL_ORIGIN, "--expected-url-count", "39",
      ], commandOptions);
      return { attempts: attempt };
    } catch (error) {
      lastFailure = error.message;
    }
    if (attempt < attempts) await delay(delayMs);
  }
  throw new Error(
    `Production deployment ${deploymentId || "unknown"} failed canonical-domain verification `
    + `after ${attempts} propagation attempt${attempts === 1 ? "" : "s"}: ${lastFailure}`,
  );
}

async function listProduction(runCommand, commandOptions) {
  return parseDeploymentList(
    await runCommand("npx", [
      "--no-install", "wrangler", "pages", "deployment", "list",
      "--project-name", PROJECT_NAME, "--environment", "production", "--json",
    ], { ...commandOptions, captureStdout: true }),
    "Cloudflare Production",
  );
}

async function resolveHeadAndOriginMain(runCommand, commandOptions) {
  const headSha = verifiedSha(await runCommand(
    "git", ["rev-parse", "--verify", "HEAD"], { ...commandOptions, captureStdout: true },
  ), "HEAD");
  const originMainSha = verifiedSha(await runCommand(
    "git", ["rev-parse", "--verify", ORIGIN_MAIN_REF], { ...commandOptions, captureStdout: true },
  ), "origin/main");
  if (headSha !== originMainSha) {
    throw new Error(`Production deployment requires HEAD ${headSha} to equal freshly fetched origin/main ${originMainSha}.`);
  }
  return { headSha, originMainSha };
}

export async function runReleaseDeployment({
  mode,
  cwd = ROOT,
  env = process.env,
  runCommand = executeReleaseCommand,
  bindProvenance = bindReleaseProvenance,
  bindSearchChanges = bindReleaseSearchChanges,
  recordSearchSubmission = recordReleaseSearchSubmission,
  resolveSearchBaseline = resolveCanonicalSearchBaseline,
  fetchImpl = globalThis.fetch,
  delay,
  nonceFactory,
} = {}) {
  if (!MODES.has(mode)) throw new TypeError("mode must be either maintenance or commerce");
  if (mode === "commerce" && !String(env.COMMERCE_EVIDENCE_FILE || "").trim()) {
    throw new Error("Commerce deployment requires COMMERCE_EVIDENCE_FILE pointing to the private validated evidence package.");
  }

  const deploymentEnv = releaseEnvironment(env, mode);
  const commandOptions = { cwd, env: deploymentEnv };
  await runCommand("node", ["scripts/assert-clean-worktree.mjs"], commandOptions);
  await runCommand("npm", ["run", `gate:${mode}`], commandOptions);
  await runCommand("git", ["fetch", "--quiet", "origin", "+refs/heads/main:refs/remotes/origin/main"], commandOptions);
  const { headSha, originMainSha } = await resolveHeadAndOriginMain(runCommand, commandOptions);
  await runCommand("node", ["scripts/assert-clean-worktree.mjs"], commandOptions);
  const boundProvenance = await bindProvenance({ cwd, headSha });
  if (boundProvenance?.commit !== headSha) {
    throw new Error(
      `Release provenance binding returned ${boundProvenance?.commit || "missing"}, expected HEAD ${headSha}`,
    );
  }
  const searchBaselineRef = await resolveSearchBaseline({
    fetchImpl,
    delay,
    nonceFactory,
  });
  const searchChanges = await bindSearchChanges({
    cwd,
    baselineRef: searchBaselineRef,
    candidateCommit: headSha,
  });

  const before = await listProduction(runCommand, commandOptions);
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-production-deploy-"));
  const outputFile = path.join(outputRoot, "wrangler-output.ndjson");
  let outputText;
  try {
    await runCommand("npx", [
      "--no-install", "wrangler", "pages", "deploy", ".release",
      "--project-name", PROJECT_NAME, "--branch", "main", "--commit-hash", headSha,
    ], { ...commandOptions, env: { ...deploymentEnv, WRANGLER_OUTPUT_FILE_PATH: outputFile } });
    outputText = await readFile(outputFile, "utf8");
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }

  let after;
  let afterMetadataError;
  try {
    after = await listProduction(runCommand, commandOptions);
  } catch (error) {
    afterMetadataError = error;
  }

  // The remote may advance while the upload is in flight. We cannot roll back the
  // upload here, but the command must fail loudly instead of reporting success.
  let postUpload;
  try {
    await runCommand("git", ["fetch", "--quiet", "origin", "+refs/heads/main:refs/remotes/origin/main"], commandOptions);
    postUpload = await resolveHeadAndOriginMain(runCommand, commandOptions);
  } catch (error) {
    throw new Error(`Production upload completed, but the post-upload origin/main guard failed: ${error.message}`);
  }
  if (postUpload.headSha !== headSha || postUpload.originMainSha !== headSha) {
    throw new Error(
      `Production upload completed, but the post-upload release guard failed: uploaded release ${headSha}; `
      + `current HEAD ${postUpload.headSha}; current origin/main ${postUpload.originMainSha}.`,
    );
  }

  if (afterMetadataError) {
    throw new Error(`Production upload completed, but post-upload metadata capture failed: ${afterMetadataError.message}`);
  }
  const detailed = parseWranglerDetailedDeployment(outputText);
  const deployment = validateNewProductionDeployment({ before, after, detailed, headSha });

  await verifyProductionDeploymentUrl(deployment.deploymentUrl, { fetchImpl, delay });
  await verifyReleaseProvenance(deployment.deploymentUrl, {
    expectedCommit: headSha,
    fetchImpl,
    attempts: 8,
    delay,
    nonceFactory,
    label: `Production deployment ${deployment.deploymentId}`,
  });
  await verifyReleaseProvenance(CANONICAL_ORIGIN, {
    expectedCommit: headSha,
    fetchImpl,
    attempts: 8,
    delay,
    nonceFactory,
    label: "canonical production domain before verify:seo",
  });
  await verifyCanonicalSeoAfterPropagation({
    runCommand,
    commandOptions,
    deploymentId: deployment.deploymentId,
    delay,
  });
  await verifyReleaseProvenance(CANONICAL_ORIGIN, {
    expectedCommit: headSha,
    fetchImpl,
    attempts: 4,
    delay,
    nonceFactory,
    label: "canonical production domain after verify:seo",
  });
  await runCommand("node", ["scripts/verify-analytics-persistence.mjs"], commandOptions);
  let indexNow;
  if (searchChanges.changedPaths.length > 0) {
    if (searchChanges.submissionReceipt?.outcome === "accepted") {
      indexNow = {
        submitted: false,
        alreadySubmitted: true,
        changedPaths: searchChanges.changedPaths,
      };
    } else {
      const result = await runCommand(
        "npm",
        ["run", "submit:indexnow"],
        { ...commandOptions, captureStdout: true },
      );
      const receipt = indexNowReceipt(result, searchChanges.changedPaths.length);
      if (searchChanges.statePath) {
        await recordSearchSubmission({ cwd, candidateCommit: headSha, receipt });
      }
      indexNow = { submitted: true, changedPaths: searchChanges.changedPaths };
    }
  } else {
    indexNow = { submitted: false, changedPaths: [] };
  }

  return {
    mode,
    headSha,
    originMainSha,
    postUploadOriginMainSha: postUpload.originMainSha,
    deploymentId: deployment.deploymentId,
    deploymentUrl: deployment.deploymentUrl,
    indexNow,
    deployed: true,
  };
}

export async function runReleaseDeploymentCli(args = process.argv.slice(2), {
  runDeployment = runReleaseDeployment,
  write = (value) => process.stdout.write(value),
} = {}) {
  const options = parseReleaseDeploymentCliOptions(args);
  if (options.help) {
    write(`${help()}\n`);
    return;
  }
  const report = await runDeployment({ mode: options.mode });
  write(`${JSON.stringify(report)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  runReleaseDeploymentCli().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
