import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { GROWTH_PAGES } from "../site/growth/content-registry.js";

test("G0/G2 runtime names only the cash calculation it implements", () => {
  const page = GROWTH_PAGES.find(({ path }) => path === "/tools/g0-g2-total-cost/");
  assert.ok(page);
  for (const value of [page.title, page.h1, page.description]) {
    assert.match(value, /现金支出/);
    assert.doesNotMatch(value, /时间.*费用|维护.*费用|总成本/);
  }
});

test("G0/G2 editorial kit keeps comparison inputs blank and its blockers visible", async () => {
  const kit = await readFile(
    new URL("../docs/outreach/kits/g0-g2-cost-kit.md", import.meta.url),
    "utf8",
  );
  assert.match(kit, /content-source-of-truth\.md/);
  assert.match(kit, /现金支出\s*=\s*卡价\s*\+\s*运费\s*\+\s*首次充值\s*\+\s*预计额外使用支出/);
  assert.match(kit, /每次.*一条.*路径/);
  assert.match(kit, /不按.*汇率.*折算|不.*折算.*汇率/);
  assert.match(kit, /本站.*库存.*分类/);
  for (const boundary of ["账号", "OTP", "库存", "合规"]) assert.match(kit, new RegExp(boundary));
  assert.match(kit, /真实.*SKU.*批次.*证据|SKU.*批次.*证据/);
  assert.match(kit, /\| A /);
  assert.match(kit, /\| B /);
  assert.doesNotMatch(kit, /(?:¥|￥|£)\s*\d/);
  assert.match(kit, /不得.*推荐|不能.*推荐/);
});
