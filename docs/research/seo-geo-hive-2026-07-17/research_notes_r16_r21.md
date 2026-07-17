# R16–R21 worker evidence supplement

Date: 2026-07-17 (Asia/Shanghai)
Lane: researcher worker
Artifact status: **archived pre-curation worker snapshot; non-canonical and excluded from aggregate counts**
Review state at handoff: all cards were `reviewer_status=pending`; later curator decisions exist only in the canonical `evidence_cards.tsv` and `agent_ledger.tsv`.

## Boundary and non-actions

- Read the existing research scope, main evidence file, agent ledger, task list and gap backlog before collecting evidence.
- Used public official documentation, direct production HTTP observations and direct local repository observations.
- Did not log in to Google, Bing or Baidu; did not submit a sitemap or URL; did not run IndexNow; did not deploy, merge, contact, scan a QR code or attempt payment.
- Kept this supplement separate from the main evidence file so an independent curator could validate and merge selected cards without overwriting other workers' lanes. That curation has since occurred; do not re-merge or count this snapshot.

## Evidence shape

- `sources_r16_r21.tsv`: 32 required/important source rows, including four explicit account-only blocked rows.
- `evidence_cards_r16_r21.tsv`: 34 source-specific 20-field cards.
- `agent_ledger_r16_r21.tsv`: worker-only task summaries for R16–R21.
- Blocked account state is evidence of missing access/evidence, not evidence that ingestion, indexing or performance failed.

## R19 reproducible public PageSpeed observation

Public report: <https://pagespeed.web.dev/analysis/https-getgiffgaff-com/p2csr9pwo4?form_factor=mobile>

Captured at 2026-07-17 11:12 Asia/Shanghai:

- Real-user section: `No Data`.
- Lighthouse 13.4.0, HeadlessChromium 149.0.7827.155, emulated Moto G Power, Slow 4G, initial page load.
- Performance 100, Accessibility 96, Best Practices 100, SEO 100.
- FCP 0.9 s, LCP 0.9 s, TBT 0 ms, CLS 0, Speed Index 0.9 s.
- Report warnings included insufficient contrast and one long main-thread task.

The public PageSpeed API request without a configured key returned HTTP 429 quota exhaustion, so the browser report is the auditable public artifact. The lab run is not treated as field CWV and does not provide INP.

## Still blocked after this supplement

1. Current GSC sitemap and URL Inspection readback for the 39 URLs.
2. Current Bing sitemap and IndexNow Insights readback.
3. Baidu property ownership, submission and backend crawl/index state; any real-name, phone or OTP step must be completed by the authorized owner.
4. Search Console field CWV URL groups or another dated auditable field dataset; public PSI currently says `No Data`.
5. A complete claim-level freshness registry with owner, source, checkedAt, expiresAt, fail-closed behavior and revision history.
6. Direct G0/G2 SKU destinations and privacy-safe real-device order/payment/fulfillment/refund/support evidence.
7. Approved removal of legacy 9eSIM action text and evidence-backed privacy, terms, refund and shipping policies.

## Curator instructions

Run the official validator, inspect each source against the narrow claim, and only then merge selected cards into `evidence_cards.tsv`. Keep blocked rows blocked until the specified authorized export or real-world artifact exists. Do not change `pending` to `accepted` in the worker artifact.
