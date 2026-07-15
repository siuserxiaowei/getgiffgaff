import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";

const editorialFiles = [
  new URL("../README.md", import.meta.url),
  new URL("../docs/giffgaff-usage-pitfalls.md", import.meta.url),
  new URL("../public/guides/6-pitfalls-page.txt", import.meta.url),
  new URL("../public/research/index-page.txt", import.meta.url),
  new URL("../public/tutorial-pages.js", import.meta.url),
];

const articlesDir = new URL("../docs/articles/", import.meta.url);

test("editorial sources do not normalize risky account handoff or official identity claims", async () => {
  const articleFiles = (await readdir(articlesDir))
    .filter((name) => name.endsWith(".md"))
    .map((name) => new URL(name, articlesDir));

  for (const file of [...editorialFiles, ...articleFiles]) {
    const text = await readFile(file, "utf8");
    const label = file.pathname;

    assert.doesNotMatch(text, /账号交接|移交控制权/, label);
    assert.doesNotMatch(text, /G2[^。\n]{0,50}(?:更适合第一次|优先看 G2)/, label);
    assert.doesNotMatch(text, /getgiffgaff\s*官网/, label);
    assert.doesNotMatch(text, /本站客服确认为准/, label);
  }
});

test("every editorial page that recommends evaluating G2 links or points to current terms", async () => {
  const requiredFiles = [
    new URL("../README.md", import.meta.url),
    new URL("../docs/giffgaff-usage-pitfalls.md", import.meta.url),
    new URL("../docs/articles/buy-giffgaff-sim-in-china.md", import.meta.url),
    new URL("../docs/articles/giffgaff-activation-in-china.md", import.meta.url),
    new URL("../docs/articles/giffgaff-buying-risk-checklist.md", import.meta.url),
    new URL("../docs/articles/giffgaff-domestic-activation-failure.md", import.meta.url),
    new URL("../docs/articles/giffgaff-g0-vs-g2.md", import.meta.url),
    new URL("../docs/articles/gg-card-guide.md", import.meta.url),
  ];

  for (const file of requiredFiles) {
    const text = await readFile(file, "utf8");
    assert.match(
      text,
      /(?:giffgaff\.com\/boiler-plate\/terms|当前条款|现行条款)/,
      file.pathname,
    );
  }
});
