import assert from "node:assert/strict";
import test from "node:test";

import {
  analyticsPersistenceSql,
  retryAfterMilliseconds,
  validateAnalyticsSqlResponse,
  verifyAnalyticsPersistence,
} from "../scripts/verify-analytics-persistence.mjs";

const PROBE_ID = "a".repeat(64);

function acceptedCanary() {
  return new Response(null, {
    status: 204,
    headers: {
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex, nofollow, noarchive",
    },
  });
}

function sqlResponse(data, status = 200) {
  return new Response(JSON.stringify({
    meta: [
      { name: "probe_id", type: "String" },
      { name: "events", type: "Float64" },
    ],
    data,
    rows: data.length,
  }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("analytics persistence uses an isolated index and waits for its exact probe row", async () => {
  const calls = [];
  let sqlReads = 0;
  const report = await verifyAnalyticsPersistence({
    resolveToken: async () => "TOKEN_FIXTURE",
    verifyAccount: async () => ({ accountId: "ab6289976235fa386fcddcddd7bf62c5" }),
    idFactory: () => PROBE_ID,
    delay: async () => {},
    jitterFactory: () => 0,
    attempts: 3,
    delayMs: 0,
    fetchImpl: async (input, init) => {
      calls.push({ url: String(input), init });
      if (String(input).endsWith("/analytics-event-v1")) return acceptedCanary();
      sqlReads += 1;
      return sqlReads === 1
        ? sqlResponse([])
        : sqlResponse([{ probe_id: PROBE_ID, events: 1 }]);
    },
  });

  assert.deepEqual(report, {
    accountId: "ab6289976235fa386fcddcddd7bf62c5",
    dataset: "getgiffgaff_events_v1",
    persisted: true,
    queryAttempts: 2,
    weightedEvents: 1,
  });
  assert.equal(calls.length, 3);
  const canaryHeaders = new Headers(calls[0].init.headers);
  assert.equal(canaryHeaders.get("x-getgiffgaff-release-probe-id"), PROBE_ID);
  assert.equal(calls[0].init.redirect, "manual");
  assert.equal(calls[0].init.cache, "no-store");
  for (const sqlCall of calls.slice(1)) {
    const headers = new Headers(sqlCall.init.headers);
    assert.equal(headers.get("authorization"), "Bearer TOKEN_FIXTURE");
    assert.equal(headers.get("content-type"), "text/plain; charset=utf-8");
    assert.match(
      sqlCall.init.body,
      new RegExp(`index1 = 'seo_release_canary:${PROBE_ID}'`),
    );
    assert.match(sqlCall.init.body, new RegExp(`blob5 = '${PROBE_ID}'`));
    assert.match(sqlCall.init.body, /FORMAT JSON$/);
  }
});

test("analytics SQL validation rejects missing, wrong and malformed persistence results", () => {
  const response = sqlResponse([]);
  assert.throws(
    () => validateAnalyticsSqlResponse(response, {
      meta: [
        { name: "probe_id", type: "String" },
        { name: "events", type: "Float64" },
      ],
      data: [],
      rows: 0,
    }, { releaseProbeId: PROBE_ID }),
    /not queryable yet/,
  );
  assert.throws(
    () => validateAnalyticsSqlResponse(response, {
      meta: [
        { name: "probe_id", type: "String" },
        { name: "events", type: "Float64" },
      ],
      data: [{ probe_id: "b".repeat(64), events: 1 }],
      rows: 1,
    }, { releaseProbeId: PROBE_ID }),
    /exact persisted release probe/,
  );
  assert.throws(
    () => validateAnalyticsSqlResponse(
      new Response("bad", { status: 401, headers: { "content-type": "application/json" } }),
      { data: [] },
      { releaseProbeId: PROBE_ID },
    ),
    /status 401/,
  );
  assert.throws(() => analyticsPersistenceSql("short"), /256 bits/);
});

test("analytics SQL validation enforces the documented FORMAT JSON contract", () => {
  const response = sqlResponse([{ probe_id: PROBE_ID, events: 1 }]);
  const base = {
    meta: [
      { name: "probe_id", type: "String" },
      { name: "events", type: "Float64" },
    ],
    data: [{ probe_id: PROBE_ID, events: 1 }],
    rows: 1,
  };

  for (const payload of [
    { data: base.data, rows: 1 },
    { ...base, meta: "invalid" },
    { ...base, rows: 0 },
    { ...base, rows: "1" },
    { ...base, meta: [{ name: "events", type: "Float64" }] },
  ]) {
    assert.throws(
      () => validateAnalyticsSqlResponse(response, payload, { releaseProbeId: PROBE_ID }),
      /invalid JSON result shape|unexpected column metadata/,
    );
  }
  assert.throws(
    () => validateAnalyticsSqlResponse(response, {
      ...base,
      data: [{ probe_id: PROBE_ID, events: "1" }],
    }, { releaseProbeId: PROBE_ID }),
    /exact persisted release probe/,
  );
  assert.throws(
    () => validateAnalyticsSqlResponse(response, {
      ...base,
      data: [{ probe_id: PROBE_ID, events: 1, extra: true }],
    }, { releaseProbeId: PROBE_ID }),
    /exact persisted release probe/,
  );
});

test("analytics persistence fails closed when HTTP acceptance is unsafe or SQL never sees the row", async () => {
  await assert.rejects(
    () => verifyAnalyticsPersistence({
      resolveToken: async () => "TOKEN_FIXTURE",
      verifyAccount: async () => ({ accountId: "ab6289976235fa386fcddcddd7bf62c5" }),
      idFactory: () => PROBE_ID,
      attempts: 1,
      delayMs: 0,
      fetchImpl: async () => new Response(null, { status: 204 }),
    }),
    /not accepted safely/,
  );

  await assert.rejects(
    () => verifyAnalyticsPersistence({
      resolveToken: async () => "TOKEN_FIXTURE",
      verifyAccount: async () => ({ accountId: "ab6289976235fa386fcddcddd7bf62c5" }),
      idFactory: () => PROBE_ID,
      attempts: 2,
      delayMs: 0,
      delay: async () => {},
      jitterFactory: () => 0,
      fetchImpl: async (input) => (
        String(input).endsWith("/analytics-event-v1") ? acceptedCanary() : sqlResponse([])
      ),
    }),
    /not queryable after 2 SQL attempts/,
  );
});

test("analytics persistence fails immediately on permanent SQL errors and malformed success bodies", async () => {
  for (const responseFactory of [
    () => new Response("forbidden", { status: 403 }),
    () => new Response("invalid query", { status: 422 }),
    () => new Response("not-json", {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  ]) {
    let calls = 0;
    let delays = 0;
    await assert.rejects(
      () => verifyAnalyticsPersistence({
        resolveToken: async () => "TOKEN_FIXTURE",
        verifyAccount: async () => ({ accountId: "ab6289976235fa386fcddcddd7bf62c5" }),
        idFactory: () => PROBE_ID,
        attempts: 3,
        delayMs: 1,
        delay: async () => { delays += 1; },
        jitterFactory: () => 0,
        fetchImpl: async (input) => {
          calls += 1;
          return String(input).endsWith("/analytics-event-v1")
            ? acceptedCanary()
            : responseFactory();
        },
      }),
      /permanent status (403|422)|invalid JSON/,
    );
    assert.equal(calls, 2, "one canary POST and one permanent SQL failure are expected");
    assert.equal(delays, 0, "permanent contract failures must not be retried");
  }
});

test("analytics persistence honors Retry-After and backs off transient SQL failures", async () => {
  const delays = [];
  let sqlReads = 0;
  const report = await verifyAnalyticsPersistence({
    resolveToken: async () => "TOKEN_FIXTURE",
    verifyAccount: async () => ({ accountId: "ab6289976235fa386fcddcddd7bf62c5" }),
    idFactory: () => PROBE_ID,
    attempts: 4,
    delayMs: 1_000,
    delay: async (milliseconds) => delays.push(milliseconds),
    jitterFactory: () => 0,
    fetchImpl: async (input) => {
      if (String(input).endsWith("/analytics-event-v1")) return acceptedCanary();
      sqlReads += 1;
      if (sqlReads === 1) {
        return new Response("rate limited", {
          status: 429,
          headers: { "retry-after": "2" },
        });
      }
      if (sqlReads === 2) return new Response("temporary", { status: 503 });
      return sqlResponse([{ probe_id: PROBE_ID, events: 1 }]);
    },
  });

  assert.equal(report.queryAttempts, 3);
  assert.deepEqual(delays, [2_000, 2_000]);
});

test("Retry-After parser accepts bounded seconds and HTTP dates", () => {
  assert.equal(retryAfterMilliseconds("1.5"), 1_500);
  assert.equal(
    retryAfterMilliseconds("Sun, 19 Jul 2026 00:00:05 GMT", {
      nowMs: Date.parse("Sun, 19 Jul 2026 00:00:00 GMT"),
    }),
    5_000,
  );
  assert.equal(retryAfterMilliseconds("invalid"), undefined);
  assert.throws(() => retryAfterMilliseconds("121"), /release budget/);
});

test("analytics persistence enforces one wall-clock budget across requests and waits", async () => {
  let nowMs = 0;
  let sqlReads = 0;
  const delays = [];

  await assert.rejects(
    () => verifyAnalyticsPersistence({
      resolveToken: async () => "TOKEN_FIXTURE",
      verifyAccount: async () => ({ accountId: "ab6289976235fa386fcddcddd7bf62c5" }),
      idFactory: () => PROBE_ID,
      attempts: 4,
      delayMs: 1,
      totalBudgetMs: 100,
      nowFactory: () => nowMs,
      jitterFactory: () => 0,
      delay: async (milliseconds) => {
        delays.push(milliseconds);
        nowMs += milliseconds;
      },
      fetchImpl: async (input) => {
        if (String(input).endsWith("/analytics-event-v1")) return acceptedCanary();
        sqlReads += 1;
        return new Response("rate limited", {
          status: 429,
          headers: { "retry-after": "1" },
        });
      },
    }),
    /100-millisecond total release budget/,
  );

  assert.equal(sqlReads, 1, "the deadline must prevent another SQL request");
  assert.deepEqual(delays, [100], "Retry-After must be clamped to the remaining budget");
});
