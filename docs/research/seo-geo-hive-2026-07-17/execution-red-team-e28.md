# E28 privacy, identity, commerce and outreach red-team

Review date: 2026-07-17 (Asia/Shanghai)
Decision: **blocked for purchase-oriented outreach and main-branch merge**
Review type: repository and production-surface risk review, not legal advice

## Scope and decision rule

This review covers the rendered legacy commerce copy, additive growth layer, anonymous analytics interface, public policy routes, Schema/entity boundaries, and all local outreach drafts and prospect fields. It does not infer legality, authorization, inventory, payment success or platform acceptance from missing information.

A finding is closed only by the named evidence. A disclaimer, a draft policy with invented business details, or an updated ledger status is not closure evidence.

## Findings

| ID | Severity | Finding | Direct observation | Required closure evidence | State |
|---|---|---|---|---|---|
| E28-01 | P0 security | The recharge-service page leaves passwords and OTPs inside the possible “necessary information” boundary, while Contact and the additive buying guide say not to send them. | Rendered `/guides/4-recharge-service/` says to understand the risk when passwords or verification codes are involved; `/contact/` says not to send account passwords, SMS codes or full card information. | One enforced service workflow that never requests, receives, forwards or stores passwords, OTPs, cookies or full payment-card data; update every rendered surface and test the result. | open |
| E28-02 | P0 commerce | G2 suitability, balance and fulfillment statements are not backed by current per-batch evidence in this research package. | The frozen G2 page contains “优先推荐”, “通常含 10-14 英镑余额”, first-time/urgent-use positioning, an OTP suitability statement, five-day dispatch language and negotiable balance bands. Accepted official evidence establishes none of those seller-specific states. | Dated batch provenance, activation/account state, balance evidence, buyer-control workflow, current SKU/order identity, fulfillment evidence and qualified review where required; otherwise remove or narrow the claims through an explicitly approved legacy change. | open |
| E28-03 | P0 transaction | A real end-to-end purchase, cancellation/refund and support flow has not been verified. | The repository retains WeChat and 快团团 group-buying QR routes, but there is no retained direct G0/G2 SKU URL, payee/order identity, mobile test order, payment result, cancellation/refund result or support case. | Current direct SKU URLs plus a privacy-safe mobile test record covering item identity, payee/order identity, payment result, fulfillment, cancellation/refund and support handling. | blocked-business-input |
| E28-04 | P0 consumer policy | Privacy, transaction terms, refund and shipping disclosures are absent. | Direct production checks returned 404 for `/privacy/`, `/terms/`, `/refund/` and `/shipping/` on 2026-07-17. | Publish reviewed policies derived from the real operator, data, payment, fulfillment, cancellation, return and support processes. Do not fill them with templates that guess facts. | blocked-business-input |
| E28-05 | P0 safety | Frozen navigation still presents obtaining an eSIM QR code and writing it to 9eSIM as an action. | The legacy sidebar/mobile navigation repeats “获取 eSIM 二维码，并写入到 9eSIM”, while the revised page rejects credential extraction, upload and third-party write-card steps. | An approved legacy-copy exception that removes or neutralizes the action-oriented anchor on every rendered legacy route, followed by full freeze and browser verification. | open |
| E28-06 | P1 identity/trademark | Technical entity separation is correct, but authorization, legal identity and domain/trademark sufficiency are not proved. | Schema separates the getgiffgaff `Organization` from the external giffgaff `Brand`; visible copy denies official/authorized status. No verified `legalName`, controlled `sameAs`, written authorization or qualified trademark/domain decision exists. | Real operator identity, controlled profile evidence, and qualified review of name/domain/trademark use. Continue to omit invented identity or authorization fields. | blocked-owner-review |
| E28-07 | P1 privacy/analytics | Event payload minimization is implemented, but a public privacy/retention account is missing. | Client and Worker allow only canonical path, a coarse referrer category and an allowlisted event; query strings, raw referrers and user-entered fields are not sent. Dataset binding, retention, access and deletion rules are not documented as an owner-approved public policy. | Confirm whether the dataset is enabled, document purpose, fields, lawful basis where applicable, retention, access/deletion and processor details, then publish the reviewed policy. | blocked-business-input |
| E28-08 | P1 outreach/spam | Drafts are appropriately permission-gated, but no outreach or earned link exists. | Prospect rows remain research/reject; contact, follow-up and live-evidence fields are empty. Drafts reject payment, reciprocal links, required anchors, dofollow treatment and endorsement requests. Public contact routes are not treated as submission permission. | Target-specific editorial permission, an authorized dated contact record, editor response and independently checked live URL. Keep failed/rejected targets as a no-contact audit trail. | externally-pending |

## Safe changes already present

- Growth pages and the shared buying guide visibly state that getgiffgaff is an independent third-party tutorial and sales site, not giffgaff official support or an authorized representative.
- The buying guide tells users not to send passwords, SMS codes or full payment-card information and contains no form fields.
- The analytics contract accepts only an allowlisted canonical path, coarse source category and event name; unknown fields, routes, origins and oversized bodies are rejected.
- Three evidence-preview routes remain `noindex`; no OTP, network or device-compatibility success rate is published.
- Outreach materials are local drafts. No payment, reciprocal link, fixed anchor, dofollow treatment or endorsement is requested, and no candidate is marked contacted or live.

These safeguards reduce risk but do not close E28-01 through E28-08.

## Release and outreach decision

1. Do not run purchase-oriented outreach, media pitching or commercial partnership distribution while E28-01 through E28-05 remain open.
2. Educational drafts may be reviewed locally, but must remain unpublished until their referenced tool/page has passed the production gate and all claim-specific blockers are closed.
3. Do not merge `main` while the production redirect gate or the local-versus-production roaming-calculator mismatch remains open.
4. Do not create policy pages, Person/Offer/Review/price Schema or identity fields by guessing missing owner facts.
5. Do not alter the frozen legacy body as a side effect. The site owner must explicitly approve any legacy exception needed to close the credential, G2 or 9eSIM conflicts.

## Reproduction notes

The review used direct rendered-text extraction from:

- `site/legacy/guides/4-recharge-service/index.html`
- `site/legacy/contact/index.html`
- `site/legacy/shop/giffgaff-g2/index.html`
- `site/growth/commerce-widget.js`
- `site/growth/assets/analytics.js`
- `public/worker-logic.js`
- `docs/outreach/`

Production policy checks:

```sh
for pathname in /privacy/ /terms/ /refund/ /shipping/; do
  curl -sS -o /dev/null -w "$pathname %{http_code} %{url_effective}\\n" \
    "https://getgiffgaff.com$pathname"
done
```

Expected as observed on 2026-07-17: four HTTP 404 responses. A later 200 response is not sufficient by itself; policy content still requires owner-fact and qualified review.

## Non-conclusions

- This review does not decide whether any G2 workflow, brand/domain use or commercial arrangement is lawful or unlawful.
- It does not prove that analytics storage is active or inactive.
- It does not prove a backlink count, publisher interest, submission permission, indexing, ranking or AI citation.
- It does not turn absent evidence into evidence of absence.
