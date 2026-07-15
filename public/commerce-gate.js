import { blockedClaimRules } from "./claim-registry.js";

const CANONICAL_ORIGIN = "https://getgiffgaff.com";

const SAFE_DESTINATIONS = Object.freeze({
  risk: Object.freeze({ href: "/answers/", label: "G0/G2 风险说明" }),
  recharge: Object.freeze({ href: "/qa/02-topup/", label: "充值与余额自助说明" }),
  support: Object.freeze({ href: "/contact/", label: "既有订单与使用支持" }),
});

const COMMERCE_PATHS = new Set([
  "/shop/",
  "/shop/giffgaff-g0/",
  "/shop/giffgaff-g2/",
  "/guides/1-order/",
  "/guides/4-recharge-service/",
]);

function stripTags(value) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizePath(pathname) {
  return pathname === "/" || pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function parsedHref(href) {
  try {
    return new URL(href.replaceAll("&amp;", "&"), CANONICAL_ORIGIN);
  } catch {
    return null;
  }
}

function isKttDestination(url) {
  return /(?:^|[.-])ktt(?:[.-]|$)|kuaituantuan|kuaifuwu/i.test(url.hostname);
}

function safeAnchor(destination) {
  return `<a href="${destination.href}" data-commerce-paused="true">${destination.label}</a>`;
}

function replaceCommerceAnchor(anchor, href, body) {
  const target = parsedHref(href);
  if (!target) return anchor;
  const pathname = normalizePath(target.pathname);
  const isSameSite = target.origin === CANONICAL_ORIGIN;

  if (isKttDestination(target)) return safeAnchor(SAFE_DESTINATIONS.risk);
  if (isSameSite && pathname === "/guides/4-recharge-service/") {
    return safeAnchor(SAFE_DESTINATIONS.recharge);
  }
  if (isSameSite && COMMERCE_PATHS.has(pathname)) {
    return safeAnchor(SAFE_DESTINATIONS.risk);
  }
  if (
    isSameSite &&
    pathname === "/contact/" &&
    /购买前|下单|库存|报价|价格|确认.*(?:库存|余额)|G[02].*(?:购买|咨询)/i.test(stripTags(body))
  ) {
    return safeAnchor(SAFE_DESTINATIONS.support);
  }
  return anchor;
}

function removeLegacyCtaBlocks(html) {
  let rewritten = html.replace(
    /<div\b[^>]*class=["'][^"']*\bdoc-cta\b[^"']*["'][^>]*>[\s\S]*?<\/div>\s*<\/div>(?=\s*(?:<section\b|<nav\b|<\/article>|<\/main>))/gi,
    "",
  );
  rewritten = rewritten.replace(
    /<div\b[^>]*class=["'][^"']*\bdoc-cta\b[^"']*["'][^>]*>[\s\S]*?<\/div>(?=\s*(?:<section\b|<nav\b|<\/article>|<\/main>))/gi,
    "",
  );
  return rewritten;
}

function replaceKnownUnverifiedCopy(html) {
  return html
    .replace(/giffgaff 英国手机卡购买与中文教程/g, "giffgaff 英国手机卡使用与风险教程")
    .replace(/英国手机卡购买与教程/g, "英国手机卡使用与风险教程")
    .replace(/独立第三方购买与教程/g, "独立第三方使用与风险信息")
    .replace(/购买与教程站/g, "使用与风险信息站")
    .replace(
      /本站主卖\s*G0\s*新卡和\s*G2\s*有余额卡/g,
      "本站当前不提供新客交易，G0/G2 仅作风险分类说明",
    )
    .replace(/>\s*优先推荐\s*</g, ">风险待核验<")
    .replace(
      /默认浙江发货[^。<]*(?:。)?/g,
      "发货规则待业务所有者核验，当前交易暂停。",
    )
    .replace(/浙江发货[，,、]?\s*圆通包邮/g, "发货规则待核验")
    .replace(/>\s*(?:点此购买|立即购买|进入手机卡商城|购买前联系确认)\s*</gi, ">交易暂停<");
}

function applyBlockedClaims(html, now) {
  let rewritten = html;
  for (const claim of blockedClaimRules(now)) {
    for (const pattern of claim.blockedPatterns) {
      rewritten = rewritten.replace(
        new RegExp(pattern, "giu"),
        claim.blockedReplacement || "该声明当前缺少有效证据",
      );
    }
  }
  return rewritten;
}

function addGateNotice(html) {
  if (html.includes('data-commerce-gate="closed"') || !html.includes("</main>")) {
    return html;
  }
  const notice = `<aside data-commerce-gate="closed" role="note"><strong>交易与推荐保持暂停</strong><p>品牌许可、供货、账户控制权与真实经营资料通过门禁前，本站不提供新客购买、库存或人工充值推荐。</p><p><a href="/contact/">既有订单与使用支持</a></p></aside>`;
  return html.replace("</main>", `${notice}</main>`);
}

export function sanitizeCommerceHtml(html, route, now = new Date()) {
  if (route?.commerceAllowed !== false || typeof html !== "string") return html;
  const original = html;
  let rewritten = removeLegacyCtaBlocks(html);
  rewritten = rewritten.replace(
    /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (anchor, href, body) => replaceCommerceAnchor(anchor, href, body),
  );
  rewritten = rewritten.replace(
    /<button\b[^>]*>([\s\S]*?)<\/button>/gi,
    (button, body) =>
      /购买|下单|库存|代充|立即|buy|order/i.test(stripTags(body))
        ? '<span data-commerce-paused="true">交易暂停</span>'
        : button,
  );
  rewritten = replaceKnownUnverifiedCopy(rewritten);
  rewritten = applyBlockedClaims(rewritten, now);
  return rewritten === original ? rewritten : addGateNotice(rewritten);
}

export const COMMERCE_GATE_PATHS = Object.freeze([...COMMERCE_PATHS]);
