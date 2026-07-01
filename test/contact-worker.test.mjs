import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import worker, { HOTFIX_ORIGIN } from "../public/worker-logic.js";

const brokenContactHtml = `
<!doctype html>
<html>
  <body>
    <main>
      <a class="btn btn-primary contact-action-button" href="/contact/"><span>确认 G0 库存</span></a>
      <a class="btn btn-primary contact-action-button" href="/contact/"><span>确认 G2 库存</span></a>
      <div class="wechat-name">小玉</div>
    </main>
  </body>
</html>`;

const guideIndexHtml = `
<!doctype html>
<html>
  <body>
    <nav>
      <li><a href="/guides/5-travel-data/">giffgaff 旅行流量包使用指南</a></li>
    </nav>
    <main>
      <a class="doc-list-item" href="/guides/5-travel-data/"><span>giffgaff 旅行流量包使用指南</span></a>
    </main>
  </body>
</html>`;

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
<loc>https://getgiffgaff.com/guides/5-travel-data/</loc>
</url>
</urlset>`;

const sitemapXmlWithHotfixRoutes = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
<loc>https://getgiffgaff.com/guides/6-pitfalls/</loc>
</url>
<url>
<loc>https://getgiffgaff.com/research/</loc>
</url>
</urlset>`;

function countOccurrences(text, pattern) {
  return (text.match(pattern) || []).length;
}

async function assetEnv() {
  const pitfallsHtml = await readFile(
    new URL("../public/guides/6-pitfalls-page.txt", import.meta.url),
    "utf8",
  );
  const researchHtml = await readFile(
    new URL("../public/research/index-page.txt", import.meta.url),
    "utf8",
  );

  return {
    ASSETS: {
      fetch: async (request) => {
        const url = new URL(request.url);
        if (url.pathname === "/guides/6-pitfalls-page.txt") {
          return new Response(pitfallsHtml, {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }
        if (url.pathname === "/research/index-page.txt") {
          return new Response(researchHtml, {
            headers: { "content-type": "text/html; charset=utf-8" },
          });
        }

        return new Response("missing", { status: 404 });
      },
    },
  };
}

test("rewrites contact inventory buttons to the Kuaituantuan modal", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(brokenContactHtml, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });

  try {
    const response = await worker.fetch(new Request("https://getgiffgaff.com/contact/"), {});
    const html = await response.text();

    assert.equal(response.headers.get("x-getgiffgaff-hotfix"), "contact-ktt-modal");
    assert.match(html, /id="ktt-giga-card"/);
    assert.match(html, /href="#ktt-giga-card"[^>]*>[\s\S]*确认 G0 库存/);
    assert.match(html, /href="#ktt-giga-card"[^>]*>[\s\S]*确认 G2 库存/);
    assert.doesNotMatch(html, /href="\/contact\/"[^>]*>[\s\S]*确认 G0 库存/);
    assert.doesNotMatch(html, /href="\/contact\/"[^>]*>[\s\S]*确认 G2 库存/);
    assert.match(html, /客服小玉/);
    assert.match(html, /\/contact\/ktt-giga-card\.png/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("proxies non-contact requests to the immutable previous deployment", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  globalThis.fetch = async (request) => {
    requestedUrl = request.url;
    return new Response("ok");
  };

  try {
    const response = await worker.fetch(
      new Request("https://getgiffgaff.com/tutorial/?from=test"),
      {},
    );

    assert.equal(await response.text(), "ok");
    assert.equal(requestedUrl, `${HOTFIX_ORIGIN}/tutorial/?from=test`);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("serves the giffgaff pitfalls guide from Pages assets", async () => {
  const response = await worker.fetch(
    new Request("https://getgiffgaff.com/guides/6-pitfalls/"),
    await assetEnv(),
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-getgiffgaff-hotfix"), "pitfalls-guide");
  assert.match(html, /giffgaff 使用教程和避坑清单/);
  assert.match(html, /https:\/\/help\.giffgaff\.com\/en\/articles\/242797-understanding-why-your-number-has-been-deactivated/);
  assert.match(html, /不承诺所有验证码均可送达/);
  assert.doesNotMatch(html, /nano-banana|Nano Banana|AI 订阅/);
});

test("redirects the pitfalls guide to the canonical trailing slash", async () => {
  const response = await worker.fetch(
    new Request("https://getgiffgaff.com/guides/6-pitfalls"),
    await assetEnv(),
  );

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://getgiffgaff.com/guides/6-pitfalls/");
});

test("serves the research hub from Pages assets", async () => {
  const response = await worker.fetch(
    new Request("https://getgiffgaff.com/research/"),
    await assetEnv(),
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-getgiffgaff-hotfix"), "research-hub");
  assert.match(html, /giffgaff \/ GG 卡全网资料索引/);
  assert.match(html, /github\.com\/siuserxiaowei\/getgiffgaff/);
});

test("redirects the research hub to the canonical trailing slash", async () => {
  const response = await worker.fetch(
    new Request("https://getgiffgaff.com/research"),
    await assetEnv(),
  );

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://getgiffgaff.com/research/");
});

test("injects the pitfalls guide into the guide directory", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(guideIndexHtml, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });

  try {
    const response = await worker.fetch(new Request("https://getgiffgaff.com/guides/"), {});
    const html = await response.text();

    assert.equal(response.headers.get("x-getgiffgaff-hotfix"), "guide-pitfalls-link");
    assert.match(html, /href="\/guides\/6-pitfalls\/">giffgaff 使用教程和避坑清单/);
    assert.match(html, /class="doc-list-item" href="\/guides\/6-pitfalls\/"/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("injects the hotfix routes into sitemap.xml", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(sitemapXml, {
      headers: { "content-type": "application/xml; charset=utf-8" },
    });

  try {
    const response = await worker.fetch(new Request("https://getgiffgaff.com/sitemap.xml"), {});
    const xml = await response.text();

    assert.equal(response.headers.get("x-getgiffgaff-hotfix"), "sitemap-hotfix-routes");
    assert.match(xml, /https:\/\/getgiffgaff\.com\/guides\/6-pitfalls\//);
    assert.match(xml, /https:\/\/getgiffgaff\.com\/research\//);
    assert.match(xml, /2026-07-01T00:00:00\.000Z/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("does not duplicate hotfix routes already present in sitemap.xml", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(sitemapXmlWithHotfixRoutes, {
      headers: { "content-type": "application/xml; charset=utf-8" },
    });

  try {
    const response = await worker.fetch(new Request("https://getgiffgaff.com/sitemap.xml"), {});
    const xml = await response.text();

    assert.equal(response.headers.get("x-getgiffgaff-hotfix"), "sitemap-hotfix-routes");
    assert.equal(countOccurrences(xml, /https:\/\/getgiffgaff\.com\/guides\/6-pitfalls\//g), 1);
    assert.equal(countOccurrences(xml, /https:\/\/getgiffgaff\.com\/research\//g), 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("serves the local Kuaituantuan image through Pages assets", async () => {
  let assetRequested = "";
  const env = {
    ASSETS: {
      fetch: async (request) => {
        assetRequested = request.url;
        return new Response("image-bytes", {
          headers: { "content-type": "image/png" },
        });
      },
    },
  };

  const response = await worker.fetch(
    new Request("https://getgiffgaff.com/contact/ktt-giga-card.png"),
    env,
  );

  assert.equal(await response.text(), "image-bytes");
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.equal(assetRequested, "https://getgiffgaff.com/contact/ktt-giga-card.png");
});
