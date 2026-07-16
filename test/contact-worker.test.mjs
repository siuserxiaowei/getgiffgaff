import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildReleaseArtifact } from "../scripts/build-release-artifact.mjs";

function routeFile(root, route) {
  return route === "/"
    ? path.join(root, "index.html")
    : path.join(root, route.slice(1), "index.html");
}

async function withRelease(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-commerce-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await buildReleaseArtifact({ outputRoot: root });
  return root;
}

test("frozen Contact keeps WeChat Xiaoyu, G0/G2 inventory and Kuaituantuan exits", async (t) => {
  const root = await withRelease(t);
  const html = await readFile(routeFile(root, "/contact/"), "utf8");

  for (const text of [
    "小玉",
    "微信咨询",
    "确认 G0 库存",
    "确认 G2 库存",
    "快团团下单",
    "进入 Giga卡快团团店铺",
  ]) {
    assert.match(html, new RegExp(text), text);
  }
  assert.match(html, /href=["']#ktt-giga-card["']/);
  assert.match(html, /src=["']\/contact\/wechat-qr\.png["']/);
  assert.match(html, /src=["']\/contact\/ktt-giga-card\.png["']/);
  assert.doesNotMatch(html, /暂停销售|停止下单|关闭微信|暂停新客/);
});

test("Kuaituantuan modal remains keyboard accessible without Next hydration", async (t) => {
  const root = await withRelease(t);
  const html = await readFile(routeFile(root, "/contact/"), "utf8");
  const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1])
    .find((source) => source.includes("ktt-giga-card"));

  assert.ok(script, "expected the frozen modal behavior");
  assert.match(script, /keydown/);
  assert.match(script, /Escape/);
  assert.match(script, /returnFocus/);
  assert.match(script, /\.focus\(\)/);
  assert.match(script, /event\.shiftKey/);
  assert.doesNotMatch(html, /\/_next\/|self\.__next_f/);
});

test("shop, G0, G2, guides and answers keep the complete commerce funnel", async (t) => {
  const root = await withRelease(t);
  const pages = Object.fromEntries(
    await Promise.all(
      [
        "/shop/",
        "/shop/giffgaff-g0/",
        "/shop/giffgaff-g2/",
        "/guides/1-order/",
        "/answers/",
      ].map(async (route) => [route, await readFile(routeFile(root, route), "utf8")]),
    ),
  );

  assert.match(pages["/shop/"], /href=["']\/shop\/giffgaff-g0\/["']/);
  assert.match(pages["/shop/"], /href=["']\/shop\/giffgaff-g2\/["']/);
  assert.match(pages["/shop/giffgaff-g0/"], /href=["']\/contact\/["']/);
  assert.match(pages["/shop/giffgaff-g2/"], /href=["']\/contact\/["']/);
  for (const route of ["/guides/1-order/", "/answers/"]) {
    assert.match(pages[route], /data-growth-slot=["']related-tutorials-v1["']/);
    assert.match(pages[route], /href=["']\/shop\/giffgaff-g0\/["']/);
    assert.match(pages[route], /href=["']\/shop\/giffgaff-g2\/["']/);
  }
});
