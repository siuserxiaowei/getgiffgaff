#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path, { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REQUIRED_VARIANTS = ["G0", "G2"];
const REQUIRED_STAGES = ["sku", "order", "payment", "fulfillment", "refund", "support"];
const PRIVACY_CHECKS = [
  "no_full_name",
  "no_phone",
  "no_address",
  "no_email",
  "no_credentials_or_otp",
  "no_full_order_or_transaction_id",
];
const PLACEHOLDER_PATTERN =
  /(?:TODO|TBD|PLACEHOLDER|CHANGEME|example\.(?:com|org|net)|\.invalid(?:\/|$)|localhost|127\.0\.0\.1|<[^>]+>|\[\s*(?:fill|填写|待补|链接|date|时间)[^\]]*\])/iu;
const SENSITIVE_PATTERNS = [
  { label: "email", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu },
  { label: "phone number", pattern: /(?<!\d)(?:\+?86[- ]?)?1[3-9]\d{9}(?!\d)/u },
  { label: "OTP or password", pattern: /\b(?:otp|one[- ]time password|password|passcode|验证码|密码)\b.{0,16}\b\d{4,8}\b/iu },
  { label: "payment-card-like number", pattern: /(?<!\d)(?:\d[ -]?){15,18}\d(?!\d)/u },
  {
    label: "unmasked order or transaction identifier",
    pattern:
      /\b(?:order|transaction|payment|refund|case)[-_ ]?(?:id|reference|ref|number|no)\b\s*[:#=-]?\s*[A-Z0-9-]{8,}/iu,
  },
];

function issue(code, fieldPath, message) {
  return { code, path: fieldPath, message };
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nonPlaceholderString(value) {
  return typeof value === "string" && value.trim().length >= 2 && !PLACEHOLDER_PATTERN.test(value);
}

function parseTimestamp(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/u.test(value)
  ) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

function checkTimestamp(
  errors,
  value,
  fieldPath,
  now,
  { required = true, maxAgeDays = null } = {},
) {
  if (!value && !required) return null;
  const parsed = parseTimestamp(value);
  if (!parsed) {
    errors.push(issue("timestamp", fieldPath, "must be a complete ISO 8601 timestamp with timezone"));
    return null;
  }
  if (parsed > now) errors.push(issue("future", fieldPath, "must not be in the future"));
  if (
    Number.isFinite(maxAgeDays) &&
    maxAgeDays > 0 &&
    now.valueOf() - parsed.valueOf() > maxAgeDays * 86_400_000
  ) {
    errors.push(issue("stale", fieldPath, `is older than ${maxAgeDays} days`));
  }
  return parsed;
}

function checkSensitiveText(errors, value, fieldPath) {
  if (typeof value !== "string") return;
  for (const { label, pattern } of SENSITIVE_PATTERNS) {
    if (pattern.test(value)) {
      errors.push(issue("sensitive-data", fieldPath, `contains sensitive ${label} data`));
    }
  }
}

function checkText(errors, value, fieldPath, { sensitive = true } = {}) {
  if (!nonPlaceholderString(value)) {
    errors.push(issue("required", fieldPath, "must be a non-placeholder string"));
    return;
  }
  if (sensitive) checkSensitiveText(errors, value, fieldPath);
}

function checkUrl(errors, value, fieldPath) {
  if (!nonPlaceholderString(value)) {
    errors.push(issue("url", fieldPath, "must be a non-placeholder HTTPS direct SKU URL"));
    return null;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") throw new Error("URL must use HTTPS");
    if (url.username || url.password) throw new Error("URL must not contain credentials");
    if (url.pathname === "/" && !url.search) throw new Error("URL must identify a direct SKU, not a homepage");
    return url.href;
  } catch (error) {
    errors.push(issue("url", fieldPath, error.message));
    return null;
  }
}

function checkMaskedReference(errors, value, fieldPath) {
  if (typeof value !== "string" || !/^(?:[*•Xx-]){4,}[A-Za-z0-9]{2,6}$/u.test(value)) {
    errors.push(
      issue(
        "masked-reference",
        fieldPath,
        "must be masked and retain only 2-6 non-sensitive trailing characters",
      ),
    );
  }
}

function checkAmount(errors, amount, fieldPath) {
  if (!isObject(amount)) {
    errors.push(issue("amount", fieldPath, "must contain currency and value"));
    return null;
  }
  if (typeof amount.currency !== "string" || !/^[A-Z]{3}$/u.test(amount.currency)) {
    errors.push(issue("currency", `${fieldPath}.currency`, "must be an ISO-style three-letter code"));
  }
  if (!Number.isFinite(amount.value) || amount.value < 0 || amount.value > 1_000_000) {
    errors.push(issue("amount-value", `${fieldPath}.value`, "must be a finite non-negative number"));
  }
  return amount;
}

async function validateArtifact(errors, artifact, fieldPath, { evidenceRoot, now, maxAgeDays }) {
  if (!isObject(artifact)) {
    errors.push(issue("evidence", fieldPath, "must contain a retained redacted evidence artifact"));
    return false;
  }
  if (artifact.redacted !== true) {
    errors.push(issue("redaction", `${fieldPath}.redacted`, "must be true"));
  }
  if (artifact.redaction_review !== "passed") {
    errors.push(issue("redaction-review", `${fieldPath}.redaction_review`, 'must equal "passed"'));
  }
  checkTimestamp(errors, artifact.captured_at, `${fieldPath}.captured_at`, now, { maxAgeDays });
  if (typeof artifact.sha256 !== "string" || !/^[a-f0-9]{64}$/u.test(artifact.sha256)) {
    errors.push(issue("sha256", `${fieldPath}.sha256`, "must be a lowercase SHA-256 digest"));
  }
  if (typeof artifact.media_type !== "string" || !/^[\w.+-]+\/[\w.+-]+$/u.test(artifact.media_type)) {
    errors.push(issue("media-type", `${fieldPath}.media_type`, "must be an explicit media type"));
  }

  if (typeof artifact.path !== "string" || !artifact.path.trim()) {
    errors.push(issue("artifact-path", `${fieldPath}.path`, "must identify a local redacted artifact"));
    return false;
  }
  const normalized = artifact.path.replace(/\\/gu, "/");
  if (path.isAbsolute(artifact.path) || normalized.split("/").includes("..")) {
    errors.push(
      issue(
        "artifact-path",
        `${fieldPath}.path`,
        "must be a relative path without traversal outside the evidence package",
      ),
    );
    return false;
  }
  const root = resolve(evidenceRoot);
  const absolute = resolve(root, artifact.path);
  if (absolute !== root && !absolute.startsWith(`${root}${path.sep}`)) {
    errors.push(issue("artifact-path", `${fieldPath}.path`, "escapes the evidence package"));
    return false;
  }

  let data;
  try {
    data = await readFile(absolute);
  } catch (error) {
    errors.push(
      issue(
        "artifact-missing",
        `${fieldPath}.path`,
        `${artifact.path} does not exist or cannot be read: ${error.message}`,
      ),
    );
    return false;
  }
  const digest = createHash("sha256").update(data).digest("hex");
  if (digest !== artifact.sha256) {
    errors.push(issue("sha256-mismatch", `${fieldPath}.sha256`, "does not match the live artifact file"));
  }
  if (/^(?:text\/|application\/(?:json|xml|x-www-form-urlencoded))/iu.test(artifact.media_type || "")) {
    const text = data.toString("utf8");
    if (text.trim().length < 16 || PLACEHOLDER_PATTERN.test(text)) {
      errors.push(
        issue(
          "artifact-content",
          `${fieldPath}.content`,
          "must contain substantive non-placeholder redacted evidence",
        ),
      );
    }
    checkSensitiveText(errors, text, `${fieldPath}.content`);
  }
  return true;
}

function compareTimestampOrder(errors, earlier, later, fieldPath) {
  if (earlier && later && earlier > later) {
    errors.push(issue("chronology", fieldPath, "is earlier than its preceding transaction event"));
  }
}

async function validateProduct(errors, product, fieldPath, context) {
  const artifactPromises = [];
  if (!isObject(product)) {
    errors.push(issue("product", fieldPath, "must be an object"));
    return artifactPromises;
  }
  const variant = product.variant;
  if (!REQUIRED_VARIANTS.includes(variant)) {
    errors.push(issue("variant", `${fieldPath}.variant`, "must equal G0 or G2"));
  }
  for (const stage of REQUIRED_STAGES) {
    if (!isObject(product[stage])) {
      errors.push(issue("stage", `${fieldPath}.${stage}`, "is required"));
      continue;
    }
    artifactPromises.push(
      validateArtifact(errors, product[stage].evidence, `${fieldPath}.${stage}.evidence`, context),
    );
  }

  const skuUrl = checkUrl(errors, product.sku?.url, `${fieldPath}.sku.url`);
  const finalUrl = checkUrl(errors, product.sku?.final_url, `${fieldPath}.sku.final_url`);
  if (skuUrl && finalUrl && skuUrl !== finalUrl) {
    errors.push(issue("sku-final-url", `${fieldPath}.sku.final_url`, "must equal the checked direct SKU URL"));
  }
  if (product.sku?.http_status !== 200) {
    errors.push(issue("sku-status", `${fieldPath}.sku.http_status`, "must equal the observed status 200"));
  }
  const timestampOptions = { maxAgeDays: context.maxAgeDays };
  const skuChecked = checkTimestamp(
    errors,
    product.sku?.checked_at,
    `${fieldPath}.sku.checked_at`,
    context.now,
    timestampOptions,
  );

  checkMaskedReference(errors, product.order?.masked_reference, `${fieldPath}.order.masked_reference`);
  checkText(errors, product.order?.item_label, `${fieldPath}.order.item_label`);
  const orderAt = checkTimestamp(
    errors,
    product.order?.ordered_at,
    `${fieldPath}.order.ordered_at`,
    context.now,
    timestampOptions,
  );
  const orderAmount = checkAmount(errors, product.order?.amount, `${fieldPath}.order.amount`);

  if (product.payment?.status !== "succeeded") {
    errors.push(issue("payment-status", `${fieldPath}.payment.status`, 'must equal "succeeded"'));
  }
  checkMaskedReference(errors, product.payment?.masked_reference, `${fieldPath}.payment.masked_reference`);
  checkText(errors, product.payment?.payee_display_name, `${fieldPath}.payment.payee_display_name`);
  const paidAt = checkTimestamp(
    errors,
    product.payment?.paid_at,
    `${fieldPath}.payment.paid_at`,
    context.now,
    timestampOptions,
  );
  const paidAmount = checkAmount(errors, product.payment?.amount, `${fieldPath}.payment.amount`);

  if (product.fulfillment?.status !== "fulfilled") {
    errors.push(issue("fulfillment-status", `${fieldPath}.fulfillment.status`, 'must equal "fulfilled"'));
  }
  if (product.fulfillment?.item_matches_order !== true) {
    errors.push(issue("item-match", `${fieldPath}.fulfillment.item_matches_order`, "must be true"));
  }
  checkText(errors, product.fulfillment?.method, `${fieldPath}.fulfillment.method`);
  const fulfilledAt = checkTimestamp(
    errors,
    product.fulfillment?.fulfilled_at,
    `${fieldPath}.fulfillment.fulfilled_at`,
    context.now,
    timestampOptions,
  );

  if (product.refund?.status !== "refunded") {
    errors.push(issue("refund-status", `${fieldPath}.refund.status`, 'must equal "refunded"'));
  }
  checkMaskedReference(errors, product.refund?.masked_reference, `${fieldPath}.refund.masked_reference`);
  const refundRequestedAt = checkTimestamp(
    errors,
    product.refund?.requested_at,
    `${fieldPath}.refund.requested_at`,
    context.now,
    timestampOptions,
  );
  const refundCompletedAt = checkTimestamp(
    errors,
    product.refund?.completed_at,
    `${fieldPath}.refund.completed_at`,
    context.now,
    timestampOptions,
  );
  const refundAmount = checkAmount(errors, product.refund?.amount, `${fieldPath}.refund.amount`);

  if (product.support?.status !== "resolved") {
    errors.push(issue("support-status", `${fieldPath}.support.status`, 'must equal "resolved"'));
  }
  checkMaskedReference(errors, product.support?.masked_reference, `${fieldPath}.support.masked_reference`);
  checkText(errors, product.support?.channel, `${fieldPath}.support.channel`);
  checkText(errors, product.support?.redacted_summary, `${fieldPath}.support.redacted_summary`);
  const supportOpenedAt = checkTimestamp(
    errors,
    product.support?.opened_at,
    `${fieldPath}.support.opened_at`,
    context.now,
    timestampOptions,
  );
  const supportResolvedAt = checkTimestamp(
    errors,
    product.support?.resolved_at,
    `${fieldPath}.support.resolved_at`,
    context.now,
    timestampOptions,
  );

  compareTimestampOrder(errors, skuChecked, orderAt, `${fieldPath}.order.ordered_at`);
  compareTimestampOrder(errors, orderAt, paidAt, `${fieldPath}.payment.paid_at`);
  compareTimestampOrder(errors, paidAt, fulfilledAt, `${fieldPath}.fulfillment.fulfilled_at`);
  compareTimestampOrder(errors, fulfilledAt, refundRequestedAt, `${fieldPath}.refund.requested_at`);
  compareTimestampOrder(errors, refundRequestedAt, refundCompletedAt, `${fieldPath}.refund.completed_at`);
  compareTimestampOrder(errors, fulfilledAt, supportOpenedAt, `${fieldPath}.support.opened_at`);
  compareTimestampOrder(errors, supportOpenedAt, supportResolvedAt, `${fieldPath}.support.resolved_at`);

  for (const [label, amount] of [
    ["payment", paidAmount],
    ["refund", refundAmount],
  ]) {
    if (
      orderAmount &&
      amount &&
      (orderAmount.currency !== amount.currency || orderAmount.value !== amount.value)
    ) {
      errors.push(issue("amount-mismatch", `${fieldPath}.${label}.amount`, "must match the order amount"));
    }
  }
  return artifactPromises;
}

export async function validateCommerceEvidence(
  record,
  { evidenceRoot = process.cwd(), now = new Date(), maxAgeDays = 30 } = {},
) {
  const errors = [];
  const context = { evidenceRoot, now: new Date(now), maxAgeDays };
  if (!isObject(record)) {
    return { errors: [issue("record", "$", "must be a JSON object")], variants: [], artifactCount: 0 };
  }
  if (record.schema_version !== "1.0") {
    errors.push(issue("schema-version", "schema_version", 'must equal "1.0"'));
  }
  checkText(errors, record.record_id, "record_id");
  if (record.scope !== "production-mobile-test") {
    errors.push(issue("scope", "scope", 'must equal "production-mobile-test"'));
  }
  if (!Number.isFinite(maxAgeDays) || maxAgeDays < 1) {
    errors.push(issue("max-age", "maxAgeDays", "must be a positive finite number"));
  }
  const capturedAt = checkTimestamp(errors, record.captured_at, "captured_at", context.now, {
    maxAgeDays,
  });

  const privacy = record.privacy_review;
  if (!isObject(privacy)) {
    errors.push(issue("privacy-review", "privacy_review", "is required"));
  } else {
    checkText(errors, privacy.reviewer_role, "privacy_review.reviewer_role");
    checkTimestamp(errors, privacy.reviewed_at, "privacy_review.reviewed_at", context.now);
    if (privacy.redacted_copy_only !== true) {
      errors.push(issue("privacy-review", "privacy_review.redacted_copy_only", "must be true"));
    }
    if (privacy.raw_artifacts_in_repository !== false) {
      errors.push(issue("privacy-review", "privacy_review.raw_artifacts_in_repository", "must be false"));
    }
    for (const check of PRIVACY_CHECKS) {
      if (privacy.checks?.[check] !== true) {
        errors.push(issue("privacy-check", `privacy_review.checks.${check}`, "must be true"));
      }
    }
  }

  const products = Array.isArray(record.products) ? record.products : [];
  const variants = products.map((product) => product?.variant).filter(Boolean);
  if (
    products.length !== 2 ||
    REQUIRED_VARIANTS.some((variant) => variants.filter((value) => value === variant).length !== 1)
  ) {
    errors.push(issue("product-set", "products", "must contain exactly one G0 and one G2 record"));
  }
  const pendingArtifacts = [];
  for (const [index, product] of products.entries()) {
    pendingArtifacts.push(
      ...(await validateProduct(errors, product, `products[${index}]`, context)),
    );
  }
  await Promise.all(pendingArtifacts);

  const artifactPaths = products.flatMap((product) =>
    REQUIRED_STAGES.map((stage) => product?.[stage]?.evidence?.path).filter(Boolean),
  );
  if (new Set(artifactPaths).size !== artifactPaths.length) {
    errors.push(issue("duplicate-artifact", "products", "each stage must retain a distinct artifact path"));
  }

  return {
    errors,
    variants: [...new Set(variants)].sort(),
    artifactCount: products.reduce(
      (count, product) =>
        count + REQUIRED_STAGES.filter((stage) => isObject(product?.[stage]?.evidence)).length,
      0,
    ),
  };
}

export async function validateCommerceEvidenceFile(filePath, options = {}) {
  const absolute = resolve(filePath);
  let record;
  try {
    record = JSON.parse(await readFile(absolute, "utf8"));
  } catch (error) {
    return {
      errors: [
        issue(
          error instanceof SyntaxError ? "invalid-json" : "record-read",
          "$",
          `Could not read commerce evidence JSON: ${error.message}`,
        ),
      ],
      variants: [],
      artifactCount: 0,
    };
  }
  return validateCommerceEvidence(record, {
    ...options,
    evidenceRoot: options.evidenceRoot || dirname(absolute),
  });
}

function help() {
  return `Usage:
  node scripts/validate-commerce-evidence.mjs --file <evidence.json> [--max-age-days 30]

Validation is local and read-only. It does not open SKU URLs, log in, pay, refund, or contact support.`;
}

export function parseCommerceEvidenceCliOptions(args) {
  const options = { file: "", maxAgeDays: 30, help: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--file") options.file = args[++index] || "";
    else if (arg.startsWith("--file=")) options.file = arg.slice(7);
    else if (arg === "--max-age-days") options.maxAgeDays = Number(args[++index]);
    else if (arg.startsWith("--max-age-days=")) options.maxAgeDays = Number(arg.slice(15));
    else throw new TypeError(`Unknown option: ${arg}`);
  }
  return options;
}

export async function runCommerceEvidenceCli(
  args = process.argv.slice(2),
  { log = console.log, error = console.error } = {},
) {
  const options = parseCommerceEvidenceCliOptions(args);
  if (options.help) {
    log(help());
    return 0;
  }
  if (!options.file) throw new TypeError(help());
  const result = await validateCommerceEvidenceFile(options.file, {
    maxAgeDays: options.maxAgeDays,
  });
  if (result.errors.length) {
    for (const entry of result.errors) {
      error(`[${entry.code}] ${entry.path}: ${entry.message}`);
    }
    return 1;
  }
  log(
    `Commerce evidence valid: ${result.variants.join("/")}, ${result.artifactCount} retained redacted artifacts.`,
  );
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCommerceEvidenceCli().then((exitCode) => {
    process.exitCode = exitCode;
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
