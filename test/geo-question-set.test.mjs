import assert from "node:assert/strict";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { validateGeoQuestionSet } from "../scripts/validate-geo-question-set.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

test("fixed GEO corpus contains exactly 30 safe, measurable questions", async () => {
  const result = await validateGeoQuestionSet({ rootDir });

  assert.equal(result.errors.length, 0, result.errors.join("\n"));
  assert.equal(result.questionCount, 30);
  assert.equal(result.topicCount, 12);
  assert.deepEqual(result.questionIds, [
    "geo-01", "geo-02", "geo-03", "geo-04", "geo-05",
    "geo-06", "geo-07", "geo-08", "geo-09", "geo-10",
    "geo-11", "geo-12", "geo-13", "geo-14", "geo-15",
    "geo-16", "geo-17", "geo-18", "geo-19", "geo-20",
    "geo-21", "geo-22", "geo-23", "geo-24", "geo-25",
    "geo-26", "geo-27", "geo-28", "geo-29", "geo-30"
  ]);
});
