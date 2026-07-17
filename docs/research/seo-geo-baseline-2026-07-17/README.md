# getgiffgaff SEO/GEO research baseline

Date: 2026-07-17 (Asia/Shanghai)
Mode: research artifacts only
Decision: no AdSense, site implementation, deployment, commit, merge, outreach, account login or third-party write action

## What this package implements

This package turns the approved 90-day plan into a reproducible research baseline and decision-ready implementation specification. It does not change a public page, API, route, index directive, crawler policy or account setting.

The package contains:

- `baseline-manifest.json`: repository, production and tool fingerprints plus explicit limitations.
- `query-owners.tsv`: seven provisional query owners shared by the China and UK-arrival audiences.
- `production-url-baseline.tsv`: one read-only HTTP/HTML observation for every production sitemap URL.
- `public-search-observations.tsv` and `public-search-results.tsv`: public search attempts, usable observations and failure states.
- `page-governance.tsv`: the 17 short-body screening results, the confirmed duplicate pair and the evidence required before a page action.
- `claim-freshness.tsv`: claim-level source, review and expiry requirements for the seven owner pages.
- `geo-question-set.tsv`: the fixed monthly AI-answer observation set.
- `original-data-protocol.md`: privacy-safe collection fields and the 30/20/50 publication gates.
- `earned-mention-research.md`: read-only earned-mention qualification rules and hard stops.
- `gsc-readonly-handoff.md`: a future, separately authorized GSC service-account runbook.

## Baseline facts

- Research integrity remains 212 evidence cards: 196 accepted and 16 pending. Twenty-nine of 30 named research lanes contain accepted evidence; 19/30 are fully accepted. This is not “30 independent agents accepted”.
- Production sitemap contains 39 canonical URLs. On 2026-07-17, the same 39 URLs returned HTTP 200, ended on the requested URL, exposed a self-referencing canonical and declared `index, follow`.
- A conservative HTML feature scan found 31/39 pages with a visible “直接答案” or “先看结论” label, 14/39 with a visible source-section signal, and 36/39 with a date/update signal. These are markup observations, not quality, ranking or citation scores.
- The local `.release` screening found 17 legacy `doc-body` regions at 166–393 visible characters. Character count is a triage signal, not evidence of a Google penalty.
- `/guides/3-account/` and `/qa/00-username/` have the same normalized `doc-body` SHA-256. No redirect, merge or rewrite is authorized until GSC and intent evidence are reviewed.
- The production release still has the separately documented 21 deployment-gate findings. A 200 response on the 39 canonical URLs does not close those findings.

## Status vocabulary

| Status | Meaning |
|---|---|
| `observed` | Reproduced in this dated public or local read-only pass. |
| `provisional` | A research/editorial owner or recommendation that still requires the named evidence before implementation. |
| `blocked` | The required account, identity, business, sample or policy evidence is unavailable. |
| `unavailable` | The named public channel failed or could not be controlled; this is not evidence of absence. |

## 90-day sequence

1. **Days 0–14:** preserve this baseline, collect fixed public SERP observations and, only after separate authorization, run the GSC read-only handoff.
2. **Days 15–45:** decide owner/merge/noindex actions from GSC, intent and source evidence; write implementation briefs but do not create parallel China/UK URLs.
3. **Days 46–70:** record the fixed GEO question set and prepare privacy-safe original samples. Keep all under-threshold research routes noindex.
4. **Days 71–90:** research publisher fit for four non-commercial assets without contacting anyone. Commercial G0/G2 promotion stays blocked.

## Success measures

Only auditable values qualify: non-brand GSC clicks/impressions/CTR/average position, Top 10/20 query counts using the recorded GSC definition, valid indexed URLs, same-query multi-URL counts, reproducible AI citation URLs and independently verified external mentions.

The following never count as outcome KPIs: `llms.txt` presence, a crawler `Allow`, sitemap submission, Schema count, candidate prospect count, generated SEO/GEO scores, estimated search volume or a predicted traffic increase.

## Hard stops

- Stop if a lane needs account write permission, an Indexing API call, sitemap submission, personal data, payment, trademark/authorization assumptions or an unsupported conversion of pending evidence into a positive fact.
- Do not describe G0/G2 as official giffgaff SKUs.
- Do not create platform OTP guarantees, device-detection bypasses, modified APK instructions, credential extraction or third-party write-card instructions.
- Do not expand brand promotion while the domain/trademark, identity, policy, credential and real-transaction gates remain open.
- Future site implementation must preserve the dirty worktree, pass `npm run verify`, and later pass production `npm run postdeploy` with zero issues before merge or promotion is reconsidered.
