import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  EXPECTED_NO_TRAILING_SLASH_PATHS,
  buildCloudflareRedirectRuleset,
  parseCloudflareCliOptions,
  runCloudflareRedirectCli,
  validateCloudflareRedirectExport,
  validateCloudflareRedirectExportFile,
} from "../scripts/cloudflare-redirect-rules.mjs";

const NEW_PATHS = [
  "/guides/7-arrival-checklist",
  "/guides/8-uk-sim-choice",
  "/guides/9-number-balance-data-check",
  "/guides/apn-settings",
  "/more/esim-new-phone",
  "/more/esim-deleted",
  "/tools/keep-number-reminder",
  "/tools/china-roaming-cost",
  "/tools/g0-g2-total-cost",
];
const POLICY_PATHS = ["/privacy", "/terms", "/refund", "/shipping"];

test("Cloudflare canonical rule is generated from every non-root public HTML path", () => {
  const ruleset = buildCloudflareRedirectRuleset();
  const rule = ruleset.rules[0];

  assert.equal(EXPECTED_NO_TRAILING_SLASH_PATHS.length, 49);
  assert.equal(new Set(EXPECTED_NO_TRAILING_SLASH_PATHS).size, 49);
  assert.ok(EXPECTED_NO_TRAILING_SLASH_PATHS.every((pathname) => !pathname.endsWith("/")));
  for (const pathname of NEW_PATHS) assert.ok(EXPECTED_NO_TRAILING_SLASH_PATHS.includes(pathname));
  for (const pathname of POLICY_PATHS) assert.ok(EXPECTED_NO_TRAILING_SLASH_PATHS.includes(pathname));

  assert.equal(ruleset.phase, "http_request_dynamic_redirect");
  assert.equal(rule.action, "redirect");
  assert.match(rule.expression, /http\.request\.method in \{"GET" "HEAD"\}/);
  assert.equal(rule.action_parameters.from_value.status_code, 301);
  assert.equal(
    rule.action_parameters.from_value.target_url.expression,
    'concat("https://getgiffgaff.com", http.request.uri.path, "/")',
  );
  assert.equal(rule.action_parameters.from_value.preserve_query_string, true);
  assert.deepEqual(validateCloudflareRedirectExport(ruleset).errors, []);
});

test("offline export validator fails closed on missing, extra, reordered, or unsafe rule config", () => {
  const ruleset = buildCloudflareRedirectRuleset();
  const rule = structuredClone(ruleset.rules[0]);
  rule.id = "23a9c07759414918816c2e768101d6f0";
  rule.expression = rule.expression
    .replace(' "/tools/g0-g2-total-cost"', "")
    .replace(/\}\)$/u, ' "/unexpected"})');
  rule.action_parameters.from_value.status_code = 302;
  rule.action_parameters.from_value.preserve_query_string = false;
  rule.action_parameters.from_value.target_url.expression =
    'concat("https://www.getgiffgaff.com", http.request.uri.path)';
  rule.enabled = false;

  const exported = {
    result: {
      phase: "http_request_dynamic_redirect",
      rules: [
        { description: "wrong rule first", action: "redirect", expression: "true" },
        rule,
      ],
    },
  };
  const result = validateCloudflareRedirectExport(exported, {
    ruleId: "23a9c07759414918816c2e768101d6f0",
  });
  const messages = result.errors.map((entry) => `${entry.code}: ${entry.message}`).join("\n");

  assert.match(messages, /rule-order/);
  assert.match(messages, /missing-paths.*g0-g2-total-cost/);
  assert.match(messages, /unexpected-paths.*unexpected/);
  assert.match(messages, /status-code/);
  assert.match(messages, /preserve-query/);
  assert.match(messages, /target-expression/);
  assert.match(messages, /rule-disabled/);
});

test("offline validator reads a Cloudflare-exported JSON file without an API call", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-cf-rules-"));
  try {
    const exportedPath = path.join(root, "ruleset-export.json");
    const ruleset = buildCloudflareRedirectRuleset();
    ruleset.rules[0].id = "23a9c07759414918816c2e768101d6f0";
    await writeFile(exportedPath, JSON.stringify({ result: ruleset }), "utf8");

    const result = await validateCloudflareRedirectExportFile(exportedPath, {
      ruleId: "23a9c07759414918816c2e768101d6f0",
    });
    assert.equal(result.pathCount, 49);
    assert.deepEqual(result.errors, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("validator rejects malformed export JSON instead of treating it as an empty ruleset", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-cf-invalid-"));
  try {
    const exportedPath = path.join(root, "ruleset-export.json");
    await writeFile(exportedPath, "{not-json", "utf8");
    const result = await validateCloudflareRedirectExportFile(exportedPath);
    assert.match(result.errors.map((entry) => entry.code).join(" "), /invalid-json/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("ruleset shape, phase, action, methods and missing rule fail closed", () => {
  assert.match(validateCloudflareRedirectExport(null).errors[0].code, /ruleset-shape/);
  assert.match(
    validateCloudflareRedirectExport({ phase: "wrong", rules: "not-an-array" }).errors
      .map((entry) => entry.code)
      .join(" "),
    /ruleset-phase.*rules-array/,
  );
  assert.match(
    validateCloudflareRedirectExport({ phase: "http_request_dynamic_redirect", rules: [] }).errors[0]
      .code,
    /rule-missing/,
  );

  const ruleset = buildCloudflareRedirectRuleset();
  ruleset.rules[0].action = "rewrite";
  ruleset.rules[0].expression = ruleset.rules[0].expression.replace(
    '{"GET" "HEAD"}',
    '{"POST"}',
  );
  const codes = validateCloudflareRedirectExport(ruleset).errors
    .map((entry) => entry.code)
    .join(" ");
  assert.match(codes, /rule-action/);
  assert.match(codes, /request-methods/);
});

test("Cloudflare CLI generates, validates, explains and rejects bad input locally", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-cf-cli-"));
  try {
    const validPath = path.join(root, "valid.json");
    const badPath = path.join(root, "bad.json");
    await writeFile(validPath, JSON.stringify(buildCloudflareRedirectRuleset()), "utf8");
    await writeFile(badPath, "{}", "utf8");
    const logs = [];
    const errors = [];
    const io = { log: (message) => logs.push(message), error: (message) => errors.push(message) };

    assert.equal(await runCloudflareRedirectCli(["generate"], io), 0);
    assert.doesNotThrow(() => JSON.parse(logs[0]));
    assert.equal(await runCloudflareRedirectCli(["validate", "--file", validPath], io), 0);
    assert.equal(await runCloudflareRedirectCli(["validate", `--file=${badPath}`], io), 1);
    assert.match(errors.join("\n"), /ruleset-shape/);
    assert.equal(await runCloudflareRedirectCli(["help"], io), 0);
    assert.match(logs.at(-1), /never calls Cloudflare APIs/);
    assert.deepEqual(parseCloudflareCliOptions(["validate", "--rule-id=abc", `--file=${validPath}`]), {
      command: "validate",
      file: validPath,
      ruleId: "abc",
    });
    assert.throws(() => parseCloudflareCliOptions(["generate", "--bad"]), /Unknown option/);
    await assert.rejects(() => runCloudflareRedirectCli(["validate"], io), /Usage:/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
