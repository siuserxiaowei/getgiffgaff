import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  applyLegacySafetyOverrides,
  buildReleaseArtifact,
  LEGACY_SAFETY_OVERRIDE_MANIFEST,
} from "../scripts/build-release-artifact.mjs";
import { LEGACY_ROUTES } from "../public/route-manifest.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEGACY_ROOT = path.join(ROOT, "site", "legacy");

function routeFile(root, route) {
  return route === "/"
    ? path.join(root, "index.html")
    : path.join(root, route.slice(1), "index.html");
}

function count(value, needle) {
  return value.split(needle).length - 1;
}

test("approved safety overrides are exact, route-scoped and fail closed", async () => {
  const recharge = await readFile(
    routeFile(LEGACY_ROOT, "/guides/4-recharge-service/"),
    "utf8",
  );
  const rechargeResult = applyLegacySafetyOverrides(
    recharge,
    "/guides/4-recharge-service/",
  );
  assert.match(rechargeResult.html, /本站不会要求或接收密码、短信验证码、Cookie 或完整支付卡信息/);
  assert.equal(
    rechargeResult.applied,
    LEGACY_SAFETY_OVERRIDE_MANIFEST
      .filter((rule) => rule.route === "/guides/4-recharge-service/")
      .reduce((total, rule) => total + rule.expectedOccurrences, 0),
  );

  assert.throws(
    () => applyLegacySafetyOverrides(
      recharge.replace(
        "涉及密码、验证码或账号安全时，要确认你理解操作风险。",
        "copy drifted",
      ),
      "/guides/4-recharge-service/",
    ),
    /expected safety override source text/,
  );
  assert.deepEqual(
    applyLegacySafetyOverrides("<p>unrelated copy</p>", "/guides/4-signal/"),
    { html: "<p>unrelated copy</p>", applied: 0 },
  );
});

test("release neutralizes every stale 9eSIM action label without changing the source snapshot", async () => {
  let sourceOccurrences = 0;
  for (const route of LEGACY_ROUTES) {
    const html = await readFile(routeFile(LEGACY_ROOT, route), "utf8");
    sourceOccurrences += count(html, "giffgaff 获取 eSIM 二维码，并写入到 9eSIM");
  }
  assert.ok(sourceOccurrences > 0, "frozen source retains the auditable legacy baseline");

  const outputRoot = await mkdtemp(path.join(tmpdir(), "getgiffgaff-safety-release-"));
  try {
    const report = await buildReleaseArtifact({ outputRoot });
    assert.equal(
      report.safetyOverrides,
      LEGACY_SAFETY_OVERRIDE_MANIFEST.reduce(
        (total, rule) => total + rule.expectedOccurrences,
        0,
      ),
    );
    assert.equal(
      sourceOccurrences,
      LEGACY_SAFETY_OVERRIDE_MANIFEST
        .filter((rule) => rule.issueId === "SAFE-9ESIM-ANCHOR")
        .reduce((total, rule) => total + rule.expectedOccurrences, 0),
    );
    for (const route of LEGACY_ROUTES) {
      const html = await readFile(routeFile(outputRoot, route), "utf8");
      assert.doesNotMatch(html, /获取 eSIM 二维码，并写入到 9eSIM/);
      assert.doesNotMatch(html, /涉及密码、验证码或账号安全时，要确认你理解操作风险/);
      assert.doesNotMatch(html, /优先推荐|更适合接收海外平台短信验证码|通常含 10-14 英镑余额/);
    }
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});

test("G2 release copy and structured data fail closed without batch evidence", async () => {
  const source = await readFile(routeFile(LEGACY_ROOT, "/shop/giffgaff-g2/"), "utf8");
  const result = applyLegacySafetyOverrides(source, "/shop/giffgaff-g2/");

  assert.equal(
    result.applied,
    LEGACY_SAFETY_OVERRIDE_MANIFEST
      .filter((rule) => rule.route === "/shop/giffgaff-g2/")
      .reduce((total, rule) => total + rule.expectedOccurrences, 0),
  );
  assert.doesNotMatch(result.html, /"@type":"Product"/);
  assert.match(result.html, /"@type":"WebPage"/);
  assert.match(result.html, /G2 库存分类说明/);
  assert.match(result.html, /不是 giffgaff 官方 SKU/);
  assert.match(result.html, /缺少逐批证据时不要付款/);
  assert.match(result.html, /不保证任何平台验证码/);
  assert.doesNotMatch(result.html, /优先推荐|更适合第一次购买或急用|通常含 10-14 英镑余额/);
  assert.equal(
    LEGACY_SAFETY_OVERRIDE_MANIFEST.some(
      (rule) => rule.route === "/shop/giffgaff-g2/" && rule.replacement.includes("WebPage"),
    ),
    true,
  );
});

test("release removes unsupported visible commerce and fulfillment promises", async () => {
  const unsupported = /主卖|国内发货|浙江发货|圆通包邮|顺丰可到付|5 张起卖|5 张起发|适合第一次购买或急用|全新未激活|购买保障|省去首次充值麻烦|常规库存/u;
  let sourceRoutes = 0;
  for (const route of LEGACY_ROUTES) {
    const source = await readFile(routeFile(LEGACY_ROOT, route), "utf8");
    if (unsupported.test(source)) sourceRoutes += 1;
    const result = applyLegacySafetyOverrides(source, route);
    assert.doesNotMatch(result.html, unsupported, route);
  }
  assert.ok(sourceRoutes >= 4, "frozen source keeps the auditable legacy claims");
});

test("G0 release is a batch-evidence status page, not an unsupported Product", async () => {
  for (const route of ["/", "/shop/", "/shop/giffgaff-g0/", "/guides/1-order/"]) {
    const source = await readFile(routeFile(LEGACY_ROOT, route), "utf8");
    const result = applyLegacySafetyOverrides(source, route);
    assert.doesNotMatch(result.html, /全新未激活/u, route);
    assert.match(result.html, /状态须按批次核验/u, route);
  }
  const product = await readFile(routeFile(LEGACY_ROOT, "/shop/giffgaff-g0/"), "utf8");
  const result = applyLegacySafetyOverrides(product, "/shop/giffgaff-g0/");
  assert.doesNotMatch(result.html, /"@type":"Product"|"sku":"g0-new-card"/u);
  assert.match(result.html, /"@type":"WebPage","name":"G0 库存分类说明"/u);
});
