# Earned-link qualification ledger

This directory is a research and safety ledger, not proof of outreach, acceptance, backlinks, traffic, ranking or endorsement. No third party was contacted while preparing it.

Current validated inventory (2026-07-17): 23 candidate URLs across 22 hostnames, seven gated drafts and 15 Markdown assets. All contact/result fields remain empty: zero contacts, zero acceptances and zero independently verified live links. Counts describe local research records only.

## Qualification and workflow states

- `qualification=qualified`: strong topical and audience fit worth further policy research. It does **not** mean the publisher accepts submissions or links.
- `qualification=research`: fit or ownership is plausible but material policy questions remain.
- `qualification=reject`: do not contact. The row remains as an audit trail and duplicate-outreach guard.
- `status=research`: pre-contact state. A row must stay here until policy, contact scope and asset readiness are documented.

A public contact page, email, author profile, issue tracker or message button is only a route. It is never `acceptance_evidence`. Use `acceptance_evidence=none_found` until an explicit editorial/contribution policy or direct written permission is retained.

## Field rules

- `policy_url`: only an actual editorial/contribution policy; never substitute a generic contact page.
- `checked_at`: last public research date, not a contact date.
- `contact_scope`: what the public route says it handles; unknown remains explicit.
- `relationship`: disclose commercial, competitor or other relationships before any pitch.
- `asset_readiness`: factual/content readiness, independent from outreach permission.
- `blocker`, `qualification`, `reason`, `next_safe_action`: the decision audit trail.
- `first_contact`, `next_follow_up`, `live_url`, `live_evidence_url`: intentionally empty. Populate only after a real authorized action; a live claim requires a checked public linking URL and retained evidence.

## Non-negotiable rules

- Never contact a `reject` row.
- Never treat public contact details as contribution acceptance.
- Do not buy, swap, automate or mass-post links; do not place promotional comments or GitHub issues.
- Disclose that getgiffgaff is an independent third-party tutorial and sales site.
- A candidate may stay `qualified` while `status=research`; qualification is not permission.
- Do not set `status=live` without both `live_url` and `live_evidence_url`, independently checked for the actual link.
- Do not claim placement, indexing, ranking, traffic or AI citation from this ledger.

The initial 15 candidates were re-qualified using R24. R06/R07 accepted university and UK editorial candidates were then added and de-duplicated. A 2026-07-17 public-channel refresh added `fazalrshah/awesome-esim-resources` because its README explicitly welcomes genuinely useful traveler contributions. That general policy does not pre-approve getgiffgaff, a commercial tool, or a link placement; the row remains pre-action `research` and no Issue or PR was opened. Inclusion records research priority only.

## Local safety validation

Run `npm run validate:outreach` before review. The validator is intentionally local-only: it does not open network connections, send messages, publish drafts or update any third-party system.

It fails when the ledger contains an invalid reject/live transition, pre-action result fields, contact details presented as acceptance evidence, or a target page presented as policy without acceptance evidence. It also requires every draft to keep a visible permission/send/publish gate and rejects positive requests for dofollow treatment, specified anchors, reciprocal links or endorsement, plus unsupported claims of contact, publication, payment, live inventory/pricing or an official relationship.
