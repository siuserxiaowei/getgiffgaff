import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildReleaseArtifact } from "../scripts/build-release-artifact.mjs";
import { verifyReleaseArtifact } from "../scripts/verify-release-artifact.mjs";

test("release verifier audits all pages, index policies and the frozen commerce path", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-verify-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await buildReleaseArtifact({ outputRoot: root });

  const report = await verifyReleaseArtifact({ releaseRoot: root });
  assert.deepEqual(report, {
    manifestPages: 56,
    indexablePages: 49,
    noindexPages: 7,
    legacyPages: 34,
    growthPages: 22,
    sitemapUrls: 49,
    commerceChecks: 6,
  });
});
