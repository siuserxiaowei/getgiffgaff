import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function text(pathname) {
  return readFile(new URL(pathname, root), "utf8");
}

test("every legacy article is visibly archived and excluded from publishing", async () => {
  const articleDirectory = new URL("docs/articles/", root);
  const files = (await readdir(articleDirectory)).filter((name) => name.endsWith(".md"));
  assert.ok(files.length >= 12);

  for (const name of files) {
    const source = await readFile(new URL(name, articleDirectory), "utf8");
    assert.match(source.slice(0, 700), /ARCHIVED \/ NOT FOR PUBLISHING/, name);
    assert.match(source.slice(0, 700), /Claim Registry/, name);
  }

  const pillar = await text("docs/giffgaff-usage-pitfalls.md");
  assert.match(pillar.slice(0, 700), /ARCHIVED \/ NOT FOR PUBLISHING/);
});

test("the repository declares one runtime source and research copyright boundaries", async () => {
  const governance = await text("docs/CONTENT-GOVERNANCE.md");
  const readme = await text("README.md");
  assert.match(governance, /ACTIVE_RUNTIME_SOURCE/);
  assert.match(governance, /public\/route-manifest\.js/);
  assert.match(governance, /public\/claim-registry\.js/);
  assert.match(governance, /RESEARCH_ONLY/);
  assert.match(governance, /不得镜像、连续改写、搬运截图或重新发布/);
  assert.match(readme, /CONTENT-GOVERNANCE\.md/);
});

test("release instructions cannot push a dirty tree or silently target production", async () => {
  const packageJson = JSON.parse(await text("package.json"));
  const runbook = await text("docs/seo-release-runbook.md");
  const productionScript = await text("scripts/deploy-production.mjs");

  assert.doesNotMatch(JSON.stringify(packageJson.scripts), /commit-dirty/);
  assert.match(packageJson.scripts.deploy, /seo-geo-candidate/);
  assert.doesNotMatch(packageJson.scripts.deploy, /--branch main/);
  assert.match(packageJson.scripts["deploy:production"], /deploy-production/);
  assert.doesNotMatch(runbook, /commit-dirty/);
  assert.match(runbook, /CONFIRM_PRODUCTION_DEPLOY=getgiffgaff/);
  assert.match(productionScript, /git.*status|"status", "--porcelain"/s);
  assert.match(productionScript, /CONFIRM_PRODUCTION_DEPLOY/);
});

test("external gates reflect verified production evidence without opening commerce", async () => {
  const state = JSON.parse(await text("docs/external-gate-state.json"));
  assert.equal(state.deploymentMode, "information-only-commerce-closed");
  assert.equal(state.gates.G0.status, "PASS_PRODUCTION");
  for (const gate of ["G1", "G2", "G4"]) {
    assert.match(state.gates[gate].status, /^BLOCKED_/i, gate);
  }
  assert.equal(state.gates.G3.status, "IN_PROGRESS_BASELINE");
  assert.match(state.externalActions.gsc, /SITEMAP_SUBMITTED/);
  assert.match(state.externalActions.bingWebmaster, /SITEMAP_SUCCESS_28_URLS/);
  assert.match(state.externalActions.baiduSearchResource, /^BLOCKED_/);
  assert.equal(state.migration.neutralDomain, null);
  assert.equal(state.migration.decisionDeadline, "2026-07-29");
  const liveRecord = await text(state.latestLiveVerification);
  assert.match(liveRecord, /317 个问题/);
  assert.match(liveRecord, /最终生产验证器返回零错误/);
  assert.match(liveRecord, /不恢复交易/);
});
