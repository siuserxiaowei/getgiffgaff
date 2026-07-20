import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { PUBLIC_INDEXABLE_PATHS } from "../public/route-manifest.js";
import {
  createIndexNowPayload,
  parseIndexNowCliOptions,
  readReleaseChangedPaths,
  runIndexNowCli,
  submitIndexNow,
} from "../scripts/submit-indexnow.mjs";

const KEY = "9d5c7277ec252fbb3b6f9ea0249ef612";

test("explicit full IndexNow payload contains exactly the 43 canonical sitemap routes", () => {
  const payload = createIndexNowPayload(
    KEY,
    "https://getgiffgaff.com",
    PUBLIC_INDEXABLE_PATHS,
  );
  assert.equal(payload.host, "getgiffgaff.com");
  assert.equal(payload.key, KEY);
  assert.equal(payload.keyLocation, `https://getgiffgaff.com/indexnow-key.txt`);
  assert.equal(payload.urlList.length, 43);
  assert.equal(new Set(payload.urlList).size, 43);
  assert.deepEqual(
    payload.urlList,
    PUBLIC_INDEXABLE_PATHS.map((pathname) => `https://getgiffgaff.com${pathname}`),
  );
});

test("IndexNow payload accepts only an explicit unique subset of canonical routes", () => {
  const changed = ["/contact/", "/shop/"];
  const payload = createIndexNowPayload(KEY, "https://getgiffgaff.com", changed);
  assert.deepEqual(payload.urlList, changed.map((route) => `https://getgiffgaff.com${route}`));
  assert.throws(
    () => createIndexNowPayload(KEY, undefined, ["/contact/", "/contact/"]),
    /duplicates/i,
  );
  assert.throws(
    () => createIndexNowPayload(KEY, undefined, ["/privacy/"]),
    /not an indexable canonical route/i,
  );
  assert.throws(() => createIndexNowPayload(KEY, undefined, []), /no changed urls/i);
  assert.throws(() => createIndexNowPayload(KEY), /paths must be an array/i);
});

test("IndexNow CLI is incremental by default and requires --all for a full submission", () => {
  assert.deepEqual(parseIndexNowCliOptions([]), { all: false, help: false });
  assert.deepEqual(parseIndexNowCliOptions(["--all"]), { all: true, help: false });
  assert.deepEqual(parseIndexNowCliOptions(["--help"]), { all: false, help: true });
  assert.throws(() => parseIndexNowCliOptions(["--force"]), /unknown option/i);
  assert.throws(() => parseIndexNowCliOptions(["--all", "--all"]), /only be specified once/i);
});

test("default changed paths are bound to the exact built sitemap", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-indexnow-changes-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sitemapPath = path.join(root, "sitemap.xml");
  const changesPath = path.join(root, "release-search-changes.json");
  const sitemap = "<urlset><url><loc>https://getgiffgaff.com/contact/</loc></url></urlset>\n";
  await writeFile(sitemapPath, sitemap);
  await writeFile(changesPath, `${JSON.stringify({
    schema: "getgiffgaff_search_changes_v1",
    changedPaths: ["/contact/", "/shop/"],
    sitemapSha256: createHash("sha256").update(sitemap).digest("hex"),
  })}\n`);

  assert.deepEqual(
    await readReleaseChangedPaths({ changesPath, sitemapPath }),
    ["/contact/", "/shop/"],
  );
  await writeFile(sitemapPath, `${sitemap}<!-- stale -->\n`);
  await assert.rejects(
    () => readReleaseChangedPaths({ changesPath, sitemapPath }),
    /do not match the built sitemap/i,
  );
});

test("default IndexNow CLI treats an empty verified change set as a successful no-op", async () => {
  const output = [];
  let keyReads = 0;
  let submissions = 0;
  const report = await runIndexNowCli([], {
    readChangedPaths: async () => [],
    readKey: async () => {
      keyReads += 1;
      return KEY;
    },
    submit: async () => {
      submissions += 1;
      throw new Error("empty sets must never reach the IndexNow payload");
    },
    write: (value) => output.push(value),
  });

  assert.deepEqual(report, {
    outcome: "no_changes",
    status: "noop",
    submittedUrls: 0,
  });
  assert.deepEqual(JSON.parse(output.join("")), report);
  assert.equal(keyReads, 0, "a no-op must not even read the ownership key");
  assert.equal(submissions, 0);
});

test("IndexNow submission verifies the public key before posting the batch", async () => {
  const calls = [];
  const changed = ["/contact/", "/shop/"];
  const report = await submitIndexNow({
    key: KEY,
    pathnames: changed,
    fetchImpl: async (url, init = {}) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith("/indexnow-key.txt")) {
        return new Response(`${KEY}\n`, { status: 200 });
      }
      return new Response(null, { status: 200 });
    },
  });

  assert.equal(report.status, 200);
  assert.equal(report.submittedUrls, changed.length);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].init.redirect, "error");
  assert.equal(calls[1].url, "https://api.indexnow.org/indexnow");
  assert.equal(calls[1].init.method, "POST");
  assert.match(calls[1].init.headers["content-type"], /^application\/json/);
  const posted = JSON.parse(calls[1].init.body);
  assert.deepEqual(
    posted.urlList,
    changed.map((route) => `https://getgiffgaff.com${route}`),
  );
  assert.equal(posted.keyLocation, "https://getgiffgaff.com/indexnow-key.txt");
});

test("IndexNow fails closed when the published key does not match", async () => {
  let calls = 0;
  await assert.rejects(
    submitIndexNow({
      key: KEY,
      pathnames: ["/contact/"],
      fetchImpl: async () => {
        calls += 1;
        return new Response("wrong-key", { status: 200 });
      },
    }),
    /key verification failed/i,
  );
  assert.equal(calls, 1, "must not submit URLs after ownership verification fails");
});
