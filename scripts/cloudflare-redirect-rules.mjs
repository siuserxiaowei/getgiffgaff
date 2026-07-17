#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ROUTE_MANIFEST } from "../public/route-manifest.js";

export const CANONICAL_ORIGIN = "https://getgiffgaff.com";
export const CANONICAL_RULE_DESCRIPTION =
  "Canonical trailing slash for every non-root public HTML path";
export const EXPECTED_NO_TRAILING_SLASH_PATHS = Object.freeze(
  Object.keys(ROUTE_MANIFEST)
    .filter((pathname) => pathname !== "/")
    .map((pathname) => pathname.replace(/\/$/u, ""))
    .sort(),
);

const EXPECTED_TARGET_EXPRESSION =
  'concat("https://getgiffgaff.com", http.request.uri.path, "/")';
const REQUIRED_METHODS = new Set(["GET", "HEAD"]);

function quote(value) {
  return JSON.stringify(value);
}

function generatedExpression(paths = EXPECTED_NO_TRAILING_SLASH_PATHS) {
  return `(http.request.method in {"GET" "HEAD"} and http.request.uri.path in {${paths
    .map(quote)
    .join(" ")}})`;
}

export function buildCloudflareRedirectRuleset() {
  return {
    _local_artifact: {
      purpose: "review-only-rule-fragment",
      not_for_api_submission: true,
      warning:
        "Copy only the reviewed first-rule fields into the existing rule. Never replace the complete zone ruleset with this fragment.",
    },
    name: "getgiffgaff canonical redirects",
    description:
      "Offline-generated target configuration. Review and apply manually with an authorised Cloudflare account.",
    kind: "zone",
    phase: "http_request_dynamic_redirect",
    rules: [
      {
        description: CANONICAL_RULE_DESCRIPTION,
        action: "redirect",
        expression: generatedExpression(),
        enabled: true,
        action_parameters: {
          from_value: {
            status_code: 301,
            preserve_query_string: true,
            target_url: { expression: EXPECTED_TARGET_EXPRESSION },
          },
        },
      },
    ],
  };
}

function issue(code, message) {
  return { code, message };
}

function unwrapRuleset(value) {
  if (value?.result?.rules) return value.result;
  if (value?.rules) return value;
  return null;
}

function extractQuotedSet(expression, fieldName) {
  if (typeof expression !== "string") return null;
  const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const match = expression.match(new RegExp(`${escaped}\\s+in\\s+\\{([^}]*)\\}`, "u"));
  if (!match) return null;
  const values = [];
  for (const valueMatch of match[1].matchAll(/"((?:\\.|[^"\\])*)"/gu)) {
    try {
      values.push(JSON.parse(`"${valueMatch[1]}"`));
    } catch {
      return null;
    }
  }
  return values;
}

function selectRule(rules, { ruleId } = {}) {
  if (ruleId) return rules.find((rule) => rule?.id === ruleId) || null;
  return (
    rules.find((rule) => rule?.description === CANONICAL_RULE_DESCRIPTION) ||
    rules.find((rule) =>
      typeof rule?.expression === "string" &&
      rule.expression.includes("http.request.uri.path in"),
    ) ||
    null
  );
}

export function validateCloudflareRedirectExport(exported, { ruleId } = {}) {
  const errors = [];
  const ruleset = unwrapRuleset(exported);
  if (!ruleset) {
    return {
      errors: [issue("ruleset-shape", "Expected a Cloudflare ruleset object with a rules array")],
      pathCount: 0,
    };
  }
  if (ruleset.phase !== "http_request_dynamic_redirect") {
    errors.push(
      issue(
        "ruleset-phase",
        `Expected http_request_dynamic_redirect, found ${JSON.stringify(ruleset.phase)}`,
      ),
    );
  }
  if (!Array.isArray(ruleset.rules)) {
    return {
      errors: [...errors, issue("rules-array", "Exported ruleset.rules must be an array")],
      pathCount: 0,
    };
  }

  const rule = selectRule(ruleset.rules, { ruleId });
  if (!rule) {
    errors.push(
      issue(
        "rule-missing",
        ruleId
          ? `Could not find canonical redirect rule id ${ruleId}`
          : `Could not find canonical redirect rule ${JSON.stringify(CANONICAL_RULE_DESCRIPTION)}`,
      ),
    );
    return { errors, pathCount: 0 };
  }
  const ruleIndex = ruleset.rules.indexOf(rule);
  if (ruleIndex !== 0) {
    errors.push(issue("rule-order", `Canonical trailing-slash rule must be first; found index ${ruleIndex}`));
  }
  if (rule.action !== "redirect") {
    errors.push(issue("rule-action", `Expected redirect action, found ${JSON.stringify(rule.action)}`));
  }
  if (rule.enabled !== true) {
    errors.push(issue("rule-disabled", "Canonical trailing-slash rule must be explicitly enabled"));
  }

  const methods = extractQuotedSet(rule.expression, "http.request.method");
  if (!methods || methods.length !== 2 || methods.some((method) => !REQUIRED_METHODS.has(method))) {
    errors.push(issue("request-methods", "Rule must match exactly GET and HEAD methods"));
  }
  const paths = extractQuotedSet(rule.expression, "http.request.uri.path") || [];
  const pathSet = new Set(paths);
  const expectedSet = new Set(EXPECTED_NO_TRAILING_SLASH_PATHS);
  const missing = EXPECTED_NO_TRAILING_SLASH_PATHS.filter((pathname) => !pathSet.has(pathname));
  const unexpected = paths.filter((pathname) => !expectedSet.has(pathname));
  if (missing.length) errors.push(issue("missing-paths", `Missing paths: ${missing.join(", ")}`));
  if (unexpected.length) {
    errors.push(issue("unexpected-paths", `Unexpected paths: ${unexpected.join(", ")}`));
  }
  if (pathSet.size !== paths.length) {
    errors.push(issue("duplicate-paths", "Rule path set contains duplicate members"));
  }
  for (const pathname of paths) {
    if (pathname === "/" || pathname.endsWith("/")) {
      errors.push(
        issue("invalid-path-shape", `Expected a non-root path without trailing slash: ${pathname}`),
      );
    }
  }

  const fromValue = rule.action_parameters?.from_value;
  if (fromValue?.status_code !== 301) {
    errors.push(issue("status-code", `Expected redirect status 301, found ${fromValue?.status_code}`));
  }
  if (fromValue?.preserve_query_string !== true) {
    errors.push(issue("preserve-query", "Redirect must preserve the query string"));
  }
  if (fromValue?.target_url?.expression !== EXPECTED_TARGET_EXPRESSION) {
    errors.push(
      issue(
        "target-expression",
        `Redirect target must be ${EXPECTED_TARGET_EXPRESSION}; found ${JSON.stringify(
          fromValue?.target_url?.expression,
        )}`,
      ),
    );
  }

  return { errors, pathCount: pathSet.size, ruleIndex, ruleId: rule.id || null };
}

export async function validateCloudflareRedirectExportFile(filePath, options = {}) {
  let exported;
  try {
    exported = JSON.parse(await readFile(resolve(filePath), "utf8"));
  } catch (error) {
    return {
      errors: [
        issue(
          error instanceof SyntaxError ? "invalid-json" : "export-read",
          `Could not read exported rules JSON: ${error.message}`,
        ),
      ],
      pathCount: 0,
    };
  }
  return validateCloudflareRedirectExport(exported, options);
}

function help() {
  return `Usage:
  node scripts/cloudflare-redirect-rules.mjs generate
  node scripts/cloudflare-redirect-rules.mjs validate --file <export.json> [--rule-id <id>]

This command only generates or validates local JSON. It never calls Cloudflare APIs.`;
}

export function parseCloudflareCliOptions(args) {
  const [command, ...rest] = args;
  const options = { command, file: "", ruleId: "" };
  for (let index = 0; index < rest.length; index += 1) {
    if (rest[index] === "--file") options.file = rest[++index] || "";
    else if (rest[index].startsWith("--file=")) options.file = rest[index].slice(7);
    else if (rest[index] === "--rule-id") options.ruleId = rest[++index] || "";
    else if (rest[index].startsWith("--rule-id=")) options.ruleId = rest[index].slice(10);
    else if (rest[index] === "--help" || rest[index] === "-h") options.command = "help";
    else throw new TypeError(`Unknown option: ${rest[index]}`);
  }
  return options;
}

export async function runCloudflareRedirectCli(
  args = process.argv.slice(2),
  { log = console.log, error = console.error } = {},
) {
  const options = parseCloudflareCliOptions(args);
  if (options.command === "help" || options.command === "--help" || options.command === "-h") {
    log(help());
    return 0;
  }
  if (options.command === "generate") {
    log(JSON.stringify(buildCloudflareRedirectRuleset(), null, 2));
    return 0;
  }
  if (options.command !== "validate" || !options.file) throw new TypeError(help());
  const result = await validateCloudflareRedirectExportFile(options.file, {
    ruleId: options.ruleId || undefined,
  });
  if (result.errors.length) {
    for (const entry of result.errors) error(`[${entry.code}] ${entry.message}`);
    return 1;
  }
  log(`Cloudflare redirect export valid: ${result.pathCount} non-root public HTML paths.`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCloudflareRedirectCli().then((exitCode) => {
    process.exitCode = exitCode;
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
