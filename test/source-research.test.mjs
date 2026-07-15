import assert from "node:assert/strict";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { validateSourceResearch } from "../scripts/validate-source-research.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

test("six requested sources are captured as copyright-safe evidence records", async () => {
  const result = await validateSourceResearch({ rootDir });

  assert.equal(result.errors.length, 0, result.errors.join("\n"));
  assert.equal(result.sourceCount, 6);
  assert.equal(result.uniqueUrls, 6);
  assert.equal(result.sourceIds.size, 6);
});
