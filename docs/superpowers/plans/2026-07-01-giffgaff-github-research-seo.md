# giffgaff GitHub Research SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the GitHub repository into a serious Chinese giffgaff / GG 卡 learning hub that points readers to `https://getgiffgaff.com/` and `https://getgiffgaff.com/guides/6-pitfalls/` without copying third-party platform content.

**Architecture:** Keep GitHub as the indexed knowledge base: structured source registry, platform-specific study pages, original tutorial articles, and a README that routes readers to the live website. Keep the website worker as the lightweight public entry point for the most useful guide and a research hub page.

**Tech Stack:** Markdown docs, JSON source registries, Node.js built-in test runner, Cloudflare Pages Worker static asset routing.

## Global Constraints

- Do not copy full text from Zhihu, Douyin, X/Twitter, Bilibili, Xiaohongshu, Kuaishou, WeChat public accounts, blogs, GitHub repos, or forums.
- Store only public links, platform names, topic tags, short original summaries, and official verification notes.
- Claims about activation, roaming, credit, eSIM, deactivation, WiFi Calling, VoLTE, and SMS abuse policy must cite giffgaff official pages when presented as rules.
- README must not use awkward marketing-style repository wording; the title and first paragraph must read as a normal Chinese tutorial repository.
- The repository must link clearly to `https://getgiffgaff.com/`, `https://getgiffgaff.com/shop/`, `https://getgiffgaff.com/contact/`, and `https://getgiffgaff.com/guides/6-pitfalls/`.
- Use `2026-07-01` as the first update date for new research and site pages.
- No new paid API dependency is allowed for this batch.

---

## Worktree And Agent Split

Create four branches from `main` under `.worktrees/`:

- `research-sources`: structured source data and validation.
- `platform-pages`: platform-specific learning pages and source-index expansion.
- `content-cluster`: original SEO article cluster and README article navigation.
- `site-research-hub`: live website research hub route, sitemap injection, and worker tests.

Each branch must commit its own work. The integration pass merges the branches into `main`, resolves conflicts, runs `npm test`, then pushes.

## Task 1: Structured Source Registry

**Files:**
- Create: `docs/research/source-schema.md`
- Create: `docs/research/sources/official.json`
- Create: `docs/research/sources/community.json`
- Create: `scripts/validate-research-sources.mjs`
- Create: `test/research-sources.test.mjs`

**Interfaces:**
- Produces: JSON arrays of source objects with keys `id`, `platform`, `title`, `url`, `topics`, `sourceType`, `publicAccess`, `summary`, `verification`.
- Produces: `validateResearchSources({ rootDir, sourceFiles })` exported from `scripts/validate-research-sources.mjs`.
- Consumes: no earlier task output.

- [ ] **Step 1: Write the failing source validation test**

Create `test/research-sources.test.mjs` with:

```js
import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

import { validateResearchSources } from "../scripts/validate-research-sources.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

test("research source registry is structured, public, and non-verbatim", async () => {
  const result = await validateResearchSources({ rootDir });

  assert.equal(result.errors.length, 0, result.errors.join("\n"));
  assert.ok(result.sourceCount >= 30, "expected at least 30 researched sources");
  assert.ok(result.platforms.has("official"), "official sources are required");
  assert.ok(result.platforms.has("zhihu"), "Zhihu sources are required");
  assert.ok(result.platforms.has("douyin"), "Douyin search sources are required");
  assert.ok(result.platforms.has("bilibili"), "Bilibili sources are required");
  assert.ok(result.platforms.has("x-twitter"), "X/Twitter sources are required");
  assert.ok(result.platforms.has("wechat"), "WeChat/public-account source notes are required");
});
```

- [ ] **Step 2: Run test and confirm it fails because the validator does not exist**

Run: `npm test`

Expected: FAIL with an import error for `scripts/validate-research-sources.mjs`.

- [ ] **Step 3: Add the source schema document**

Create `docs/research/source-schema.md` with these exact sections:

```markdown
# giffgaff / GG 卡资料库字段说明

更新日期：2026-07-01

这个资料库只记录公开链接、主题标签、原创摘要和核查建议，不搬运任何平台全文。

## 字段

- `id`: 稳定短 ID，使用小写字母、数字和连字符。
- `platform`: 来源平台，例如 `official`、`zhihu`、`douyin`、`bilibili`、`x-twitter`、`xiaohongshu`、`kuaishou`、`wechat`、`github`、`v2ex`、`blog`。
- `title`: 链接标题或搜索入口标题。
- `url`: 可公开访问的 URL。
- `topics`: 主题标签数组，例如 `activation`、`roaming`、`credit`、`sms`、`esim`、`deactivation`、`buying`、`risk`。
- `sourceType`: `official-rule`、`community-guide`、`forum-discussion`、`video-search`、`social-post`、`search-entry`、`blog-post` 之一。
- `publicAccess`: `open`、`search-result`、`login-limited`、`unstable` 之一。
- `summary`: 原创摘要，不能复制第三方正文，单条不超过 280 个中文字符。
- `verification`: 这条资料需要用哪些官方页面或实测动作复核。

## 收录原则

1. 官方规则优先，社区内容只作为问题发现和经验补充。
2. 短视频、图文社区和公众号不稳定时，只记录搜索入口或可公开链接。
3. 价格、保号、封号、漫游、eSIM、验证码能否送达这类说法，必须回到官方页面或实测流程核查。
```

- [ ] **Step 4: Add official and community source data**

Create `docs/research/sources/official.json` and `docs/research/sources/community.json`.

The official file must include at least these IDs:

```json
[
  "official-home",
  "official-activate",
  "official-help-activation",
  "official-deactivation",
  "official-roaming",
  "official-credit",
  "official-esim",
  "official-manual-roam",
  "official-network-troubleshooting",
  "official-wifi-calling-volte",
  "official-sms-policy"
]
```

The community file must include at least these platforms:

```json
[
  "github",
  "v2ex",
  "medium",
  "zhihu",
  "bilibili",
  "douyin",
  "youtube",
  "x-twitter",
  "wechat",
  "xiaohongshu",
  "kuaishou",
  "blog"
]
```

- [ ] **Step 5: Implement the validator**

Create `scripts/validate-research-sources.mjs` with:

```js
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = join(__dirname, "..");
const DEFAULT_SOURCE_FILES = [
  "docs/research/sources/official.json",
  "docs/research/sources/community.json",
];

const ALLOWED_ACCESS = new Set(["open", "search-result", "login-limited", "unstable"]);
const ALLOWED_SOURCE_TYPES = new Set([
  "official-rule",
  "community-guide",
  "forum-discussion",
  "video-search",
  "social-post",
  "search-entry",
  "blog-post",
]);

function hasLikelyCopiedBody(summary) {
  return summary.length > 280 || /(\n|。.*。.*。.*。.*。.*。.*。.*。.*。.*。.*。)/.test(summary);
}

export async function validateResearchSources({
  rootDir = DEFAULT_ROOT,
  sourceFiles = DEFAULT_SOURCE_FILES,
} = {}) {
  const errors = [];
  const ids = new Set();
  const platforms = new Set();
  let sourceCount = 0;

  for (const file of sourceFiles) {
    const raw = await readFile(join(rootDir, file), "utf8");
    const entries = JSON.parse(raw);
    if (!Array.isArray(entries)) {
      errors.push(`${file}: expected a JSON array`);
      continue;
    }

    for (const entry of entries) {
      sourceCount += 1;
      const label = `${file}:${entry.id || "missing-id"}`;

      for (const key of ["id", "platform", "title", "url", "topics", "sourceType", "publicAccess", "summary", "verification"]) {
        if (!(key in entry)) errors.push(`${label}: missing ${key}`);
      }

      if (typeof entry.id === "string") {
        if (!/^[a-z0-9-]+$/.test(entry.id)) errors.push(`${label}: id must be lowercase kebab-case`);
        if (ids.has(entry.id)) errors.push(`${label}: duplicate id`);
        ids.add(entry.id);
      }

      if (typeof entry.platform === "string") platforms.add(entry.platform);
      if (!Array.isArray(entry.topics) || entry.topics.length === 0) errors.push(`${label}: topics must be a non-empty array`);
      if (!ALLOWED_SOURCE_TYPES.has(entry.sourceType)) errors.push(`${label}: invalid sourceType`);
      if (!ALLOWED_ACCESS.has(entry.publicAccess)) errors.push(`${label}: invalid publicAccess`);

      try {
        new URL(entry.url);
      } catch {
        errors.push(`${label}: invalid url`);
      }

      if (typeof entry.summary !== "string" || entry.summary.length < 12) errors.push(`${label}: summary too short`);
      if (typeof entry.summary === "string" && hasLikelyCopiedBody(entry.summary)) errors.push(`${label}: summary looks too long or copied`);
      if (typeof entry.verification !== "string" || entry.verification.length < 12) errors.push(`${label}: verification too short`);
    }
  }

  return { errors, sourceCount, platforms };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await validateResearchSources();
  if (result.errors.length > 0) {
    console.error(result.errors.join("\n"));
    process.exit(1);
  }
  console.log(`research sources ok: ${result.sourceCount} sources, ${result.platforms.size} platforms`);
}
```

- [ ] **Step 6: Run validation**

Run: `npm test`

Expected: PASS for existing worker tests and the new research registry test.

- [ ] **Step 7: Commit**

```bash
git add docs/research/source-schema.md docs/research/sources scripts/validate-research-sources.mjs test/research-sources.test.mjs
git commit -m "Add structured giffgaff research source registry"
```

## Task 2: Platform Study Pages

**Files:**
- Create: `docs/platforms/official.md`
- Create: `docs/platforms/zhihu.md`
- Create: `docs/platforms/douyin.md`
- Create: `docs/platforms/bilibili.md`
- Create: `docs/platforms/x-twitter.md`
- Create: `docs/platforms/xiaohongshu.md`
- Create: `docs/platforms/kuaishou.md`
- Create: `docs/platforms/wechat.md`
- Modify: `docs/research/platform-source-index.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: source IDs and themes from Task 1 if already merged; otherwise can use the links already listed in `docs/research/platform-source-index.md`.
- Produces: platform pages that the README and source index can link to.

- [ ] **Step 1: Create one page per platform**

Each page must use this exact heading shape:

```markdown
# giffgaff / GG 卡：平台名资料怎么读

更新日期：2026-07-01

## 这个平台适合看什么

## 重点链接或搜索入口

## 常见说法

## 需要回到官方核查的点

## 推荐下一步
```

- [ ] **Step 2: Add platform-specific facts without copying platform full text**

Use only link titles, short original summaries, and verification notes. The WeChat, Xiaohongshu, and Kuaishou pages must explicitly say public search indexing is unstable, so the repository records search strategy and stable public links rather than copying screenshots or全文.

- [ ] **Step 3: Update source index**

Add a `按平台继续看` section to `docs/research/platform-source-index.md` linking all new platform pages.

- [ ] **Step 4: Update README navigation**

Add a `按平台看资料` section to `README.md` with the platform pages. Keep the first paragraph short and normal; do not add awkward promotional repository wording.

- [ ] **Step 5: Verify links and wording**

Run:

```bash
rg "复制.*全文|搬运.*全文" README.md docs
rg "docs/platforms/(official|zhihu|douyin|bilibili|x-twitter|xiaohongshu|kuaishou|wechat).md" README.md docs/research/platform-source-index.md
```

Expected: first command only finds safety warnings against copying full text, not a repo description; second command finds all platform links.

- [ ] **Step 6: Commit**

```bash
git add README.md docs/platforms docs/research/platform-source-index.md
git commit -m "Add platform-specific GG card study pages"
```

## Task 3: Original Article Cluster

**Files:**
- Create: `docs/articles/giffgaff-verification-code-platforms.md`
- Create: `docs/articles/giffgaff-number-preservation-checklist.md`
- Create: `docs/articles/giffgaff-domestic-activation-failure.md`
- Create: `docs/articles/giffgaff-esim-before-switching.md`
- Create: `docs/articles/giffgaff-buying-risk-checklist.md`
- Modify: `docs/giffgaff-usage-pitfalls.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: official source themes and the current article style.
- Produces: five original long-tail tutorial articles that can rank in GitHub search and route readers to the live website.

- [ ] **Step 1: Write article files**

Each article must include:

```markdown
# 标题

更新日期：2026-07-01

## 先说结论

## 适合谁看

## 操作清单

## 常见踩坑

## 官方核查入口

## 下一步
```

- [ ] **Step 2: Use the exact primary keyword in each title**

Use these title patterns:

```text
giffgaff 收不到验证码：按平台排查 GG 卡短信
giffgaff 保号清单：6 个月不用前要做什么
giffgaff 国内激活失败：从激活码、充值到漫游排查
giffgaff 转 eSIM 前要确认什么
购买 giffgaff / GG 卡前的风险检查清单
```

- [ ] **Step 3: Add internal links**

Every new article must link to:

- `https://getgiffgaff.com/guides/6-pitfalls/`
- `https://getgiffgaff.com/shop/`
- one official giffgaff help page
- two existing repository articles from `docs/articles/`

- [ ] **Step 4: Update hub docs**

Add the five articles to `README.md` and `docs/giffgaff-usage-pitfalls.md`.

- [ ] **Step 5: Verify article coverage**

Run:

```bash
rg "更新日期：2026-07-01" docs/articles docs/giffgaff-usage-pitfalls.md
rg "https://getgiffgaff.com/guides/6-pitfalls/" docs/articles
rg "help.giffgaff.com|www.giffgaff.com/roaming-charges" docs/articles
```

Expected: all five new files have update dates, site links, and official links.

- [ ] **Step 6: Commit**

```bash
git add README.md docs/articles docs/giffgaff-usage-pitfalls.md
git commit -m "Add original GG card SEO article cluster"
```

## Task 4: Website Research Hub Route

**Files:**
- Create: `public/research/index-page.txt`
- Modify: `public/worker-logic.js`
- Modify: `test/contact-worker.test.mjs`

**Interfaces:**
- Consumes: current worker pattern for `/guides/6-pitfalls/`.
- Produces: `/research/` route with an HTML research hub and sitemap injection for `https://getgiffgaff.com/research/`.

- [ ] **Step 1: Add route constants**

In `public/worker-logic.js`, add:

```js
const RESEARCH_PATH = "/research/";
const RESEARCH_ASSET_PATH = "/research/index-page.txt";
```

- [ ] **Step 2: Serve `/research/` from Pages assets**

Mirror the existing pitfalls-guide route:

```js
if (url.pathname === "/research") {
  url.pathname = RESEARCH_PATH;
  return Response.redirect(url.toString(), 301);
}

if (url.pathname === RESEARCH_PATH && env?.ASSETS) {
  const response = await env.ASSETS.fetch(assetRequestFor(request, RESEARCH_ASSET_PATH));
  const headers = new Headers(response.headers);
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "public, max-age=0, must-revalidate");
  headers.set("x-getgiffgaff-hotfix", "research-hub");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
```

- [ ] **Step 3: Inject research URL into sitemap**

Extend sitemap injection so it includes both `/guides/6-pitfalls/` and `/research/`, with `/research/` priority `0.7` and lastmod `2026-07-01T00:00:00.000Z`.

- [ ] **Step 4: Add HTML research hub**

Create `public/research/index-page.txt` as a complete HTML page. It must include links to:

- `https://github.com/siuserxiaowei/getgiffgaff`
- `https://getgiffgaff.com/guides/6-pitfalls/`
- `https://getgiffgaff.com/shop/`
- `https://getgiffgaff.com/contact/`

The page title must be:

```text
giffgaff / GG 卡全网资料索引
```

- [ ] **Step 5: Add worker tests**

Add tests that assert:

```js
assert.equal(response.headers.get("x-getgiffgaff-hotfix"), "research-hub");
assert.match(html, /giffgaff \/ GG 卡全网资料索引/);
assert.match(html, /github\.com\/siuserxiaowei\/getgiffgaff/);
assert.equal(response.status, 301);
assert.equal(response.headers.get("location"), "https://getgiffgaff.com/research/");
assert.match(xml, /https:\/\/getgiffgaff\.com\/research\//);
```

- [ ] **Step 6: Run tests**

Run: `npm test`

Expected: all worker and research route tests pass.

- [ ] **Step 7: Commit**

```bash
git add public/research/index-page.txt public/worker-logic.js test/contact-worker.test.mjs
git commit -m "Add live research hub route"
```

## Task 5: Integration, GitHub SEO Polish, And Publish

**Files:**
- Modify: `README.md`
- Modify: `docs/research/learning-map.md`
- Modify: `package.json` if a new verification script exists after merge.

**Interfaces:**
- Consumes: commits from Tasks 1-4.
- Produces: one merged main branch with GitHub-ready docs and live site route.

- [ ] **Step 1: Merge worktrees into main**

Run from repo root:

```bash
git merge --no-ff research-sources
git merge --no-ff platform-pages
git merge --no-ff content-cluster
git merge --no-ff site-research-hub
```

Resolve conflicts by preserving all new links and keeping README concise.

- [ ] **Step 2: Polish README for GitHub search**

The README must include these exact visible phrases naturally:

```text
giffgaff 中文教程
GG 卡使用教程
giffgaff 保号
giffgaff 收不到验证码
giffgaff eSIM
G0 新卡
G2 有余额卡
```

- [ ] **Step 3: Run verification**

Run:

```bash
npm test
node scripts/validate-research-sources.mjs
rg "awkward-promotional-placeholder-that-should-never-appear" README.md docs public
rg "https://getgiffgaff.com/research/" public test
```

Expected:

- `npm test` passes.
- source validator prints `research sources ok`.
- The awkward promotional wording check returns no matches.
- research URL appears in route page, tests, and sitemap injection.

- [ ] **Step 4: Push**

```bash
git push origin main
```

- [ ] **Step 5: Deploy if the working tree is clean and tests pass**

Run:

```bash
npm run deploy
```

Then verify:

```bash
curl -I https://getgiffgaff.com/research/
curl -I https://getgiffgaff.com/guides/6-pitfalls/
```

Expected: both return HTTP 200 or 304 and the research route includes header `x-getgiffgaff-hotfix: research-hub`.

## Final Review Checklist

- README reads like a normal tutorial hub, not like a clumsy marketing note.
- GitHub repository contains source index, platform pages, source schema, and article cluster.
- Live site has `/guides/6-pitfalls/` and `/research/`.
- No third-party platform full text has been copied.
- Official rule claims link back to giffgaff official pages.
- Tests pass before push and before deploy.
