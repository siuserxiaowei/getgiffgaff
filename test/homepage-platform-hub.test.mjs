import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildReleaseArtifact } from "../scripts/build-release-artifact.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("final homepage presents Claude problem owners without selling KYC or appeals", async (t) => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-home-hub-"));
  t.after(() => rm(outputRoot, { recursive: true, force: true }));
  await buildReleaseArtifact(outputRoot);
  const html = await readFile(path.join(outputRoot, "index.html"), "utf8");
  const css = await readFile(path.join(outputRoot, "growth-assets", "growth.css"));
  const cssVersion = createHash("sha256").update(css).digest("hex").slice(0, 16);
  const slot = html.match(
    /<section\b(?=[^>]*data-growth-slot="related-tutorials-v1")[^>]*>[\s\S]*?<\/section>/i,
  )?.[0] || "";

  assert.match(slot, /Claude 验证与账号问题/i);
  assert.match(html, new RegExp(`/growth-assets/growth\\.css\\?v=${cssVersion}`));
  assert.match(slot, /英国号码最多只涉及受支持地区的短信手机号验证/);
  assert.match(slot, /不能替代政府证件/);
  assert.match(slot, /不能恢复被禁用的账号/);
  assert.match(slot, /不保证 Claude 接受号码或发送验证码/);
  assert.doesNotMatch(slot, /href="\/(?:shop|contact)\//);
  assert.doesNotMatch(html, /AI 工具注册/);
  assert.doesNotMatch(html, /海外手机号辅助注册、验证/);
  assert.doesNotMatch(html, /买手机卡是为了注册、验证/);
  assert.match(html, /AI 订阅与手机号、身份验证和账号申诉是不同事项/);
});
