import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

import { validateResearchSources } from "../scripts/validate-research-sources.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

test("research source registry is structured, public, and non-verbatim", async () => {
  const result = await validateResearchSources({ rootDir });

  assert.equal(result.errors.length, 0, result.errors.join("\n"));
  assert.ok(result.sourceCount >= 30, "expected at least 30 researched sources");
  assert.ok(result.platforms.has("official"), "official sources are required");
  assert.ok(result.platforms.has("zhihu"), "Zhihu sources are required");
  assert.ok(result.platforms.has("douyin"), "Douyin search sources are required");
  assert.ok(result.platforms.has("bilibili"), "Bilibili sources are required");
  assert.ok(result.platforms.has("x-twitter"), "X/Twitter sources are required");
  assert.ok(result.platforms.has("wechat"), "WeChat/public-account source notes are required");
});
