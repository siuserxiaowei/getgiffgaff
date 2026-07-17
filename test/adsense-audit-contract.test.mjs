import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT = path.join(ROOT, "docs", "adsense", "ADSENSE-AUDIT-2026-07-17.md");
const OWNER_GUIDE = path.join(ROOT, "docs", "adsense", "OWNER-READ-SCREEN-CHECKLIST.md");
const ACCOUNT_FACTS = path.join(ROOT, "docs", "adsense", "OWNER-CONFIRMED-FACTS.md");
const PRIVACY_PAGE = path.join(ROOT, "site", "growth", "privacy", "index.html");

const EXPECTED_IDS = Object.freeze([
  ...["01", "02", "03", "04"].map((id) => `ADS-ELIG-${id}`),
  ...["01", "02", "03"].map((id) => `ADS-OWN-${id}`),
  ...["01", "02"].map((id) => `ADS-SITE-${id}`),
  ...["01", "02"].map((id) => `ADS-TXT-${id}`),
  ...["01", "02", "03", "04", "05", "06", "07", "08"].map((id) => `ADS-CONTENT-${id}`),
  ...["01", "02", "03", "04", "05", "06"].map((id) => `ADS-UX-${id}`),
  ...["01", "02", "03", "04", "05", "06", "07"].map((id) => `ADS-CRAWL-${id}`),
  ...["01", "02", "03", "04", "05", "06", "07"].map((id) => `ADS-PROG-${id}`),
  ...Array.from({ length: 16 }, (_, index) => `ADS-PUB-${String(index + 1).padStart(2, "0")}`),
  ...Array.from({ length: 8 }, (_, index) => `ADS-REST-${String(index + 1).padStart(2, "0")}`),
  ...Array.from({ length: 10 }, (_, index) => `ADS-PRIV-${String(index + 1).padStart(2, "0")}`),
]);

function checklistRows(markdown) {
  return [...markdown.matchAll(
    /^\| (ADS-[A-Z]+-\d{2}) \| (Pass|Fail|Unknown|N\/A) \|/gm,
  )].map((match) => ({ id: match[1], status: match[2] }));
}

test("AdSense audit covers every one of the 73 requirements exactly once", async () => {
  const markdown = await readFile(REPORT, "utf8");
  const rows = checklistRows(markdown);
  const ids = rows.map((row) => row.id);

  assert.equal(EXPECTED_IDS.length, 73);
  assert.equal(rows.length, 73);
  assert.equal(new Set(ids).size, 73);
  assert.deepEqual([...ids].sort(), [...EXPECTED_IDS].sort());
  assert.match(markdown, /Decision:\s*\*\*Not ready\*\*/i);
  assert.match(markdown, /15.*两跳/s);
  assert.match(markdown, /4.*(?:404|政策页)/s);
  assert.match(markdown, /2.*robots/s);
  assert.match(markdown, /73\/73/);
  assert.doesNotMatch(markdown, /保证.*(?:通过|AdSense)/i);
});

test("owner guide is screen-reader friendly and never requests secrets", async () => {
  const markdown = await readFile(OWNER_GUIDE, "utf8");
  assert.match(markdown, /读屏/);
  assert.match(markdown, /只回答“有”或“没有”/);
  assert.match(markdown, /18 岁/);
  assert.match(markdown, /个人.*企业/s);
  assert.match(markdown, /公开联系邮箱/);
  assert.match(markdown, /不要.*(?:密码|OTP|验证码)/s);
  assert.match(markdown, /不要.*(?:身份证|银行卡)/s);
});

test("confirmed account facts update the audit without inventing an account or publisher ID", async () => {
  const [report, facts, privacy] = await Promise.all([
    readFile(REPORT, "utf8"),
    readFile(ACCOUNT_FACTS, "utf8"),
    readFile(PRIVACY_PAGE, "utf8"),
  ]);

  assert.match(report, /21 Pass、16 Fail、10 Unknown、26 N\/A/);
  assert.match(
    report,
    /^\| ADS-ELIG-01 \| Pass \| 申请人已确认年满 18 岁/m,
  );
  assert.match(
    report,
    /^\| ADS-ELIG-02 \| Pass \| 申请人已确认当前没有 AdSense 账号/m,
  );
  assert.match(
    report,
    /^\| ADS-SITE-01 \| N\/A \| 当前没有 AdSense 账号/m,
  );
  assert.match(report, /个人账号路径/);
  assert.match(report, /siuserxy@gmail\.com/);
  assert.match(facts, /账号类型：个人/);
  assert.match(facts, /publisher ID：尚未分配/);
  assert.doesNotMatch(facts, /\b(?:ca-)?pub-\d{16}\b/);
  assert.match(privacy, /mailto:siuserxy@gmail\.com/);
  assert.match(privacy, /尚未启用 Google AdSense/);
  assert.match(privacy, /本页仍不是完整隐私政策/);
});
