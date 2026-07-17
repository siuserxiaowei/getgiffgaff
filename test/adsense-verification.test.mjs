import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  ADSENSE_AD_ELIGIBLE_ROUTES,
  adsenseAccountId,
  adsenseSellerLine,
  configureAdsenseVerification,
  injectAdsenseVerificationMeta,
  normalizeAdsensePublisherId,
} from "../scripts/adsense-verification.mjs";
import { buildReleaseArtifact } from "../scripts/build-release-artifact.mjs";
import worker from "../public/_worker.js";
import {
  OPTIONAL_PUBLIC_STATIC_ASSET_PATHS,
  PUBLIC_STATIC_ASSET_PATHS,
  ROUTE_MANIFEST,
} from "../public/route-manifest.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEST_PUBLISHER_ID = "pub-1234567890123456";
const TEST_ACCOUNT_ID = "ca-pub-1234567890123456";

function routeFile(root, route) {
  return route === "/"
    ? path.join(root, "index.html")
    : path.join(root, route.slice(1), "index.html");
}

async function exists(filename) {
  try {
    await access(filename);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function accountMetaTags(html) {
  return String(html).match(
    /<meta\b(?=[^>]*\bname=["']google-adsense-account["'])[^>]*>/gi,
  ) || [];
}

function contentTypeFor(pathname) {
  if (pathname.endsWith(".txt")) return "text/plain; charset=utf-8";
  if (pathname.endsWith("/") || pathname.endsWith(".html")) {
    return "text/html; charset=utf-8";
  }
  return "application/octet-stream";
}

function createAssetsEnvironment(root) {
  return {
    ASSETS: {
      async fetch(input) {
        const request = input instanceof Request ? input : new Request(input);
        const url = new URL(request.url);
        const filename = url.pathname.endsWith("/")
          ? path.join(root, url.pathname.slice(1), "index.html")
          : path.join(root, url.pathname.slice(1));
        try {
          const bytes = await readFile(filename);
          return new Response(request.method === "HEAD" ? null : bytes, {
            status: 200,
            headers: {
              "content-length": String(bytes.length),
              "content-type": contentTypeFor(url.pathname),
            },
          });
        } catch (error) {
          if (error?.code !== "ENOENT") throw error;
          return new Response(request.method === "HEAD" ? null : "Not found", {
            status: 404,
            headers: { "content-type": "text/plain; charset=utf-8" },
          });
        }
      },
    },
  };
}

test("publisher ID parsing is strict and normalizes pub/ca-pub forms", () => {
  assert.equal(normalizeAdsensePublisherId(), null);
  assert.equal(normalizeAdsensePublisherId(""), null);
  assert.equal(normalizeAdsensePublisherId(`  ${TEST_PUBLISHER_ID}  `), TEST_PUBLISHER_ID);
  assert.equal(normalizeAdsensePublisherId(TEST_ACCOUNT_ID), TEST_PUBLISHER_ID);
  assert.equal(adsenseAccountId(TEST_PUBLISHER_ID), TEST_ACCOUNT_ID);
  assert.equal(
    adsenseSellerLine(TEST_ACCOUNT_ID),
    `google.com, ${TEST_PUBLISHER_ID}, DIRECT, f08c47fec0942fa0`,
  );

  for (const invalid of [
    "pub-0000000000000000",
    "ca-pub-XXXXXXXXXXXXXXXX",
    "1234567890123456",
    "pub-123",
    "pub-12345678901234567",
    "ca-pub-123456789012345x",
  ]) {
    assert.throws(
      () => normalizeAdsensePublisherId(invalid),
      /publisher ID/i,
      invalid,
    );
  }
});

test("verification meta injection is exact, idempotent, and never injects ad JavaScript", () => {
  const source = "<!doctype html><html><head><title>Fixture</title></head><body>OK</body></html>";
  const once = injectAdsenseVerificationMeta(source, TEST_PUBLISHER_ID);
  const twice = injectAdsenseVerificationMeta(once, TEST_ACCOUNT_ID);

  assert.equal(twice, once);
  assert.equal(accountMetaTags(once).length, 1);
  assert.match(accountMetaTags(once)[0], new RegExp(`content=["']${TEST_ACCOUNT_ID}["']`));
  assert.doesNotMatch(once, /adsbygoogle|pagead2\.googlesyndication\.com/i);
  assert.throws(
    () => injectAdsenseVerificationMeta(
      source.replace("</head>", '<meta name="google-adsense-account" content="ca-pub-9999999999999999"></head>'),
      TEST_PUBLISHER_ID,
    ),
    /conflicting/i,
  );
  assert.throws(
    () => injectAdsenseVerificationMeta(
      source.replace(
        "</head>",
        `<meta name="google-adsense-account" content="${TEST_ACCOUNT_ID}">`
          + `<meta name="google-adsense-account" content="${TEST_ACCOUNT_ID}"></head>`,
      ),
      TEST_PUBLISHER_ID,
    ),
    /duplicate/i,
  );
  assert.throws(
    () => injectAdsenseVerificationMeta("<html><body>No head</body></html>", TEST_PUBLISHER_ID),
    /no closing head/i,
  );
});

test("configuration rejects missing paths and removes stale verification when disabled", async (t) => {
  await assert.rejects(
    configureAdsenseVerification({ outputRoot: "", publisherId: "", routes: [] }),
    /outputRoot/i,
  );
  await assert.rejects(
    configureAdsenseVerification({ outputRoot: "/tmp/not-used", publisherId: "", routes: null }),
    /route list/i,
  );

  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-adsense-clean-"));
  t.after(() => rm(outputRoot, { recursive: true, force: true }));
  const htmlFile = path.join(outputRoot, "index.html");
  const stale = injectAdsenseVerificationMeta(
    "<!doctype html><html><head><title>Stale</title></head><body>OK</body></html>",
    TEST_PUBLISHER_ID,
  );
  await writeFile(htmlFile, stale);
  await writeFile(path.join(outputRoot, "ads.txt"), `${adsenseSellerLine(TEST_PUBLISHER_ID)}\n`);

  const result = await configureAdsenseVerification({
    outputRoot,
    publisherId: undefined,
    routes: ["/"],
  });
  const cleaned = await readFile(htmlFile, "utf8");
  assert.deepEqual(result, { enabled: false, pages: 0, adsTxt: false });
  assert.equal(accountMetaTags(cleaned).length, 0);
  assert.equal(await exists(path.join(outputRoot, "ads.txt")), false);
});

test("configuration fails closed when no publisher ID exists", async (t) => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-adsense-off-"));
  t.after(() => rm(outputRoot, { recursive: true, force: true }));
  const htmlFile = path.join(outputRoot, "index.html");
  const source = "<!doctype html><html><head><title>Off</title></head><body>Off</body></html>";
  await writeFile(htmlFile, source);

  const result = await configureAdsenseVerification({
    outputRoot,
    publisherId: "",
    routes: ["/"],
  });

  assert.deepEqual(result, { enabled: false, pages: 0, adsTxt: false });
  assert.equal(await readFile(htmlFile, "utf8"), source);
  assert.equal(await exists(path.join(outputRoot, "ads.txt")), false);
});

test("configured release publishes exact ads.txt and one verification meta per page", async (t) => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-adsense-on-"));
  t.after(() => rm(outputRoot, { recursive: true, force: true }));

  const report = await buildReleaseArtifact({
    outputRoot,
    adsensePublisherId: TEST_ACCOUNT_ID,
  });

  assert.deepEqual(report.adsense, {
    enabled: true,
    pages: Object.keys(ROUTE_MANIFEST).length,
    adsTxt: true,
  });
  assert.equal(
    await readFile(path.join(outputRoot, "ads.txt"), "utf8"),
    `google.com, ${TEST_PUBLISHER_ID}, DIRECT, f08c47fec0942fa0\n`,
  );
  for (const route of Object.keys(ROUTE_MANIFEST)) {
    const html = await readFile(routeFile(outputRoot, route), "utf8");
    assert.equal(accountMetaTags(html).length, 1, route);
    assert.match(accountMetaTags(html)[0], new RegExp(`content=["']${TEST_ACCOUNT_ID}["']`), route);
    assert.doesNotMatch(html, /adsbygoogle|pagead2\.googlesyndication\.com/i, route);
  }
});

test("ordinary release contains no AdSense artifacts or ad-enabled routes", async (t) => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-adsense-default-"));
  t.after(() => rm(outputRoot, { recursive: true, force: true }));
  const report = await buildReleaseArtifact({ outputRoot, adsensePublisherId: "" });

  assert.deepEqual(report.adsense, { enabled: false, pages: 0, adsTxt: false });
  assert.deepEqual(ADSENSE_AD_ELIGIBLE_ROUTES, []);
  assert.equal(await exists(path.join(outputRoot, "ads.txt")), false);
  for (const route of Object.keys(ROUTE_MANIFEST)) {
    const html = await readFile(routeFile(outputRoot, route), "utf8");
    assert.equal(accountMetaTags(html).length, 0, route);
    assert.doesNotMatch(html, /adsbygoogle|pagead2\.googlesyndication\.com/i, route);
  }
});

test("Worker serves configured ads.txt for GET and HEAD", async (t) => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-adsense-worker-"));
  t.after(() => rm(outputRoot, { recursive: true, force: true }));
  await buildReleaseArtifact({ outputRoot, adsensePublisherId: TEST_PUBLISHER_ID });
  const env = createAssetsEnvironment(outputRoot);
  const url = "https://getgiffgaff.com/ads.txt";

  const getResponse = await worker.fetch(new Request(url), env, {});
  const body = await getResponse.text();
  assert.equal(getResponse.status, 200);
  assert.equal(getResponse.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.equal(body, `google.com, ${TEST_PUBLISHER_ID}, DIRECT, f08c47fec0942fa0\n`);
  assert.equal(getResponse.headers.get("x-robots-tag"), null);

  const headResponse = await worker.fetch(new Request(url, { method: "HEAD" }), env, {});
  assert.equal(headResponse.status, 200);
  assert.equal(await headResponse.text(), "");
  assert.equal(headResponse.headers.get("content-length"), String(Buffer.byteLength(body)));
  assert.ok(OPTIONAL_PUBLIC_STATIC_ASSET_PATHS.includes("/ads.txt"));
  assert.ok(!PUBLIC_STATIC_ASSET_PATHS.includes("/ads.txt"));
});

test("robots explicitly allows AdSense crawlers", async () => {
  const robots = await readFile(path.join(ROOT, "public", "robots.txt"), "utf8");
  for (const crawler of ["Mediapartners-Google", "Google-Display-Ads-Bot"]) {
    assert.match(
      robots,
      new RegExp(`User-agent: ${crawler}\\nAllow: /`, "i"),
      crawler,
    );
  }
});
