# ssnhd/giffgaff contribution proposal / 贡献提案草稿

Status: **`DO NOT OPEN UNTIL PERMISSION`**<br>
Prepared: 2026-07-17 (Asia/Shanghai)<br>
Target: [ssnhd/giffgaff](https://github.com/ssnhd/giffgaff)<br>
External action taken: **none** — no Issue, Discussion, pull request, comment, email or direct message was created

This document is an internal two-stage workflow. It is not an Issue body ready to post. The first stage asks whether a narrowly scoped contribution is welcome; the second stage is allowed only after the maintainer gives explicit permission for the relevant contribution type.

本文是内部两阶段流程，不是可以直接发布的 Issue 正文。第一阶段只询问维护者是否接受范围很小的外部建议；只有维护者对相应贡献类型作出明确许可，才能进入第二阶段。

## Current bounded repository state / 当前可确认的仓库状态

Read-only checks on 2026-07-17 found:

- the public README was readable from `https://raw.githubusercontent.com/ssnhd/giffgaff/master/README.md`;
- the following common policy paths returned HTTP 404 on the `master` branch:
  - `CONTRIBUTING.md`
  - `.github/CONTRIBUTING.md`
  - `CODE_OF_CONDUCT.md`
  - `SECURITY.md`
  - `LICENSE`
  - `LICENSE.md`
- the GitHub repository page/API returned 403 to this unauthenticated read-only check, so directory-level policy discovery was not completed.

The correct conclusion is: **no CONTRIBUTING guidance was found in the checked paths**. This does not prove that the maintainer welcomes Issues, pull requests, external tools, commercial resources or link suggestions. Missing policy is not permission.

Before any contact, a human must recheck the repository page, default branch, README, `.github/`, Issue/Discussion availability and any newly published contribution policy in a normal browser.

## Non-negotiable boundaries / 不可绕过的边界

- **DO NOT OPEN UNTIL PERMISSION.** Do not open an Issue, Discussion or pull request merely because no `CONTRIBUTING` file was found.
- One pre-inquiry at most, through a maintainer-approved public channel. Do not repeat it across Issue, Discussion, email, social accounts and comments.
- Keep two permission questions separate:
  1. Does the maintainer accept reproducible factual corrections?
  2. Does the maintainer accept optional external tool/resource suggestions from a commercially interested site?
- Permission for a factual correction is not permission to add a getgiffgaff link. Permission to mention an external resource is not permission to rewrite unrelated README content.
- Disclose that getgiffgaff is an independent Chinese-language tutorial **and SIM-card sales service**, not giffgaff, its official site or an authorised representative.
- Do not offer or request payment, products, commission, reciprocal links, stars, follows, promotion or any other consideration.
- Do not request a specified anchor, keyword-rich anchor, dofollow treatment, placement, endorsement or retention period.
- Do not turn an Issue title or body into an advertisement. No screenshots of sales pages, QR codes, prices, inventory, shipping, customer-service contacts or purchase CTA.
- Do not paste substantially identical messages into other repositories. No Issue spam, comment spam or automated follow-up.
- A non-response is not permission. A reaction emoji, Issue label or automated bot response is not permission unless it unambiguously authorises the proposed contribution type.
- If the maintainer declines, closes the inquiry as unwanted, or requests no further contact, record `declined` and stop.

## Permission ledger / 许可台账

Do not advance a row without a public permalink or retained maintainer message whose meaning is explicit.

| Contribution type | State | Required evidence | Allowed next action |
|---|---|---|---|
| Reproducible factual correction | `permission-not-requested` | Maintainer explicitly says a narrowly scoped correction/diff is welcome | Prepare one minimal correction proposal |
| External getgiffgaff tool/resource | `permission-not-requested` | Maintainer explicitly says third-party commercial resources may be proposed and understands the sales relationship | Prepare one optional, removable resource line |
| README pull request | `blocked` | Maintainer asks for or authorises a PR and supplies preferred workflow/branch | Prepare a minimal diff; do not bundle extras |

“You can send the correction” permits only the correction. It does not change the tool/resource row.

---

## Stage 1 — non-promotional permission pre-inquiry

### Pre-send checklist

- [ ] Recheck current default branch and every contribution/policy location.
- [ ] Confirm the proposed channel is permitted for a short process question.
- [ ] Remove all tool URLs, sales URLs, product claims and suggested anchor text from the pre-inquiry.
- [ ] Identify one factual passage that can be reproduced from the current README and one current official primary source.
- [ ] Verify the official source on the day of contact and save the checked date.
- [ ] Keep the request answerable with “yes”, “facts only”, “resources also welcome”, or “no”.
- [ ] Assign a human owner; automated posting is prohibited.

### Chinese pre-inquiry draft / 中文预询问草稿

**Title:** `Pre-inquiry: does this repository accept small primary-source corrections or external resource suggestions?`

维护者您好：

我在阅读这个仓库的 giffgaff 中文 README。准备任何修改前，想先确认这里是否接受外部贡献，以及您希望使用哪种流程。

我的两个问题彼此独立：

1. 是否接受范围很小、可复现、附 giffgaff 当前官方来源与核验日期的事实勘误？
2. 是否接受外部工具/资源建议？如果不接受商业相关资源，我只会考虑第 1 类事实勘误，不会加入任何自有链接。

关系披露：getgiffgaff 是面向中文用户的独立第三方教程与 SIM 卡销售服务站，不是 giffgaff 官方或授权代表。我与本仓库维护者没有已知的官方或商业关系。

这不是 backlink、anchor、dofollow、置顶、背书或互链请求。我不会提供或要求付款、产品、佣金、star、关注、推广或其他对价，也不会在未获许可时提交 Issue/PR 内容或重复联系。

如果您不接受外部建议，直接回复“不接受”即可；不回复也会被视为没有许可，我不会继续。若接受，请告知可接受的类型（仅事实勘误 / 也可审阅外部资源）和您偏好的提交方式。

谢谢。

### English pre-inquiry draft

**Title:** `Pre-inquiry: does this repository accept small primary-source corrections or external resource suggestions?`

Hello maintainer,

I have been reading this repository's Chinese-language giffgaff README. Before preparing any change, I would like to ask whether external contributions are welcome and which workflow you prefer.

My two questions are independent:

1. Do you accept small, reproducible factual corrections supported by a current official giffgaff source and checked date?
2. Do you accept suggestions for external tools/resources? If commercially connected resources are not welcome, I would consider only the factual-correction route and include no self-owned link.

Relationship disclosure: getgiffgaff is an independent third-party Chinese-language tutorial and SIM-card sales service. It is not giffgaff, the official giffgaff website, or an authorised representative. I have no known official or commercial relationship with this repository's maintainer.

This is not a request for a backlink, specified anchor, dofollow treatment, placement, endorsement or reciprocal link. I am not offering or asking for payment, products, commission, stars, follows, promotion or any other consideration, and I will not post proposed Issue/PR content or contact you repeatedly without permission.

If outside suggestions are not welcome, a simple “no” is sufficient. No response will also be treated as no permission and I will not proceed. If they are welcome, please indicate the acceptable type (factual corrections only / external resources may also be reviewed) and your preferred submission method.

Thank you.

### Stage 1 decision

| Field | Value |
|---|---|
| Permission channel | `[not selected]` |
| Policy evidence | `[not verified]` |
| Pre-inquiry sent | `no` |
| Maintainer response | `[empty]` |
| Factual correction permission | `not granted` |
| External resource permission | `not granted` |
| PR permission | `not granted` |

**Stop condition:** unless a permission field changes to `explicitly granted` with evidence, do not prepare or open a repository submission.

---

## Stage 2A — reproducible factual correction, only after explicit permission

This path is for facts already present in the README. It must remain usable if every getgiffgaff reference is removed.

### Reproducibility package template

Copy and complete all fields. Missing evidence means `hold`, not “best effort”.

````markdown
## Proposed factual correction

### Permission
- Maintainer permission URL/message: [required]
- Permission date: [YYYY-MM-DD]
- Permitted submission route: [Issue / Discussion / PR / other]

### Current README text
- Default branch and commit SHA: [required]
- File: README.md
- Heading: [exact heading]
- Line(s): [exact current line numbers]
- Exact current text:
  > [verbatim short excerpt]

### Claim to verify
- Atomic claim: [one claim only]
- Why it may need revision: [neutral explanation; do not assume bad intent]

### Official primary evidence
- Source owner: giffgaff
- Source title: [exact page title]
- Final URL: [official URL]
- HTTP/final-page result: [status and redirect result]
- Retrieved at: [timestamp + timezone]
- Exact supporting excerpt: [short quotation]
- Scope/conditions: [country, account state, per-call unit, date, etc.]
- Counter-evidence checked: [other official page or conflict search]
- Source expiry/recheck date: [YYYY-MM-DD]

### Minimal proposed replacement
```diff
- [current README sentence]
+ [narrow replacement sentence]
```

### Verification
- Re-fetch the README at the recorded SHA.
- Open the official source without authentication.
- Confirm the excerpt supports every word of the replacement.
- Confirm no unrelated content, tool link, sales link or anchor request is included.
- Confirm the correction remains useful if getgiffgaff disappears.

### Relationship and consideration disclosure
getgiffgaff is an independent third-party Chinese-language tutorial and SIM-card sales service,
not giffgaff, its official site or an authorised representative. No payment, product, commission,
reciprocal link, specified anchor, dofollow treatment, promotion or endorsement is offered or requested.
````

### Internal evidence example — inactivity wording (not a prepared submission)

This is an internal candidate, not permission to post. Recheck both texts immediately before any submission.

**Observed README wording on 2026-07-17:**

> 每 180 天内余额变动（消费或充值）自动延长 180 天，可以执行以下任一操作：

**Official page checked on 2026-07-17:** [Understanding why your number has been deactivated](https://help.giffgaff.com/en/articles/242797-understanding-why-your-number-has-been-deactivated)

The official page frames inactivity as no listed use for six months. It lists an eligible outgoing call/SMS/MMS, a mobile-data connection, or an Airtime Credit/plan purchase as actions that prevent inactivity deactivation. It does not frame the rule simply as any balance change or promise a rolling 180-day extension from every event.

The example below shows only how an atomic correction could be represented for reproducibility. It is not a prepared README suggestion and must not be copied into GitHub. After explicit permission, a human must re-fetch the permitted commit, recheck the official page, and create a new minimal diff from those current texts.

**Illustrative diff shape only:**

```diff
- 每 180 天内余额变动（消费或充值）自动延长 180 天，可以执行以下任一操作：
+ 为避免因不活跃停用，请至少每 6 个月完成一次 giffgaff 当前官方列出的有效动作，并在操作前复核官方规则：
```

The existing bullet list would then need its own line-by-line comparison with the current official list. Do not add “receiving SMS” as a qualifying action; it was not in the official list retrieved on 2026-07-17. Do not promise that an action guarantees permanent number retention or recovery after deactivation.

### Evidence retrieval example

The commands below are for reproducibility after permission, not for posting or writing to GitHub:

```bash
/usr/bin/curl -fsSL \
  "https://raw.githubusercontent.com/ssnhd/giffgaff/<PERMITTED_COMMIT_SHA>/README.md"

/usr/bin/curl -fsSL \
  "https://r.jina.ai/https://help.giffgaff.com/en/articles/242797-understanding-why-your-number-has-been-deactivated"
```

Record the output timestamp and exact excerpts. If the official page is inaccessible or materially different, do not submit the correction until a human resolves the evidence gap.

---

## Stage 2B — optional external tool/resource, only after separate explicit permission

Do not enter this stage when the maintainer grants “facts only”. An external resource is commercially connected even if the tool is free, educational and client-side.

### Additional gate

- [ ] Maintainer explicitly permits an external resource from a SIM-card sales service.
- [ ] The exact resource is factual, live, current, accessible and independently reviewed.
- [ ] The page visibly discloses the independent third-party tutorial and sales relationship.
- [ ] All release, production and evidence-expiry gates are green.
- [ ] The suggestion is useful without a keyword-rich anchor.
- [ ] The README change is one optional line in a clearly appropriate resources section.
- [ ] The maintainer may remove, rewrite, nofollow or omit the link without affecting any factual correction.
- [ ] No reciprocal link, payment, product, commission, ranking benefit, Issue promotion or retention request exists.

### Minimal resource suggestion template

Use only the one exact asset the maintainer permitted. Do not bundle the calculator, reminder, buying guide and sales pages.

```markdown
Permission reference: [maintainer's explicit resource permission]

Relationship disclosure: getgiffgaff is an independent third-party Chinese-language tutorial and
SIM-card sales service. It is not giffgaff, its official site or an authorised representative.

Optional resource for editorial review:
- URL: [one reviewed non-purchase asset]
- Reader task: [one neutral sentence]
- Official sources shown on asset: [URLs]
- Checked/expires dates: [dates]
- Data/privacy boundary: [what it does not collect]
- Claims boundary: [not an actual bill / not OTP guarantee / other relevant limitation]

No payment, product, commission, reciprocal link, specified anchor, dofollow treatment, placement,
promotion or endorsement is offered or requested. Whether to include a link, the wording of any
anchor, placement, rel attributes, and whether to remove it later are entirely the maintainer's choice.
```

### Minimal README shape

Only if the maintainer requests an actual line, a neutral shape is:

```diff
 ## [Maintainer-selected resources heading]

+ - [Maintainer-written neutral label] — [one-sentence task description and independently reviewed URL]. Third-party commercial resource; not affiliated with giffgaff.
```

Do not preselect or negotiate the anchor. The maintainer may write plain text, use a naked URL, cite only the official source, or decline the resource entirely.

---

## Submission hygiene / 提交卫生

If and only if the maintainer authorises a submission:

1. Pin the current README commit SHA and reproduce the exact relevant passage.
2. Prepare one atomic change for one permitted contribution type.
3. Do not combine factual corrections with external-resource additions unless the maintainer explicitly requests both in one submission.
4. Show the smallest diff first; explanation follows evidence, not marketing.
5. Use the maintainer's preferred route. Do not open both an Issue and a PR for the same proposal.
6. Do not mention SEO, GEO, rankings, backlinks, domain authority, anchor strategy or traffic.
7. Do not follow up more than once, and only if the maintainer's stated process allows it.
8. Record the public outcome accurately: `permission granted`, `submitted`, `declined`, `closed`, or `merged`. Never convert silence into acceptance.
9. A merged factual correction is not an endorsement of getgiffgaff. A retained link is not proof of partnership or official status.

## Final human review record

| Gate | Reviewer | Evidence | Date | Result |
|---|---|---|---|---|
| Current contribution policy rechecked |  |  |  | `hold / pass` |
| Permission pre-inquiry channel allowed |  |  |  | `hold / pass` |
| Factual correction permission |  |  |  | `not granted / granted` |
| External resource permission |  |  |  | `not granted / granted` |
| Official evidence current |  |  |  | `hold / pass` |
| Minimal diff reviewed |  |  |  | `hold / pass` |
| Independent sales relationship disclosed |  |  |  | `hold / pass` |
| No consideration/anchor/Issue-spam risk |  |  |  | `hold / pass` |

With empty rows, the only valid status is **`DO NOT OPEN UNTIL PERMISSION`**.
