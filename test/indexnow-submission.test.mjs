import assert from "node:assert/strict";
import test from "node:test";

import { PUBLIC_INDEXABLE_PATHS } from "../public/route-manifest.js";
import {
  createIndexNowPayload,
  submitIndexNow,
} from "../scripts/submit-indexnow.mjs";

const KEY = "9d5c7277ec252fbb3b6f9ea0249ef612";

test("IndexNow payload contains exactly the 39 canonical sitemap routes", () => {
  const payload = createIndexNowPayload(KEY);
  assert.equal(payload.host, "getgiffgaff.com");
  assert.equal(payload.key, KEY);
  assert.equal(payload.keyLocation, `https://getgiffgaff.com/indexnow-key.txt`);
  assert.equal(payload.urlList.length, 39);
  assert.equal(new Set(payload.urlList).size, 39);
  assert.deepEqual(
    payload.urlList,
    PUBLIC_INDEXABLE_PATHS.map((pathname) => `https://getgiffgaff.com${pathname}`),
  );
});

test("IndexNow submission verifies the public key before posting the batch", async () => {
  const calls = [];
  const report = await submitIndexNow({
    key: KEY,
    fetchImpl: async (url, init = {}) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith("/indexnow-key.txt")) {
        return new Response(`${KEY}\n`, { status: 200 });
      }
      return new Response(null, { status: 200 });
    },
  });

  assert.equal(report.status, 200);
  assert.equal(report.submittedUrls, 39);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].init.redirect, "error");
  assert.equal(calls[1].url, "https://api.indexnow.org/indexnow");
  assert.equal(calls[1].init.method, "POST");
  assert.match(calls[1].init.headers["content-type"], /^application\/json/);
  const posted = JSON.parse(calls[1].init.body);
  assert.equal(posted.urlList.length, 39);
  assert.equal(posted.keyLocation, "https://getgiffgaff.com/indexnow-key.txt");
});

test("IndexNow fails closed when the published key does not match", async () => {
  let calls = 0;
  await assert.rejects(
    submitIndexNow({
      key: KEY,
      fetchImpl: async () => {
        calls += 1;
        return new Response("wrong-key", { status: 200 });
      },
    }),
    /key verification failed/i,
  );
  assert.equal(calls, 1, "must not submit URLs after ownership verification fails");
});
