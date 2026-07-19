#!/usr/bin/env node

import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const CANONICAL_ORIGIN = "https://getgiffgaff.com";
const CLOUDFLARE_ACCOUNT_ID = "ab6289976235fa386fcddcddd7bf62c5";
const ANALYTICS_DATASET = "getgiffgaff_events_v1";
const ANALYTICS_SQL_ENDPOINT =
  `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/analytics_engine/sql`;
const ANALYTICS_EVENT_PATH = "/analytics-event-v1";
const ANALYTICS_RELEASE_PROBE_HEADER = "x-getgiffgaff-release-probe";
const ANALYTICS_RELEASE_PROBE_VALUE = "seo_release_canary_v1";
const ANALYTICS_RELEASE_PROBE_ID_HEADER = "x-getgiffgaff-release-probe-id";
const ANALYTICS_RELEASE_PROBE_INDEX = "seo_release_canary";
const ANALYTICS_RELEASE_PROBE_BLOB = "seo_release_canary";
const ANALYTICS_RELEASE_PROBE_PAYLOAD = Object.freeze({
  version: "analytics_event_v1",
  path: "/",
  source: "direct",
  event: "page_view",
});
const DEFAULT_ATTEMPTS = 8;
const DEFAULT_DELAY_MS = 1_000;
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_TOTAL_BUDGET_MS = 120_000;
const MAX_RETRY_DELAY_MS = 15_000;
const MAX_RETRY_AFTER_MS = 120_000;

class RetryableAnalyticsSqlError extends Error {
  constructor(message, { retryAfterMs } = {}) {
    super(message);
    this.name = "RetryableAnalyticsSqlError";
    this.retryAfterMs = retryAfterMs;
  }
}

function bearerToken(value) {
  const token = String(value || "").trim();
  if (!token || /[\r\n]/u.test(token)) {
    throw new Error("Cloudflare bearer credential is missing or malformed");
  }
  return token;
}

function probeId(value) {
  const id = String(value || "").trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/u.test(id)) {
    throw new Error("Analytics persistence probe ID must contain 256 bits of hexadecimal entropy");
  }
  return id;
}

function privateNoStore(response) {
  const cacheControl = response.headers.get("cache-control") || "";
  const robots = response.headers.get("x-robots-tag") || "";
  return /\bprivate\b/iu.test(cacheControl)
    && /\bno-store\b/iu.test(cacheControl)
    && /\bnoindex\b/iu.test(robots)
    && /\bnofollow\b/iu.test(robots)
    && /\bnoarchive\b/iu.test(robots);
}

export function resolveWranglerBearerToken({
  cwd = ROOT,
  env = process.env,
  spawnImpl = spawn,
} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawnImpl(
      "npx",
      ["--no-install", "wrangler", "auth", "token", "--json"],
      { cwd, env, stdio: ["ignore", "pipe", "inherit"] },
    );
    const stdout = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code !== 0) {
        reject(new Error(
          `Could not obtain Cloudflare credentials from the local Wrangler login (${signal ? `signal ${signal}` : `exit code ${code}`})`,
        ));
        return;
      }
      let credentials;
      try {
        credentials = JSON.parse(Buffer.concat(stdout).toString("utf8"));
      } catch (error) {
        reject(new Error(`Could not parse Wrangler authentication metadata: ${error.message}`));
        return;
      }
      if (!new Set(["oauth", "api_token"]).has(credentials?.type)) {
        reject(new Error(
          `Analytics SQL verification requires a bearer credential; Wrangler reported ${credentials?.type || "an unsupported authentication type"}`,
        ));
        return;
      }
      try {
        resolve(bearerToken(credentials.token));
      } catch (error) {
        reject(error);
      }
    });
  });
}

export async function verifyWranglerAccount({
  cwd = ROOT,
  env = process.env,
  runCommand = (command, args, options) => new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: ["ignore", "pipe", "inherit"] });
    const stdout = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.once("error", reject);
    child.once("exit", (code) => (
      code === 0
        ? resolve({ stdout: Buffer.concat(stdout).toString("utf8") })
        : reject(new Error(`Wrangler account lookup failed with exit code ${code}`))
    ));
  }),
} = {}) {
  const result = await runCommand(
    "npx",
    ["--no-install", "wrangler", "whoami", "--json"],
    { cwd, env },
  );
  let identity;
  try {
    identity = JSON.parse(String(result?.stdout || ""));
  } catch (error) {
    throw new Error(`Could not parse Wrangler account metadata: ${error.message}`);
  }
  const accounts = Array.isArray(identity?.accounts) ? identity.accounts : [];
  if (!identity?.loggedIn || !accounts.some(({ id }) => id === CLOUDFLARE_ACCOUNT_ID)) {
    throw new Error(`Wrangler login does not have access to Cloudflare account ${CLOUDFLARE_ACCOUNT_ID}`);
  }
  return { accountId: CLOUDFLARE_ACCOUNT_ID };
}

export function analyticsPersistenceSql(releaseProbeId) {
  const id = probeId(releaseProbeId);
  return [
    "SELECT blob5 AS probe_id, SUM(_sample_interval * double1) AS events",
    `FROM ${ANALYTICS_DATASET}`,
    "WHERE timestamp >= NOW() - INTERVAL '15' MINUTE",
    `  AND index1 = '${ANALYTICS_RELEASE_PROBE_INDEX}'`,
    `  AND blob4 = '${ANALYTICS_RELEASE_PROBE_BLOB}'`,
    `  AND blob5 = '${id}'`,
    "GROUP BY blob5",
    "LIMIT 1",
    "FORMAT JSON",
  ].join("\n");
}

export function validateAnalyticsSqlResponse(response, payload, { releaseProbeId } = {}) {
  const id = probeId(releaseProbeId);
  const contentType = response?.headers?.get("content-type") || "";
  const mime = contentType.toLowerCase().split(";", 1)[0].trim();
  if (response?.status !== 200) {
    throw new Error(`Analytics SQL API returned status ${response?.status ?? "missing"}`);
  }
  if (mime !== "application/json") {
    throw new Error(`Analytics SQL API returned ${contentType || "a missing Content-Type"}, expected application/json`);
  }
  if (
    !payload ||
    Array.isArray(payload) ||
    typeof payload !== "object" ||
    !Array.isArray(payload.meta) ||
    !Array.isArray(payload.data) ||
    !Number.isSafeInteger(payload.rows) ||
    payload.rows < 0 ||
    payload.rows !== payload.data.length
  ) {
    throw new Error("Analytics SQL API returned an invalid JSON result shape");
  }
  const columns = payload.meta.map((column) => (
    column && typeof column === "object" && !Array.isArray(column)
      ? { name: column.name, type: column.type }
      : null
  ));
  if (
    columns.length !== 2 ||
    columns[0]?.name !== "probe_id" ||
    columns[1]?.name !== "events" ||
    typeof columns[0]?.type !== "string" ||
    !columns[0].type ||
    typeof columns[1]?.type !== "string" ||
    !columns[1].type
  ) {
    throw new Error("Analytics SQL API returned unexpected column metadata");
  }
  if (payload.data.length === 0) {
    throw new RetryableAnalyticsSqlError(
      "Analytics persistence probe is not queryable yet (matching rows: 0)",
    );
  }
  if (payload.data.length !== 1) {
    throw new Error(`Analytics SQL API returned an impossible matching row count: ${payload.data.length}`);
  }
  const row = payload.data[0];
  const rowKeys = row && typeof row === "object" && !Array.isArray(row)
    ? Object.keys(row).sort().join(",")
    : "";
  const events = row?.events;
  if (
    rowKeys !== "events,probe_id" ||
    row?.probe_id !== id ||
    typeof events !== "number" ||
    !Number.isFinite(events) ||
    events <= 0
  ) {
    throw new Error("Analytics SQL API did not return the exact persisted release probe");
  }
  return { events };
}

export function retryAfterMilliseconds(value, { nowMs = Date.now() } = {}) {
  const raw = String(value || "").trim();
  if (!raw) return undefined;
  let milliseconds;
  if (/^\d+(?:\.\d+)?$/u.test(raw)) {
    milliseconds = Math.ceil(Number(raw) * 1_000);
  } else {
    const retryAt = Date.parse(raw);
    if (!Number.isFinite(retryAt)) return undefined;
    milliseconds = Math.max(0, retryAt - nowMs);
  }
  if (!Number.isSafeInteger(milliseconds) || milliseconds < 0) return undefined;
  if (milliseconds > MAX_RETRY_AFTER_MS) {
    throw new Error(
      `Analytics SQL API Retry-After exceeds the ${MAX_RETRY_AFTER_MS / 1_000}-second release budget`,
    );
  }
  return milliseconds;
}

function retryDelayMilliseconds({ attempt, delayMs, retryAfterMs, jitterFactory }) {
  const backoff = retryAfterMs ?? Math.min(
    MAX_RETRY_DELAY_MS,
    delayMs * (2 ** Math.max(0, attempt - 1)),
  );
  const jitterSample = Number(jitterFactory());
  if (!Number.isFinite(jitterSample) || jitterSample < 0 || jitterSample >= 1) {
    throw new TypeError("Analytics persistence jitter must be a number from 0 (inclusive) to 1 (exclusive)");
  }
  const jitter = Math.floor(jitterSample * Math.min(1_000, Math.ceil(backoff * 0.2)));
  return backoff + jitter;
}

function currentTimeMilliseconds(nowFactory) {
  const nowMs = Number(nowFactory());
  if (!Number.isFinite(nowMs)) {
    throw new TypeError("Analytics persistence clock must return a finite millisecond timestamp");
  }
  return nowMs;
}

function remainingBudgetMilliseconds(deadlineMs, nowFactory, totalBudgetMs) {
  const remainingMs = Math.floor(deadlineMs - currentTimeMilliseconds(nowFactory));
  if (remainingMs < 1) {
    throw new Error(
      `Analytics persistence exceeded its ${totalBudgetMs}-millisecond total release budget`,
    );
  }
  return remainingMs;
}

async function queryPersistedProbe({
  token,
  releaseProbeId,
  fetchImpl,
  timeoutMs,
  nowMs,
}) {
  let response;
  try {
    response = await fetchImpl(ANALYTICS_SQL_ENDPOINT, {
      method: "POST",
      redirect: "manual",
      cache: "no-store",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${bearerToken(token)}`,
        "content-type": "text/plain; charset=utf-8",
      },
      body: analyticsPersistenceSql(releaseProbeId),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    throw new RetryableAnalyticsSqlError(
      `Analytics SQL API request failed before a response: ${error?.name || "network error"}`,
    );
  }
  if (response.status === 429) {
    throw new RetryableAnalyticsSqlError("Analytics SQL API rate limited the release probe", {
      retryAfterMs: retryAfterMilliseconds(response.headers.get("retry-after"), { nowMs }),
    });
  }
  if (new Set([500, 502, 503, 504]).has(response.status)) {
    throw new RetryableAnalyticsSqlError(`Analytics SQL API returned transient status ${response.status}`);
  }
  if (response.status !== 200) {
    throw new Error(`Analytics SQL API returned permanent status ${response.status}`);
  }
  let raw;
  try {
    raw = await response.text();
  } catch (error) {
    throw new RetryableAnalyticsSqlError(
      `Analytics SQL API response body failed in transit: ${error?.name || "network error"}`,
    );
  }
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Analytics SQL API returned invalid JSON: ${error.message}`);
  }
  return validateAnalyticsSqlResponse(response, payload, { releaseProbeId });
}

export async function verifyAnalyticsPersistence({
  fetchImpl = globalThis.fetch,
  resolveToken = resolveWranglerBearerToken,
  verifyAccount = verifyWranglerAccount,
  delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  idFactory = () => randomBytes(32).toString("hex"),
  jitterFactory = Math.random,
  nowFactory = Date.now,
  attempts = DEFAULT_ATTEMPTS,
  delayMs = DEFAULT_DELAY_MS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  totalBudgetMs = DEFAULT_TOTAL_BUDGET_MS,
} = {}) {
  if (!Number.isSafeInteger(attempts) || attempts < 1 || attempts > 20) {
    throw new TypeError("Analytics persistence attempts must be an integer from 1 through 20");
  }
  if (!Number.isSafeInteger(delayMs) || delayMs < 0 || delayMs > 30_000) {
    throw new TypeError("Analytics persistence retry delay must be from 0 through 30000 milliseconds");
  }
  if (!Number.isSafeInteger(totalBudgetMs) || totalBudgetMs < 1 || totalBudgetMs > 120_000) {
    throw new TypeError("Analytics persistence total budget must be from 1 through 120000 milliseconds");
  }
  await verifyAccount();
  const token = bearerToken(await resolveToken());
  const releaseProbeId = probeId(idFactory());
  const deadlineMs = currentTimeMilliseconds(nowFactory) + totalBudgetMs;
  const canaryUrl = `${CANONICAL_ORIGIN}${ANALYTICS_EVENT_PATH}`;
  const canaryResponse = await fetchImpl(canaryUrl, {
    method: "POST",
    redirect: "manual",
    cache: "no-store",
    headers: {
      accept: "*/*",
      "content-type": "application/json",
      origin: CANONICAL_ORIGIN,
      [ANALYTICS_RELEASE_PROBE_HEADER]: ANALYTICS_RELEASE_PROBE_VALUE,
      [ANALYTICS_RELEASE_PROBE_ID_HEADER]: releaseProbeId,
    },
    body: JSON.stringify(ANALYTICS_RELEASE_PROBE_PAYLOAD),
    signal: AbortSignal.timeout(Math.min(
      timeoutMs,
      remainingBudgetMilliseconds(deadlineMs, nowFactory, totalBudgetMs),
    )),
  });
  remainingBudgetMilliseconds(deadlineMs, nowFactory, totalBudgetMs);
  if (canaryResponse.status !== 204 || !privateNoStore(canaryResponse)) {
    throw new Error(
      `Production analytics persistence probe was not accepted safely (status ${canaryResponse.status})`,
    );
  }

  let lastFailure = "no SQL response";
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const remainingBeforeRequest = remainingBudgetMilliseconds(
      deadlineMs,
      nowFactory,
      totalBudgetMs,
    );
    try {
      const result = await queryPersistedProbe({
        token,
        releaseProbeId,
        fetchImpl,
        timeoutMs: Math.min(timeoutMs, remainingBeforeRequest),
        nowMs: currentTimeMilliseconds(nowFactory),
      });
      remainingBudgetMilliseconds(deadlineMs, nowFactory, totalBudgetMs);
      return {
        accountId: CLOUDFLARE_ACCOUNT_ID,
        dataset: ANALYTICS_DATASET,
        persisted: true,
        queryAttempts: attempt,
        weightedEvents: result.events,
      };
    } catch (error) {
      lastFailure = error.message;
      if (!(error instanceof RetryableAnalyticsSqlError)) throw error;
      if (attempt < attempts) {
        const remainingBeforeDelay = remainingBudgetMilliseconds(
          deadlineMs,
          nowFactory,
          totalBudgetMs,
        );
        const requestedDelay = retryDelayMilliseconds({
          attempt,
          delayMs,
          retryAfterMs: error.retryAfterMs,
          jitterFactory,
        });
        await delay(Math.min(requestedDelay, remainingBeforeDelay));
      }
    }
  }
  throw new Error(
    `Analytics release probe was accepted but not queryable after ${attempts} SQL attempt${attempts === 1 ? "" : "s"}: ${lastFailure}`,
  );
}

export async function runAnalyticsPersistenceCli({
  verify = verifyAnalyticsPersistence,
  write = (value) => process.stdout.write(value),
} = {}) {
  const report = await verify();
  write(`${JSON.stringify(report)}\n`);
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  runAnalyticsPersistenceCli().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
