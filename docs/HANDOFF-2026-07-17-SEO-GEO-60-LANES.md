# SEO / GEO / earned-link 60-lane handoff

Date: 2026-07-17 (Asia/Shanghai)
Branch: `seo-additive-growth-20260716`
Starting commit: `46790d4 docs: add SEO growth handoff`
Current state: local changes are intentionally uncommitted and not deployed

## Executive decision

Thirty research lanes and thirty execution/review lanes now have distinct task rows and local handoff states. This is **not** “60 agents all accepted” and it is **not** a production-ready or earned-link-complete result.

- Research: the evidence corpus contains 212 structurally valid cards: 196 `accepted`, 16 `pending` and 0 `rejected`. All 29 worker lanes with declared card minima now have complete sets. R03-R09 contribute 74 reconstructed and independently reviewed cards: 67 narrowly accepted and seven retained pending; the other nine pending cards retain their account/access/business/legal blockers. The BetterSIM replacement is only a current asset-form observation, not recovery of the old citation. R10's programme clauses are separated without claiming getgiffgaff authorization; the Zhihu and X cards are narrow anti-spam policy facts, not publishing permission. R30 is independently accepted only as a bounded gap-preserving synthesis, not as closure of those cards. The package therefore still does not satisfy a 30/30 acceptance gate.
- Execution: E01-E30 each produced or reviewed a scoped local artifact. Their actual states include completed local-only work, drafts not sent, permission-gated drafts, release-blocked assets, commerce-blocked assets and a production gate failure.
- External outcome: zero outreach messages, zero posts, zero Issues/PRs, zero independently verified earned links, zero deployment, zero index submission and zero `main` merge in this run.

## What changed locally

### Technical SEO and GEO

- `llms.txt` build becomes a curated five-section task index for all 39 indexable canonical URLs; all seven noindex evidence/status routes are excluded and `llms-full.txt` remains private 410.
- `robots.txt` documents search/user-triggered retrieval separately from excluded training/data-use crawlers. The current `Google-Extended: Disallow` choice remains unchanged because it also affects some Gemini grounding.
- Growth Article Schema uses the real 1400×1000 social image. No Person, `sameAs`, Offer, price, rating, review or unsupported publication date was added.
- Five indexable growth pages have answer-first passages, nearby official sources, checked dates and explicit scope/identity limits.
- Nine approved legacy link slots provide at least two thematic inbound links to each indexable growth page at depth no greater than two. The build verifies all 34 frozen source pages and their baseline before adding those slots and the explicitly enumerated safety overrides; it does not treat the post-override copy as byte-identical to production.
- The China PAYG calculator now implements a 30-second outgoing minimum followed by per-second billing and per-call whole-minute incoming billing. It reports component units and totals, distinguishes PAYG Credit from Travel Data Add-on, rejects overflow/unsafe values and fails closed after evidence expiry.

### Earned-link and external-content system

- A controlled fact source, publisher media kit, 23-candidate/22-hostname prospect ledger and target-specific pitch templates were created. Only `fazalrshah/awesome-esim-resources` has an explicit general “Contributions welcome” statement; this is not getgiffgaff-specific permission and no Issue or PR was opened.
- Five editorial kits cover the arrival checklist, keep-number reminder, China PAYG calculator, G0/G2 cash formula and UK SIM choice framework.
- Platform drafts cover Zhihu, WeChat, Bilibili/YouTube, X, GitHub contribution pre-inquiry and five university resource suggestions.
- Every external item remains a local draft or research record. The system forbids payment, reciprocal links, required anchors, dofollow requests, endorsement requests and treating a public contact route as submission permission.
- `npm run validate:outreach` now enforces ledger transitions and content gates locally.

### Independent red-team and local mitigation

The E28 red-team recorded five P0 findings. Their current boundaries are:

1. credential-request copy is corrected in the local release artifact by route-scoped safety overrides, but production still has the old copy;
2. unsupported G2 recommendation, balance, OTP suitability and fulfillment claims are removed or bounded locally, but no current per-batch proof exists and production is unchanged;
3. no real end-to-end G0/G2 SKU, payment, fulfillment, refund or support evidence is retained;
4. local noindex status pages now exist for privacy, terms, refund and shipping, but they are not complete business policies and production still returns 404 for all four routes;
5. the 46 legacy 9eSIM action-anchor occurrences are replaced in the local release artifact after frozen-source verification, but the frozen source and current production still contain the old wording.

The build applies 240 exact, route-scoped safety replacements only after the original 34-page frozen signatures pass. This is a local mitigation, not evidence that production or the underlying business process has been remediated.

Identity/trademark, analytics policy and external permission remain P1 or externally pending. See `docs/research/seo-geo-hive-2026-07-17/execution-red-team-e28.md` for closure evidence.

## Verification result

### Local

- `npm run test:coverage`: **149/149 pass**.
- Coverage: aggregate line **88.29%**, branch **77.16%**, functions **88.58%** (`npm run test:coverage`, latest rerun 2026-07-17). The measured denominator includes CLI and capture scripts; these are the current reproducible Node totals.
- `npm run verify`: pass; builds 12 growth pages and audits 46 total routes: 34 legacy, 39 indexable and 7 noindex. The release report records 240 safety overrides.
- `npm run validate:outreach`: pass; 23 candidates, 7 gated drafts, 15 outreach Markdown files.
- `git diff --check`: pass.
- Evidence-card validators: all 212 present cards are structurally valid; their decisions are 196 accepted, 16 pending and 0 rejected. All 29 worker-declared card sets are complete; twenty-nine of 30 research lanes have accepted evidence and nineteen are fully accepted. R03-R09 source-by-source review accepted only bounded metadata/page/policy/attributed-statement observations; structural validity, topical relevance and public contact routes do not prove demand, contribution permission or backlinks.
- Latest browser run used isolated port 4187. All 34 interaction checks completed with zero local console errors, but 12 legacy route/viewport comparisons failed the production visual threshold. Inspection confirmed expected safety-copy differences, with the largest on shop/G2 where unsupported balance, OTP and fulfillment claims were removed. No threshold was weakened. The safety differences need explicit review and a new approved baseline before deployment.

### Production

The latest read-only `npm run postdeploy` run failed with **21 issues**:

- 15 canonicalization hops: five new no-trailing-slash paths each take two hops for HTTPS `www`, HTTP apex and HTTP `www` variants;
- four policy-status 404s: `/privacy/`, `/terms/`, `/refund/` and `/shipping/`;
- two Cloudflare robots source conflicts: Managed wildcard `Allow: /` conflicts with repository `Disallow: /` for `cohere-ai` and `anthropic-ai`. Standard exact-UA evaluation still blocks them, but the owner policies disagree and the gate fails explicitly.

Production also still serves:

- the old linear China call-cost formula;
- the old bare-URL `llms.txt`;
- the old credential, G2 and 9eSIM wording that is mitigated only in the local release artifact.

A read-only visible-text scan of the 39 production sitemap routes found legacy risk wording on 27 routes: the old 9eSIM action anchor appeared 46 times across 22 routes and “主卖” appeared on 19 routes, alongside narrower domestic-fulfillment, minimum-quantity, balance and OTP statements. The same exact release-risk phrase scan returned zero matches across the 46 local `.release` HTML routes. This is deployment drift evidence, not proof that the underlying business facts are false or resolved.

This proves the reviewed local implementation is not yet deployed. The China roaming kit and its result remain release-gated.

## Open blockers before merge or promotion

1. Update the first Cloudflare redirect rule from the generated 45-path manifest; at minimum the five already-public growth paths must stop producing the observed 15 two-hop combinations. Retain a zero-issue `npm run postdeploy` result after the candidate is deployed.
2. Review and approve the 240 route-scoped credential, commerce, G2 and 9eSIM safety overrides and their expected visual differences, then establish a reviewed baseline before deployment; local green tests are not production closure.
3. Obtain separate release-owner approval to deploy the four noindex policy-status pages so they stop returning 404, while continuing to block payment and promotion until the owner supplies real privacy, terms, refund and shipping facts and qualified review where appropriate.
4. Supply current G0/G2 direct SKU URLs and the 12 required, independent, redacted evidence files covering SKU, order, payment, fulfillment, refund and support for both products.
5. After those trust and commerce gates are approved, deploy the reviewed artifact and verify the £4.80 worked example, unsafe-input fail-closed behavior, curated `llms.txt` and all safety wording on production.
6. Obtain a qualified identity/domain/trademark review and real business identity/social-profile evidence before inventing Schema identity fields or scaling outreach.
7. Resolve or retain the seven R03-R05 and nine other pending cards honestly; preserve the independently accepted R30 gap inventory and only then reassess whether the research can be described as 30/30 accepted.
8. Obtain GSC/Bing dated backend readback for all 39 URLs; Baidu remains owner real-name/OTP gated.
9. Keep the three evidence-preview routes noindex until their real sample thresholds are met.
10. Do not send any pitch or publish any platform draft until the specific page, source freshness, identity, target policy and release gates all pass.

## Safe next sequence

1. Owner updates the Cloudflare rule to the generated 45-path set and supplies business/transaction facts.
2. Reviewer approves or rejects the already implemented route-scoped credential, commerce, G2 and 9eSIM safety overrides and records the intended visual baseline; no silent freeze bypass is allowed.
3. Re-run `npm run verify`, outreach validation and isolated-port browser verification.
4. Deploy only the reviewed artifact; run `npm run postdeploy` until zero issues.
5. Confirm production `tools.js` and curated `llms.txt` match local behavior.
6. Only then submit/confirm search-console readback and evaluate one target-specific, permission-respecting educational outreach action at a time.
7. Record contact/live fields only after real dated evidence; link placement, anchor wording and link attributes remain the publisher's choice.

## Key files

- Research status: `docs/research/seo-geo-hive-2026-07-17/final_synthesis.md`
- R30 independent review: `docs/research/seo-geo-hive-2026-07-17/r30-independent-review.md`
- Task states: `docs/research/seo-geo-hive-2026-07-17/agent_tasks.tsv`
- Worker/curator ledger: `docs/research/seo-geo-hive-2026-07-17/agent_ledger.tsv`
- Evidence gaps: `docs/research/seo-geo-hive-2026-07-17/source_gap_backlog.md`
- E28 red-team: `docs/research/seo-geo-hive-2026-07-17/execution-red-team-e28.md`
- E29 verification: `docs/research/seo-geo-hive-2026-07-17/verification-e29.md`
- External fact source: `docs/outreach/content-source-of-truth.md`
- Publisher fact sheet: `docs/outreach/publisher-fact-sheet-and-media-kit.md`
- Outreach safety README: `docs/outreach/README.md`

## Explicit non-actions

This run did not deploy, merge, commit, push, create a PR/Issue, submit IndexNow, change Search Console/Bing/Baidu state, contact a third party, publish a draft, purchase/swap a link, or run a real payment. Those empty outcomes are intentional safety boundaries, not unfinished ledger fields to backfill.
