import { createHash, randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import {
  PUBLIC_INDEXABLE_PATHS,
  PUBLIC_STATIC_ASSET_PATHS,
  ROUTE_MANIFEST,
} from "../public/route-manifest.js";

const CANONICAL_ORIGIN = "https://getgiffgaff.com";
const DEFAULT_PROJECT_NAME = "getgiffgaff";
const MAX_ATTEMPTS = 4;
const execFileAsync = promisify(execFile);
const ANALYTICS_EVENT_PATH = "/analytics-event-v1";
const ANALYTICS_PREVIEW_EXPECTED_STATUS = 404;
const ANALYTICS_RELEASE_PROBE_HEADER = "x-getgiffgaff-release-probe";
const ANALYTICS_RELEASE_PROBE_VALUE = "seo_release_canary_v1";
const ANALYTICS_RELEASE_PROBE_ID_HEADER = "x-getgiffgaff-release-probe-id";
const ANALYTICS_RELEASE_PROBE_PAYLOAD = Object.freeze({
  version: "analytics_event_v1",
  path: "/",
  source: "direct",
  event: "page_view",
});
export const OWNER_QR_ASSETS = Object.freeze([
  Object.freeze({
    pathname: "/contact/wechat-qr.jpg",
    sha256: "751f8055949c3ee5d13a69dae6eef3aeef925a9e6f8dda1ca00b48e0399e1b43",
  }),
  Object.freeze({
    pathname: "/contact/telegram-qr.jpg",
    sha256: "9a6ed7d1e30acc7dc35d2dabe2e1078cd2cd0b3ceaecd7bf1d716fa5c1b1b3fa",
  }),
]);
const RELEASE_PROVENANCE_PATH = "/release-provenance.json";
const RELEASE_PROVENANCE_SCHEMA = "getgiffgaff_release_provenance_v1";

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

function fullCommitSha(value) {
  const sha = String(value || "").trim().toLowerCase();
  if (!/^[0-9a-f]{40}$/u.test(sha)) {
    throw new Error("--expected-commit must be the full 40-character release SHA");
  }
  return sha;
}

function normalizedDeploymentUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "").toLowerCase();
}

export function validatePreviewDeploymentMetadata(baseUrl, expectedCommit, deployments) {
  const base = normalizedDeploymentUrl(baseUrl);
  const expectedSha = fullCommitSha(expectedCommit);
  const records = Array.isArray(deployments) ? deployments : [];
  const matching = records.filter(
    (record) => normalizedDeploymentUrl(record?.Deployment) === base,
  );
  const failures = [];

  if (matching.length !== 1) {
    failures.push(
      `deployment metadata: expected exactly one Preview record for ${base}, found ${matching.length}`,
    );
    return { deploymentId: "", source: "", failures };
  }

  const record = matching[0];
  const environment = String(record?.Environment || "").trim();
  const source = String(record?.Source || "").trim().toLowerCase();
  const deploymentId = String(record?.Id || "").trim();
  if (environment !== "Preview") {
    failures.push(`deployment metadata: expected Environment Preview, got ${environment || "missing"}`);
  }
  if (!/^[0-9a-f]{7,40}$/u.test(source)) {
    failures.push(`deployment metadata: invalid Source ${source || "missing"}`);
  } else if (!expectedSha.startsWith(source)) {
    failures.push(
      `deployment metadata: Source ${source} does not match expected release ${expectedSha}`,
    );
  }
  if (!deploymentId) failures.push("deployment metadata: missing deployment Id");
  if (String(record?.Status || "").trim() === "Failure") {
    failures.push("deployment metadata: deployment status is Failure");
  }

  return { deploymentId, source, failures };
}

export async function listCloudflarePreviewDeployments({
  projectName = DEFAULT_PROJECT_NAME,
  execFileImpl = execFileAsync,
  writeStderr = (value) => process.stderr.write(value),
} = {}) {
  const { stdout, stderr } = await execFileImpl(
    "npx",
    [
      "--no-install",
      "wrangler",
      "pages",
      "deployment",
      "list",
      "--project-name",
      projectName,
      "--environment",
      "preview",
      "--json",
    ],
    { maxBuffer: 4 * 1024 * 1024 },
  );
  if (String(stderr || "").trim()) {
    writeStderr(String(stderr));
  }
  let deployments;
  try {
    deployments = JSON.parse(stdout);
  } catch (error) {
    throw new Error(`Could not parse Cloudflare Preview deployment metadata: ${error.message}`);
  }
  if (!Array.isArray(deployments)) {
    throw new Error("Cloudflare Preview deployment metadata is not an array");
  }
  return deployments;
}

export async function verifyPreviewDeploymentSource(baseUrl, {
  expectedCommit,
  projectName = DEFAULT_PROJECT_NAME,
  listDeployments = listCloudflarePreviewDeployments,
} = {}) {
  const expectedSha = fullCommitSha(expectedCommit);
  const deployments = await listDeployments({ projectName });
  return validatePreviewDeploymentMetadata(baseUrl, expectedSha, deployments);
}

function attribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(tag).match(
    new RegExp(`\\b${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"),
  );
  return match ? match[1] ?? match[2] ?? match[3] ?? "" : "";
}

function canonicalHref(html) {
  for (const tag of String(html).match(/<link\b[^>]*>/gi) || []) {
    if (attribute(tag, "rel").toLowerCase().split(/\s+/).includes("canonical")) {
      return attribute(tag, "href");
    }
  }
  return "";
}

function ogUrl(html) {
  for (const tag of String(html).match(/<meta\b[^>]*>/gi) || []) {
    if (attribute(tag, "property").toLowerCase() === "og:url") {
      return attribute(tag, "content");
    }
  }
  return "";
}

function commerceWidgetCount(html) {
  return (
    String(html).match(
      /<aside\b(?=[^>]*\bdata-growth-slot=["']wechat-buying-guide-v1["'])[^>]*>/gi,
    ) || []
  ).length;
}

function hasPrivatePreviewPolicy(response) {
  const robots = response.headers.get("x-robots-tag")?.toLowerCase() || "";
  const cache = response.headers.get("cache-control")?.toLowerCase() || "";
  return (
    robots.includes("noindex") &&
    robots.includes("nofollow") &&
    robots.includes("noarchive") &&
    cache.includes("private") &&
    cache.includes("no-store")
  );
}

function decodeEntities(value) {
  return String(value).replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
}

function extractSitemapUrls(xml) {
  return Array.from(
    String(xml).matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc>/gi),
    (match) => decodeEntities(match[1].trim()),
  );
}

export function validatePreviewSitemap(xml, {
  status,
  canonicalOrigin = CANONICAL_ORIGIN,
  indexablePaths = PUBLIC_INDEXABLE_PATHS,
} = {}) {
  const urls = extractSitemapUrls(xml);
  const uniqueUrls = [...new Set(urls)];
  const expectedUrls = indexablePaths.map((pathname) => `${canonicalOrigin}${pathname}`);
  const expectedSet = new Set(expectedUrls);
  const actualSet = new Set(uniqueUrls);
  const failures = [];

  if (status !== 200) failures.push(`/sitemap.xml: expected status 200, got ${status}`);
  if (urls.length !== indexablePaths.length) {
    failures.push(`/sitemap.xml: expected ${indexablePaths.length} URLs, got ${urls.length}`);
  }
  if (uniqueUrls.length !== indexablePaths.length) {
    failures.push(`/sitemap.xml: expected ${indexablePaths.length} unique URLs, got ${uniqueUrls.length}`);
  }
  for (const expectedUrl of expectedUrls) {
    if (!actualSet.has(expectedUrl)) {
      failures.push(`/sitemap.xml: missing ${new URL(expectedUrl).pathname}`);
    }
  }
  for (const actualUrl of actualSet) {
    if (expectedSet.has(actualUrl)) continue;
    let label = actualUrl;
    try {
      const parsed = new URL(actualUrl);
      label = parsed.origin === canonicalOrigin ? parsed.pathname : actualUrl;
    } catch {
      // Keep the invalid value in the failure message.
    }
    failures.push(`/sitemap.xml: unexpected ${label}`);
  }

  return { urls, uniqueUrls, urlCount: urls.length, failures };
}

export function validatePreviewStaticAsset(pathname, response, bytes, {
  ownerQrAssets = OWNER_QR_ASSETS,
  expectedCommit,
} = {}) {
  const failures = [];
  const byteLength = bytes?.byteLength ?? 0;
  if (response.status !== 200 || byteLength === 0) {
    failures.push(`${pathname}: asset ${response.status}, ${byteLength} bytes`);
  }
  if (response.redirected) {
    failures.push(`${pathname}: asset followed an unexpected redirect`);
  }
  if (!hasPrivatePreviewPolicy(response)) {
    failures.push(`${pathname}: preview asset policy is not private`);
  }

  const ownerQr = ownerQrAssets.find((asset) => asset.pathname === pathname);
  if (ownerQr) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.toLowerCase().split(";", 1)[0].trim() !== "image/jpeg") {
      failures.push(`${pathname}: expected Content-Type image/jpeg, got ${contentType || "missing"}`);
    }
    if (byteLength > 0) {
      const sha256 = createHash("sha256").update(new Uint8Array(bytes)).digest("hex");
      if (sha256 !== ownerQr.sha256) {
        failures.push(`${pathname}: SHA-256 mismatch, got ${sha256}`);
      }
    }
  }

  if (pathname === RELEASE_PROVENANCE_PATH) {
    const expectedSha = fullCommitSha(expectedCommit);
    const contentType = response.headers.get("content-type") || "";
    if (contentType.toLowerCase().split(";", 1)[0].trim() !== "application/json") {
      failures.push(`${pathname}: expected Content-Type application/json, got ${contentType || "missing"}`);
    }
    if (byteLength > 512) failures.push(`${pathname}: provenance response is too large`);
    if (byteLength > 0) {
      try {
        const payload = JSON.parse(new TextDecoder().decode(bytes));
        if (
          !payload
          || Array.isArray(payload)
          || typeof payload !== "object"
          || Object.keys(payload).sort().join(",") !== "commit,schema"
          || payload.schema !== RELEASE_PROVENANCE_SCHEMA
          || !/^[0-9a-f]{40}$/u.test(payload.commit || "")
        ) {
          failures.push(`${pathname}: invalid release provenance payload`);
        } else if (payload.commit !== expectedSha) {
          failures.push(
            `${pathname}: provenance commit ${payload.commit} does not equal expected release ${expectedSha}`,
          );
        }
      } catch (error) {
        failures.push(`${pathname}: invalid release provenance JSON: ${error.message}`);
      }
    }
  }

  return failures;
}

export async function probePreviewAnalyticsIsolation(baseUrl, {
  fetchImpl = globalThis.fetch,
  timeoutMs = 15_000,
  idFactory = () => randomBytes(32).toString("hex"),
} = {}) {
  const url = `${String(baseUrl).replace(/\/+$/, "")}${ANALYTICS_EVENT_PATH}`;
  const releaseProbeId = String(idFactory()).trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/u.test(releaseProbeId)) {
    throw new Error("Analytics release probe ID must contain 256 bits of hexadecimal entropy");
  }
  const failures = [];
  let response;

  try {
    const init = {
      method: "POST",
      redirect: "manual",
      headers: {
        "content-type": "application/json",
        origin: CANONICAL_ORIGIN,
        [ANALYTICS_RELEASE_PROBE_HEADER]: ANALYTICS_RELEASE_PROBE_VALUE,
        [ANALYTICS_RELEASE_PROBE_ID_HEADER]: releaseProbeId,
      },
      body: JSON.stringify(ANALYTICS_RELEASE_PROBE_PAYLOAD),
    };
    if (timeoutMs && typeof AbortSignal?.timeout === "function") {
      init.signal = AbortSignal.timeout(timeoutMs);
    }
    response = await fetchImpl(url, init);
  } catch (error) {
    failures.push(`${ANALYTICS_EVENT_PATH}: isolation probe failed: ${error.message}`);
    return { status: null, failures };
  }

  if (response.status !== ANALYTICS_PREVIEW_EXPECTED_STATUS) {
    failures.push(
      `${ANALYTICS_EVENT_PATH}: expected ${ANALYTICS_PREVIEW_EXPECTED_STATUS}, got ${response.status}`,
    );
  }
  if (!hasPrivatePreviewPolicy(response)) {
    failures.push(`${ANALYTICS_EVENT_PATH}: preview policy is not private`);
  }

  return { status: response.status, failures };
}

async function fetchWithPropagationRetry(url, init, {
  fetchImpl = globalThis.fetch,
  delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
  let response;
  let error;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      response = await fetchImpl(url, {
        ...init,
        redirect: "manual",
        signal: AbortSignal.timeout(15_000),
      });
      if (response.status !== 404 || attempt === MAX_ATTEMPTS) return response;
    } catch (caught) {
      error = caught;
      if (attempt === MAX_ATTEMPTS) throw caught;
    }
    await delay(750 * attempt);
  }
  if (response) return response;
  throw error || new Error(`Unable to fetch ${url}`);
}

export async function verifyPreviewRelease(baseUrl, {
  expectedCommit,
  projectName = DEFAULT_PROJECT_NAME,
  listDeployments = listCloudflarePreviewDeployments,
  fetchImpl = globalThis.fetch,
  delay,
  nonceFactory = () => randomBytes(32).toString("hex"),
} = {}) {
  const base = String(baseUrl || "").replace(/\/+$/, "");
  if (!/^https:\/\/[0-9a-f]{8}\.getgiffgaff\.pages\.dev$/i.test(base)) {
    throw new Error("--base-url must be an https://<deployment-id>.getgiffgaff.pages.dev URL");
  }
  const expectedSha = fullCommitSha(expectedCommit);
  const fetchOptions = { fetchImpl, delay };

  const failures = [];
  const deployment = await verifyPreviewDeploymentSource(base, {
    expectedCommit: expectedSha,
    projectName,
    listDeployments,
  });
  failures.push(...deployment.failures);
  for (const pathname of Object.keys(ROUTE_MANIFEST)) {
    const response = await fetchWithPropagationRetry(`${base}${pathname}`, undefined, fetchOptions);
    const html = await response.text();
    if (response.status !== 200) failures.push(`${pathname}: GET ${response.status}`);
    if (canonicalHref(html) !== `${CANONICAL_ORIGIN}${pathname}`) {
      failures.push(`${pathname}: canonical ${canonicalHref(html) || "missing"}`);
    }
    if (ogUrl(html) !== `${CANONICAL_ORIGIN}${pathname}`) {
      failures.push(`${pathname}: og:url ${ogUrl(html) || "missing"}`);
    }
    if (commerceWidgetCount(html) !== 1) {
      failures.push(`${pathname}: buying-guide widget count ${commerceWidgetCount(html)}`);
    }
    if (!hasPrivatePreviewPolicy(response)) {
      failures.push(`${pathname}: preview indexing/cache policy is not private`);
    }

    const head = await fetchWithPropagationRetry(`${base}${pathname}`, { method: "HEAD" }, fetchOptions);
    if (head.status !== 200) failures.push(`${pathname}: HEAD ${head.status}`);
    if (!hasPrivatePreviewPolicy(head)) {
      failures.push(`${pathname}: HEAD preview policy is not private`);
    }
  }

  for (const pathname of PUBLIC_STATIC_ASSET_PATHS) {
    const assetUrl = new URL(pathname, `${base}/`);
    if (pathname === RELEASE_PROVENANCE_PATH) {
      const nonce = String(nonceFactory()).toLowerCase();
      if (!/^[0-9a-f]{64}$/u.test(nonce)) {
        throw new Error("Release provenance probe nonce must contain 256 bits of hexadecimal entropy");
      }
      assetUrl.searchParams.set(
        "release_provenance_probe",
        nonce,
      );
    }
    const response = await fetchWithPropagationRetry(assetUrl.href, undefined, fetchOptions);
    const bytes = await response.arrayBuffer();
    failures.push(...validatePreviewStaticAsset(pathname, response, bytes, {
      expectedCommit: expectedSha,
    }));
  }

  const sitemap = await fetchWithPropagationRetry(`${base}/sitemap.xml`, undefined, fetchOptions);
  const sitemapXml = await sitemap.text();
  const sitemapResult = validatePreviewSitemap(sitemapXml, { status: sitemap.status });
  failures.push(...sitemapResult.failures);
  if (!hasPrivatePreviewPolicy(sitemap)) {
    failures.push("/sitemap.xml: preview policy is not private");
  }

  for (const pathname of ["/__preview-404-probe__/", "/growth-assets/not-real.js"]) {
    const response = await fetchWithPropagationRetry(`${base}${pathname}`, undefined, fetchOptions);
    const html = await response.text();
    if (response.status !== 404) failures.push(`${pathname}: expected 404, got ${response.status}`);
    if (canonicalHref(html) || ogUrl(html)) failures.push(`${pathname}: error carries canonical metadata`);
    if (!hasPrivatePreviewPolicy(response)) failures.push(`${pathname}: error policy is not private`);
  }

  const retired = await fetchWithPropagationRetry(`${base}/llms-full.txt`, undefined, fetchOptions);
  if (retired.status !== 410) failures.push(`/llms-full.txt: expected 410, got ${retired.status}`);
  if (!hasPrivatePreviewPolicy(retired)) failures.push("/llms-full.txt: policy is not private");

  const analytics = await probePreviewAnalyticsIsolation(base, { fetchImpl });
  failures.push(...analytics.failures);

  return {
    baseUrl: base,
    deploymentId: deployment.deploymentId,
    deploymentSource: deployment.source,
    routes: Object.keys(ROUTE_MANIFEST).length,
    assets: PUBLIC_STATIC_ASSET_PATHS.length,
    sitemapUrls: sitemapResult.urlCount,
    analyticsStatus: analytics.status,
    failures,
  };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const baseUrl = option("--base-url") || process.env.PREVIEW_BASE_URL;
  const expectedCommit = option("--expected-commit") || process.env.PREVIEW_EXPECTED_COMMIT;
  const projectName = option("--project-name") || process.env.CLOUDFLARE_PAGES_PROJECT || DEFAULT_PROJECT_NAME;
  try {
    const report = await verifyPreviewRelease(baseUrl, { expectedCommit, projectName });
    process.stdout.write(`${JSON.stringify(report)}\n`);
    if (report.failures.length) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error?.stack || error}\n`);
    process.exitCode = 1;
  }
}
