import assert from "node:assert/strict";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { validateCompetitorResearch } from "../scripts/validate-competitor-research.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

test("competitor corpus contains 40 unique, evidence-backed pages", async () => {
  const result = await validateCompetitorResearch({ rootDir });

  assert.equal(result.errors.length, 0, result.errors.join("\n"));
  assert.equal(result.competitorCount, 40);
  assert.equal(result.uniqueUrls, 40);
  assert.ok(result.directCount >= 15, "expected meaningful direct-competitor coverage");
  assert.ok(result.indirectCount >= 3, "expected indirect/channel coverage");
  assert.ok(result.queries.size >= 20, "expected a broad query evidence set");
});
