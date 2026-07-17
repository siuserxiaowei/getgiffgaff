# E29 local and production-safe verification

Run date: 2026-07-17 (Asia/Shanghai)
Repository branch: `seo-additive-growth-20260716`
Decision: **local release artifact passes; production release gate fails and merge/deployment remains blocked**

## Verified local results

| Gate | Result | Evidence |
|---|---|---|
| Test coverage | pass | Latest `npm run test:coverage`: 149/149 tests; aggregate line 88.29%, branch 77.16%, functions 88.58%. The measured denominator includes CLI and capture scripts, so these are the current reproducible Node coverage totals. |
| Repository/release verification | pass | Latest `npm run verify`: 149/149 tests, 12 growth pages built, 46 source cards built, 46 manifest pages audited: 34 legacy, 39 indexable and 7 noindex routes. The build records 240 exact route-scoped safety overrides. |
| Outreach safety | pass | `npm run validate:outreach`: 23 candidates, 7 gated drafts and 15 outreach Markdown files. One repository has a general contribution policy; no target-specific permission or action is recorded. |
| Diff hygiene | pass | `git diff --check` returned no findings. |
| Evidence-card shape | pass with decision limitations | Both research validators accept all 212 present cards. Decisions are 196 accepted, 16 pending and 0 rejected; all 29 worker-declared card sets are complete, 29/30 lanes contain accepted evidence and 19/30 are fully accepted. R03-R09 source-by-source review accepted 67 narrow observations and retained seven pending. R30 is independently accepted only as a bounded gap-preserving synthesis; the program is still not 30/30 accepted. |
| Legacy freeze and safety layer | pass locally | Source/DOM/visible-text tests verify the original 34 frozen pages before approved append-only slots and 240 exact route-scoped safety replacements are applied. Credential, commerce, G2 and 9eSIM corrections are local only and are not yet production closure. |
| China PAYG calculation | pass locally | Outgoing calls: 30-second minimum then per-second; incoming calls: every positive call rounds up to a whole minute; unsafe/non-finite inputs fail closed. The worked example totals £4.80. |

## Browser verification

The latest release artifact was served on an isolated port and checked against production:

```sh
python3 -m http.server 4187 --bind 127.0.0.1 --directory .release
npm run verify:browser -- http://127.0.0.1:4187 /tmp/getgiffgaff-visual-final-20260717
```

- All ten growth screenshots and 34 interaction checks ran; local console errors were zero.
- Twelve of fourteen legacy route/viewport comparisons exceeded the old production threshold. The largest changes were `/shop/` and `/shop/giffgaff-g2/` because unsupported balance, OTP suitability, stock and fulfillment statements were replaced by evidence-gated safety copy.
- Manual screenshot inspection found no CSS/layout break; the differences are intentional visible safety changes and cannot be dismissed as pixel noise.
- No threshold was loosened and no unsupported wording was restored.

The browser result is therefore **interaction pass, old visual baseline fail**. A reviewer must approve the intended safety differences and establish a new release baseline before deployment.

## Production verification

The latest read-only `npm run postdeploy` run against `https://getgiffgaff.com` failed with exactly 21 findings:

- five new paths:
  - `/guides/7-arrival-checklist`
  - `/guides/8-uk-sim-choice`
  - `/tools/keep-number-reminder`
  - `/tools/china-roaming-cost`
  - `/tools/g0-g2-total-cost`
- three no-trailing-slash combinations per path:
  - HTTPS `www`
  - HTTP apex
  - HTTP `www`

Each variant first lands on the canonical host without adding the trailing slash, so it requires a second redirect. This reproduces the existing Cloudflare-rule blocker; it is not a new repository regression.

The remaining six findings are:

- four `policy-page-status` failures because `/privacy/`, `/terms/`, `/refund/` and `/shipping/` return 404 rather than the local 200/noindex status pages;
- two `robots-cloudflare-policy-conflict` failures because Cloudflare Managed wildcard `Allow: /` conflicts with repository `Disallow: /` for `cohere-ai` and `anthropic-ai`. Exact-UA evaluation still blocks these agents, but the two policy owners disagree.

The local rule generator now derives all 45 non-root public HTML paths from the 46-route manifest. A Cloudflare export must pass that offline comparison; at minimum the five paths above must be added to remove the 15 observed hops. Offline validation alone is not production closure.

Additional production observations confirm that the current local work has not been deployed:

- production `/growth-assets/tools.js` still contains the old linear `outgoing * outgoingRate` calculation;
- production `/llms.txt` is still the prior bare-URL list rather than the local curated task index;
- `/privacy/`, `/terms/`, `/refund/` and `/shipping/` still return 404, although the local candidate now has explicit noindex status pages for them;
- production still contains the credential, G2 and 9eSIM wording corrected by the local safety layer.

A read-only visible-text scan across the 39 production sitemap routes found at least one legacy release-risk phrase on 27 routes. The old 9eSIM action anchor appeared 46 times across 22 routes, and “主卖” appeared on 19 routes; domestic-fulfillment, minimum-quantity, balance and OTP statements were also still visible. The same exact risk-phrase scan returned zero matches across the 46 local `.release` HTML routes. These observations establish local/production drift only; they do not establish inventory, fulfillment, authorization or commerce outcomes.

The four local status pages disclose missing operator facts and tell users not to treat them as complete policies. They remove the local 404 surface but do not establish real privacy, terms, refund or shipping commitments.

## Completion boundary

E29 is complete because all requested local and production-safe checks were run and their actual results were retained. The release itself is **not** complete:

1. update the first Cloudflare redirect rule to the generated 45-path set and remove the five paths' observed 15 two-hop combinations;
2. approve the 240 local credential, commerce, G2 and 9eSIM safety overrides and their visual baseline, and deploy the four noindex policy-status pages without presenting them as complete business policies;
3. obtain the real G0/G2 direct SKU inputs and all 12 independent, redacted evidence files for SKU, order, payment, fulfillment, refund and support before enabling payment or promotion;
4. deploy the reviewed local artifact only after the owner approves the remaining trust/commerce blockers;
5. resolve the Cloudflare Managed/repository robots source conflicts for `cohere-ai` and `anthropic-ai` without weakening the owner-approved crawler policy;
6. rerun a clean full browser check on an isolated port against the approved baseline;
7. rerun `npm run postdeploy` and require zero issues;
8. only then consider merge, IndexNow/search-console submission or promotion of the roaming tool.

No deployment, merge, index submission, PR, outreach message or public post was performed in E29.
