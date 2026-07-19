import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  listCloudflarePreviewDeployments,
  OWNER_QR_ASSETS,
  validatePreviewDeploymentMetadata,
  verifyPreviewDeploymentSource,
  probePreviewAnalyticsIsolation,
  validatePreviewSitemap,
  validatePreviewStaticAsset,
} from "../scripts/verify-preview-release.mjs";
import { PUBLIC_INDEXABLE_PATHS } from "../public/route-manifest.js";

const CANONICAL_ORIGIN = "https://getgiffgaff.com";
const RELEASE_SHA = "0123456789abcdef0123456789abcdef01234567";
const PREVIEW_URL = "https://b0d3e1d6.getgiffgaff.pages.dev";

test("preview metadata lookup invokes only the project-local Wrangler", async () => {
  const calls = [];
  const records = [{ Id: "preview-id" }];
  const result = await listCloudflarePreviewDeployments({
    projectName: "getgiffgaff",
    execFileImpl: async (command, args, options) => {
      calls.push({ command, args, options });
      return { stdout: JSON.stringify(records) };
    },
  });

  assert.deepEqual(result, records);
  assert.deepEqual(calls, [{
    command: "npx",
    args: [
      "--no-install",
      "wrangler",
      "pages",
      "deployment",
      "list",
      "--project-name",
      "getgiffgaff",
      "--environment",
      "preview",
      "--json",
    ],
    options: { maxBuffer: 4 * 1024 * 1024 },
  }]);
});

test("preview metadata lookup parses stdout when Wrangler writes proxy notices to stderr", async () => {
  const deployments = [{
    Id: "01234567-89ab-cdef-0123-456789abcdef",
    Environment: "Preview",
    Source: "0123456",
    Deployment: "https://01234567.getgiffgaff.pages.dev",
  }];
  const execFileImpl = async () => ({
    stdout: JSON.stringify(deployments),
    stderr: "Proxy environment variables detected.\n",
  });
  const notices = [];

  assert.deepEqual(
    await listCloudflarePreviewDeployments({
      execFileImpl,
      writeStderr: (value) => notices.push(value),
    }),
    deployments,
  );
  assert.deepEqual(notices, ["Proxy environment variables detected.\n"]);
});

test("preview deployment metadata binds the exact URL to the expected release SHA", async () => {
  const records = [{
    Id: "b0d3e1d6-d78c-4162-9c90-e608748d7abb",
    Environment: "Preview",
    Branch: "codex-restore-consultation-funnel",
    Source: RELEASE_SHA.slice(0, 7),
    Deployment: PREVIEW_URL,
    Status: "1 minute ago",
  }];

  assert.deepEqual(
    validatePreviewDeploymentMetadata(PREVIEW_URL, RELEASE_SHA, records),
    {
      deploymentId: records[0].Id,
      source: RELEASE_SHA.slice(0, 7),
      failures: [],
    },
  );

  const result = await verifyPreviewDeploymentSource(PREVIEW_URL, {
    expectedCommit: RELEASE_SHA,
    projectName: "getgiffgaff",
    listDeployments: async ({ projectName }) => {
      assert.equal(projectName, "getgiffgaff");
      return records;
    },
  });
  assert.deepEqual(result.failures, []);
});

test("preview deployment metadata rejects stale, ambiguous and non-Preview records", () => {
  const stale = validatePreviewDeploymentMetadata(PREVIEW_URL, RELEASE_SHA, [{
    Id: "stale",
    Environment: "Production",
    Source: "89abcde",
    Deployment: PREVIEW_URL,
    Status: "Failure",
  }]);
  assert.match(stale.failures.join("\n"), /Environment Preview/);
  assert.match(stale.failures.join("\n"), /does not match expected release/);
  assert.match(stale.failures.join("\n"), /status is Failure/);

  const ambiguous = validatePreviewDeploymentMetadata(PREVIEW_URL, RELEASE_SHA, [
    { Deployment: PREVIEW_URL },
    { Deployment: `${PREVIEW_URL}/` },
  ]);
  assert.match(ambiguous.failures.join("\n"), /exactly one Preview record.*found 2/);
  assert.throws(
    () => validatePreviewDeploymentMetadata(PREVIEW_URL, "0123456", []),
    /full 40-character release SHA/,
  );
});

test("preview analytics probe sends a valid canary and requires an exact 404 isolation response", async () => {
  const requests = [];
  const fetchImpl = async (input, init) => {
    requests.push({ url: String(input), init });
    return new Response("Not found", {
      status: 404,
      headers: {
        "x-robots-tag": "noindex, nofollow, noarchive",
        "cache-control": "private, no-store",
      },
    });
  };

  const result = await probePreviewAnalyticsIsolation(
    "https://release-abc123.getgiffgaff.pages.dev",
    { fetchImpl, idFactory: () => "a".repeat(64) },
  );

  assert.equal(result.status, 404);
  assert.deepEqual(result.failures, []);
  assert.equal(requests.length, 1);
  assert.equal(
    requests[0].url,
    "https://release-abc123.getgiffgaff.pages.dev/analytics-event-v1",
  );
  assert.equal(requests[0].init.method, "POST");
  assert.equal(new Headers(requests[0].init.headers).get("origin"), CANONICAL_ORIGIN);
  assert.equal(
    new Headers(requests[0].init.headers).get("x-getgiffgaff-release-probe"),
    "seo_release_canary_v1",
  );
  assert.equal(
    new Headers(requests[0].init.headers).get("x-getgiffgaff-release-probe-id"),
    "a".repeat(64),
  );
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    version: "analytics_event_v1",
    path: "/",
    source: "direct",
    event: "page_view",
  });

  const unsafe = await probePreviewAnalyticsIsolation(
    "https://release-abc123.getgiffgaff.pages.dev",
    {
      fetchImpl: async () => new Response(null, {
        status: 204,
        headers: {
          "x-robots-tag": "noindex, nofollow, noarchive",
          "cache-control": "private, no-store",
        },
      }),
      idFactory: () => "b".repeat(64),
    },
  );
  assert.ok(unsafe.failures.some((message) => /expected 404, got 204/i.test(message)));
});

test("preview sitemap rejects a same-size pathname set with missing and unexpected routes", () => {
  const missingPathname = PUBLIC_INDEXABLE_PATHS[2];
  const unexpectedPathname = "/same-count-unexpected/";
  const pathnames = PUBLIC_INDEXABLE_PATHS.map((pathname) =>
    pathname === missingPathname ? unexpectedPathname : pathname,
  );
  const xml = `<urlset>${pathnames
    .map((pathname) => `<url><loc>${CANONICAL_ORIGIN}${pathname}</loc></url>`)
    .join("")}</urlset>`;

  const result = validatePreviewSitemap(xml, { status: 200 });

  assert.equal(result.urlCount, PUBLIC_INDEXABLE_PATHS.length);
  assert.ok(result.failures.some((message) => message.includes(`missing ${missingPathname}`)));
  assert.ok(result.failures.some((message) => message.includes(`unexpected ${unexpectedPathname}`)));
});

test("preview static asset validation checks owner QR MIME, bytes, and checksum", () => {
  const asset = OWNER_QR_ASSETS[0];
  const validBytes = Buffer.from("known owner qr fixture");
  const expectedSha256 = createHash("sha256").update(validBytes).digest("hex");
  const response = new Response(validBytes, {
    status: 200,
    headers: {
      "content-type": "text/plain",
      "x-robots-tag": "noindex, nofollow, noarchive",
      "cache-control": "private, no-store",
    },
  });

  const failures = validatePreviewStaticAsset(asset.pathname, response, validBytes, {
    ownerQrAssets: [{ ...asset, sha256: expectedSha256 }],
  });

  assert.ok(failures.some((message) => /image\/jpeg/i.test(message)));
});

test("preview provenance marker must equal the exact expected commit and reject extra fields", () => {
  const response = new Response(null, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-robots-tag": "noindex, nofollow, noarchive",
      "cache-control": "private, no-store",
    },
  });
  const valid = Buffer.from(`${JSON.stringify({
    schema: "getgiffgaff_release_provenance_v1",
    commit: RELEASE_SHA,
  })}\n`);
  assert.deepEqual(
    validatePreviewStaticAsset("/release-provenance.json", response, valid, {
      expectedCommit: RELEASE_SHA,
    }),
    [],
  );

  const stale = Buffer.from(JSON.stringify({
    schema: "getgiffgaff_release_provenance_v1",
    commit: "89abcdef0123456789abcdef0123456789abcdef",
  }));
  assert.match(
    validatePreviewStaticAsset("/release-provenance.json", response, stale, {
      expectedCommit: RELEASE_SHA,
    }).join("\n"),
    /does not equal expected release/,
  );

  const extra = Buffer.from(JSON.stringify({
    schema: "getgiffgaff_release_provenance_v1",
    commit: RELEASE_SHA,
    extra: true,
  }));
  assert.match(
    validatePreviewStaticAsset("/release-provenance.json", response, extra, {
      expectedCommit: RELEASE_SHA,
    }).join("\n"),
    /invalid release provenance payload/,
  );
  assert.throws(
    () => validatePreviewStaticAsset("/release-provenance.json", response, valid),
    /full 40-character release SHA/,
  );
});
