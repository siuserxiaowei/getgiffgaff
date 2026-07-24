import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildReleaseArtifact } from "../scripts/build-release-artifact.mjs";
import {
  BAIDU_SITE_VERIFICATION_CODE,
  injectBaiduVerificationMeta,
  normalizeBaiduVerificationCode,
} from "../scripts/search-platform-verification.mjs";

test("Baidu verification code validation rejects malformed values", () => {
  assert.equal(
    normalizeBaiduVerificationCode(BAIDU_SITE_VERIFICATION_CODE),
    BAIDU_SITE_VERIFICATION_CODE,
  );
  for (const value of ["", "EHQw5Gn8uH", "codeva-<script>", "google-site-verification"]) {
    assert.throws(() => normalizeBaiduVerificationCode(value), /Invalid Baidu/u);
  }
});

test("Baidu verification meta injection is exact and idempotent", () => {
  const source = "<html><head><title>Example</title></head><body></body></html>";
  const output = injectBaiduVerificationMeta(source, BAIDU_SITE_VERIFICATION_CODE);
  assert.match(
    output,
    new RegExp(
      `<meta name="baidu-site-verification" content="${BAIDU_SITE_VERIFICATION_CODE}">`,
      "u",
    ),
  );
  assert.equal(
    injectBaiduVerificationMeta(output, BAIDU_SITE_VERIFICATION_CODE),
    output,
  );
  assert.throws(
    () => injectBaiduVerificationMeta(
      output.replace(BAIDU_SITE_VERIFICATION_CODE, "codeva-conflict"),
      BAIDU_SITE_VERIFICATION_CODE,
    ),
    /Conflicting/u,
  );
});

test("release artifact keeps Baidu ownership verification on the homepage only", async () => {
  const outputRoot = await mkdtemp(
    path.join(os.tmpdir(), "getgiffgaff-baidu-verification-"),
  );
  try {
    const report = await buildReleaseArtifact({ outputRoot });
    const homepage = await readFile(path.join(outputRoot, "index.html"), "utf8");
    const guide = await readFile(
      path.join(outputRoot, "guides", "0-intro", "index.html"),
      "utf8",
    );
    assert.deepEqual(report.searchPlatformVerification, {
      baidu: {
        enabled: true,
        code: BAIDU_SITE_VERIFICATION_CODE,
        pages: 1,
      },
    });
    assert.match(
      homepage,
      new RegExp(
        `name="baidu-site-verification" content="${BAIDU_SITE_VERIFICATION_CODE}"`,
        "u",
      ),
    );
    assert.doesNotMatch(guide, /baidu-site-verification/u);
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});
