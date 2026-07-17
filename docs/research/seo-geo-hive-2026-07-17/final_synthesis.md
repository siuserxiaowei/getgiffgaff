# Research synthesis and acceptance state

Date: 2026-07-17 (Asia/Shanghai)

## Acceptance decision

The research run has thirty named research tasks, but it does **not** yet have thirty independently auditable, curator-accepted research results.

- R01-R29 now have their full worker-declared source-specific 20-field card sets: 29/29 declared sets are structurally complete. The 74 reconstructed R03-R09 cards received independent source-by-source decisions: 67 narrowly accepted and seven retained pending. R06-R09 are fully accepted only at their bounded page, policy, metadata, and attributed-public-statement scope.
- Across the complete corpus, 196 cards are accepted and 16 remain pending: seven R03-R05 access, identity, and backlink-data gaps plus nine account/access/business/legal cards. R10 has one authorization card pending because missing supplied evidence cannot prove either authorization or its absence.
- R30 is this curator synthesis. Independent red-team review required the narrowing recorded below and accepted it only as a bounded, gap-preserving synthesis. R30 acceptance does not accept any of the 16 pending cards or turn the program into 30/30 accepted research.
- E01-E30 now each have an execution artifact or completed verification/review lane. This does **not** mean the release, external distribution, earned-link acquisition or research acceptance is complete: several lanes are local-only, draft-only, release-blocked, commerce-blocked or production-failed. See `agent_tasks.tsv` and the 2026-07-17 handoff for the exact state.

`evidence_cards.tsv` currently contains 212 data rows: 196 accepted and 16 pending. It is structurally valid, `sources.tsv` resolves every source ID, and the validator checks card-to-source URL binding plus claim-group cross-source semantics. All 29 worker lanes with declared card minima have complete sets. Twenty-nine of 30 research lanes have at least one accepted card; nineteen lanes have all of their current cards accepted. `npm run validate:research` fails if a task/curator status gets ahead of evidence, a card points to the wrong source URL, or a single-source group is mislabeled as corroborated/conflicting.

## Status vocabulary

| Status | Meaning |
|---|---|
| `accepted` | A curator accepted a bounded claim set; source cards should be present and structurally valid. |
| `partially-curated-open-cards` | A full or partial card set exists, but one or more cards are pending/rejected; structural completeness is not acceptance. |
| `curator-summary` | A synthesis of available material that preserves limitations; it is not a replacement for missing cards. |
| `blocked-*` | A required source, account state, business input, or external verification is unavailable. |
| `completed-unreviewed` | An execution artifact exists but has not received independent review. |

## Findings that are sufficiently bounded for planning

1. The local candidate owns 39 indexable sitemap URLs and seven supporting noindex routes: three evidence previews plus four policy-status pages. Production still serves the older 39-index/three-noindex release. Sitemap presence, crawler permission, `llms.txt`, and external discovery do not prove indexing, ranking, or AI citation.
2. Official giffgaff sources support narrow facts about activation, inactivity, eSIM switching, China roaming rates, coverage limitations, credit/plans, SMS use, and international delivery. They do not prove any G0/G2 inventory state, commercial legality, payment outcome, OTP delivery, or official relationship.
3. The accepted local/production comparison shows that the local China roaming calculator implements the accepted billing units while production still linearly multiplies fractional call minutes. Deployment and production verification remain necessary.
4. The technical entity graph separates getgiffgaff Organization from the external giffgaff Brand. That implementation detail does not establish authorization, trademark sufficiency, a legal entity name, or an official relationship.
5. Candidate publishers, universities, repositories, social platforms, and public contact routes are research prospects only. One repository explicitly welcomes generally useful traveler contributions, but that does not establish getgiffgaff-specific acceptance, endorsement, permission to place a link, or a live backlink.
6. Three planned research/data pages must remain noindex until their stated real-sample thresholds and review requirements are met. Four policy-status pages must also remain noindex and must not be described as complete policies.

## Conflicts and overclaim risks

### AI crawler policy

Production `robots.txt` combines Cloudflare-managed blocks for names such as `ClaudeBot`, `GPTBot`, and `Google-Extended` with later allow rules for search/user agents such as `OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`, and Perplexity agents. Reporting must be agent-specific. “All AI answer crawlers are allowed” and “all blocked agents are training-only” are both too broad. Google-Extended also involves a grounding/training business choice and must not be simplified without an explicit owner decision.

### Backlinks and prospecting

R04 still has insufficient backlink-profile data. A legacy summary mentioned two self-owned referring domains but retained no exact referring-page URLs, so even that lower bound is now treated as unauditable pending evidence. The checked Common Crawl release has no graph record for the domain, and the exact authenticated GitHub code query returned no rows; neither bounded result proves zero backlinks. No backlink total, authority score, growth trend, anchor distribution, toxic ratio, health score or earned placement can be claimed. R05 now includes a current independently matched BetterSIM calculator page only as an observable asset-form example; this does not recover the unidentified legacy citation or validate the calculator's data, performance or links. R03 and R05-R09 otherwise supply only narrow language, asset-form, topical, policy, video-metadata or attributed-social-statement observations; those observations cannot be upgraded into demand, prevalence, success-rate, current operator policy, contribution acceptance or live backlink claims.

### Identity, G0/G2, and commerce

Legacy G2 copy describes G2 as preferred, suitable for first-time or urgent buyers, and commonly carrying a balance, while the additive growth widget separately states independent-third-party and seller-defined G0/G2 boundaries. G0/G2 are seller-defined inventory classifications, not official giffgaff SKUs. Any batch state, balance, ownership/control path, stock, fulfillment time, or suitability statement requires current first-party business evidence.

The official terms URL concatenates multiple agreements. Standard mobile clause 6.2 concerns Plan duration; the separate Pioneers clause 6.2, Spread giffgaff clauses 7.13-7.14 and Super Recruiters clauses 7.28-7.31 have different programme-specific licence or promotion effects. None identifies getgiffgaff's programme status, material provenance or individual authorization, so the getgiffgaff-specific authorization gap remains pending.

The frozen source and current production recharge-service page leave room for interpreting passwords or OTPs as potentially necessary, while the contact page says not to send them. This conflict must be closed with an owner-approved credential boundary and real-flow verification; if the service cannot operate without receiving sensitive credentials, it requires security and legal review before promotion.

The production contact and order navigation still contain legacy anchor text about obtaining an eSIM QR code and writing it to 9eSIM. That production wording is a safety blocker; local mitigation and its exact scope are execution observations recorded separately below.

### Search-platform verification

GSC/Bing configuration or prior submission does not prove that the current 39 URLs were re-read or indexed. Baidu account ownership, real-name, phone, and OTP steps are outside this run. These states must remain pending until the account owner supplies direct backend evidence.

## Execution and handoff observations

The following are operational observations from `verification-e29.md` and the 2026-07-17 handoff, not accepted 20-field research-card findings. They remain useful release blockers but must not be cited as independently accepted market, policy, backlink, or business evidence:

- The latest read-only production gate failed with 21 findings: 15 two-hop canonicalization variants, four policy-status 404s, and two Cloudflare/repository owner-source conflicts for `cohere-ai` and `anthropic-ai`. Exact-UA evaluation still disallows the two agents, but the policy owners disagree.
- The local release applies 240 exact route-scoped safety replacements, including a never-request/never-receive boundary for passwords, OTPs, cookies, and full payment-card information. This is candidate implementation state, not proof that the real service flow follows the boundary.
- The local release neutralizes 46 legacy 9eSIM action labels across 22 routes after frozen-input verification. This is not deployed and does not establish authorization, safety, or a completed remediation.
- The latest visual comparison has 12 threshold failures because the candidate safety copy differs from production. The threshold was not weakened; intended differences still need explicit review and a replacement baseline.
- The local roaming tool rejects unsafe/overflow inputs in tests. This is an execution/test result, separate from accepted carrier-rate and billing-unit research.
- E01 changed only local research ledgers and documentation. It performed no external account write, outreach, deployment, submission, payment, or fabricated evidence backfill.

## Consolidated release blockers

1. Deploy and production-verify the locally corrected China roaming call-cost result; the current production result can still undercount billing units.
2. Add the five new no-trailing-slash paths to the first Cloudflare redirect rule, then run the full post-deploy gate and retain its output before merging main.
3. Review, approve, deploy and production-verify the 240 route-scoped commerce, G2, credential and 9eSIM safety overrides; do not treat local tests as production closure or batch evidence. The latest visual comparison has 12 threshold failures because the safety text intentionally differs from production, so the exception and replacement baseline require explicit review.
4. Before purchase-oriented outreach, provide real G0/G2 direct SKU links, payee/order identity, a mobile end-to-end test order, and verifiable fulfillment, refund, and support handling.
5. Replace the four local noindex policy-status pages with reviewed privacy, transaction/terms, refund and shipping disclosures based on real business processes. Until then they only remove the silent 404 in the candidate and explicitly pause payment; they are not policies. Trademark, domain, G2 account-control and consumer-facing policy questions require qualified review; this research makes no legal conclusion.

## Outreach acceptance boundary

- Educational drafts may cite pages only after their factual and identity blockers are closed.
- Purchase-oriented outreach and commercial partnerships remain paused.
- Do not use GitHub issues primarily to create promotional backlinks or unsolicited advertising. `fazalrshah/awesome-esim-resources` generally welcomes useful traveler contributions, but no getgiffgaff-specific approval, placement or endorsement exists and the local compatibility tool remains noindex/release-gated.
- Zhihu's public Institution Account Usage Specification (Trial) identifies bulk harassing promotion, repeated low-quality promotional-link content, duplicate answers and frequent promotional private messages as institution-account violations. This does not establish personal-account rules, getgiffgaff account type or permission for a post or link, so the draft remains pre-action and manually blocked.
- Bilibili requires lawful content rights and prohibits promotional spam; this does not approve a specific account, video or external link.
- X's Authenticity policy, retrieved substantively through Jina while direct access remained Cloudflare-challenged, prohibits bulk, duplicative, irrelevant or unsolicited content. This does not ban all promotion or external links and does not approve any specific post, account, automation or link.
- This corpus has no accepted WeChat platform-policy card. Any WeChat publishing restriction in the execution drafts is an editorial guardrail, not a research conclusion about platform policy.
- `contacted` and `live` must remain empty until independently verified. No anchor-text, dofollow, endorsement, or official-affiliation request is permitted.

## Pending evidence inventory

These 16 cards may be cited only as unresolved gaps, never as positive facts, authorization, proof of absence, or external outcomes:

- R03: `EC-R03-12`, `EC-R03-13`
- R04: `EC-R04-03`, `EC-R04-04`, `EC-R04-05`, `EC-R04-07`
- R05: `EC-R05-02`
- R10: `EC-R10-10`
- R17: `EC-R17-06`, `EC-R17-07`
- R18: `EC-R18-04`
- R19: `EC-R19-05`
- R24: `EC-R24-03`
- R28: `EC-R28-04`
- R29: `EC-R29-03`, `EC-R29-05`

## Required curation sequence

1. Preserve the seven still-pending R03-R05 cards until their named search result set, backlink dataset/referrer URLs, or source identity exists. Keep `EC-R05-07` limited to the independently matched current BetterSIM asset form; do not describe it as recovery of the legacy citation.
2. Resolve the other nine pending cards only with the named account, platform-access, business, identity or transaction artifacts; do not convert a confirmed evidence gap into a positive external claim.
3. Preserve the two replacement cards' narrowed current-source claims; do not revive their stale broader wording.
4. Keep one owner-visible P0 list with a closure artifact and reproducible verification command for every blocker.
5. R30 is independently accepted as a bounded synthesis that preserves these 16 unresolved cards. The overall research program may be described as 30/30 accepted only after those cards receive supported independent decisions and no lane remains partially curated. E01-E30 have scoped local artifacts or review records, but local-only, draft-not-sent, release/commerce blocked and production-failed are not interchangeable with deployed or externally completed outcomes.

## R30 scope

R30 acceptance means the synthesis accurately distinguishes accepted evidence, pending gaps, and separately sourced execution observations. It is not a missing-card substitute, release approval, outreach authorization, earned-link outcome, or 30/30 program acceptance.
