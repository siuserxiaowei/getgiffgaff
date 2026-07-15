import assert from "node:assert/strict";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { validateStrategyArtifacts } from "../scripts/validate-strategy-artifacts.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

test("content cluster, briefs, map and internal-link graph remain synchronized", async () => {
  const result = await validateStrategyArtifacts({ rootDir });

  assert.equal(result.errors.length, 0, result.errors.join("\n"));
  assert.equal(result.clusterCount, 5);
  assert.equal(result.spokeCount, 20);
  assert.equal(result.briefCount, 6);
  assert.equal(result.nodeCount, 21);
  assert.equal(result.linkCount, 90);
});
