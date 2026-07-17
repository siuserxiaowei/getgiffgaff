import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  parseCommerceEvidenceCliOptions,
  runCommerceEvidenceCli,
  validateCommerceEvidence,
  validateCommerceEvidenceFile,
} from "../scripts/validate-commerce-evidence.mjs";

const NOW = new Date("2026-07-17T12:00:00+08:00");
const CAPTURED_AT = "2026-07-16T12:00:00+08:00";
const STAGES = ["sku", "order", "payment", "fulfillment", "refund", "support"];

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

function artifact(variant, stage, content) {
  return {
    path: `artifacts/${variant.toLowerCase()}-${stage}.txt`,
    sha256: sha256(content),
    media_type: "text/plain",
    captured_at: CAPTURED_AT,
    redacted: true,
    redaction_review: "passed",
  };
}

function product(variant, suffix, contents) {
  const evidence = Object.fromEntries(
    STAGES.map((stage) => [stage, artifact(variant, stage, contents[`${variant}-${stage}`])]),
  );
  return {
    variant,
    sku: {
      url: `https://shop.example-merchant.test/products/giffgaff-${variant.toLowerCase()}-${suffix}`,
      final_url: `https://shop.example-merchant.test/products/giffgaff-${variant.toLowerCase()}-${suffix}`,
      checked_at: CAPTURED_AT,
      http_status: 200,
      evidence: evidence.sku,
    },
    order: {
      masked_reference: `******${suffix}OR`,
      item_label: `giffgaff ${variant} test item`,
      ordered_at: CAPTURED_AT,
      amount: { currency: "CNY", value: 10.5 },
      evidence: evidence.order,
    },
    payment: {
      status: "succeeded",
      masked_reference: `******${suffix}PA`,
      payee_display_name: "Test Merchant",
      paid_at: CAPTURED_AT,
      amount: { currency: "CNY", value: 10.5 },
      evidence: evidence.payment,
    },
    fulfillment: {
      status: "fulfilled",
      fulfilled_at: CAPTURED_AT,
      method: "mobile test delivery",
      item_matches_order: true,
      evidence: evidence.fulfillment,
    },
    refund: {
      status: "refunded",
      masked_reference: `******${suffix}RE`,
      requested_at: CAPTURED_AT,
      completed_at: CAPTURED_AT,
      amount: { currency: "CNY", value: 10.5 },
      evidence: evidence.refund,
    },
    support: {
      status: "resolved",
      masked_reference: `******${suffix}SU`,
      channel: "merchant support chat",
      opened_at: CAPTURED_AT,
      resolved_at: CAPTURED_AT,
      redacted_summary: "Test question received a dated resolution with no personal data retained.",
      evidence: evidence.support,
    },
  };
}

function validRecord(contents) {
  return {
    schema_version: "1.0",
    record_id: "commerce-proof-2026-07-16-a",
    captured_at: CAPTURED_AT,
    scope: "production-mobile-test",
    privacy_review: {
      reviewer_role: "business owner",
      reviewed_at: CAPTURED_AT,
      redacted_copy_only: true,
      raw_artifacts_in_repository: false,
      checks: {
        no_full_name: true,
        no_phone: true,
        no_address: true,
        no_email: true,
        no_credentials_or_otp: true,
        no_full_order_or_transaction_id: true,
      },
    },
    products: [product("G0", "A1", contents), product("G2", "B2", contents)],
  };
}

async function makeEvidenceDirectory(root) {
  const artifactsRoot = path.join(root, "artifacts");
  const contents = {};
  await import("node:fs/promises").then(({ mkdir }) => mkdir(artifactsRoot, { recursive: true }));
  for (const variant of ["G0", "G2"]) {
    for (const stage of STAGES) {
      const content = `${variant} ${stage} redacted evidence captured 2026-07-16\n`;
      contents[`${variant}-${stage}`] = content;
      await writeFile(path.join(artifactsRoot, `${variant.toLowerCase()}-${stage}.txt`), content);
    }
  }
  return contents;
}

test("complete, current G0 and G2 transaction evidence passes structural and live-file gates", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-commerce-proof-"));
  try {
    const contents = await makeEvidenceDirectory(root);
    const record = validRecord(contents);
    const result = await validateCommerceEvidence(record, {
      evidenceRoot: root,
      now: NOW,
      maxAgeDays: 30,
    });
    assert.deepEqual(result.errors, []);
    assert.equal(result.artifactCount, 12);
    assert.deepEqual(result.variants, ["G0", "G2"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("empty template and incomplete stage evidence fail closed", async () => {
  const template = JSON.parse(
    await readFile(new URL("../docs/operations/commerce-evidence.template.json", import.meta.url), "utf8"),
  );
  const result = await validateCommerceEvidence(template, { now: NOW });
  const messages = result.errors.map((entry) => `${entry.path}: ${entry.message}`).join("\n");

  assert.match(messages, /record_id.*non-placeholder/);
  assert.match(messages, /captured_at.*ISO 8601/);
  assert.match(messages, /products\[0\]\.payment\.status.*succeeded/);
  assert.match(messages, /products\[1\]\.refund\.status.*refunded/);
  assert.match(messages, /does not exist/);
  assert.match(messages, /privacy_review/);
});

test("privacy, direct-SKU, redaction and result claims are strictly validated", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-commerce-unsafe-"));
  try {
    const contents = await makeEvidenceDirectory(root);
    const record = validRecord(contents);
    record.privacy_review.checks.no_credentials_or_otp = false;
    record.products[0].sku.url = "https://example.com/";
    record.products[0].sku.final_url = "https://example.com/";
    record.products[0].order.masked_reference = "FULL-ORDER-123456789";
    record.products[0].payment.status = "pending";
    record.products[0].payment.payee_display_name = "buyer@merchant.test";
    record.products[0].fulfillment.item_matches_order = false;
    record.products[0].refund.status = "requested";
    record.products[0].support.redacted_summary = "Call 13800138000 with OTP 123456";
    record.products[0].support.evidence.redacted = false;

    const result = await validateCommerceEvidence(record, { evidenceRoot: root, now: NOW });
    const messages = result.errors.map((entry) => `${entry.path}: ${entry.message}`).join("\n");
    assert.match(messages, /no_credentials_or_otp.*must be true/);
    assert.match(messages, /sku\.url.*placeholder/);
    assert.match(messages, /masked_reference.*masked/);
    assert.match(messages, /payment\.status.*succeeded/);
    assert.match(messages, /payee_display_name.*sensitive/);
    assert.match(messages, /item_matches_order.*true/);
    assert.match(messages, /refund\.status.*refunded/);
    assert.match(messages, /redacted_summary.*sensitive/);
    assert.match(messages, /evidence\.redacted.*true/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("live artifact validation rejects traversal, missing files, hash mismatch, stale and future evidence", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-commerce-files-"));
  try {
    const contents = await makeEvidenceDirectory(root);
    const record = validRecord(contents);
    record.captured_at = "2026-01-01T12:00:00+08:00";
    record.products[0].sku.evidence.path = "../outside.txt";
    record.products[0].order.evidence.path = "artifacts/missing.txt";
    record.products[0].payment.evidence.sha256 = "0".repeat(64);
    record.products[1].support.resolved_at = "2026-07-18T12:00:00+08:00";

    const result = await validateCommerceEvidence(record, {
      evidenceRoot: root,
      now: NOW,
      maxAgeDays: 30,
    });
    const messages = result.errors.map((entry) => `${entry.path}: ${entry.message}`).join("\n");
    assert.match(messages, /captured_at.*older than 30 days/);
    assert.match(messages, /path.*relative path without traversal/);
    assert.match(messages, /missing\.txt.*does not exist/);
    assert.match(messages, /sha256.*does not match/);
    assert.match(messages, /resolved_at.*future/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("file validator rejects malformed JSON and accepts a retained evidence package", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-commerce-json-"));
  try {
    const badPath = path.join(root, "bad.json");
    await writeFile(badPath, "not-json", "utf8");
    const bad = await validateCommerceEvidenceFile(badPath, { now: NOW });
    assert.match(bad.errors.map((entry) => entry.code).join(" "), /invalid-json/);

    const contents = await makeEvidenceDirectory(root);
    const goodPath = path.join(root, "evidence.json");
    await writeFile(goodPath, JSON.stringify(validRecord(contents)), "utf8");
    const good = await validateCommerceEvidenceFile(goodPath, { now: NOW });
    assert.deepEqual(good.errors, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("commerce validator rejects malformed product shape, amount, chronology and duplicate artifacts", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-commerce-branches-"));
  try {
    const contents = await makeEvidenceDirectory(root);
    const record = validRecord(contents);
    record.products.push({ variant: "G3" });
    record.products[0].payment.amount.currency = "yuan";
    record.products[0].payment.amount.value = -1;
    record.products[0].payment.paid_at = "2026-07-15T12:00:00+08:00";
    record.products[0].support.resolved_at = "2026-07-15T12:00:00+08:00";
    record.products[1].order.evidence.path = record.products[1].sku.evidence.path;

    const result = await validateCommerceEvidence(record, { evidenceRoot: root, now: NOW });
    const messages = result.errors.map((entry) => `${entry.code}: ${entry.path}`).join("\n");
    assert.match(messages, /product-set/);
    assert.match(messages, /variant/);
    assert.match(messages, /stage/);
    assert.match(messages, /currency/);
    assert.match(messages, /amount-value/);
    assert.match(messages, /chronology/);
    assert.match(messages, /duplicate-artifact/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("commerce CLI handles help, valid packages, fail-closed templates and bad options", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-commerce-cli-"));
  try {
    const contents = await makeEvidenceDirectory(root);
    const goodPath = path.join(root, "record.json");
    await writeFile(goodPath, JSON.stringify(validRecord(contents)), "utf8");
    const templatePath = fileURLToPath(
      new URL("../docs/operations/commerce-evidence.template.json", import.meta.url),
    );
    const logs = [];
    const errors = [];
    const io = { log: (message) => logs.push(message), error: (message) => errors.push(message) };

    assert.equal(await runCommerceEvidenceCli(["--help"], io), 0);
    assert.match(logs[0], /local and read-only/);
    assert.equal(await runCommerceEvidenceCli([`--file=${goodPath}`, "--max-age-days=30"], io), 0);
    assert.match(logs.at(-1), /G0\/G2, 12 retained/);
    assert.equal(await runCommerceEvidenceCli(["--file", templatePath], io), 1);
    assert.match(errors.join("\n"), /record_id/);
    assert.deepEqual(parseCommerceEvidenceCliOptions(["--file", goodPath, "--max-age-days", "7"]), {
      file: goodPath,
      maxAgeDays: 7,
      help: false,
    });
    assert.throws(() => parseCommerceEvidenceCliOptions(["--bad"]), /Unknown option/);
    await assert.rejects(() => runCommerceEvidenceCli([], io), /Usage:/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
