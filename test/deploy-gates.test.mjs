import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  bindReleaseProvenance,
  executeReleaseCommand,
  parseReleaseDeploymentCliOptions,
  parseWranglerDetailedDeployment,
  runReleaseDeployment,
  runReleaseDeploymentCli,
  validateNewProductionDeployment,
  validateReleaseProvenanceResponse,
  verifyReleaseProvenance,
} from "../scripts/deploy-release.mjs";
import {
  parsePreviewDeploymentCliOptions,
  runPreviewReleaseDeployment,
  validatePreviewWranglerRecord,
} from "../scripts/deploy-preview-release.mjs";
import {
  executeCommand,
  parseDeploymentGateCliOptions,
  runDeploymentGate,
  runDeploymentGateCli,
  scanStaticReleaseAssertions,
  verifyStaticReleaseAssertions,
} from "../scripts/verify-maintenance-release.mjs";

const PACKAGE_URL = new URL("../package.json", import.meta.url);
const PACKAGE_LOCK_URL = new URL("../package-lock.json", import.meta.url);
const RUNBOOK_URL = new URL("../docs/seo-release-runbook.md", import.meta.url);
const HEAD_SHA = "0123456789abcdef0123456789abcdef01234567";
const OTHER_SHA = "89abcdef0123456789abcdef0123456789abcdef";
const LOCAL_WRANGLER_COMMAND = "npx --no-install wrangler";

function recorder({ commerceEvidenceFile = "" } = {}) {
  const calls = [];
  const runCommand = async (command, args, options = {}) => {
    calls.push({ command, args, options });
  };
  return {
    calls,
    options: {
      env: commerceEvidenceFile ? { COMMERCE_EVIDENCE_FILE: commerceEvidenceFile } : {},
      runCommand,
    },
  };
}

function labels(calls) {
  return calls.map(({ command, args }) => [command, ...args].join(" "));
}

test("package scripts make commerce the default, keep maintenance explicit and expose no raw deploy bypass", async () => {
  const [pkg, runbook] = await Promise.all([
    readFile(PACKAGE_URL, "utf8").then(JSON.parse),
    readFile(RUNBOOK_URL, "utf8"),
  ]);

  assert.equal(pkg.scripts["gate:maintenance"], "node scripts/verify-maintenance-release.mjs --mode maintenance");
  assert.equal(pkg.scripts["gate:commerce"], "node scripts/verify-maintenance-release.mjs --mode commerce");
  assert.equal(
    pkg.scripts.deploy,
    "node scripts/deploy-release.mjs --mode commerce",
  );
  assert.equal(
    pkg.scripts["deploy:maintenance"],
    "node scripts/deploy-release.mjs --mode maintenance",
  );
  assert.equal(pkg.scripts["deploy:preview"], "node scripts/deploy-preview-release.mjs");
  assert.equal(pkg.scripts["validate:commerce-evidence"], "node scripts/validate-commerce-evidence.mjs");
  assert.equal(Object.hasOwn(pkg.scripts, "deploy:pages"), false);
  assert.equal(Object.hasOwn(pkg.scripts, "deploy:commerce"), false);
  assert.equal(Object.hasOwn(pkg.scripts, "predeploy"), false);

  // Deployment correctness is wholly inside the direct Node command, not an npm lifecycle.
  assert.equal(Object.hasOwn(pkg.scripts, "postdeploy"), false);
  assert.match(pkg.scripts.deploy, /--mode commerce/);
  assert.doesNotMatch(pkg.scripts["deploy:maintenance"], /postdeploy/);
  assert.equal(
    Object.values(pkg.scripts).some((script) => /wrangler\s+pages\s+deploy/u.test(script)),
    false,
  );
  assert.doesNotMatch(runbook, /^\s*(?:npx\s+)?wrangler\b/gmu);
  assert.doesNotMatch(runbook, /wrangler\s+pages\s+deploy/u);
});

test("package manifest and lockfile pin the project-local Wrangler release exactly", async () => {
  const [pkg, lock] = await Promise.all([
    readFile(PACKAGE_URL, "utf8").then(JSON.parse),
    readFile(PACKAGE_LOCK_URL, "utf8").then(JSON.parse),
  ]);

  assert.equal(pkg.devDependencies.wrangler, "4.112.0");
  assert.equal(lock.lockfileVersion, 3);
  assert.equal(lock.packages[""].devDependencies.wrangler, "4.112.0");
  assert.equal(lock.packages["node_modules/wrangler"].version, "4.112.0");
  assert.match(lock.packages["node_modules/wrangler"].integrity, /^sha512-/u);
  assert.equal(lock.packages["node_modules/wrangler"].bin.wrangler, "bin/wrangler.js");
});

test("release deployment CLI requires an explicit supported mode", () => {
  assert.deepEqual(parseReleaseDeploymentCliOptions(["--mode", "commerce"]), {
    help: false,
    mode: "commerce",
  });
  assert.deepEqual(parseReleaseDeploymentCliOptions(["--mode=maintenance"]), {
    help: false,
    mode: "maintenance",
  });
  assert.throws(() => parseReleaseDeploymentCliOptions([]), /--mode/);
  assert.throws(() => parseReleaseDeploymentCliOptions(["--mode", "preview"]), /maintenance.*commerce/);
  assert.throws(
    () => parseReleaseDeploymentCliOptions(["--mode", "commerce", "--mode=maintenance"]),
    /only be specified once/,
  );
  assert.throws(() => parseReleaseDeploymentCliOptions(["--unknown"]), /Unknown option/);
});

function releaseRecorder({
  head = HEAD_SHA,
  originMain = head,
  postUploadHead = head,
  postUploadOriginMain = originMain,
  before = [{ Id: "old-id", Deployment: "https://old.getgiffgaff.pages.dev" }],
  after,
  detailed = {},
  failLabel = "",
  failure = new Error("command failed"),
} = {}) {
  const calls = [];
  let productionLists = 0;
  let headReads = 0;
  let originReads = 0;
  const deployment = {
    type: "pages-deploy-detailed",
    pages_project: "getgiffgaff",
    deployment_id: "new-id",
    url: "https://new-id.getgiffgaff.pages.dev",
    environment: "production",
    production_branch: "main",
    deployment_trigger: { metadata: { commit_hash: head } },
    ...detailed,
  };
  const afterRecords = after || [
    ...before,
    {
      Id: deployment.deployment_id,
      Environment: "Production",
      Branch: "main",
      Source: head.slice(0, 7),
      Deployment: deployment.url,
      Status: "Success",
    },
  ];
  const runCommand = async (command, args, options = {}) => {
    const label = [command, ...args].join(" ");
    calls.push({ command, args, options, label });
    if (label === failLabel) throw failure;
    if (label === "git rev-parse --verify HEAD") {
      headReads += 1;
      return { stdout: `${headReads === 1 ? head : postUploadHead}\n` };
    }
    if (label === "git rev-parse --verify refs/remotes/origin/main") {
      originReads += 1;
      return { stdout: `${originReads === 1 ? originMain : postUploadOriginMain}\n` };
    }
    if (label.includes("pages deployment list")) {
      productionLists += 1;
      return { stdout: JSON.stringify(productionLists === 1 ? before : afterRecords) };
    }
    if (label.includes("pages deploy .release")) {
      await writeFile(options.env.WRANGLER_OUTPUT_FILE_PATH, `${JSON.stringify(deployment)}\n`);
    }
    return { stdout: "" };
  };
  return { calls, runCommand };
}

function boundProvenance(headSha = HEAD_SHA) {
  return async ({ headSha: actualSha }) => {
    assert.equal(actualSha, headSha);
    return { commit: actualSha, bytes: 100, markerPath: "/fixture/release-provenance.json" };
  };
}

function productionFetch({
  headSha = HEAD_SHA,
  rootStatus = 200,
  rootHtml = '<link rel="canonical" href="https://getgiffgaff.com/">',
  markerCommit = headSha,
  requests = [],
} = {}) {
  return async (input, init = {}) => {
    const url = new URL(String(input));
    requests.push({ url, init });
    if (url.pathname === "/release-provenance.json") {
      return new Response(`${JSON.stringify({
        schema: "getgiffgaff_release_provenance_v1",
        commit: markerCommit,
      })}\n`, {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "private, no-store",
        },
      });
    }
    return new Response(rootHtml, { status: rootStatus });
  };
}

test("commerce deployment pins exact HEAD, proves a new Production record and runs both HTTP gates internally", async () => {
  const harness = releaseRecorder();
  const env = {
    COMMERCE_EVIDENCE_FILE: "/private/evidence/commerce.json",
    ADSENSE_PUBLISHER_ID: "pub-must-not-leak",
  };
  const fetches = [];
  let nonce = 0;

  const report = await runReleaseDeployment({
    mode: "commerce",
    env,
    runCommand: harness.runCommand,
    bindProvenance: boundProvenance(),
    fetchImpl: productionFetch({ requests: fetches }),
    nonceFactory: () => (++nonce).toString(16).padStart(64, "0"),
  });

  assert.deepEqual(harness.calls.map(({ label }) => label), [
    "node scripts/assert-clean-worktree.mjs",
    "npm run gate:commerce",
    "git fetch --quiet origin +refs/heads/main:refs/remotes/origin/main",
    "git rev-parse --verify HEAD",
    "git rev-parse --verify refs/remotes/origin/main",
    "node scripts/assert-clean-worktree.mjs",
    `${LOCAL_WRANGLER_COMMAND} pages deployment list --project-name getgiffgaff --environment production --json`,
    `${LOCAL_WRANGLER_COMMAND} pages deploy .release --project-name getgiffgaff --branch main --commit-hash ${HEAD_SHA}`,
    `${LOCAL_WRANGLER_COMMAND} pages deployment list --project-name getgiffgaff --environment production --json`,
    "git fetch --quiet origin +refs/heads/main:refs/remotes/origin/main",
    "git rev-parse --verify HEAD",
    "git rev-parse --verify refs/remotes/origin/main",
    "npm run verify:seo -- --base-url https://getgiffgaff.com --expected-url-count 39",
    "node scripts/verify-analytics-persistence.mjs",
  ]);
  assert.equal(harness.calls[3].options.captureStdout, true);
  assert.equal(harness.calls[4].options.captureStdout, true);
  assert.equal(harness.calls[7].args.includes("--commit-dirty=true"), false);
  assert.equal(harness.calls[7].options.env.WRANGLER_OUTPUT_FILE_PATH.endsWith("wrangler-output.ndjson"), true);
  assert.equal(fetches.length, 4);
  assert.equal(fetches[0].url.pathname, "/");
  assert.deepEqual(fetches.slice(1).map(({ url }) => url.pathname), [
    "/release-provenance.json",
    "/release-provenance.json",
    "/release-provenance.json",
  ]);
  assert.equal(new Set(fetches.slice(1).map(({ url }) => url.search)).size, 3);
  for (const request of fetches.slice(1)) {
    assert.equal(request.init.redirect, "manual");
    assert.equal(request.init.cache, "no-store");
  }
  for (const call of harness.calls) {
    assert.equal(Object.hasOwn(call.options.env, "ADSENSE_PUBLISHER_ID"), false);
  }
  assert.deepEqual(report, {
    mode: "commerce",
    headSha: HEAD_SHA,
    originMainSha: HEAD_SHA,
    postUploadOriginMainSha: HEAD_SHA,
    deploymentId: "new-id",
    deploymentUrl: "https://new-id.getgiffgaff.pages.dev",
    deployed: true,
  });
});

test("release provenance binding accepts only exact placeholder bytes and verifies the rebound bytes", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-provenance-bind-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const releaseRoot = path.join(root, ".release");
  const markerPath = path.join(releaseRoot, "release-provenance.json");
  await mkdir(releaseRoot, { recursive: true });
  await writeFile(markerPath, '{"schema":"getgiffgaff_release_provenance_v1","commit":"unbound"}\n');

  const report = await bindReleaseProvenance({ cwd: root, headSha: HEAD_SHA });
  assert.equal(report.commit, HEAD_SHA);
  assert.equal(
    await readFile(markerPath, "utf8"),
    `${JSON.stringify({ schema: "getgiffgaff_release_provenance_v1", commit: HEAD_SHA })}\n`,
  );

  await writeFile(markerPath, '{"schema":"getgiffgaff_release_provenance_v1","commit":"unbound", "extra":true}\n');
  await assert.rejects(
    () => bindReleaseProvenance({ cwd: root, headSha: HEAD_SHA }),
    /not the exact unbound build artifact/,
  );

  await writeFile(markerPath, '{"schema":"getgiffgaff_release_provenance_v1","commit":"unbound"}\n');
  await assert.rejects(
    () => bindReleaseProvenance({
      cwd: root,
      headSha: HEAD_SHA,
      writeFileImpl: async () => {},
    }),
    /byte verification failed/,
  );
});

test("release provenance probe is cache-busted, redirect-manual and validates an exact payload", async () => {
  const requests = [];
  const result = await verifyReleaseProvenance("https://new-id.getgiffgaff.pages.dev", {
    expectedCommit: HEAD_SHA,
    attempts: 1,
    nonceFactory: () => "a".repeat(64),
    fetchImpl: productionFetch({ requests }),
  });
  assert.equal(result.commit, HEAD_SHA);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url.pathname, "/release-provenance.json");
  assert.equal(requests[0].url.searchParams.get("release_provenance_probe"), "a".repeat(64));
  assert.equal(requests[0].init.redirect, "manual");
  assert.equal(requests[0].init.cache, "no-store");
  assert.equal(new Headers(requests[0].init.headers).get("accept"), "application/json");

  for (const [body, init, pattern] of [
    [JSON.stringify({ schema: "getgiffgaff_release_provenance_v1", commit: HEAD_SHA }), { status: 302, headers: { "content-type": "application/json" } }, /status 200/],
    [JSON.stringify({ schema: "getgiffgaff_release_provenance_v1", commit: HEAD_SHA }), { status: 200, headers: { "content-type": "text/plain" } }, /Content-Type application\/json/],
    [JSON.stringify({ schema: "getgiffgaff_release_provenance_v1", commit: HEAD_SHA }), { status: 200, headers: { "content-type": "application/json", "cache-control": "public, max-age=3600" } }, /Cache-Control private, no-store/],
    [JSON.stringify({ schema: "wrong", commit: HEAD_SHA }), { status: 200, headers: { "content-type": "application/json" } }, /schema is/],
    [JSON.stringify({ schema: "getgiffgaff_release_provenance_v1", commit: OTHER_SHA }), { status: 200, headers: { "content-type": "application/json" } }, /does not equal expected release/],
    [JSON.stringify({ schema: "getgiffgaff_release_provenance_v1", commit: HEAD_SHA, extra: true }), { status: 200, headers: { "content-type": "application/json" } }, /exactly the commit and schema/],
    ["{".repeat(513), { status: 200, headers: { "content-type": "application/json" } }, /limit is 512/],
  ]) {
    assert.throws(
      () => validateReleaseProvenanceResponse(new Response(body, init), Buffer.from(body), {
        expectedCommit: HEAD_SHA,
      }),
      pattern,
    );
  }
});

test("commerce deployment rejects missing evidence before running any command", async () => {
  for (const env of [{}, { COMMERCE_EVIDENCE_FILE: "   " }]) {
    const harness = releaseRecorder();
    await assert.rejects(
      () => runReleaseDeployment({ mode: "commerce", env, runCommand: harness.runCommand }),
      /COMMERCE_EVIDENCE_FILE/,
    );
    assert.deepEqual(harness.calls, []);
  }
});

test("dirty deployment stops before gates, fetch and Wrangler", async () => {
  const dirty = new Error("Deployment requires a clean worktree: M package.json");
  const harness = releaseRecorder({
    failLabel: "node scripts/assert-clean-worktree.mjs",
    failure: dirty,
  });

  await assert.rejects(
    () => runReleaseDeployment({
      mode: "maintenance",
      env: {},
      runCommand: harness.runCommand,
    }),
    /clean worktree/,
  );
  assert.deepEqual(harness.calls.map(({ label }) => label), [
    "node scripts/assert-clean-worktree.mjs",
  ]);
});

test("a worktree change after gates is caught by the final clean check before Wrangler", async () => {
  const calls = [];
  let cleanChecks = 0;
  const runCommand = async (command, args, options = {}) => {
    const label = [command, ...args].join(" ");
    calls.push(label);
    if (label === "node scripts/assert-clean-worktree.mjs") {
      cleanChecks += 1;
      if (cleanChecks === 2) {
        throw new Error("Deployment requires a clean worktree: M generated-file");
      }
    }
    if (label === "git rev-parse --verify HEAD") return { stdout: `${HEAD_SHA}\n` };
    if (label === "git rev-parse --verify refs/remotes/origin/main") {
      return { stdout: `${HEAD_SHA}\n` };
    }
    return { stdout: "", options };
  };

  await assert.rejects(
    () => runReleaseDeployment({ mode: "maintenance", env: {}, runCommand }),
    /clean worktree/,
  );
  assert.equal(calls.at(-1), "node scripts/assert-clean-worktree.mjs");
  assert.equal(calls.some((label) => label.startsWith(`${LOCAL_WRANGLER_COMMAND} `)), false);
});

test("freshly fetched origin/main mismatch stops before Wrangler", async () => {
  const harness = releaseRecorder({ originMain: OTHER_SHA });

  await assert.rejects(
    () => runReleaseDeployment({
      mode: "maintenance",
      env: { COMMERCE_EVIDENCE_FILE: "/must/not/leak.json" },
      runCommand: harness.runCommand,
    }),
    new RegExp(`HEAD .*${HEAD_SHA}.*origin/main .*${OTHER_SHA}`, "s"),
  );
  assert.deepEqual(harness.calls.map(({ label }) => label), [
    "node scripts/assert-clean-worktree.mjs",
    "npm run gate:maintenance",
    "git fetch --quiet origin +refs/heads/main:refs/remotes/origin/main",
    "git rev-parse --verify HEAD",
    "git rev-parse --verify refs/remotes/origin/main",
  ]);
  assert.equal(
    harness.calls.some(({ options }) => Object.hasOwn(options.env, "COMMERCE_EVIDENCE_FILE")),
    false,
  );
});

test("post-upload origin/main advancement fails without a deployed:true report", async () => {
  const harness = releaseRecorder({ postUploadOriginMain: OTHER_SHA });
  await assert.rejects(
    () => runReleaseDeployment({
      mode: "maintenance",
      env: {},
      runCommand: harness.runCommand,
      bindProvenance: boundProvenance(),
      fetchImpl: async () => new Response('<link rel="canonical" href="https://getgiffgaff.com/">'),
    }),
    new RegExp(`HEAD .*${HEAD_SHA}.*origin/main .*${OTHER_SHA}`, "s"),
  );
  assert.equal(harness.calls.some(({ label }) => label === "npm run verify:seo -- --base-url https://getgiffgaff.com --expected-url-count 39"), false);
});

test("post-upload HEAD and origin/main advancing together cannot validate an older upload", async () => {
  const harness = releaseRecorder({
    postUploadHead: OTHER_SHA,
    postUploadOriginMain: OTHER_SHA,
  });
  await assert.rejects(
    () => runReleaseDeployment({
      mode: "maintenance",
      env: {},
      runCommand: harness.runCommand,
      bindProvenance: boundProvenance(),
      fetchImpl: async () => new Response('<link rel="canonical" href="https://getgiffgaff.com/">'),
    }),
    new RegExp(`post-upload release guard failed.*uploaded release ${HEAD_SHA}.*current HEAD ${OTHER_SHA}.*current origin/main ${OTHER_SHA}`, "s"),
  );
  assert.equal(
    harness.calls.some(({ label }) => label === "npm run verify:seo -- --base-url https://getgiffgaff.com --expected-url-count 39"),
    false,
  );
});

test("post-upload remote guard still runs when the post-deploy metadata list fails", async () => {
  const calls = [];
  let productionLists = 0;
  const runCommand = async (command, args, options = {}) => {
    const label = [command, ...args].join(" ");
    calls.push(label);
    if (label === "git rev-parse --verify HEAD") return { stdout: `${HEAD_SHA}\n` };
    if (label === "git rev-parse --verify refs/remotes/origin/main") return { stdout: `${HEAD_SHA}\n` };
    if (label.includes("pages deployment list")) {
      productionLists += 1;
      if (productionLists === 2) throw new Error("metadata API unavailable");
      return { stdout: "[]" };
    }
    if (label.includes("pages deploy .release")) {
      await writeFile(options.env.WRANGLER_OUTPUT_FILE_PATH, `${JSON.stringify({
        type: "pages-deploy-detailed",
        pages_project: "getgiffgaff",
        deployment_id: "new-id",
        url: "https://new-id.getgiffgaff.pages.dev",
        environment: "production",
        production_branch: "main",
        deployment_trigger: { metadata: { commit_hash: HEAD_SHA } },
      })}\n`);
    }
    return { stdout: "" };
  };
  await assert.rejects(
    () => runReleaseDeployment({
      mode: "maintenance", env: {}, runCommand, bindProvenance: boundProvenance(),
    }),
    /post-upload metadata capture failed.*metadata API unavailable/s,
  );
  assert.equal(calls.filter((label) => label === "git fetch --quiet origin +refs/heads/main:refs/remotes/origin/main").length, 2);
  assert.equal(calls.filter((label) => label === "git rev-parse --verify refs/remotes/origin/main").length, 2);
});

test("production metadata rejects absent, wrong-environment, wrong-branch and wrong-source new records", () => {
  const detailed = {
    type: "pages-deploy-detailed",
    pages_project: "getgiffgaff",
    deployment_id: "new-id",
    url: "https://new-id.getgiffgaff.pages.dev",
    environment: "production",
    production_branch: "main",
    deployment_trigger: { metadata: { commit_hash: HEAD_SHA } },
  };
  const old = [{ Id: "old-id" }];
  assert.throws(
    () => validateNewProductionDeployment({ before: old, after: old, detailed, headSha: HEAD_SHA }),
    /exactly one new Production deployment record, found 0/,
  );
  for (const [field, value, pattern] of [
    ["Environment", "Preview", /Environment is Preview/],
    ["Branch", "feature", /Branch is feature/],
    ["Source", OTHER_SHA.slice(0, 7), /does not match HEAD/],
  ]) {
    const record = {
      Id: "new-id",
      Environment: "Production",
      Branch: "main",
      Source: HEAD_SHA.slice(0, 7),
      Deployment: detailed.url,
      [field]: value,
    };
    assert.throws(
      () => validateNewProductionDeployment({ before: old, after: [...old, record], detailed, headSha: HEAD_SHA }),
      pattern,
    );
  }
});

test("production deployment rejects detailed metadata with wrong environment or production branch", () => {
  const base = {
    pages_project: "getgiffgaff",
    deployment_id: "new-id",
    url: "https://new-id.getgiffgaff.pages.dev",
    environment: "production",
    production_branch: "main",
    deployment_trigger: { metadata: { commit_hash: HEAD_SHA } },
  };
  const record = {
    Id: "new-id",
    Environment: "Production",
    Branch: "main",
    Source: HEAD_SHA.slice(0, 7),
    Deployment: base.url,
  };
  assert.throws(
    () => validateNewProductionDeployment({
      before: [], after: [record], detailed: { ...base, environment: "preview" }, headSha: HEAD_SHA,
    }),
    /environment is preview, expected production/,
  );
  assert.throws(
    () => validateNewProductionDeployment({
      before: [], after: [record], detailed: { ...base, production_branch: "feature" }, headSha: HEAD_SHA,
    }),
    /production_branch is feature, expected main/,
  );
});

test("Wrangler detailed metadata requires one parseable record and exact full production provenance", () => {
  assert.throws(() => parseWranglerDetailedDeployment(""), /exactly one/);
  assert.throws(() => parseWranglerDetailedDeployment("not json"), /Could not parse/);
  assert.throws(
    () => validateNewProductionDeployment({
      before: [],
      after: [{
        Id: "new-id", Environment: "Production", Branch: "main",
        Source: HEAD_SHA.slice(0, 7), Deployment: "https://new-id.getgiffgaff.pages.dev",
      }],
      detailed: {
        pages_project: "getgiffgaff",
        deployment_id: "new-id",
        url: "https://new-id.getgiffgaff.pages.dev",
        environment: "production",
        production_branch: "main",
        deployment_trigger: { metadata: { commit_hash: HEAD_SHA.slice(0, 7) } },
      },
      headSha: HEAD_SHA,
    }),
    /does not equal HEAD/,
  );
});

test("postdeploy HTTP or canonical SEO failure prevents deployed:true even via the direct deployment function", async () => {
  const httpHarness = releaseRecorder();
  await assert.rejects(
    () => runReleaseDeployment({
      mode: "maintenance",
      env: {},
      runCommand: httpHarness.runCommand,
      bindProvenance: boundProvenance(),
      fetchImpl: async () => new Response("old edge", { status: 404 }),
      delay: async () => {},
    }),
    /deployment URL verification failed/,
  );

  const seoHarness = releaseRecorder({
    failLabel: "npm run verify:seo -- --base-url https://getgiffgaff.com --expected-url-count 39",
    failure: new Error("canonical production verification failed"),
  });
  await assert.rejects(
    () => runReleaseDeployment({
      mode: "maintenance",
      env: {},
      runCommand: seoHarness.runCommand,
      bindProvenance: boundProvenance(),
      fetchImpl: productionFetch(),
    }),
    /canonical production verification failed/,
  );

  const markerRequests = [];
  const afterSeoHarness = releaseRecorder();
  await assert.rejects(
    () => runReleaseDeployment({
      mode: "maintenance",
      env: {},
      runCommand: afterSeoHarness.runCommand,
      bindProvenance: boundProvenance(),
      nonceFactory: () => "c".repeat(64),
      fetchImpl: async (input, init = {}) => {
        const url = new URL(String(input));
        if (url.pathname === "/") {
          return new Response('<link rel="canonical" href="https://getgiffgaff.com/">');
        }
        markerRequests.push({ url, init });
        const commit = markerRequests.length === 3 ? OTHER_SHA : HEAD_SHA;
        return new Response(JSON.stringify({
          schema: "getgiffgaff_release_provenance_v1",
          commit,
        }), {
          headers: {
            "content-type": "application/json",
            "cache-control": "private, no-store",
          },
        });
      },
    }),
    /canonical production domain after verify:seo.*does not equal expected release/s,
  );
  assert.equal(
    afterSeoHarness.calls.filter(({ label }) => label.startsWith("npm run verify:seo")).length,
    1,
  );
});

test("production does not report deployed:true until the analytics SQL readback passes", async () => {
  const harness = releaseRecorder({
    failLabel: "node scripts/verify-analytics-persistence.mjs",
    failure: new Error("analytics canary is not queryable"),
  });
  await assert.rejects(
    () => runReleaseDeployment({
      mode: "maintenance",
      env: {},
      runCommand: harness.runCommand,
      bindProvenance: boundProvenance(),
      fetchImpl: productionFetch(),
    }),
    /analytics canary is not queryable/,
  );
  assert.equal(
    harness.calls.filter(({ label }) => label === "node scripts/verify-analytics-persistence.mjs").length,
    1,
  );
});

test("production fails closed when deployment or canonical provenance is stale", async () => {
  for (const markerCommit of [OTHER_SHA, "unbound"]) {
    const harness = releaseRecorder();
    await assert.rejects(
      () => runReleaseDeployment({
        mode: "maintenance",
        env: {},
        runCommand: harness.runCommand,
        bindProvenance: boundProvenance(),
        fetchImpl: productionFetch({ markerCommit }),
        delay: async () => {},
        nonceFactory: () => "b".repeat(64),
      }),
      /Release provenance probe failed.*(?:does not equal expected release|not a lowercase 40-character)/s,
    );
    assert.equal(
      harness.calls.some(({ label }) => label.startsWith("npm run verify:seo")),
      false,
    );
  }
});

test("release deployment validates full SHAs and propagates command failures", async () => {
  const invalidHead = releaseRecorder({ head: "not-a-sha" });
  await assert.rejects(
    () => runReleaseDeployment({
      mode: "maintenance",
      env: {},
      runCommand: invalidHead.runCommand,
    }),
    /full Git commit SHA for HEAD/,
  );
  assert.equal(
    invalidHead.calls.some(
      ({ command, args }) => command === "npx" && args[0] === "--no-install" && args[1] === "wrangler",
    ),
    false,
  );

  await executeReleaseCommand(process.execPath, ["-e", "process.stdout.write('ok')"], {
    captureStdout: true,
  }).then(({ stdout }) => assert.equal(stdout, "ok"));
  await assert.rejects(
    () => executeReleaseCommand(process.execPath, ["-e", "process.exit(8)"]),
    /exit code 8/,
  );
});

test("release CLI reports help and invokes only the selected deployment mode", async () => {
  const output = [];
  await runReleaseDeploymentCli(["--help"], {
    write: (value) => output.push(value),
  });
  assert.match(output.join(""), /--mode commerce/);

  const deploymentCalls = [];
  output.length = 0;
  await runReleaseDeploymentCli(["--mode=maintenance"], {
    runDeployment: async (options) => {
      deploymentCalls.push(options);
      return {
        mode: options.mode,
        headSha: HEAD_SHA,
        originMainSha: HEAD_SHA,
        deployed: true,
      };
    },
    write: (value) => output.push(value),
  });
  assert.deepEqual(deploymentCalls, [{ mode: "maintenance" }]);
  assert.deepEqual(JSON.parse(output.join("")), {
    mode: "maintenance",
    headSha: HEAD_SHA,
    originMainSha: HEAD_SHA,
    deployed: true,
  });
});

test("Preview CLI accepts no SHA, branch or artifact override", () => {
  assert.deepEqual(parsePreviewDeploymentCliOptions([]), { help: false });
  assert.deepEqual(parsePreviewDeploymentCliOptions(["--help"]), { help: true });
  for (const args of [
    ["--expected-commit", HEAD_SHA],
    ["--branch", "feature"],
    ["--directory", "/tmp/artifact"],
    [".release"],
  ]) {
    assert.throws(() => parsePreviewDeploymentCliOptions(args), /Unknown option/);
  }
});

test("Preview deployment rebuilds maintenance artifact, pins current remote branch and verifies its URL", async () => {
  const calls = [];
  const env = {
    COMMERCE_EVIDENCE_FILE: "/must/not/leak.json",
    ADSENSE_PUBLISHER_ID: "pub-must/not/leak",
  };
  const runCommand = async (command, args, options = {}) => {
    const label = [command, ...args].join(" ");
    calls.push({ label, options });
    if (label === "git symbolic-ref --quiet --short HEAD") return { stdout: "codex/restore-consultation-funnel\n" };
    if (label === "git rev-parse --verify HEAD") return { stdout: `${HEAD_SHA}\n` };
    if (label === "git rev-parse --verify refs/remotes/origin/codex/restore-consultation-funnel") {
      return { stdout: `${HEAD_SHA}\n` };
    }
    if (label.includes("pages deploy .release")) {
      await writeFile(options.env.WRANGLER_OUTPUT_FILE_PATH, `${JSON.stringify({
        type: "pages-deploy-detailed",
        pages_project: "getgiffgaff",
        deployment_id: "preview-id",
        url: "https://preview-id.getgiffgaff.pages.dev",
        environment: "preview",
        production_branch: "main",
        deployment_trigger: { metadata: { commit_hash: HEAD_SHA } },
      })}\n`);
    }
    return { stdout: "" };
  };

  const report = await runPreviewReleaseDeployment({
    env,
    runCommand,
    bindProvenance: boundProvenance(),
  });
  assert.deepEqual(calls.map(({ label }) => label), [
    "node scripts/assert-clean-worktree.mjs",
    "npm run gate:maintenance",
    "git symbolic-ref --quiet --short HEAD",
    "git fetch --quiet origin +refs/heads/codex/restore-consultation-funnel:refs/remotes/origin/codex/restore-consultation-funnel",
    "git rev-parse --verify HEAD",
    "git rev-parse --verify refs/remotes/origin/codex/restore-consultation-funnel",
    "node scripts/assert-clean-worktree.mjs",
    `${LOCAL_WRANGLER_COMMAND} pages deploy .release --project-name getgiffgaff --branch codex/restore-consultation-funnel --commit-hash ${HEAD_SHA}`,
    "git fetch --quiet origin +refs/heads/codex/restore-consultation-funnel:refs/remotes/origin/codex/restore-consultation-funnel",
    "git rev-parse --verify HEAD",
    "git rev-parse --verify refs/remotes/origin/codex/restore-consultation-funnel",
    `npm run verify:preview -- --base-url https://preview-id.getgiffgaff.pages.dev --expected-commit ${HEAD_SHA} --project-name getgiffgaff`,
  ]);
  assert.deepEqual(report, {
    branch: "codex/restore-consultation-funnel",
    headSha: HEAD_SHA,
    originBranchSha: HEAD_SHA,
    postUploadOriginBranchSha: HEAD_SHA,
    deploymentId: "preview-id",
    deploymentUrl: "https://preview-id.getgiffgaff.pages.dev",
    deployed: true,
  });
  for (const call of calls) {
    assert.equal(Object.hasOwn(call.options.env, "COMMERCE_EVIDENCE_FILE"), false);
    assert.equal(Object.hasOwn(call.options.env, "ADSENSE_PUBLISHER_ID"), false);
  }
});

test("Preview post-upload remote advancement fails before URL verification", async () => {
  const calls = [];
  let remoteReads = 0;
  const remoteRef = "refs/remotes/origin/feature";
  const runCommand = async (command, args, options = {}) => {
    const label = [command, ...args].join(" ");
    calls.push(label);
    if (label === "git symbolic-ref --quiet --short HEAD") return { stdout: "feature\n" };
    if (label === "git rev-parse --verify HEAD") return { stdout: `${HEAD_SHA}\n` };
    if (label === `git rev-parse --verify ${remoteRef}`) {
      remoteReads += 1;
      return { stdout: `${remoteReads === 1 ? HEAD_SHA : OTHER_SHA}\n` };
    }
    if (label.includes("pages deploy .release")) {
      await writeFile(options.env.WRANGLER_OUTPUT_FILE_PATH, `${JSON.stringify({
        type: "pages-deploy-detailed",
        pages_project: "getgiffgaff",
        deployment_id: "preview-id",
        url: "https://preview-id.getgiffgaff.pages.dev",
        environment: "preview",
        deployment_trigger: { metadata: { commit_hash: HEAD_SHA } },
      })}\n`);
    }
    return { stdout: "" };
  };

  await assert.rejects(
    () => runPreviewReleaseDeployment({
      env: {}, runCommand, bindProvenance: boundProvenance(),
    }),
    /post-upload remote guard failed.*origin\/feature/s,
  );
  assert.equal(calls.some((label) => label.startsWith("npm run verify:preview")), false);
});

test("Preview stops on dirty tree, remote misalignment or bad Wrangler provenance", async () => {
  const dirtyCalls = [];
  await assert.rejects(
    () => runPreviewReleaseDeployment({
      env: {},
      runCommand: async (command, args) => {
        dirtyCalls.push([command, ...args].join(" "));
        throw new Error("dirty worktree");
      },
    }),
    /dirty worktree/,
  );
  assert.deepEqual(dirtyCalls, ["node scripts/assert-clean-worktree.mjs"]);

  const calls = [];
  await assert.rejects(
    () => runPreviewReleaseDeployment({
      env: {},
      runCommand: async (command, args) => {
        const label = [command, ...args].join(" ");
        calls.push(label);
        if (label === "git symbolic-ref --quiet --short HEAD") return { stdout: "feature\n" };
        if (label === "git rev-parse --verify HEAD") return { stdout: `${HEAD_SHA}\n` };
        if (label === "git rev-parse --verify refs/remotes/origin/feature") return { stdout: `${OTHER_SHA}\n` };
        return { stdout: "" };
      },
    }),
    /freshly fetched origin\/feature/,
  );
  assert.equal(calls.some((label) => label.includes("pages deploy")), false);

  assert.throws(
    () => validatePreviewWranglerRecord({
      pages_project: "getgiffgaff",
      deployment_id: "preview-id",
      url: "https://preview-id.getgiffgaff.pages.dev",
      environment: "production",
      deployment_trigger: { metadata: { commit_hash: OTHER_SHA } },
    }, { headSha: HEAD_SHA }),
    /expected preview.*does not equal HEAD/s,
  );
});

test("CLI mode is explicit and fail-closed", () => {
  assert.deepEqual(parseDeploymentGateCliOptions(["--mode", "maintenance"]), {
    help: false,
    mode: "maintenance",
  });
  assert.deepEqual(parseDeploymentGateCliOptions(["--mode=commerce"]), {
    help: false,
    mode: "commerce",
  });
  assert.throws(() => parseDeploymentGateCliOptions([]), /--mode/);
  assert.throws(() => parseDeploymentGateCliOptions(["--mode", "silent"]), /maintenance.*commerce/);
  assert.throws(
    () => parseDeploymentGateCliOptions(["--mode", "commerce", "--mode=maintenance"]),
    /only be specified once/,
  );
  assert.throws(() => parseDeploymentGateCliOptions(["--unknown"]), /Unknown option/);
});

test("maintenance runs verify, outreach, static assertion scan and clean-tree without commerce evidence", async () => {
  const harness = recorder({ commerceEvidenceFile: "/must/not/reach-maintenance-commands.json" });

  const report = await runDeploymentGate({ mode: "maintenance", ...harness.options });

  assert.deepEqual(labels(harness.calls), [
    "npm run verify",
    "npm run validate:outreach",
    "node scripts/verify-maintenance-release.mjs --scan-release-only",
    "node scripts/assert-clean-worktree.mjs",
  ]);
  assert.equal(report.mode, "maintenance");
  assert.equal(report.commerceEvidenceValidated, false);
  assert.equal(
    harness.calls.some(({ args }) => args.join(" ").includes("validate:commerce-evidence")),
    false,
  );
  assert.equal(
    harness.calls.some(({ options }) => Object.hasOwn(options.env || {}, "COMMERCE_EVIDENCE_FILE")),
    false,
  );
});

test("commerce requires a non-empty evidence path before running, then keeps every maintenance gate", async () => {
  const missing = recorder();
  await assert.rejects(
    () => runDeploymentGate({ mode: "commerce", ...missing.options }),
    /COMMERCE_EVIDENCE_FILE/,
  );
  assert.deepEqual(missing.calls, []);

  const whitespace = recorder({ commerceEvidenceFile: "   " });
  await assert.rejects(
    () => runDeploymentGate({ mode: "commerce", ...whitespace.options }),
    /COMMERCE_EVIDENCE_FILE/,
  );
  assert.deepEqual(whitespace.calls, []);

  const evidencePath = "/private/evidence/commerce.json";
  const present = recorder({ commerceEvidenceFile: evidencePath });
  const report = await runDeploymentGate({ mode: "commerce", ...present.options });

  assert.deepEqual(labels(present.calls), [
    "npm run verify",
    "npm run validate:outreach",
    "node scripts/verify-maintenance-release.mjs --scan-release-only",
    "npm run validate:commerce-evidence -- --file /private/evidence/commerce.json",
    "node scripts/assert-clean-worktree.mjs",
  ]);
  assert.equal(report.mode, "commerce");
  assert.equal(report.commerceEvidenceValidated, true);
});

test("both modes stop immediately when a shared release gate fails", async () => {
  for (const mode of ["maintenance", "commerce"]) {
    const calls = [];
    const runCommand = async (command, args) => {
      calls.push([command, ...args].join(" "));
      if (calls.length === 2) throw new Error("outreach failed");
    };
    await assert.rejects(
      () => runDeploymentGate({
        mode,
        env: mode === "commerce" ? { COMMERCE_EVIDENCE_FILE: "/proof.json" } : {},
        runCommand,
      }),
      /outreach failed/,
    );
    assert.deepEqual(calls, ["npm run verify", "npm run validate:outreach"]);
  }
});

test("static release assertion scanner rejects unsupported promises and blanket payment deterrents", () => {
  const safe = scanStaticReleaseAssertions([
    {
      path: "contact/index.html",
      text: "<p>付款前请联系客服确认当前库存、价格、余额说明与发货安排；以支付页和书面确认信息为准。本站不保证实时库存。可查看快团团小程序码。</p>",
    },
    {
      path: "privacy/index.html",
      text: "<p>如果具体订单需要依赖本页尚未确认的信息，请暂停付款并联系本站索取书面说明；无法取得时请勿付款。</p>",
    },
  ]);
  assert.deepEqual(safe.errors, []);

  const unsafe = scanStaticReleaseAssertions([
    {
      path: "shop/index.html",
      text: "<h1>手机卡商城</h1>\n<p>本站当前现货充足，浙江发货，圆通包邮。</p>",
    },
  ]);
  assert.equal(unsafe.scannedFiles, 1);
  assert.match(unsafe.errors.join("\n"), /shop\/index\.html:2/);
  assert.match(unsafe.errors.join("\n"), /现货充足|浙江发货|圆通包邮/);

  const deterrents = scanStaticReleaseAssertions([
    { path: "shop/index.html", text: "<p>资料补齐前请勿付款。</p>" },
    { path: "guides/1-order/index.html", text: "<p>当前证据未齐，请勿付款。</p>" },
    { path: "index.html", text: "<p>商品未核验所以不要付款。</p>" },
    { path: "contact/index.html", text: "<p>缺少书面订单说明时不要付款。</p>" },
    { path: "answers/index.html", text: "<p>请暂停付款；无法取得时请勿付款。</p>" },
  ]);
  assert.equal(deterrents.errors.length, 5);
  assert.match(deterrents.errors.join("\n"), /blanket payment deterrent/i);
  for (const filename of [
    "shop/index.html",
    "guides/1-order/index.html",
    "index.html",
    "contact/index.html",
    "answers/index.html",
  ]) {
    assert.match(deterrents.errors.join("\n"), new RegExp(filename.replaceAll("/", "\\/")));
  }

  const staleHandoffs = scanStaticReleaseAssertions([
    { path: "contact/index.html", text: "<p>微信客服小玉</p>" },
    { path: "shop/index.html", text: "<p>进入快团团店铺下单</p>" },
    { path: "guides/1-order/index.html", text: "<p>以快团团商品页为准</p>" },
    { path: "index.html", text: "<p>通过快团团或客服入口下单</p>" },
  ]);
  assert.equal(staleHandoffs.errors.length, 4);
  assert.match(staleHandoffs.errors.join("\n"), /微信客服小玉|快团团店铺|快团团商品页|通过快团团或客服入口下单/);
});

test("policy warning exception is path-scoped and does not hide commercial assertions", () => {
  const warning = "如果具体订单需要依赖本页尚未确认的信息，请暂停付款并联系本站索取书面说明；无法取得时请勿付款。";
  for (const path of [
    "privacy/index.html",
    "terms/index.html",
    "refund/index.html",
    "shipping/index.html",
  ]) {
    assert.deepEqual(scanStaticReleaseAssertions([{ path, text: warning }]).errors, [], path);
  }

  const misplaced = scanStaticReleaseAssertions([
    { path: "shop/index.html", text: warning },
  ]);
  assert.equal(misplaced.errors.length, 1);
  assert.match(misplaced.errors[0], /blanket payment deterrent/i);

  const unsafePolicy = scanStaticReleaseAssertions([
    { path: "privacy/index.html", text: `${warning}\n<p>现货充足，浙江发货。</p>` },
  ]);
  assert.equal(unsafePolicy.errors.length, 1);
  assert.match(unsafePolicy.errors[0], /unsupported commercial assertion/i);
});

test("filesystem release scan is recursive, extension-scoped and fail-closed", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-maintenance-scan-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "nested"));
  await writeFile(path.join(root, "index.html"), "<p>下单前请联系客服确认。</p>");
  await writeFile(path.join(root, "nested", "client.js"), "const status = 'evidence pending';");
  await writeFile(path.join(root, "ignored.png"), "浙江发货");

  assert.deepEqual(await verifyStaticReleaseAssertions({ releaseRoot: root }), {
    errors: [],
    scannedFiles: 2,
  });

  await writeFile(path.join(root, "nested", "catalog.json"), '{"shipping":"圆通包邮"}');
  await assert.rejects(
    () => verifyStaticReleaseAssertions({ releaseRoot: root }),
    /catalog\.json:1.*圆通包邮/,
  );
});

test("command runner resolves zero exits and rejects failed commands", async () => {
  await executeCommand(process.execPath, ["-e", "process.exit(0)"]);
  await assert.rejects(
    () => executeCommand(process.execPath, ["-e", "process.exit(7)"]),
    /exit code 7/,
  );
});

test("CLI reports help, scan and selected gate without hidden defaults", async () => {
  const output = [];
  await runDeploymentGateCli(["--help"], { write: (value) => output.push(value) });
  assert.match(output.join(""), /--mode maintenance/);

  const scanCalls = [];
  output.length = 0;
  await runDeploymentGateCli(["--scan-release-only", "/tmp/release"], {
    scanRelease: async (options) => {
      scanCalls.push(options);
      return { errors: [], scannedFiles: 9 };
    },
    write: (value) => output.push(value),
  });
  assert.deepEqual(scanCalls, [{ releaseRoot: path.resolve("/tmp/release") }]);
  assert.match(output.join(""), /9 files scanned/);

  const gateCalls = [];
  output.length = 0;
  await runDeploymentGateCli(["--mode=maintenance"], {
    runGate: async (options) => {
      gateCalls.push(options);
      return { mode: options.mode, commerceEvidenceValidated: false };
    },
    write: (value) => output.push(value),
  });
  assert.deepEqual(gateCalls, [{ mode: "maintenance" }]);
  assert.deepEqual(JSON.parse(output.join("")), {
    mode: "maintenance",
    commerceEvidenceValidated: false,
  });

  await assert.rejects(
    () => runDeploymentGateCli(["--scan-release-only", "/a", "/b"]),
    /Usage/,
  );
});
