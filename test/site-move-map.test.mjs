import assert from "node:assert/strict";
import test from "node:test";

import { buildSiteMoveMap } from "../scripts/generate-site-move-map.mjs";
import { ROUTE_MANIFEST } from "../public/route-manifest.js";

test("builds a one-to-one migration map for every public HTML route", () => {
  const map = buildSiteMoveMap("https://neutral-sim.example");
  const expectedPaths = Object.values(ROUTE_MANIFEST)
    .filter((route) => route.path.endsWith("/"))
    .filter((route) => ["index", "noindex"].includes(route.indexPolicy))
    .map((route) => route.canonicalPath);

  assert.equal(map.sourceOrigin, "https://getgiffgaff.com");
  assert.equal(map.targetOrigin, "https://neutral-sim.example");
  assert.equal(map.redirectStatus, 301);
  assert.equal(map.routes.length, new Set(expectedPaths).size);
  assert.equal(new Set(map.routes.map(({ from }) => from)).size, map.routes.length);
  assert.equal(new Set(map.routes.map(({ to }) => to)).size, map.routes.length);
  for (const route of map.routes) {
    assert.equal(new URL(route.from).pathname, new URL(route.to).pathname);
    assert.equal(new URL(route.to).origin, map.targetOrigin);
  }
});

test("refuses unsafe, same-origin or trademark-bearing default targets", () => {
  for (const target of [
    "http://neutral-sim.example",
    "https://getgiffgaff.com",
    "https://another-giffgaff.example",
    "https://neutral-sim.example/path",
    "https://neutral-sim.example/?query=1",
  ]) {
    assert.throws(() => buildSiteMoveMap(target), /target origin|neutral|https/i, target);
  }
});
