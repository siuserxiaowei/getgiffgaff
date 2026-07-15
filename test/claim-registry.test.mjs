import assert from "node:assert/strict";
import test from "node:test";

import {
  CLAIM_REGISTRY,
  CLAIM_STATUS,
  activeClaims,
  claimFor,
} from "../public/claim-registry.js";

test("claim registry exposes the full lifecycle and only current ACTIVE claims", () => {
  assert.deepEqual(Object.values(CLAIM_STATUS), [
    "DRAFT",
    "PENDING_EVIDENCE",
    "IN_REVIEW",
    "ACTIVE",
    "SUSPENDED",
    "EXPIRED",
    "SUPERSEDED",
    "RETIRED",
  ]);

  const active = claimFor("site.independent_identity", "2026-07-15T00:00:00.000Z");
  assert.equal(active?.status, "ACTIVE");
  assert.match(active?.publicWording ?? "", /独立第三方/);
  assert.ok(active?.sources?.length > 0);

  assert.equal(claimFor("commerce.g2_recommendation", "2026-07-15"), null);
  assert.equal(claimFor("commerce.g0_bulk", "2026-07-15"), null);
  assert.equal(claimFor("roaming.china_rates", "2026-07-15"), null);
  assert.equal(
    claimFor("retention.inactivity_window", "2026-07-15"),
    null,
    "a service-rule claim without a real author and reviewer must fail closed",
  );
  assert.equal(claimFor("missing", "2026-07-15"), null);

  const publishable = activeClaims("2026-07-15");
  assert.ok(publishable.length > 0);
  assert.ok(publishable.every((claim) => claim.status === "ACTIVE"));
  assert.ok(publishable.every((claim) => claim.sourceHealth === "healthy"));
  assert.ok(publishable.every((claim) => new Date(claim.expiresAt) >= new Date("2026-07-15")));
});

test("claimFor fails closed on expiry and invalid time input", () => {
  const identity = CLAIM_REGISTRY["site.independent_identity"];
  assert.equal(claimFor(identity.claimId, identity.nextReviewAt), null);
  assert.equal(claimFor(identity.claimId, "2030-01-01"), null);
  assert.throws(() => claimFor(identity.claimId, "not-a-date"), /valid date/i);
});

test("every claim carries review ownership, evidence and stale behavior", () => {
  for (const claim of Object.values(CLAIM_REGISTRY)) {
    assert.equal(claim.claimId.length > 0, true);
    assert.ok(claim.version);
    assert.ok(claim.risk);
    assert.ok(claim.status);
    assert.ok(Array.isArray(claim.sources));
    assert.ok(Array.isArray(claim.routes));
    assert.ok(claim.owner);
    assert.ok(claim.verifiedAt);
    assert.ok(claim.nextReviewAt);
    assert.ok(claim.expiresAt);
    assert.match(claim.staleBehavior, /hide|block|suspend/i);
  }
});
