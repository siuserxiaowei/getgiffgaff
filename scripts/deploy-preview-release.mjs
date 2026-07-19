#!/usr/bin/env node

import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  bindReleaseEdgeCacheVersion,
  bindReleaseProvenance,
  executeReleaseCommand,
  parseWranglerDetailedDeployment,
} from "./deploy-release.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const PROJECT_NAME = "getgiffgaff";

function usage() {
  return `Usage:
  node scripts/deploy-preview-release.mjs

The Preview candidate is always rebuilt by the maintenance gate and pinned to
the clean local HEAD after a fresh fetch of the current remote branch. SHA,
branch and artifact-directory overrides are intentionally unsupported.`;
}

export function parsePreviewDeploymentCliOptions(args = []) {
  let help = false;
  for (const argument of args) {
    if (argument === "--help" || argument === "-h") help = true;
    else throw new TypeError(`Unknown option: ${argument}`);
  }
  return { help };
}

function fullSha(result, label) {
  const value = String(result?.stdout || "").trim().toLowerCase();
  if (!/^[0-9a-f]{40}$/u.test(value)) throw new Error(`Unable to resolve a full Git commit SHA for ${label}`);
  return value;
}

function branchName(result) {
  const value = String(result?.stdout || "").trim();
  if (!/^(?!main$)[A-Za-z0-9._/-]+$/u.test(value) || value.startsWith("-") || value.includes("..")) {
    throw new Error(`Preview deployment requires a checked-out non-main branch; got ${value || "detached HEAD"}`);
  }
  return value;
}

function previewEnvironment(env) {
  return Object.fromEntries(Object.entries(env).filter(([name]) => (
    name !== "COMMERCE_EVIDENCE_FILE"
    && name !== "ADSENSE_PUBLISHER_ID"
    && name !== "WRANGLER_OUTPUT_FILE_PATH"
  )));
}

export function validatePreviewWranglerRecord(record, { headSha }) {
  const deploymentId = String(record?.deployment_id || "").trim();
  const deploymentUrl = String(record?.url || "").trim().replace(/\/+$/u, "").toLowerCase();
  const commitHash = String(record?.deployment_trigger?.metadata?.commit_hash || "").trim().toLowerCase();
  const failures = [];
  if (!deploymentId) failures.push("missing deployment_id");
  if (String(record?.pages_project || "").trim() !== PROJECT_NAME) {
    failures.push(`project is ${record?.pages_project || "missing"}, expected ${PROJECT_NAME}`);
  }
  if (String(record?.environment || "").trim().toLowerCase() !== "preview") {
    failures.push(`environment is ${record?.environment || "missing"}, expected preview`);
  }
  if (commitHash !== headSha) failures.push(`commit ${commitHash || "missing"} does not equal HEAD ${headSha}`);
  if (!/^https:\/\/[a-z0-9-]+\.getgiffgaff\.pages\.dev$/u.test(deploymentUrl)) {
    failures.push(`invalid deployment URL ${deploymentUrl || "missing"}`);
  }
  if (failures.length) throw new Error(`Preview deployment provenance verification failed:\n${failures.join("\n")}`);
  return { deploymentId, deploymentUrl };
}

export async function runPreviewReleaseDeployment({
  cwd = ROOT,
  env = process.env,
  runCommand = executeReleaseCommand,
  bindProvenance = bindReleaseProvenance,
  bindEdgeCacheVersion = bindReleaseEdgeCacheVersion,
} = {}) {
  const deploymentEnv = previewEnvironment(env);
  const commandOptions = { cwd, env: deploymentEnv };

  await runCommand("node", ["scripts/assert-clean-worktree.mjs"], commandOptions);
  // This gate includes the full verify/build pipeline and regenerates .release.
  await runCommand("npm", ["run", "gate:maintenance"], commandOptions);
  const branch = branchName(await runCommand(
    "git", ["symbolic-ref", "--quiet", "--short", "HEAD"],
    { ...commandOptions, captureStdout: true },
  ));
  const remoteRef = `refs/remotes/origin/${branch}`;
  await runCommand("git", [
    "fetch", "--quiet", "origin", `+refs/heads/${branch}:${remoteRef}`,
  ], commandOptions);
  const headSha = fullSha(await runCommand(
    "git", ["rev-parse", "--verify", "HEAD"], { ...commandOptions, captureStdout: true },
  ), "HEAD");
  const originBranchSha = fullSha(await runCommand(
    "git", ["rev-parse", "--verify", remoteRef], { ...commandOptions, captureStdout: true },
  ), `origin/${branch}`);
  if (headSha !== originBranchSha) {
    throw new Error(`Preview deployment requires HEAD ${headSha} to equal freshly fetched origin/${branch} ${originBranchSha}.`);
  }
  await runCommand("node", ["scripts/assert-clean-worktree.mjs"], commandOptions);
  const boundProvenance = await bindProvenance({ cwd, headSha });
  if (boundProvenance?.commit !== headSha) {
    throw new Error(
      `Release provenance binding returned ${boundProvenance?.commit || "missing"}, expected HEAD ${headSha}`,
    );
  }
  const boundEdgeCacheVersion = await bindEdgeCacheVersion({ cwd, headSha });
  if (boundEdgeCacheVersion?.commit !== headSha) {
    throw new Error(
      `Edge cache version binding returned ${boundEdgeCacheVersion?.commit || "missing"}, expected HEAD ${headSha}`,
    );
  }

  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-preview-deploy-"));
  const outputFile = path.join(outputRoot, "wrangler-output.ndjson");
  let detailed;
  try {
    await runCommand("npx", [
      "--no-install", "wrangler", "pages", "deploy", ".release",
      "--project-name", PROJECT_NAME, "--branch", branch, "--commit-hash", headSha,
    ], { ...commandOptions, env: { ...deploymentEnv, WRANGLER_OUTPUT_FILE_PATH: outputFile } });
    detailed = parseWranglerDetailedDeployment(await readFile(outputFile, "utf8"));
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
  const deployment = validatePreviewWranglerRecord(detailed, { headSha });

  // The branch may advance while the artifact is uploading. Fail closed instead
  // of reporting a valid candidate for a commit that is no longer branch HEAD.
  let postUploadOriginBranchSha;
  try {
    await runCommand("git", [
      "fetch", "--quiet", "origin", `+refs/heads/${branch}:${remoteRef}`,
    ], commandOptions);
    const postUploadHeadSha = fullSha(await runCommand(
      "git", ["rev-parse", "--verify", "HEAD"], { ...commandOptions, captureStdout: true },
    ), "post-upload HEAD");
    postUploadOriginBranchSha = fullSha(await runCommand(
      "git", ["rev-parse", "--verify", remoteRef], { ...commandOptions, captureStdout: true },
    ), `post-upload origin/${branch}`);
    if (postUploadHeadSha !== headSha || postUploadOriginBranchSha !== headSha) {
      throw new Error(
        `expected uploaded HEAD ${headSha}, got local ${postUploadHeadSha} and origin/${branch} ${postUploadOriginBranchSha}`,
      );
    }
  } catch (error) {
    throw new Error(`Preview upload completed, but the post-upload remote guard failed: ${error.message}`);
  }

  await runCommand("npm", [
    "run", "verify:preview", "--",
    "--base-url", deployment.deploymentUrl,
    "--expected-commit", headSha,
    "--project-name", PROJECT_NAME,
  ], commandOptions);

  return {
    branch,
    headSha,
    originBranchSha,
    postUploadOriginBranchSha,
    deploymentId: deployment.deploymentId,
    deploymentUrl: deployment.deploymentUrl,
    deployed: true,
  };
}

export async function runPreviewReleaseDeploymentCli(args = process.argv.slice(2), {
  runDeployment = runPreviewReleaseDeployment,
  write = (value) => process.stdout.write(value),
} = {}) {
  const options = parsePreviewDeploymentCliOptions(args);
  if (options.help) {
    write(`${usage()}\n`);
    return;
  }
  const report = await runDeployment();
  write(`${JSON.stringify(report)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  runPreviewReleaseDeploymentCli().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
