export const CLAIM_STATUS = Object.freeze({
  DRAFT: "DRAFT",
  PENDING_EVIDENCE: "PENDING_EVIDENCE",
  IN_REVIEW: "IN_REVIEW",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  EXPIRED: "EXPIRED",
  SUPERSEDED: "SUPERSEDED",
  RETIRED: "RETIRED",
});

function freezeClaim(claim) {
  return Object.freeze({
    ...claim,
    sources: Object.freeze(claim.sources.map((source) => Object.freeze({ ...source }))),
    evidence: Object.freeze([...(claim.evidence || [])]),
    routes: Object.freeze([...claim.routes]),
    blockedPatterns: Object.freeze([...(claim.blockedPatterns || [])]),
  });
}

const claims = [
  {
    claimId: "site.independent_identity",
    version: 1,
    subject: "getgiffgaff",
    predicate: "relationshipToGiffgaff",
    value: "independent-third-party",
    publicWording:
      "getgiffgaff 是独立第三方中文信息与既有订单支持站，不是 giffgaff Limited 官方网站、官方客服或授权代表。",
    category: "identity",
    scope: "all-public-pages",
    risk: "high",
    status: CLAIM_STATUS.ACTIVE,
    sourceHealth: "healthy",
    sources: [
      {
        title: "giffgaff Terms and Conditions",
        url: "https://www.giffgaff.com/boiler-plate/terms",
      },
    ],
    evidence: ["本站未发布任何官方授权或关联证明，因此只允许独立第三方表述。"],
    routes: ["/", "/about/", "/contact/", "/disclaimer/"],
    caveat: "若未来获得书面许可，仍需由业务所有者和专业顾问逐项复核公开措辞。",
    staleBehavior: "block official-status language and hide dependent claims",
    owner: "getgiffgaff-editorial",
    author: null,
    reviewer: null,
    verifiedAt: "2026-07-15T00:00:00.000Z",
    nextReviewAt: "2026-08-15T00:00:00.000Z",
    expiresAt: "2026-10-15T23:59:59.999Z",
    revision: "Initial fail-closed identity claim.",
  },
  {
    claimId: "retention.inactivity_window",
    version: 1,
    subject: "giffgaff SIM",
    predicate: "inactivityReviewWindow",
    value: "six-month-rule-with-five-month-risk-buffer",
    publicWording:
      "官方当前帮助页说明号码可能在约六个月无有效使用后停用；本站建议第五个月提醒，仅作为风险缓冲，不是官方新规则。",
    category: "service-rule",
    scope: "/guides/3-usage/",
    risk: "medium",
    status: CLAIM_STATUS.ACTIVE,
    sourceHealth: "healthy",
    sources: [
      {
        title: "Understanding why your number has been deactivated",
        url: "https://help.giffgaff.com/en/articles/242797-understanding-why-your-number-has-been-deactivated",
      },
    ],
    evidence: ["工具只计算提醒日期，不收集号码或账号。"],
    routes: ["/guides/3-usage/"],
    caveat: "操作当日必须重新查看官方规则；提醒不保证号码继续有效。",
    staleBehavior: "hide rule wording and block reminder export until reviewed",
    owner: "getgiffgaff-editorial",
    author: null,
    reviewer: null,
    verifiedAt: "2026-07-15T00:00:00.000Z",
    nextReviewAt: "2026-08-15T00:00:00.000Z",
    expiresAt: "2026-10-15T23:59:59.999Z",
    revision: "Linked reminder boundary to current official source.",
  },
  {
    claimId: "commerce.g2_recommendation",
    version: 1,
    subject: "G2",
    predicate: "purchaseRecommendation",
    value: null,
    publicWording: "",
    category: "commerce",
    scope: "all-routes",
    risk: "critical",
    status: CLAIM_STATUS.SUSPENDED,
    sourceHealth: "unverified",
    blockedPatterns: [
      "G2\\s*(?:有余额卡)?\\s*(?:通常)?(?:含|有)\\s*10\\s*[–—-]\\s*14\\s*(?:英镑|GBP)(?:余额)?",
      "G2[^<。；]{0,40}优先推荐",
      "优先推荐[^<。；]{0,40}(?:G2|第一次购买|急用)",
    ],
    blockedReplacement: "G2 的余额、来源和账户控制权未经当前证据核验",
    sources: [
      { title: "giffgaff Terms and Conditions", url: "https://www.giffgaff.com/boiler-plate/terms" },
    ],
    evidence: [],
    routes: ["/answers/", "/shop/giffgaff-g2/", "/contact/"],
    caveat: "Requires written brand, supply, registration, balance and account-control evidence.",
    staleBehavior: "suspend CTA and block all recommendation wording",
    owner: "business-owner-pending",
    author: null,
    reviewer: null,
    verifiedAt: "2026-07-15T00:00:00.000Z",
    nextReviewAt: "2026-07-29T00:00:00.000Z",
    expiresAt: "2026-07-29T23:59:59.999Z",
    revision: "Suspended by default because evidence is incomplete.",
  },
  {
    claimId: "commerce.g0_bulk",
    version: 1,
    subject: "G0",
    predicate: "bulkSaleAvailability",
    value: null,
    publicWording: "",
    category: "commerce",
    scope: "all-routes",
    risk: "critical",
    status: CLAIM_STATUS.SUSPENDED,
    sourceHealth: "unverified",
    blockedPatterns: [
      "G0[^<。；]{0,50}(?:批量备用|批量购买|大批量)",
    ],
    blockedReplacement: "G0 的批量供货与销售声明暂停",
    sources: [
      { title: "giffgaff Terms and Conditions", url: "https://www.giffgaff.com/boiler-plate/terms" },
    ],
    evidence: [],
    routes: ["/shop/giffgaff-g0/", "/guides/1-order/"],
    caveat: "Requires documented supply and buyer-self-activation path.",
    staleBehavior: "suspend CTA and block bulk or minimum-quantity claims",
    owner: "business-owner-pending",
    author: null,
    reviewer: null,
    verifiedAt: "2026-07-15T00:00:00.000Z",
    nextReviewAt: "2026-07-29T00:00:00.000Z",
    expiresAt: "2026-07-29T23:59:59.999Z",
    revision: "Suspended until supply evidence is reviewed.",
  },
  {
    claimId: "roaming.china_rates",
    version: 1,
    subject: "China roaming",
    predicate: "tariffRates",
    value: null,
    publicWording: "",
    category: "tariff",
    scope: "/guides/5-travel-data/",
    risk: "high",
    status: CLAIM_STATUS.PENDING_EVIDENCE,
    sourceHealth: "pending",
    sources: [
      { title: "giffgaff Roaming", url: "https://www.giffgaff.com/roaming" },
    ],
    evidence: [],
    routes: ["/guides/5-travel-data/"],
    caveat: "No static rate is published until all required service units are reviewed.",
    staleBehavior: "hide all prices and block calculator output",
    owner: "getgiffgaff-editorial",
    author: null,
    reviewer: null,
    verifiedAt: "2026-07-15T00:00:00.000Z",
    nextReviewAt: "2026-07-29T00:00:00.000Z",
    expiresAt: "2026-07-29T23:59:59.999Z",
    revision: "Calculator intentionally remains fail-closed.",
  },
];

export const CLAIM_REGISTRY = Object.freeze(
  Object.fromEntries(claims.map((claim) => [claim.claimId, freezeClaim(claim)])),
);

function normalizedNow(now) {
  const value = now instanceof Date ? new Date(now.valueOf()) : new Date(now);
  if (Number.isNaN(value.valueOf())) throw new TypeError("now must be a valid date");
  return value;
}

export function claimFor(claimId, now = new Date()) {
  const claim = CLAIM_REGISTRY[claimId];
  if (!claim) return null;
  const timestamp = normalizedNow(now);
  if (claim.status !== CLAIM_STATUS.ACTIVE) return null;
  if (claim.sourceHealth !== "healthy" || claim.sources.length === 0) return null;
  if (claim.evidence.length === 0) return null;
  if (new Date(claim.verifiedAt) > timestamp) return null;
  if (new Date(claim.nextReviewAt) <= timestamp) return null;
  if (new Date(claim.expiresAt) < timestamp) return null;
  if (claim.category !== "identity" && (!claim.author || !claim.reviewer)) return null;
  return claim;
}

export function activeClaims(now = new Date()) {
  const timestamp = normalizedNow(now);
  return Object.values(CLAIM_REGISTRY).filter(
    (claim) => claimFor(claim.claimId, timestamp) !== null,
  );
}

export function blockedClaimRules(now = new Date()) {
  const timestamp = normalizedNow(now);
  return Object.values(CLAIM_REGISTRY).filter(
    (claim) => claim.blockedPatterns.length > 0 && claimFor(claim.claimId, timestamp) === null,
  );
}
