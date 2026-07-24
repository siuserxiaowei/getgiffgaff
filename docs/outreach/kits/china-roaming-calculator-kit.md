# China PAYG roaming calculator editorial kit / 中国 PAYG 漫游试算编辑资料包

Status: **`release-gated — do not publish, syndicate, or pitch yet`**<br>
Prepared: 2026-07-24 (Asia/Shanghai)<br>
Evidence retrieved: 2026-07-24<br>
Evidence expires: 2026-08-22<br>
Proposed public asset: `https://getgiffgaff.com/tools/china-roaming-cost/`

This kit documents the E08 calculation fix and gives editors a source-traceable way to assess the methodology. The E08 unit tests pass locally, but that does not prove that the corrected build is live, that an editor has reviewed it, or that a real giffgaff bill will equal an estimate. Keep the kit behind the release gate until every item in the final checklist passes.

本资料包记录 E08 计费修复，方便编辑逐项核对方法和官方来源。E08 专项测试已在本地通过，但这不证明修复版本已经上线、编辑已经审阅，或真实 giffgaff 账单会与试算相同。发布前测试清单未全部通过时，不得发布或用于外联。

## One-sentence scope / 一句话范围

The calculator estimates how much **giffgaff account Credit** the listed China PAYG usage could consume under a dated public rate card; it is not an invoice, tariff guarantee, coverage test, or comparison of the cheapest option.

本工具根据带核验期限的公开费率卡，试算中国漫游用量可能消耗多少 **giffgaff 账户 Credit**；它不是账单、资费承诺、覆盖测试，也不是“最便宜方案”比较。

## Official primary sources / 官方一手来源

| Source | What this kit uses it for | Retrieved | Recheck no later than |
|---|---|---:|---:|
| [giffgaff — Roaming charges in China](https://www.giffgaff.com/roaming/china) | China rates, call billing units, Travel Data Add-on distinction and PAYG/Credit context | 2026-07-24 | 2026-08-22 |
| [giffgaff Help — Everything to know about Credit](https://help.giffgaff.com/en/articles/240847-everything-to-know-about-credit) | Definition and use of account Credit | 2026-07-24 | 2026-08-22 |
| [giffgaff Help — Travel Data Add-ons and how they work](https://help.giffgaff.com/en/articles/365501-giffgaff-travel-data-add-ons-and-how-they-work) | App-only purchase route and country-specific non-EU scope, including China | 2026-07-24 | 2026-08-22 |

The dates above are this project's evidence window, not a promise that the source will remain unchanged until the expiry date. If any source changes earlier, the rate card must be treated as stale immediately.

## What “PAYG Credit” means here / 本资料包怎样使用“PAYG Credit”

giffgaff describes Credit as money added to an account that can pay for services outside a plan, or for standard calls, texts and data when a plan has expired or is not being used. In this kit, “China PAYG Credit estimate” has a narrower operational meaning:

- the destination is China;
- the calculation uses the public China PAYG/Credit rates listed below;
- the result is denominated in GBP and represents a possible Credit deduction under those inputs;
- a Travel Data Add-on, plan allowance, voucher purchase, top-up amount, card price and currency conversion are not included;
- the result is a planning estimate, not an observed account deduction or invoice.

“Credit balance” and “cost” are not interchangeable. Adding £10 Credit is a top-up action; it does not mean a sample use costs £10. Conversely, an estimated £4.80 usage cost does not establish what a user's balance was before or after an actual session.

## Dated rate card / 带期限的费率卡

The accepted rate inputs for this documentation window are:

| Component | Dated public rate | Billing boundary used by E08 | Included in calculator total? |
|---|---:|---|---|
| Data | £0.20 per MB | input MB × £0.20 | Yes |
| Outgoing call | £1.00 per minute | each call separately; first 30 seconds are the minimum, then whole-second increments | Yes, one outgoing call per calculation |
| Incoming call | £1.00 per minute | each call separately; every positive duration rounds up to a whole billed minute | Yes, one incoming call per calculation |
| Sent SMS | £0.30 per text | non-negative whole-number count × £0.30 | Yes |
| Received SMS | Free on the dated public page | no charge | Not an input; documented only |
| MMS | Separate public rates exist | not modelled | No |
| Voicemail | Listed with calls on the source page | not modelled as a distinct input | No |
| Travel Data Add-on | Separate product route | excluded from every formula and total | No |

All numeric output must fail closed after `2026-08-22` unless a reviewer rechecks the official pages, updates the evidence dates and rate card, and reruns the release tests.

## Formula and billing boundaries / 公式与计费边界

### Data

```text
data_cost_gbp = input_megabytes × 0.20
```

The input is a planning quantity. Background traffic, device accounting and network-side metering can differ from a user's manual estimate.

### Sent SMS

```text
sent_sms_cost_gbp = integer_sent_sms_count × 0.30
```

The runtime rejects fractional SMS counts. Received SMS is shown as free on the dated China rate page but is not an input and does not create a negative or offsetting amount.

### Outgoing calls

For each outgoing call separately:

```text
actual_seconds = duration_minutes × 60
billed_seconds = 0                                      when duration = 0
billed_seconds = max(30, ceil(actual_seconds))          when duration > 0
outgoing_call_cost_gbp = billed_seconds ÷ 60 × 1.00
```

The component amount is displayed to two decimal places. “After the first 30 seconds, per-second increments” does not permit aggregating several short calls before applying the 30-second minimum.

### Incoming calls

For each incoming call separately:

```text
billed_minutes = 0                       when duration = 0
billed_minutes = ceil(duration_minutes)  when duration > 0
incoming_call_cost_gbp = billed_minutes × 1.00
```

Several incoming calls must not be merged before rounding. For example, two separate 0.1-minute incoming calls each round to one billed minute under this method.

### Total

```text
estimated_total_gbp =
  data_cost_gbp
  + sent_sms_cost_gbp
  + outgoing_call_cost_gbp
  + incoming_call_cost_gbp
```

The current interface models one outgoing and one incoming call per calculation. To discuss multiple calls, compute each call separately and sum their charge components. Do not enter an aggregate call duration and present it as equivalent.

## Explainable breakdown example / 可解释的分项示例

Illustrative inputs, using the rate card retrieved on 2026-07-24:

- 10 MB of data;
- 1 sent SMS;
- one outgoing call lasting 0.1 minute (6 actual seconds);
- one incoming call lasting 1.1 minutes.

| Component | Calculation | Illustrative amount |
|---|---|---:|
| Data | 10 MB × £0.20/MB | £2.00 |
| Sent SMS | 1 × £0.30 | £0.30 |
| Outgoing call | 6 actual seconds → 30 billed seconds → 30/60 × £1.00 | £0.50 |
| Incoming call | 1.1 actual minutes → 2 billed minutes → 2 × £1.00 | £2.00 |
| **Estimated PAYG Credit total** | sum of the four components | **£4.80** |

This is a deterministic method example, not a real customer session or an actual bill. It does not include MMS, voicemail, a plan, a Travel Data Add-on, taxes or adjustments not represented on the cited destination table, foreign-exchange conversion, or other account activity.

### Why per-call calculation matters

| Usage pattern | Correct method | Why aggregation is unsafe |
|---|---:|---|
| Two separate 0.1-minute outgoing calls | 2 × £0.50 = £1.00 | each call has its own 30-second minimum |
| Two separate 0.1-minute incoming calls | 2 × £1.00 = £2.00 | each call rounds up to one minute |

These rows explain the billing boundary; they are not claims about an observed invoice.

## Travel Data Add-on exclusion / Travel Data Add-on 排除项

The calculator's numeric output is **PAYG Credit only**. A Travel Data Add-on is a separate route and must not be silently included in or compared against the total.

The official pages retrieved on 2026-07-24 indicate that:

- Travel Data Add-ons are purchased through the giffgaff app;
- China is listed among the supported non-EU destinations;
- a non-EU add-on is country-specific;
- the roaming page presents 1 GB, 5 GB and 10 GB sizes and a 30-day term.

This kit intentionally does not freeze a China add-on price. It also does not calculate add-on purchase cost, remaining allowance, activation, eligibility, expiry consumption, coverage, speed, or what happens after an allowance is exhausted. Editors should link to the official add-on source rather than infer that PAYG is cheaper, dearer or more suitable.

## Retrieved/expires policy / 核验与失效规则

- `retrievedAt` records when a reviewer successfully read the official source and matched every numeric field and billing rule.
- `expiresAt` is the last day this project permits numeric output without a fresh review.
- The calculation may run on `expiresAt`; it must return no numeric result after that date.
- A source change, redirect to materially different content, inaccessible rate table, currency change, or ambiguous billing text makes the card stale immediately, even before `expiresAt`.
- A stale or invalid card must produce a non-numeric “recheck the official source” state. It must not reuse the previous total with a warning badge.
- Extending `expiresAt` without re-reading all official sources and recording a reviewer is prohibited.

## Machine-readable rate-card draft / 机器可读费率卡草案

The JSON below is a documentation example only. E16 does **not** add it as a runtime asset, endpoint, downloadable data feed or public API. If a future task adopts it, it needs schema validation, ownership, change logging, a runtime stale-state test and a separate review.

```json
{
  "schemaVersion": "draft-1",
  "status": "release-gated",
  "runtimeAsset": false,
  "id": "giffgaff-china-payg-credit-2026-07-24",
  "destination": {
    "name": "China",
    "isoCountryCode": "CN"
  },
  "scope": "payg-credit-only",
  "currency": "GBP",
  "retrievedAt": "2026-07-24",
  "expiresAt": "2026-08-22",
  "rates": {
    "data": {
      "rate": 0.2,
      "rateUnit": "megabyte",
      "formula": "megabytes * rate"
    },
    "sentSms": {
      "rate": 0.3,
      "rateUnit": "message",
      "inputConstraint": "non-negative-integer"
    },
    "receivedSms": {
      "rate": 0,
      "rateUnit": "message",
      "calculatorInput": false
    },
    "outgoingCall": {
      "rate": 1,
      "rateUnit": "minute",
      "calculationUnit": "second",
      "minimumBillableSecondsPerCall": 30,
      "rounding": "ceil-to-whole-second-after-minimum",
      "perCall": true
    },
    "incomingCall": {
      "rate": 1,
      "rateUnit": "minute",
      "minimumBillableMinutesPerPositiveCall": 1,
      "rounding": "ceil-to-whole-minute",
      "perCall": true
    }
  },
  "exclusions": [
    "travel-data-add-on",
    "plans",
    "mms",
    "voicemail-as-a-distinct-input",
    "coverage-or-network-performance",
    "otp-delivery",
    "actual-bill-or-account-adjustments",
    "currency-conversion"
  ],
  "sources": [
    {
      "role": "china-rates-and-billing-units",
      "url": "https://www.giffgaff.com/roaming/china"
    },
    {
      "role": "credit-definition",
      "url": "https://help.giffgaff.com/en/articles/240847-everything-to-know-about-credit"
    },
    {
      "role": "travel-data-add-on-boundary",
      "url": "https://help.giffgaff.com/en/articles/365501-giffgaff-travel-data-add-ons-and-how-they-work"
    }
  ],
  "disclaimer": "Planning estimate only; not an actual bill and not a cheapest-option claim."
}
```

## Editor-ready citation sentences / 编辑可用引用句

Use only after the release gate passes and recheck the linked source on the publication date.

### Short Chinese citation

> getgiffgaff 的中国漫游工具按 giffgaff 公开的中国 PAYG Credit 费率逐项试算，并把拨出电话的单次 30 秒最低计费、之后按秒，以及接听电话逐通向上取整到整分钟分别显示；费率核验于 2026-07-24，当前证据窗口截至 2026-08-22。它不包含 Travel Data Add-on，也不代表实际账单。

### Short English citation

> getgiffgaff's China roaming tool provides a component-level estimate using giffgaff's public China PAYG Credit rates, applying the per-call 30-second minimum followed by per-second billing for outgoing calls and whole-minute rounding for incoming calls. Its rate evidence was retrieved on 17 July 2026 and expires on 15 August 2026; it excludes Travel Data Add-ons and is not an actual bill.

### Method citation without linking to the tool

> On the giffgaff China roaming page retrieved 17 July 2026, outgoing calls were listed at £1 per minute in per-second increments after the first 30 seconds, incoming calls at £1 per minute in per-minute increments, data at 20p per MB and sent texts at 30p each. See the [official destination rate page](https://www.giffgaff.com/roaming/china) and recheck it before publication.

Editors may shorten or rewrite these sentences. Whether to cite the tool, cite only the official source, use no link, and choose any anchor wording remains entirely their editorial decision.

## Appropriate editorial uses / 适合的编辑用途

- Explain why fractional call duration must respect the carrier's billing unit.
- Add a dated China example to a broader giffgaff roaming guide.
- Distinguish PAYG Credit from the separate Travel Data Add-on path.
- Show an auditable calculation breakdown instead of publishing an unexplained total.
- Provide a correction note when existing copy multiplies fractional minutes without per-call rounding.
- Give Chinese-speaking readers a methodology companion while keeping the official page as the primary rate source.

This kit is not permission to reuse giffgaff logos, screenshots or substantial official copy. It does not require an editor to link to getgiffgaff and must not be conditioned on payment, reciprocal linking, a specified anchor, dofollow treatment, review coverage or endorsement.

## Disclosure and claims boundary / 披露与不可宣称事项

Any excerpt or editorial pitch using this kit must disclose:

- getgiffgaff is an independent third-party Chinese-language tutorial and SIM-card sales service;
- it is not giffgaff, the official giffgaff website, or an authorised representative;
- the calculator is a client-side planning tool using dated public sources;
- the rate evidence can expire and numeric output is intended to fail closed;
- the Travel Data Add-on is excluded.

Do **not** claim or imply that:

- the output is an actual bill, observed deduction, quote, invoice or guaranteed maximum;
- PAYG, giffgaff, getgiffgaff, or any card/add-on is the cheapest, best or most suitable option;
- giffgaff, an editor or a publisher tested, approved, certified, endorsed or partnered with the tool;
- the rate will remain available or unchanged beyond the evidence window;
- the tool covers MMS, voicemail, plans, Travel Data Add-ons, exchange rates, taxes, adjustments or all account activity;
- the result proves network availability, coverage, speed, ordinary SMS delivery, OTP delivery, account status or number retention;
- the local E08 test result proves the corrected production asset is live;
- a public contact route or this editorial kit grants permission to pitch or guarantees a backlink.

## Release and pre-publication test checklist / 发布前测试清单

All boxes must be checked by a named human reviewer. Until then, status remains `release-gated`.

### Source and rate review

- [ ] Open all three official URLs in this kit; record HTTP/final URL, retrieved time and reviewer.
- [ ] Confirm China data, outgoing-call, incoming-call, sent-SMS and received-SMS values against the visible official page.
- [ ] Confirm outgoing calls still use a 30-second minimum followed by per-second increments.
- [ ] Confirm incoming calls still use per-minute increments and that per-call rounding remains the correct bounded interpretation.
- [ ] Confirm China remains listed for the non-EU Travel Data Add-on and recheck its purchase route and term.
- [ ] Update `retrievedAt` and set a newly reviewed `expiresAt`; never extend dates mechanically.
- [ ] If any field is missing, ambiguous or changed, keep numeric output disabled and revise the method before release.

### Calculation tests

- [ ] Run `node --test test/roaming-cost.test.mjs` and retain the passing output.
- [ ] Verify zero usage returns £0.00 rather than a minimum charge.
- [ ] Verify a 0.1-minute outgoing call bills 30 seconds and £0.50 at the documented £1/min rate.
- [ ] Verify a 0.51-minute outgoing call bills 31 seconds and displays £0.52.
- [ ] Verify a 1.1-minute outgoing call bills 66 seconds and £1.10.
- [ ] Verify a 0.1-minute incoming call bills one minute and £1.00.
- [ ] Verify a 1.1-minute incoming call bills two minutes and £2.00.
- [ ] Verify the 10 MB + 1 sent SMS + 0.1-minute outgoing + 1.1-minute incoming example breaks down to £4.80.
- [ ] Verify blank, negative, non-finite and fractional-SMS inputs do not produce a numeric result.
- [ ] Verify multiple calls are documented and calculated per call, never by aggregating duration before rounding.
- [ ] Verify the day after `expiresAt` returns no numeric result and instructs the user to recheck the official source.

### Page and disclosure review

- [ ] Confirm the page says `PAYG Credit`, not a generic all-inclusive roaming price.
- [ ] Confirm the breakdown visibly shows data, sent SMS, outgoing billed seconds and incoming billed minutes.
- [ ] Confirm Travel Data Add-on exclusion and the official add-on link are visible beside the method.
- [ ] Confirm the output says estimate and not actual bill; remove every “cheapest”, “best” or equivalent superlative.
- [ ] Confirm independent third-party tutorial **and sales-service** identity is visible.
- [ ] Confirm no coverage, OTP, number-retention, plan, add-on-price or partnership guarantee is present.
- [ ] Confirm no phone number, account identifier, precise location or payment information is collected by the calculator.
- [ ] Confirm this JSON remains documentation-only unless a separately reviewed task deliberately creates a runtime asset.

### Build, production and outreach gate

- [ ] Run the full repository verification required by the release runbook and retain the output.
- [ ] Build and verify the release artifact; confirm the corrected tool code and page are in that artifact.
- [ ] Complete the pending Cloudflare canonical redirect update before relying on the production URL.
- [ ] Run `npm run postdeploy` only after the redirect update and retain a fully passing result.
- [ ] On production, repeat the boundary inputs and expiry/fail-closed checks in a real browser.
- [ ] Confirm the canonical URL resolves in one hop, is indexable as intended, and its official-source links reach the expected pages.
- [ ] Have a reviewer compare the live production output with this kit and record the review date.
- [ ] Recheck the target publisher's current editorial/contact policy before any pitch.
- [ ] Send no bulk mail, offer no payment or reciprocal link, request no specified anchor/dofollow, and leave citation/link decisions to the editor.
- [ ] Change status from `release-gated` only after all required checks above pass; local E08 tests alone are insufficient.

## Review record / 审核记录

| Review area | Reviewer | Evidence or command output | Date | Decision |
|---|---|---|---|---|
| Official sources |  |  |  | `hold / pass` |
| Formula and tests |  |  |  | `hold / pass` |
| Identity and claims |  |  |  | `hold / pass` |
| Release artifact |  |  |  | `hold / pass` |
| Production/postdeploy |  |  |  | `hold / pass` |
| Target editorial policy |  |  |  | `hold / pass` |

An empty review record means the kit remains on hold. A completed record permits a human to consider one target-specific editorial suggestion; it does not mean the target accepted it or that a backlink exists.
