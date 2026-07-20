import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  INDEXABLE_GROWTH_ROUTES,
  LEGACY_ROUTES,
  NOINDEX_GROWTH_ROUTES,
  PUBLIC_INDEXABLE_PATHS,
  routeFor,
} from "../public/route-manifest.js";
import {
  legacyDomSignature,
  staticizeLegacyHtml,
  visibleTextSignature,
} from "./capture-legacy-site.mjs";
import { applyGrowthSafetyOverrides } from "./build-growth-pages.mjs";
import { renderCommerceWidget } from "../site/growth/commerce-widget.js";
import { configureAdsenseVerification } from "./adsense-verification.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const LEGACY_ROOT = path.join(ROOT, "site", "legacy");
const GROWTH_ROOT = path.join(ROOT, "site", "growth");
const PUBLIC_ROOT = path.join(ROOT, "public");
const DEFAULT_OUTPUT = path.join(ROOT, ".release");
const GROWTH_MARKER = 'data-growth-slot="related-tutorials-v1"';
const COMMERCE_MARKER = 'data-growth-slot="wechat-buying-guide-v1"';
const CONTACT_CHANNEL_MARKER = 'data-release-slot="verified-contact-channels-v1"';
const SHOP_HERO_IMAGE_SOURCE = '<div class="shop-hero__visual" aria-hidden="true"><img alt="" width="620" height="420" decoding="async" data-nimg="1" class="shop-hero__image" style="color:transparent" src="/gg-card-hero.png"/></div>';
const SHOP_HERO_IMAGE_REPLACEMENT = '<div class="shop-hero__visual"><img alt="giffgaff 英国手机卡购买页面示意图" width="620" height="420" decoding="async" data-nimg="1" class="shop-hero__image" style="color:transparent" src="/gg-card-hero.png"/></div>';
const ACTIONABLE_PREPAYMENT_GUIDANCE =
  "付款前请联系客服核对当前库存、价格、卡片来源与激活状态、账号登记和控制权、余额、交付内容、售后边界及发货安排；无法核对关键事项时不要付款；以支付页面和书面确认信息为准。";
const INTERNAL_CONTACT_ANALYTICS_MARKER =
  'href="/contact/" data-analytics-event="contact_click"';
const INTERNAL_CONTACT_NAVIGATION_MARKER =
  'href="/contact/" data-analytics-event="commerce_click"';
const GROWTH_BLANKET_PAYMENT_DETERRENT =
  "当前缺少 SKU 与交易证据，资料补齐前请勿付款。";
export const RELEASE_PROVENANCE_PLACEHOLDER = Object.freeze({
  schema: "getgiffgaff_release_provenance_v1",
  commit: "unbound",
});
export const RELEASE_SEARCH_CHANGES_SCHEMA = "getgiffgaff_search_changes_v1";
const RELEASE_SEARCH_CHANGES_FILE = "release-search-changes.json";
const RELEASE_SEARCH_STATE_SCHEMA = "getgiffgaff_search_release_state_v1";
const RELEASE_SEARCH_STATE_FILE = path.join(".seo-cache", "release-search-state.json");
const CONTACT_RELEASE_COPY_OVERRIDES = Object.freeze([
  Object.freeze({
    label: "current WeChat display name",
    source: "微信客服“客服小玉”，二维码见本页；当前未公布固定在线时段，请以会话中的实际回复为准。",
    replacement: "微信联系人当前显示名为“胡小胡”，二维码见本页；当前未公布固定在线时段，请以会话中的实际回复为准。",
    expectedOccurrences: 1,
  }),
  Object.freeze({
    label: "Kuaituantuan contact card",
    source: '<h2 id="contact-ktt-title">快团团下单</h2><p>需要下单时先选 G0/G2；如果按钮显示库存确认，就先加微信确认当前链接和库存。</p>',
    replacement: '<h2 id="contact-ktt-title">查看快团团小程序码</h2><p>本站没有可核验的商品直达链接。扫码后请在实际页面自行核对收款方、商品、金额和发货说明。</p>',
    expectedOccurrences: 1,
  }),
  Object.freeze({
    label: "G0 QR action",
    source: ">确认 G0 库存</a>",
    replacement: ">查看 G0 小程序码</a>",
    expectedOccurrences: 1,
  }),
  Object.freeze({
    label: "G2 QR action",
    source: ">确认 G2 库存</a>",
    replacement: ">查看 G2 小程序码</a>",
    expectedOccurrences: 1,
  }),
  Object.freeze({
    label: "Kuaituantuan modal eyebrow",
    source: '<p class="ktt-modal-eyebrow">快团团下单</p>',
    replacement: '<p class="ktt-modal-eyebrow">快团团小程序码</p>',
    expectedOccurrences: 1,
  }),
  Object.freeze({
    label: "Kuaituantuan modal title",
    source: '<h2 class="ktt-modal-title" id="ktt-giga-card-title">进入 Giga卡快团团店铺</h2>',
    replacement: '<h2 class="ktt-modal-title" id="ktt-giga-card-title">扫描前请核对页面主体</h2>',
    expectedOccurrences: 1,
  }),
  Object.freeze({
    label: "Kuaituantuan modal description",
    source: '<p class="ktt-modal-copy" id="ktt-giga-card-description">点 G0/G2 后，先在快团团确认库存、余额范围和发货方式；付款或售后问题找客服小玉。</p>',
    replacement: '<p class="ktt-modal-copy" id="ktt-giga-card-description">本站只能提供小程序码，不能证明扫码后的页面由谁运营，也不能证明商品、库存、订单、支付或履约状态。请在实际页面核对收款方、商品、金额和发货说明；需要沟通时可联系微信“胡小胡”或 Telegram @xiaoyuhuai。</p>',
    expectedOccurrences: 1,
  }),
  Object.freeze({
    label: "Kuaituantuan modal note",
    source: '<p class="ktt-modal-note">长按识别小程序码，进店确认库存</p>',
    replacement: '<p class="ktt-modal-note">长按识别小程序码；打开后自行核对页面信息</p>',
    expectedOccurrences: 1,
  }),
]);

const LEGACY_COMMERCIAL_COPY_OVERRIDES = Object.freeze({
  "/": Object.freeze([
    Object.freeze({
      label: "homepage FAQ purchase path",
      source: "然后通过快团团或客服入口下单。",
      replacement: "然后通过微信或 Telegram 联系咨询，并在实际支付页面核对信息后决定。",
      expectedOccurrences: 2,
    }),
    Object.freeze({
      label: "homepage unverified Kuaituantuan facts",
      source: "价格、库存和 G2 余额范围以快团团商品页或客服确认为准。",
      replacement: "价格、库存和 G2 余额范围须在当前实际页面与书面沟通中逐项核对。",
      expectedOccurrences: 1,
    }),
    Object.freeze({
      label: "homepage classification heading",
      source: "当前主推两种实体卡",
      replacement: "当前介绍两种实体卡分类",
      expectedOccurrences: 1,
    }),
    Object.freeze({
      label: "homepage Kuaituantuan status labels",
      source: "以快团团为准",
      replacement: "状态须逐批核对",
      expectedOccurrences: 2,
    }),
    Object.freeze({
      label: "homepage purchase labels",
      source: "查看并购买",
      replacement: "查看分类说明",
      expectedOccurrences: 2,
    }),
  ]),
  "/guides/1-order/": Object.freeze([
    Object.freeze({
      label: "guide current-stock description",
      source: "按购买页整理：实体卡现货、激活须知、官网申请、英国本土购买和收卡检查。",
      replacement: "按购买路径整理：实体卡分类、激活须知、官网申请、英国本土获取和收卡检查。",
      expectedOccurrences: 3,
    }),
    Object.freeze({
      label: "guide current-stock headings and anchors",
      source: "实体卡现货",
      replacement: "实体卡分类",
      expectedOccurrences: 5,
    }),
    Object.freeze({
      label: "guide current availability assertion",
      source: "getgiffgaff 当前提供 giffgaff 实体 SIM 卡，主要分为 G0 新卡和 G2 有余额卡。",
      replacement: "getgiffgaff 当前介绍 G0 新卡和 G2 有余额卡两种内部分类；是否有货须逐批核对。",
      expectedOccurrences: 1,
    }),
    Object.freeze({
      label: "guide buyer behavior assertion",
      source: "多数客户会直接选择现货实体卡",
      replacement: "如考虑实体卡，可先核对当前是否有货及交付条件",
      expectedOccurrences: 1,
    }),
    Object.freeze({
      label: "guide unverified Kuaituantuan facts",
      source: "具体售价、库存数量和 G2 余额范围，以快团团商品页或客服确认为准。",
      replacement: "具体售价、库存数量和 G2 余额范围，须在当前实际页面与书面沟通中逐项核对。",
      expectedOccurrences: 1,
    }),
    Object.freeze({
      label: "guide FAQ order path",
      source: "后续下单入口以本站快团团按钮和客服确认为准。",
      replacement: "本站没有可核验的商品直达链接；请先联系咨询，再在实际页面核对收款方、商品、金额和发货说明。",
      expectedOccurrences: 2,
    }),
    Object.freeze({
      label: "guide Kuaituantuan card heading",
      source: '<h3 id="order-ktt-title">快团团下单</h3>',
      replacement: '<h3 id="order-ktt-title">联系咨询后核对实际页面</h3>',
      expectedOccurrences: 1,
    }),
    Object.freeze({
      label: "guide checkout CTA",
      source: "看完购买说明后，可以进入快团团下单；如果 G2 库存不确定，付款前先确认。",
      replacement: "看完购买说明后，先联系咨询；只有在实际页面核对收款方、商品、金额与发货说明后再决定是否付款。",
      expectedOccurrences: 1,
    }),
    Object.freeze({
      label: "guide checkout heading",
      source: "准备下单",
      replacement: "付款前核对",
      expectedOccurrences: 1,
    }),
    Object.freeze({
      label: "guide order-entry label",
      source: "实体卡下单入口",
      replacement: "实体卡分类入口",
      expectedOccurrences: 1,
    }),
    Object.freeze({
      label: "guide Kuaituantuan status labels",
      source: "以快团团为准",
      replacement: "状态须逐批核对",
      expectedOccurrences: 2,
    }),
  ]),
  "/shop/": Object.freeze([
    Object.freeze({
      label: "shop unverified Kuaituantuan facts",
      source: "价格、库存和 G2 余额范围以快团团商品页或客服确认为准。",
      replacement: "价格、库存和 G2 余额范围须在当前实际页面与书面沟通中逐项核对。",
      expectedOccurrences: 1,
    }),
    Object.freeze({
      label: "shop Kuaituantuan status labels",
      source: "以快团团为准",
      replacement: "状态须逐批核对",
      expectedOccurrences: 2,
    }),
    Object.freeze({
      label: "shop purchase labels",
      source: "查看并购买",
      replacement: "查看分类说明",
      expectedOccurrences: 2,
    }),
    Object.freeze({
      label: "shop fulfillment flow assertion",
      source: "选择商品 → 确认库存 → 快团团下单或微信确认 → 填写收货信息 → 发货。",
      replacement: "选择分类 → 联系咨询 → 在实际页面核对收款方、商品、金额与发货说明 → 再决定是否付款。",
      expectedOccurrences: 1,
    }),
    Object.freeze({
      label: "shop availability heading",
      source: "选择你的 giffgaff 实体卡",
      replacement: "查看 giffgaff 实体卡分类",
      expectedOccurrences: 1,
    }),
  ]),
  "/shop/giffgaff-g0/": Object.freeze([
    Object.freeze({
      label: "G0 Kuaituantuan status label",
      source: "以快团团为准",
      replacement: "状态须逐批核对",
      expectedOccurrences: 1,
    }),
    Object.freeze({
      label: "G0 availability CTA",
      source: "确认 G0 库存",
      replacement: "咨询 G0 当前状态",
      expectedOccurrences: 1,
    }),
    Object.freeze({
      label: "G0 WeChat availability CTA",
      source: "微信确认库存",
      replacement: "微信或 Telegram 咨询",
      expectedOccurrences: 1,
    }),
  ]),
  "/shop/giffgaff-g2/": Object.freeze([
    Object.freeze({
      label: "G2 unverified Kuaituantuan metadata",
      source: "售价、库存和余额范围以快团团商品页或客服确认为准。",
      replacement: "售价、库存和余额范围须在当前实际页面与书面沟通中逐项核对。",
      expectedOccurrences: 1,
    }),
    Object.freeze({
      label: "G2 Kuaituantuan status label",
      source: "以快团团为准",
      replacement: "状态须逐批核对",
      expectedOccurrences: 1,
    }),
    Object.freeze({
      label: "G2 availability CTA",
      source: "确认 G2 库存",
      replacement: "咨询 G2 当前状态",
      expectedOccurrences: 1,
    }),
    Object.freeze({
      label: "G2 WeChat availability CTA",
      source: "微信确认库存",
      replacement: "微信或 Telegram 咨询",
      expectedOccurrences: 1,
    }),
  ]),
});

/**
 * The frozen QA capture combined two distinct search jobs: paying for a top
 * up and looking up an already-active account. Keep the historical capture
 * immutable, but let the shipped page own only the payment intent. The
 * dedicated guide owns phone-number, Credit, plan, and usage lookups.
 */
const TOPUP_INTENT_RELEASE_COPY_OVERRIDES = Object.freeze([
  Object.freeze({
    label: "top-up page title, navigation label, headline, and breadcrumb",
    source: "giffgaff 如何充值/查询余额/查消费记录",
    replacement: "giffgaff 充值、voucher 与支付失败",
    expectedOccurrences: 6,
  }),
  Object.freeze({
    label: "top-up page description",
    source: "giffgaff 余额充值、voucher、套餐、余额查询和消费记录说明。",
    replacement: "giffgaff 充值、voucher 充值券与支付失败处理；说明自助充值与第三方代充的边界。",
    expectedOccurrences: 3,
  }),
  Object.freeze({
    label: "top-up FAQ structured data",
    source: '{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"接收短信会扣余额吗？","acceptedAnswer":{"@type":"Answer","text":"接收短信通常不扣余额，但具体以运营商实时规则和号码状态为准。"}},{"@type":"Question","name":"充值后多久显示？","acceptedAnswer":{"@type":"Answer","text":"通常会较快显示，但支付渠道和系统处理可能有延迟。先看账户记录再判断。"}}]}',
    replacement: '{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"voucher 充值券和套餐是一回事吗？","acceptedAnswer":{"@type":"Answer","text":"不是。选择前按官方账户页面显示的产品名称、金额和用途核对；不确定时不要根据第三方简称判断。"}},{"@type":"Question","name":"充值后支付仍显示失败怎么办？","acceptedAnswer":{"@type":"Answer","text":"先不要重复付款。保存页面提示和交易参考信息，分别向支付服务方或 giffgaff 官方支持核对；第三方代充不能处理密码、短信验证码或账户恢复。"}}]}',
    expectedOccurrences: 1,
  }),
  Object.freeze({
    label: "top-up table of contents",
    source: '<nav class="doc-toc" aria-label="本页内容"><strong>本页内容</strong><ol><li><a href="#充值和套餐的区别">充值和套餐的区别</a></li><li><a href="#查询余额和消费记录">查询余额和消费记录</a></li><li><a href="#什么时候需要代充">什么时候需要代充</a></li></ol></nav>',
    replacement: '<nav class="doc-toc" aria-label="本页内容"><strong>本页内容</strong><ol><li><a href="#official-topup">先选官方充值或 voucher</a></li><li><a href="#payment-failure">支付失败时先核对什么</a></li><li><a href="#third-party-boundary">第三方代充的服务边界</a></li></ol></nav>',
    expectedOccurrences: 1,
  }),
  Object.freeze({
    label: "top-up answer-first summary",
    source: '<div class="doc-answer"><strong>先看结论</strong><p>giffgaff 常见充值方式包括信用卡/借记卡、PayPal 和 voucher 充值券。国内用户如果支付被拒，可以检查卡片海外支付权限、账单信息和风控状态；没有可用支付方式时，可以考虑充值券或代充。</p></div>',
    replacement: '<div class="doc-answer"><strong>先看结论</strong><p>先使用 giffgaff 官方账户提供的充值入口，并确认你要添加的是 Credit 还是套餐；有 voucher 充值券时，按账户页面提示核对兑换步骤。银行卡、PayPal 或其他支付方式被拒时，先检查支付权限、账单资料和账户提示，不要连续反复提交。没有可用支付方式才考虑第三方代充，且第三方不能代替官方账户、号码或验证码问题的处理。</p></div>',
    expectedOccurrences: 1,
  }),
  Object.freeze({
    label: "top-up payment-focused article body",
    source: '<div class="doc-body"><section id="充值和套餐的区别"><h2>充值和套餐的区别</h2><p>余额适合按量扣费用，套餐更适合有通话、短信或数据使用需求。国内低频收短信的用户通常更关注余额和号码状态。</p><p>页面里不同入口可能分别对应 add credit、goodybag 或其他服务，下单前先确认自己要的是哪一种。</p></section><section id="查询余额和消费记录"><h2>查询余额和消费记录</h2><p>可以通过网页端或 App 查看余额、套餐和消费记录。G2 到手后建议先截图保存当前余额。</p><p>如果余额与付款前确认不一致，先不要继续操作，保留截图和订单记录联系售后。</p></section><section id="什么时候需要代充"><h2>什么时候需要代充</h2><p>如果银行卡或 PayPal 被拒，且你只想完成激活或保号，可以看代充说明。代充前确认号码、金额、到账时间和必要信息边界。</p><p>代充解决的是支付问题，不代表平台验证码和保号结果一定稳定。</p></section></div>',
    replacement: '<div class="doc-body"><section id="official-topup"><h2>先选官方充值或 voucher</h2><p>充值前先确认你要添加的是 Credit 还是套餐：它们用途不同，不能只按“充值”一词判断。通过官方账户页面可见的自助入口操作时，确认金额、货币和页面提示后再提交。</p><p>有 voucher 充值券时，只使用官方账户内与 voucher 相符的兑换入口；不要把兑换码、密码、短信验证码或完整支付卡信息交给第三方。</p></section><section id="payment-failure"><h2>银行卡或 PayPal 支付失败时先核对什么</h2><p>支付被拒时，先检查支付卡是否允许对应交易、账单资料是否一致，以及支付服务方或账户是否提示风控、限额或验证要求。不要短时间反复提交同一笔付款；保留错误时间、页面提示和订单或交易参考信息，必要时向支付服务方或 giffgaff 官方支持核对。</p><p>支付失败不等于号码失效，也不能靠继续充值解决无信号、普通短信或第三方验证码等问题；这些应按账号、网络和短信路径分别排查。</p></section><section id="third-party-boundary"><h2>第三方代充的服务边界</h2><p>没有可用支付方式时，可先阅读<a href="/guides/4-recharge-service/">本站的代充说明</a>，再决定是否继续。第三方服务仅应处理已确认的充值金额和必要的非敏感信息，不应要求密码、短信验证码、Cookie、完整支付卡信息或 SIM 序列号。</p><p>代充也不承诺支付一定成功、号码长期有效、平台验证码送达或账户状态恢复。若要查询手机号、Credit、套餐、流量或使用明细，请到<a href="/guides/9-number-balance-data-check/">手机号、Credit、套餐和流量查询教程</a>，按官方 Dashboard、App 或官方短信入口核对。</p></section></div>',
    expectedOccurrences: 1,
  }),
  Object.freeze({
    label: "top-up visible FAQ",
    source: '<section class="doc-faq"><h2>相关问题</h2><details open=""><summary>接收短信会扣余额吗？</summary><p>接收短信通常不扣余额，但具体以运营商实时规则和号码状态为准。</p></details><details><summary>充值后多久显示？</summary><p>通常会较快显示，但支付渠道和系统处理可能有延迟。先看账户记录再判断。</p></details></section>',
    replacement: '<section class="doc-faq"><h2>相关问题</h2><details open=""><summary>voucher 充值券和套餐是一回事吗？</summary><p>不是。选择前按官方账户页面显示的产品名称、金额和用途核对；不确定时不要根据第三方简称判断。</p></details><details><summary>充值后支付仍显示失败怎么办？</summary><p>先不要重复付款。保存页面提示和交易参考信息，分别向支付服务方或 giffgaff 官方支持核对；第三方代充不能处理密码、短信验证码或账户恢复。</p></details></section>',
    expectedOccurrences: 1,
  }),
]);

function safetyRule(route, issueId, source, replacement, expectedOccurrences, reason) {
  return Object.freeze({
    route,
    issueId,
    source,
    replacement,
    expectedOccurrences,
    reason,
  });
}

const NINE_ESIM_ANCHOR_COUNTS = Object.freeze({
  "/answers/": 2,
  "/guides/": 2,
  "/guides/0-intro/": 2,
  "/guides/1-order/": 2,
  "/guides/2-activate/": 2,
  "/guides/3-account/": 2,
  "/guides/3-app/": 2,
  "/guides/3-usage/": 2,
  "/guides/4-recharge-service/": 2,
  "/guides/5-travel-data/": 2,
  "/more/": 3,
  "/more/00-wechat/": 2,
  "/more/02-telegram/": 2,
  "/more/03-esim/": 2,
  "/more/04-esim-qrcode/": 2,
  "/qa/": 2,
  "/qa/00-username/": 3,
  "/qa/01-change-number/": 2,
  "/qa/02-topup/": 2,
  "/qa/03-reissue/": 2,
  "/qa/04-choose-number/": 2,
  "/qa/05-multiple-number/": 2,
  "/qa/06-activation-expiration/": 2,
  "/qa/07-voicemail-switch/": 2,
  "/qa/08-gv/": 2,
  "/qa/09-spread/": 2,
  "/contact/": 2,
});

const NINE_ESIM_SAFETY_RULES = Object.entries(NINE_ESIM_ANCHOR_COUNTS).map(
  ([route, expectedOccurrences]) => safetyRule(
    route,
    "SAFE-9ESIM-ANCHOR",
    "giffgaff 获取 eSIM 二维码，并写入到 9eSIM",
    "giffgaff eSIM 安全边界与官方路径",
    expectedOccurrences,
    "旧导航把第三方写卡描述成行动步骤；发布物只保留官方路径与安全边界。",
  ),
);

const LEGACY_COMMERCE_META_COUNTS = Object.freeze({
  "/": 6,
  "/guides/": 2,
  "/guides/0-intro/": 2,
  "/guides/1-order/": 2,
  "/guides/3-account/": 2,
  "/guides/3-app/": 2,
  "/guides/4-recharge-service/": 2,
  "/guides/5-travel-data/": 2,
  "/more/": 2,
  "/more/00-wechat/": 2,
  "/more/02-telegram/": 2,
  "/qa/": 2,
  "/qa/00-username/": 2,
  "/qa/01-change-number/": 2,
  "/qa/02-topup/": 2,
  "/qa/03-reissue/": 2,
  "/qa/04-choose-number/": 2,
  "/qa/05-multiple-number/": 2,
  "/qa/06-activation-expiration/": 2,
  "/qa/07-voicemail-switch/": 2,
  "/qa/08-gv/": 2,
  "/qa/09-spread/": 2,
  "/shop/": 2,
  "/shop/giffgaff-g0/": 2,
  "/shop/giffgaff-g2/": 2,
});

const LEGACY_COMMERCE_META_SAFETY_RULES = Object.entries(LEGACY_COMMERCE_META_COUNTS).map(
  ([route, expectedOccurrences]) => safetyRule(
    route,
    "SAFE-COMMERCE-META",
    "getgiffgaff 是面向中文用户的 giffgaff 英国手机卡购买与教程站，提供 G0 新卡、G2 有余额卡、国内发货、激活、充值、收短信、信号排查和常见问题说明。",
    "getgiffgaff 是独立第三方中文教程与销售服务站，提供 G0/G2 分类说明、激活、充值、短信和信号排查；当前商品与履约证据未核验。",
    expectedOccurrences,
    "共享元数据不得把未经核验的库存、销售或国内发货写成当前事实。",
  ),
);

const LEGACY_COMMERCE_CTA_COUNTS = Object.freeze({
  "/guides/0-intro/": 1,
  "/guides/3-account/": 1,
  "/guides/3-app/": 1,
  "/guides/4-recharge-service/": 1,
  "/guides/5-travel-data/": 1,
  "/more/00-wechat/": 1,
  "/more/02-telegram/": 1,
  "/qa/00-username/": 1,
  "/qa/01-change-number/": 1,
  "/qa/02-topup/": 1,
  "/qa/03-reissue/": 1,
  "/qa/04-choose-number/": 1,
  "/qa/05-multiple-number/": 1,
  "/qa/06-activation-expiration/": 1,
  "/qa/07-voicemail-switch/": 1,
  "/qa/08-gv/": 1,
  "/qa/09-spread/": 1,
});

const LEGACY_COMMERCE_CTA_SAFETY_RULES = Object.entries(LEGACY_COMMERCE_CTA_COUNTS).map(
  ([route, expectedOccurrences]) => safetyRule(
    route,
    "SAFE-COMMERCE-CTA",
    "本站主卖 G0 新卡和 G2 有余额卡，购买说明集中放在获取和购买教程里。",
    `本站保留 G0/G2 分类说明。${ACTIONABLE_PREPAYMENT_GUIDANCE}`,
    expectedOccurrences,
    "共享购买 CTA 不得把未经核验的商品状态写成当前在售事实。",
  ),
);

const COMMERCE_EVIDENCE_SAFETY_RULES = [
  safetyRule(
    "/",
    "SAFE-COMMERCE-EVIDENCE",
    "主卖 G0 新卡和 G2 有余额卡，并整理国内发货、激活、充值、保号、收短信和信号排查说明。",
    "整理 G0/G2 分类、激活、充值、保号、短信和信号排查；当前商品与履约证据未核验。",
    2,
    "主卖与国内发货断言缺少当前 SKU 和履约证据。",
  ),
  safetyRule(
    "/",
    "SAFE-COMMERCE-EVIDENCE",
    "G0 新卡、G2 有余额卡、国内发货。",
    "G0/G2 分类与购买证据状态。",
    1,
    "库存与国内发货断言缺少当前 SKU 和履约证据。",
  ),
  safetyRule(
    "/",
    "SAFE-COMMERCE-EVIDENCE",
    "购买前确认库存、余额范围、发货方式和使用边界。",
    ACTIONABLE_PREPAYMENT_GUIDANCE,
    1,
    "口头确认不能替代当前 SKU 与交易证据。",
  ),
  safetyRule(
    "/",
    "SAFE-COMMERCE-EVIDENCE",
    "默认浙江发货，圆通包邮，急单可提前沟通顺丰到付。",
    ACTIONABLE_PREPAYMENT_GUIDANCE,
    2,
    "发货地点、承运商、运费与时效承诺缺少真实履约证据。",
  ),
  safetyRule(
    "/",
    "SAFE-COMMERCE-EVIDENCE",
    "默认浙江发货，5 天内发出；圆通包邮，着急可备注顺丰到付。",
    ACTIONABLE_PREPAYMENT_GUIDANCE,
    1,
    "发货地点、承运商、运费与时效承诺缺少真实履约证据。",
  ),
  safetyRule(
    "/",
    "SAFE-COMMERCE-EVIDENCE",
    "国内圆通包邮，顺丰可到付",
    "物流方式与费用须以当前订单书面说明为准",
    2,
    "承运商与运费承诺缺少真实履约证据。",
  ),
  safetyRule(
    "/",
    "SAFE-COMMERCE-EVIDENCE",
    "5 张起卖",
    "起售数量暂无已核验证据",
    1,
    "起售数量缺少当前 SKU 证据。",
  ),
  safetyRule(
    "/",
    "SAFE-COMMERCE-EVIDENCE",
    "浙江发货，圆通包邮",
    "物流证据待核验",
    2,
    "发货地点、承运商和运费承诺缺少真实履约证据。",
  ),
  safetyRule(
    "/shop/",
    "SAFE-COMMERCE-EVIDENCE",
    "getgiffgaff 手机卡商城，提供 G0 新卡和 G2 有余额卡，浙江发货，5 天内发出，购买前可确认库存、余额范围和发货安排。",
    `getgiffgaff 手机卡信息页。${ACTIONABLE_PREPAYMENT_GUIDANCE}`,
    1,
    "搜索摘要不得发布未经核验的库存、发货和时效断言。",
  ),
  safetyRule(
    "/shop/",
    "SAFE-COMMERCE-EVIDENCE",
    "当前主卖 G0 新卡和 G2 有余额卡。先看清楚库存、余额范围、发货方式和使用限制，再选择适合自己的卡。",
    `本页保留 G0/G2 分类说明。${ACTIONABLE_PREPAYMENT_GUIDANCE}`,
    1,
    "主卖与库存断言缺少当前 SKU 及交易证据。",
  ),
  safetyRule(
    "/shop/",
    "SAFE-COMMERCE-EVIDENCE",
    "购买保障",
    "购买证据状态",
    1,
    "没有真实订单、支付、履约、退款与售后记录时不得声称购买保障。",
  ),
  safetyRule(
    "/shop/",
    "SAFE-COMMERCE-EVIDENCE",
    "<span>浙江发货</span><p>默认圆通包邮，顺丰可到付</p>",
    "<span>物流待核验</span><p>发货地点、承运商、费用和时效暂无已核验证据</p>",
    1,
    "物流承诺缺少真实履约记录。",
  ),
  safetyRule(
    "/shop/",
    "SAFE-COMMERCE-EVIDENCE",
    "5 张起卖",
    "起售数量待核验",
    1,
    "起售数量缺少当前 SKU 证据。",
  ),
  safetyRule(
    "/shop/",
    "SAFE-COMMERCE-EVIDENCE",
    "省去首次充值麻烦",
    "不保证激活、充值或支付结果",
    1,
    "卡片分类不能保证充值或支付结果。",
  ),
  safetyRule(
    "/shop/",
    "SAFE-COMMERCE-EVIDENCE",
    "默认浙江发货，5 天内发出；圆通包邮，着急可备注顺丰到付。",
    ACTIONABLE_PREPAYMENT_GUIDANCE,
    1,
    "物流承诺缺少真实履约记录。",
  ),
  safetyRule(
    "/shop/giffgaff-g0/",
    "SAFE-COMMERCE-EVIDENCE",
    "浙江发货，5 天内发出；着急可备注顺丰到付。",
    ACTIONABLE_PREPAYMENT_GUIDANCE,
    2,
    "物流承诺缺少真实履约记录。",
  ),
  safetyRule(
    "/shop/giffgaff-g0/",
    "SAFE-COMMERCE-EVIDENCE",
    "国内圆通包邮，顺丰可到付",
    "物流方式与费用须以当前订单书面说明为准",
    1,
    "承运商与运费承诺缺少真实履约证据。",
  ),
  safetyRule(
    "/shop/giffgaff-g0/",
    "SAFE-COMMERCE-EVIDENCE",
    "5 张起卖",
    "起售数量待核验",
    1,
    "起售数量缺少当前 SKU 证据。",
  ),
  safetyRule(
    "/shop/giffgaff-g0/",
    "SAFE-COMMERCE-EVIDENCE",
    "常规库存，5 张起发；大批量付款前建议先确认数量。",
    ACTIONABLE_PREPAYMENT_GUIDANCE,
    1,
    "库存与起售数量缺少当前 SKU 证据。",
  ),
  safetyRule(
    "/shop/giffgaff-g0/",
    "SAFE-COMMERCE-EVIDENCE",
    "售价、库存和余额范围以快团团商品页或客服确认为准。",
    ACTIONABLE_PREPAYMENT_GUIDANCE,
    1,
    "泛化跳转或口头确认不能替代当前 SKU 与交易证据。",
  ),
  safetyRule(
    "/guides/1-order/",
    "SAFE-COMMERCE-EVIDENCE",
    "本站当前以快团团下单为主，默认浙江发货、圆通包邮，着急可备注顺丰到付。",
    ACTIONABLE_PREPAYMENT_GUIDANCE,
    1,
    "下单渠道和物流承诺缺少真实交易与履约证据。",
  ),
  safetyRule(
    "/guides/1-order/",
    "SAFE-COMMERCE-EVIDENCE",
    "国内圆通包邮，顺丰可到付",
    "物流方式与费用须以当前订单书面说明为准",
    2,
    "承运商与运费承诺缺少真实履约证据。",
  ),
  safetyRule(
    "/guides/1-order/",
    "SAFE-COMMERCE-EVIDENCE",
    "5 张起卖",
    "起售数量待核验",
    3,
    "起售数量缺少当前 SKU 证据。",
  ),
  safetyRule(
    "/guides/1-order/",
    "SAFE-COMMERCE-EVIDENCE",
    "浙江发货，5 天内发出；着急可备注顺丰到付。",
    ACTIONABLE_PREPAYMENT_GUIDANCE,
    1,
    "物流承诺缺少真实履约记录。",
  ),
  safetyRule(
    "/guides/1-order/",
    "SAFE-COMMERCE-EVIDENCE",
    "常规库存，5 张起发；大批量付款前建议先确认数量。",
    ACTIONABLE_PREPAYMENT_GUIDANCE,
    1,
    "库存与起售数量缺少当前 SKU 证据。",
  ),
];

const G2_SAFETY_RULES = [
  safetyRule(
    "/",
    "SAFE-G2-SCHEMA",
    '"@type":"Product","name":"giffgaff G2 有余额卡"',
    '"@type":"WebPage","name":"G2 库存分类说明"',
    1,
    "没有可核验的在售批次时不得把 G2 分类声明为 Product。",
  ),
  safetyRule(
    "/",
    "SAFE-G2-BATCH",
    "通常含 10-14 英镑余额",
    "余额范围须按批次核验",
    7,
    "固定余额范围缺少逐批证据。",
  ),
  safetyRule(
    "/",
    "SAFE-G2-BATCH",
    "更适合第一次购买或急用",
    "仅可在逐批证据齐全后评估",
    2,
    "推荐适用性缺少逐批证据。",
  ),
  safetyRule(
    "/",
    "SAFE-G2-BATCH",
    "更适合第一次购买、急用或不想处理首次充值失败的人",
    "只应在逐批证据齐全后评估",
    2,
    "推荐适用性缺少逐批证据。",
  ),
  safetyRule(
    "/",
    "SAFE-G2-BATCH",
    "G2 适合第一次购买或急用",
    "G2 仅可在逐批证据齐全后评估",
    1,
    "推荐适用性缺少逐批证据。",
  ),
  safetyRule(
    "/",
    "SAFE-G2-BATCH",
    "已完成前置处理的 giffgaff 实体卡",
    "本站称为 G2 的内部库存分类",
    2,
    "前置处理状态缺少逐批证据。",
  ),
  safetyRule(
    "/",
    "SAFE-G2-BATCH",
    "优先推荐",
    "逐批证据待补",
    1,
    "证据不足时不得作优先推荐。",
  ),
  safetyRule(
    "/",
    "SAFE-G2-OTP",
    "更适合接收海外平台短信验证码",
    "不保证任何平台验证码",
    1,
    "OTP 适用性不能由卡片分类保证。",
  ),
  safetyRule(
    "/shop/",
    "SAFE-G2-SCHEMA",
    '"@type":"Product","name":"G2 有余额卡"',
    '"@type":"WebPage","name":"G2 库存分类说明"',
    1,
    "没有可核验的在售批次时不得把 G2 分类声明为 Product。",
  ),
  safetyRule(
    "/shop/",
    "SAFE-G2-SCHEMA",
    '"sku":"g2-credit-card",',
    "",
    1,
    "G2 是本站内部分类，不能冒充已核验的官方或商家 SKU。",
  ),
  safetyRule(
    "/shop/",
    "SAFE-G2-BATCH",
    "通常含 10-14 英镑余额",
    "余额范围须按批次核验",
    2,
    "固定余额范围缺少逐批证据。",
  ),
  safetyRule(
    "/shop/",
    "SAFE-G2-BATCH",
    "更适合第一次购买或急用",
    "仅可在逐批证据齐全后评估",
    1,
    "推荐适用性缺少逐批证据。",
  ),
  safetyRule(
    "/shop/",
    "SAFE-G2-BATCH",
    "已完成前置处理的 giffgaff 实体卡",
    "本站称为 G2 的内部库存分类",
    2,
    "前置处理状态缺少逐批证据。",
  ),
  safetyRule(
    "/shop/",
    "SAFE-G2-BATCH",
    "优先推荐",
    "逐批证据待补",
    1,
    "证据不足时不得作优先推荐。",
  ),
  safetyRule(
    "/shop/giffgaff-g2/",
    "SAFE-G2-SCHEMA",
    '"@type":"Product","name":"G2 有余额卡"',
    '"@type":"WebPage","name":"G2 库存分类说明"',
    1,
    "没有可核验的在售批次时不得把 G2 分类声明为 Product。",
  ),
  safetyRule(
    "/shop/giffgaff-g2/",
    "SAFE-G2-SCHEMA",
    '"sku":"g2-credit-card",',
    "",
    1,
    "G2 是本站内部分类，不能冒充已核验的官方或商家 SKU。",
  ),
  safetyRule(
    "/shop/giffgaff-g2/",
    "SAFE-G2-BATCH",
    "通常含 10-14 英镑余额",
    "余额范围须按批次核验",
    6,
    "固定余额范围缺少逐批证据。",
  ),
  safetyRule(
    "/shop/giffgaff-g2/",
    "SAFE-G2-BATCH",
    "余额通常为 10-14 英镑",
    "当前未登记固定余额范围",
    1,
    "固定余额范围缺少逐批证据。",
  ),
  safetyRule(
    "/shop/giffgaff-g2/",
    "SAFE-G2-BATCH",
    "更适合第一次购买或急用",
    "仅可在逐批证据齐全后评估",
    2,
    "推荐适用性缺少逐批证据。",
  ),
  safetyRule(
    "/shop/giffgaff-g2/",
    "SAFE-G2-BATCH",
    "已完成前置处理的 giffgaff 实体卡",
    "本站称为 G2 的内部库存分类",
    4,
    "前置处理状态缺少逐批证据。",
  ),
  safetyRule(
    "/shop/giffgaff-g2/",
    "SAFE-G2-BATCH",
    "优先推荐",
    "逐批证据待补",
    1,
    "证据不足时不得作优先推荐。",
  ),
  safetyRule(
    "/shop/giffgaff-g2/",
    "SAFE-G2-OTP",
    "更适合接收海外平台短信验证码",
    "不保证任何平台验证码",
    1,
    "OTP 适用性不能由卡片分类保证。",
  ),
  safetyRule(
    "/shop/giffgaff-g2/",
    "SAFE-G2-OTP",
    "急用英国手机号接收海外平台短信",
    "不保证任何平台验证码或短信送达",
    1,
    "OTP 与短信送达不能由卡片分类保证。",
  ),
  safetyRule(
    "/shop/giffgaff-g2/",
    "SAFE-G2-BATCH",
    "第一次购买 giffgaff 手机卡",
    "仅在商家提供逐批证据后评估",
    1,
    "适用人群缺少逐批证据。",
  ),
  safetyRule(
    "/shop/giffgaff-g2/",
    "SAFE-G2-BATCH",
    "不想处理首次充值和支付失败问题",
    "不代替 giffgaff 官方激活或充值流程",
    1,
    "卡片分类不能保证绕过激活、充值或支付问题。",
  ),
  safetyRule(
    "/shop/giffgaff-g2/",
    "SAFE-G2-BATCH",
    "付款前先确认当前库存和余额范围。",
    "付款前要求商家提供对应批次证据。",
    1,
    "库存和余额必须由逐批证据支持。",
  ),
  safetyRule(
    "/shop/giffgaff-g2/",
    "SAFE-G2-BATCH",
    "到手后按随卡说明插卡测试和登录账户。",
    "收到后仅通过 giffgaff 官方渠道核验卡片状态。",
    2,
    "避免暗示未经核验的随卡凭证或登录状态。",
  ),
  safetyRule(
    "/shop/giffgaff-g2/",
    "SAFE-G2-BATCH",
    "到手后先按随卡说明测试信号、余额和账户。",
    "收到后仅通过 giffgaff 官方渠道核验卡片状态。",
    1,
    "避免暗示未经核验的随卡凭证或登录状态。",
  ),
  safetyRule(
    "/shop/giffgaff-g2/",
    "SAFE-COMMERCE-EVIDENCE",
    "国内圆通包邮，顺丰可到付",
    "物流方式与时效须由当前批次履约证据支持",
    1,
    "物流承诺缺少真实履约记录。",
  ),
  safetyRule(
    "/shop/giffgaff-g2/",
    "SAFE-COMMERCE-EVIDENCE",
    "浙江发货，5 天内发出；急单请提前确认。",
    "发货地点、承运商与时效须以已登记批次证据为准。",
    2,
    "发货承诺缺少真实履约记录。",
  ),
  safetyRule(
    "/shop/giffgaff-g2/",
    "SAFE-COMMERCE-EVIDENCE",
    "需要的客户较多，不保证随时有货；10 英镑以下或 15 英镑以上余额卡可单独议价。",
    ACTIONABLE_PREPAYMENT_GUIDANCE,
    1,
    "库存、余额和议价断言缺少真实批次记录。",
  ),
  safetyRule(
    "/shop/giffgaff-g2/",
    "SAFE-G2-BATCH",
    "<h1>giffgaff G2 有余额卡</h1>",
    `<h1>G2 库存分类说明</h1><p><strong>G2 是本站内部库存分类，不是 giffgaff 官方 SKU；${ACTIONABLE_PREPAYMENT_GUIDANCE}</strong></p>`,
    1,
    "页面首屏必须明确分类身份与付款禁区。",
  ),
  safetyRule(
    "/guides/1-order/",
    "SAFE-G2-BATCH",
    "通常含 10-14 英镑余额",
    "余额范围须按批次核验",
    4,
    "固定余额范围缺少逐批证据。",
  ),
  safetyRule(
    "/guides/1-order/",
    "SAFE-G2-BATCH",
    "更适合第一次购买、急用或不想处理首次充值的人",
    "只应在逐批证据齐全后评估",
    1,
    "推荐适用性缺少逐批证据。",
  ),
  safetyRule(
    "/guides/1-order/",
    "SAFE-G2-BATCH",
    "已完成前置处理的 giffgaff 实体卡",
    "本站称为 G2 的内部库存分类",
    1,
    "前置处理状态缺少逐批证据。",
  ),
  safetyRule(
    "/guides/1-order/",
    "SAFE-G2-BATCH",
    "优先推荐",
    "逐批证据待补",
    1,
    "证据不足时不得作优先推荐。",
  ),
  safetyRule(
    "/guides/1-order/",
    "SAFE-G2-OTP",
    "更适合接收海外平台短信验证码",
    "不保证任何平台验证码",
    1,
    "OTP 适用性不能由卡片分类保证。",
  ),
  safetyRule(
    "/guides/1-order/",
    "SAFE-COMMERCE-EVIDENCE",
    "浙江发货，5 天内发出；急单请提前确认。",
    "发货地点、承运商与时效须以已登记批次证据为准。",
    1,
    "发货承诺缺少真实履约记录。",
  ),
  safetyRule(
    "/guides/1-order/",
    "SAFE-COMMERCE-EVIDENCE",
    "默认浙江发货，5 天内发出。圆通包邮，着急可以备注顺丰到付。",
    "当前没有已登记的发货地点、承运商与时效证据；付款前必须核验。",
    1,
    "发货承诺缺少真实履约记录。",
  ),
  safetyRule(
    "/guides/1-order/",
    "SAFE-COMMERCE-EVIDENCE",
    "需要的客户较多，不保证随时有货；10 英镑以下或 15 英镑以上余额卡可单独议价。",
    ACTIONABLE_PREPAYMENT_GUIDANCE,
    1,
    "库存、余额和议价断言缺少真实批次记录。",
  ),
  safetyRule(
    "/",
    "SAFE-G2-BATCH",
    "适合第一次购买或急用",
    "适用性须按批次证据评估",
    1,
    "适用性断言缺少当前批次证据。",
  ),
];

const G0_SAFETY_RULES = [
  safetyRule(
    "/",
    "SAFE-G0-SCHEMA",
    '"@type":"Product","name":"giffgaff G0 新卡"',
    '"@type":"WebPage","name":"G0 库存分类说明"',
    1,
    "没有可核验的在售 SKU 和批次时不得把 G0 分类声明为 Product。",
  ),
  safetyRule(
    "/",
    "SAFE-G0-BATCH",
    "全新未激活",
    "状态须按批次核验",
    6,
    "实体卡状态缺少当前批次证据。",
  ),
  safetyRule(
    "/shop/",
    "SAFE-G0-SCHEMA",
    '"@type":"Product","name":"G0 新卡"',
    '"@type":"WebPage","name":"G0 库存分类说明"',
    1,
    "没有可核验的在售 SKU 和批次时不得把 G0 分类声明为 Product。",
  ),
  safetyRule(
    "/shop/",
    "SAFE-G0-SCHEMA",
    '"sku":"g0-new-card",',
    "",
    1,
    "G0 是本站内部分类，不能冒充已核验的官方或商家 SKU。",
  ),
  safetyRule(
    "/shop/",
    "SAFE-G0-BATCH",
    "全新未激活",
    "状态须按批次核验",
    2,
    "实体卡状态缺少当前批次证据。",
  ),
  safetyRule(
    "/shop/giffgaff-g0/",
    "SAFE-G0-SCHEMA",
    '"@type":"Product","name":"G0 新卡"',
    '"@type":"WebPage","name":"G0 库存分类说明"',
    1,
    "没有可核验的在售 SKU 和批次时不得把 G0 分类声明为 Product。",
  ),
  safetyRule(
    "/shop/giffgaff-g0/",
    "SAFE-G0-SCHEMA",
    '"sku":"g0-new-card",',
    "",
    1,
    "G0 是本站内部分类，不能冒充已核验的官方或商家 SKU。",
  ),
  safetyRule(
    "/shop/giffgaff-g0/",
    "SAFE-G0-BATCH",
    "全新未激活",
    "状态须按批次核验",
    6,
    "实体卡状态缺少当前批次证据。",
  ),
  safetyRule(
    "/guides/1-order/",
    "SAFE-G0-BATCH",
    "全新未激活",
    "状态须按批次核验",
    4,
    "实体卡状态缺少当前批次证据。",
  ),
];

export const LEGACY_SAFETY_OVERRIDE_MANIFEST = Object.freeze([
  ...NINE_ESIM_SAFETY_RULES,
  ...LEGACY_COMMERCE_META_SAFETY_RULES,
  ...LEGACY_COMMERCE_CTA_SAFETY_RULES,
  ...COMMERCE_EVIDENCE_SAFETY_RULES,
  safetyRule(
    "/guides/4-recharge-service/",
    "SAFE-CREDENTIAL-BOUNDARY",
    "涉及密码、验证码或账号安全时，要确认你理解操作风险。",
    "本站不会要求或接收密码、短信验证码、Cookie 或完整支付卡信息；如有人索取，请立即停止。",
    1,
    "代充说明必须明确禁止接收密码、OTP、Cookie 和完整卡资料。",
  ),
  ...G2_SAFETY_RULES,
  ...G0_SAFETY_RULES,
]);

export const UNSUPPORTED_COMMERCE_CLAIM_PATTERN =
  /主卖|国内发货|浙江发货|圆通包邮|顺丰可到付|5 张起卖|5 张起发|适合第一次购买或急用|全新未激活|购买保障|省去首次充值麻烦|常规库存/u;

export function assertNoUnsupportedCommerceClaims(html, route) {
  const match = html.match(UNSUPPORTED_COMMERCE_CLAIM_PATTERN);
  if (match) {
    throw new Error(
      `${route} retains unsupported commerce claim ${JSON.stringify(match[0])} after safety overrides`,
    );
  }
}

export function applyLegacySafetyOverrides(html, route) {
  let output = html;
  let applied = 0;
  for (const rule of LEGACY_SAFETY_OVERRIDE_MANIFEST) {
    if (rule.route !== route) continue;
    const occurrences = output.split(rule.source).length - 1;
    if (occurrences !== rule.expectedOccurrences) {
      throw new Error(
        `${route} expected safety override source text ${JSON.stringify(rule.source)} `
        + `${rule.expectedOccurrences} time(s), found ${occurrences} (${rule.issueId})`,
      );
    }
    output = output.replaceAll(rule.source, rule.replacement);
    applied += occurrences;
  }
  return { html: output, applied };
}

const LLMS_TASK_SECTIONS = Object.freeze([
  Object.freeze({
    heading: "选卡、购买与收卡",
    pages: Object.freeze([
      ["/", "从本站首页进入 G0/G2 选卡、购买、教程和售后路径。"],
      ["/answers/", "比较 G0 与 G2 的卡状态、账号边界、总成本和风险。"],
      ["/shop/", `查看 G0/G2 分类并在付款前确认订单信息；${ACTIONABLE_PREPAYMENT_GUIDANCE}`],
      ["/shop/giffgaff-g0/", "了解 G0 分类、激活边界和当前缺失的 SKU 与交易证据。"],
      ["/shop/giffgaff-g2/", "了解 G2 内部分类、风险边界和当前缺失的逐批证据。"],
      ["/guides/0-intro/", "理解 giffgaff 英国手机卡、英国号码和常见使用场景。"],
      ["/guides/1-order/", `按步骤核对购买信息与风险；${ACTIONABLE_PREPAYMENT_GUIDANCE}`],
      ["/guides/7-arrival-checklist/", "收到 G0/G2 后逐项验收包装、卡状态、余额、网络和短信。"],
      ["/guides/8-uk-sim-choice/", "按旅行、留学和跨境保号需求选择英国手机卡。"],
      ["/tools/g0-g2-total-cost/", "自行输入卡价、运费、充值和使用支出来比较现金成本。"],
      ["/contact/", "联系本站索取书面订单信息；联系入口不等于 SKU、支付或履约证据。"],
    ]),
  }),
  Object.freeze({
    heading: "激活、账号、充值与保号",
    pages: Object.freeze([
      ["/guides/", "浏览购买、激活、账号、保号、信号和漫游教程目录。"],
      ["/guides/2-activate/", "在中国境内按官方边界激活实体 SIM 并排查失败。"],
      ["/guides/3-account/", "管理用户名、密码、邮箱和账号恢复信息。"],
      ["/guides/3-app/", "使用 giffgaff App 登录、查余额、看套餐和管理安全设置。"],
      ["/guides/9-number-balance-data-check/", "查询手机号、Credit、当前套餐和 App 中的使用记录。"],
      ["/guides/3-usage/", "核对六个月 inactive 规则、有效动作和停用边界。"],
      ["/guides/4-recharge-service/", "判断何时需要代充值服务并准备必要的非敏感信息。"],
      ["/guides/apn-settings/", "有信号但移动数据或热点失败时核对官方 APN 参数。"],
      ["/tools/keep-number-reminder/", "在浏览器本地生成第五月保号缓冲提醒并导出日历。"],
      ["/qa/00-username/", "查找或修改 giffgaff 用户名并处理常见登录问题。"],
      ["/qa/01-change-number/", "了解更换号码的入口、限制和操作前备份事项。"],
      ["/qa/02-topup/", "处理官方充值、voucher、支付失败和第三方代充的安全边界。"],
      ["/qa/03-reissue/", "实体卡损坏或丢失后准备验证并申请补卡。"],
      ["/qa/04-choose-number/", "了解挑选或更换号码时的限制和账号绑定风险。"],
      ["/qa/05-multiple-number/", "理解多号码与账号管理的边界并建立卡片记录。"],
      ["/qa/06-activation-expiration/", "评估新卡长期未激活的风险和操作时机。"],
      ["/qa/07-voicemail-switch/", "了解关闭 voicemail 的常见方式和注意事项。"],
    ]),
  }),
  Object.freeze({
    heading: "信号、短信、平台与中国漫游",
    pages: Object.freeze([
      ["/guides/claude-identity-verification/", "区分 Claude 身份 KYC、手机号验证，并按官方证件与自拍要求处理失败。"],
      ["/guides/claude-phone-verification/", "核对 Claude 支持地区、号码类型、六位短信代码和长期保号边界。"],
      ["/guides/claude-account-disabled-appeal/", "区分 Claude 403、登录故障与账号禁用，并准备官方申诉资料。"],
      ["/guides/4-signal/", "从账号、设备和选网逐层排查无信号、普通短信与 OTP。"],
      ["/guides/5-travel-data/", "区分旅行流量、漫游使用和中国境内低频短信场景。"],
      ["/tools/china-roaming-cost/", "按已核验的中国漫游费率输入用量并估算费用。"],
      ["/more/", "浏览 WeChat、Telegram 与 eSIM 等延伸使用主题。"],
      ["/more/00-wechat/", "了解使用 giffgaff 号码注册或换绑 WeChat 的风险边界。"],
      ["/more/02-telegram/", "了解 Telegram 注册、验证码和平台风控排查。"],
      ["/qa/08-gv/", "判断英国号码用于 Google Voice 验证时的不确定性。"],
      ["/qa/09-spread/", "理解邀请奖励与 Payback 的资格、周期和限制。"],
    ]),
  }),
  Object.freeze({
    heading: "eSIM、安全与研究方法",
    pages: Object.freeze([
      ["/more/03-esim/", "按官方 App 路径核对 eSIM 兼容、切换和失败恢复边界。"],
      ["/more/esim-new-phone/", "换手机前核对 eSIM 兼容、账号登录与短信 MFA 条件。"],
      ["/more/esim-deleted/", "误删 eSIM 后按官方实体 SIM 中转路径恢复原号码。"],
      ["/more/04-esim-qrcode/", "区分官方 eSIM 凭证与第三方写卡并避免敏感凭证泄露。"],
      ["/qa/", "浏览用户名、换号、充值、补卡、挑号和平台验证问答。"],
      ["/guides/6-pitfalls/", "从总览检查购买、激活、保号、漫游、eSIM 和 OTP 风险。"],
      ["/research/", "查看本站的来源拆解、竞品证据卡、版权边界和研究方法。"],
    ]),
  }),
]);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function routeFile(root, route) {
  return route === "/"
    ? path.join(root, "index.html")
    : path.join(root, route.slice(1), "index.html");
}

const PITFALLS_FUNNEL_INTENTS = new Set([
  "after-purchase",
  "before-purchase",
]);

function growthModule(links) {
  const intentLinks = links.filter((link) => Object.hasOwn(link, "intent"));
  const tutorialLinks = links.filter((link) => !Object.hasOwn(link, "intent"));
  if (intentLinks.length > 0) {
    const intents = intentLinks.map(({ intent }) => intent);
    if (
      intents.length !== PITFALLS_FUNNEL_INTENTS.size
      || new Set(intents).size !== PITFALLS_FUNNEL_INTENTS.size
      || intents.some((intent) => !PITFALLS_FUNNEL_INTENTS.has(intent))
    ) {
      throw new Error(
        "Related tutorial intent choices must contain exactly one "
        + "before-purchase and one after-purchase card",
      );
    }
  }
  const intentCards = intentLinks
    .map(
      ({ label, href, intent, description }) =>
        `<a class="growth-intent-card" href="${escapeHtml(href)}" data-funnel-intent="${escapeHtml(intent)}" data-analytics-event="commerce_click"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(description)}</span></a>`,
    )
    .join("");
  const items = tutorialLinks
    .map(
      ({ label, href }) =>
        `<li><a href="${escapeHtml(href)}" data-analytics-event="growth_related_click">${escapeHtml(label)}</a></li>`,
    )
    .join("");
  const intentChooser = intentCards
    ? `<p class="growth-eyebrow">按当前状态继续</p><h2 id="growth-related-title">你现在要解决哪一步？</h2><div class="growth-intent-grid">${intentCards}</div><h3>继续查资料</h3>`
    : `<p class="growth-eyebrow">继续阅读</p><h2 id="growth-related-title">相关教程与下一步</h2>`;
  return `<section class="growth-related-slot" ${GROWTH_MARKER} aria-labelledby="growth-related-title"><div class="growth-related-inner">${intentChooser}<ul>${items}</ul></div></section>`;
}

export function ensureGrowthStylesheet(html) {
  let output = html;
  if (!/href=["']\/growth-assets\/growth\.css["']/i.test(output)) {
    const stylesheet = '<link rel="stylesheet" href="/growth-assets/growth.css">';
    if (!/<\/head>/i.test(output)) throw new Error("Legacy page has no closing head");
    output = output.replace(/<\/head>/i, `${stylesheet}</head>`);
  }
  return output;
}

export function injectRelatedTutorials(html, links) {
  if (!Array.isArray(links) || links.length === 0) return html;
  if (html.includes(GROWTH_MARKER)) return html;

  const output = ensureGrowthStylesheet(html);

  const closingMain = output.toLowerCase().lastIndexOf("</main>");
  if (closingMain === -1) throw new Error("Legacy page has no closing main");
  return `${output.slice(0, closingMain)}${growthModule(links)}${output.slice(closingMain)}`;
}

export function injectCommerceWidget(html) {
  if (html.includes(COMMERCE_MARKER)) return html;
  const output = ensureGrowthStylesheet(html);
  const closingBody = output.toLowerCase().lastIndexOf("</body>");
  if (closingBody === -1) throw new Error("Page has no closing body");
  return `${output.slice(0, closingBody)}${renderCommerceWidget()}${output.slice(closingBody)}`;
}

/**
 * Add the owner-verified WeChat and Telegram channels to the frozen Contact
 * page at release time. The historical capture and its provenance remain
 * unchanged; this route-scoped slot is independently covered by link and
 * exact-asset-hash tests.
 */
export function injectVerifiedContactChannels(html) {
  if (html.includes(CONTACT_CHANNEL_MARKER)) return html;
  const anchor = '<p><strong>咨询资料：</strong>';
  const offset = html.indexOf(anchor);
  if (offset === -1) throw new Error("Contact page has no verified insertion anchor");
  const slot = `<section class="verified-contact-channels" ${CONTACT_CHANNEL_MARKER} aria-labelledby="verified-contact-title">
  <h2 id="verified-contact-title">微信或 Telegram 联系客服</h2>
  <p>微信添加后请核对显示名为“胡小胡”；Telegram 账号为 @xiaoyuhuai。如需购买，请先核对当前订单的关键事项；请勿发送密码、短信验证码或完整支付卡信息。</p>
  <div class="verified-contact-grid">
    <section class="verified-contact-card" aria-labelledby="verified-wechat-title">
      <h3 id="verified-wechat-title">微信客服</h3>
      <img src="/contact/wechat-qr.jpg" alt="微信显示名胡小胡的客服二维码" width="888" height="1135" loading="lazy" decoding="async">
      <p>手机可尝试打开微信；若未唤起或跳到微信官网，请使用微信“扫一扫”扫描二维码。</p>
      <a class="btn btn-primary" href="https://u.wechat.com/MOlSxFZ7nu5enWrw4HtvKC4" target="_blank" rel="noopener noreferrer" data-link-role="contact-channel" data-analytics-event="contact_click" data-analytics-channel="wechat">尝试打开微信添加“胡小胡”</a>
    </section>
    <section class="verified-contact-card" aria-labelledby="verified-telegram-title">
      <h3 id="verified-telegram-title">Telegram 客服</h3>
      <img src="/contact/telegram-qr.jpg" alt="Telegram 客服 xiaoyuhuai 二维码" width="1000" height="1920" loading="lazy" decoding="async">
      <a class="btn btn-secondary" href="https://t.me/xiaoyuhuai" target="_blank" rel="noopener noreferrer" data-link-role="contact-channel" data-analytics-event="contact_click" data-analytics-channel="telegram">打开 Telegram 联系 @xiaoyuhuai</a>
    </section>
  </div>
</section>`;
  return `${html.slice(0, offset)}${slot}${html.slice(offset)}`;
}

export function replaceRetiredWechatQr(html) {
  return html.replaceAll("/contact/wechat-qr.png", "/contact/wechat-qr.jpg");
}

/**
 * The shop hero is the page's primary visual, so it must not be hidden from
 * assistive technology or represented by an empty alt attribute. This remains
 * a release-only correction so the captured legacy baseline stays immutable.
 */
export function improveShopHeroImageAccessibility(html, route) {
  if (route !== "/shop/") return html;
  if (html.includes(SHOP_HERO_IMAGE_REPLACEMENT)) return html;
  return exactReleaseReplacement(html, {
    route,
    label: "shop hero image alternative text",
    source: SHOP_HERO_IMAGE_SOURCE,
    replacement: SHOP_HERO_IMAGE_REPLACEMENT,
    expectedOccurrences: 1,
  });
}

function exactReleaseReplacement(output, {
  route,
  label,
  source,
  replacement,
  expectedOccurrences,
}) {
  const occurrences = output.split(source).length - 1;
  if (occurrences !== expectedOccurrences) {
    throw new Error(
      `${route} expected release copy source text ${JSON.stringify(source)} `
      + `${expectedOccurrences} time(s), found ${occurrences} (${label})`,
    );
  }
  return output.replaceAll(source, replacement);
}

/**
 * Correct generated/injected copy only in the release artifact. This keeps the
 * frozen capture and generated growth sources intact while making the shipped
 * analytics language precise.
 */
export function applyReleaseConversionOverrides(html, route, options = {}) {
  const expectedInternalContactClicks = options.expectedInternalContactClicks ?? 0;
  let output = exactReleaseReplacement(html, {
    route,
    label: "internal Contact analytics marker",
    source: INTERNAL_CONTACT_ANALYTICS_MARKER,
    replacement: INTERNAL_CONTACT_NAVIGATION_MARKER,
    expectedOccurrences: expectedInternalContactClicks,
  });
  for (const rule of LEGACY_COMMERCIAL_COPY_OVERRIDES[route] || []) {
    output = exactReleaseReplacement(output, { route, ...rule });
  }
  if (route === "/qa/02-topup/") {
    for (const rule of TOPUP_INTENT_RELEASE_COPY_OVERRIDES) {
      output = exactReleaseReplacement(output, { route, ...rule });
    }
  }
  if (route === "/contact/") {
    for (const rule of CONTACT_RELEASE_COPY_OVERRIDES) {
      output = exactReleaseReplacement(output, { route, ...rule });
    }
  }
  return output;
}

function applyGrowthReleaseConversionOverrides(html, route) {
  let output = applyReleaseConversionOverrides(html, route);
  if (route === "/tools/g0-g2-total-cost/") {
    output = exactReleaseReplacement(output, {
      route,
      label: "growth blanket payment deterrent",
      source: GROWTH_BLANKET_PAYMENT_DETERRENT,
      replacement: ACTIONABLE_PREPAYMENT_GUIDANCE,
      expectedOccurrences: 1,
    });
  }
  return output;
}

async function copyTree(source, destination, { exclude = new Set() } = {}) {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (exclude.has(entry.name)) continue;
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      await copyTree(from, to, { exclude: new Set() });
    } else if (entry.isFile()) {
      await mkdir(path.dirname(to), { recursive: true });
      await copyFile(from, to);
    }
  }
}

export function sitemapXml() {
  const entries = PUBLIC_INDEXABLE_PATHS.map((pathname) => {
    const route = routeFor(pathname);
    return `  <url>\n    <loc>https://getgiffgaff.com${pathname}</loc>\n    <lastmod>${route.lastModified}</lastmod>\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function validateSearchChanges(value) {
  const changedPaths = Array.isArray(value) ? value : [];
  const uniquePaths = [...new Set(changedPaths)].sort();
  if (uniquePaths.length !== changedPaths.length) {
    throw new Error("release search changes must not contain duplicate routes");
  }
  for (const pathname of uniquePaths) {
    if (!PUBLIC_INDEXABLE_PATHS.includes(pathname)) {
      throw new Error(`release search changes contains a non-indexable route: ${pathname}`);
    }
  }
  return uniquePaths;
}

function searchChangesArtifact({ changedPaths, sitemap }) {
  return Object.freeze({
    schema: RELEASE_SEARCH_CHANGES_SCHEMA,
    changedPaths: validateSearchChanges(changedPaths),
    sitemapSha256: sha256(sitemap),
  });
}

function releaseCommit(value, label) {
  const commit = String(value || "").trim().toLowerCase();
  if (!/^[0-9a-f]{40}$/u.test(commit)) {
    throw new Error(`${label} must be a lowercase 40-character Git SHA`);
  }
  return commit;
}

function submissionReceipt(value, changedPaths) {
  if (value === null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("release search submission receipt must be an object or null");
  }
  if (value.outcome === "no_changes") {
    if (
      changedPaths.length !== 0
      || value.status !== "noop"
      || value.submittedUrls !== 0
    ) {
      throw new Error("release search no-change receipt does not match the change set");
    }
    return Object.freeze({
      outcome: "no_changes",
      status: "noop",
      submittedUrls: 0,
    });
  }
  if (
    value.outcome !== "accepted"
    || value.endpoint !== "https://api.indexnow.org/indexnow"
    || ![200, 202].includes(value.status)
    || value.submittedUrls !== changedPaths.length
    || value.keyLocation !== "https://getgiffgaff.com/indexnow-key.txt"
  ) {
    throw new Error("release search IndexNow receipt does not match the change set");
  }
  return Object.freeze({
    outcome: "accepted",
    endpoint: value.endpoint,
    status: value.status,
    submittedUrls: value.submittedUrls,
    keyLocation: value.keyLocation,
  });
}

function releaseSearchState(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("release search state must be an object");
  }
  if (value.schema !== RELEASE_SEARCH_STATE_SCHEMA) {
    throw new Error(`Unsupported release search state schema: ${value.schema || "missing"}`);
  }
  const changedPaths = validateSearchChanges(value.changedPaths);
  const sitemapSha256 = String(value.sitemapSha256 || "");
  if (!/^[a-f0-9]{64}$/u.test(sitemapSha256)) {
    throw new Error("release search state has an invalid sitemap SHA-256");
  }
  return Object.freeze({
    schema: RELEASE_SEARCH_STATE_SCHEMA,
    baselineCommit: releaseCommit(value.baselineCommit, "release search baseline"),
    candidateCommit: releaseCommit(value.candidateCommit, "release search candidate"),
    changedPaths,
    sitemapSha256,
    submissionReceipt: submissionReceipt(value.submissionReceipt, changedPaths),
  });
}

async function readReleaseSearchState(cwd) {
  const statePath = path.join(cwd, RELEASE_SEARCH_STATE_FILE);
  try {
    return { statePath, state: releaseSearchState(JSON.parse(await readFile(statePath, "utf8"))) };
  } catch (error) {
    if (error?.code === "ENOENT") return { statePath, state: null };
    throw new Error(`Unable to read release search state ${statePath}: ${error.message}`);
  }
}

async function writeReleaseSearchState(cwd, value) {
  const state = releaseSearchState(value);
  const statePath = path.join(cwd, RELEASE_SEARCH_STATE_FILE);
  await mkdir(path.dirname(statePath), { recursive: true });
  const temporaryPath = `${statePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(state)}\n`, { flag: "wx" });
    await rename(temporaryPath, statePath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
  return { statePath, state };
}

function changedPathsFromSitemaps(previousSitemap, nextSitemap) {
  const entries = (xml) => new Map(
    [...String(xml || "").matchAll(
      /<url>\s*<loc>https:\/\/getgiffgaff\.com([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>\s*<\/url>/gu,
    )].map((match) => [match[1], match[2]]),
  );
  const before = entries(previousSitemap);
  const after = entries(nextSitemap);
  return [...after]
    .filter(([pathname, lastModified]) => before.get(pathname) !== lastModified)
    .map(([pathname]) => pathname);
}

export async function bindReleaseSearchChanges({
  cwd = ROOT,
  baselineRef,
  candidateCommit,
  runGit,
} = {}) {
  const baselineCommit = releaseCommit(baselineRef, "release search baseline");
  const candidate = releaseCommit(candidateCommit, "release search candidate");
  const releaseRoot = path.join(cwd, ".release");
  const sitemapPath = path.join(releaseRoot, "sitemap.xml");
  const nextSitemap = await readFile(sitemapPath, "utf8");
  const nextSitemapSha256 = sha256(nextSitemap);
  const existing = await readReleaseSearchState(cwd);
  if (
    existing.state?.candidateCommit === candidate
    && (
      baselineCommit === existing.state.baselineCommit
      || baselineCommit === candidate
    )
  ) {
    if (existing.state.sitemapSha256 !== nextSitemapSha256) {
      throw new Error(
        `Release search state for candidate ${candidate} does not match the built sitemap`,
      );
    }
    const artifact = searchChangesArtifact({
      changedPaths: existing.state.changedPaths,
      sitemap: nextSitemap,
    });
    await writeFile(
      path.join(releaseRoot, RELEASE_SEARCH_CHANGES_FILE),
      `${JSON.stringify(artifact)}\n`,
    );
    return {
      changedPaths: existing.state.changedPaths,
      source: existing.state.baselineCommit,
      candidateCommit: candidate,
      submissionReceipt: existing.state.submissionReceipt,
      statePath: existing.statePath,
      reused: true,
    };
  }
  const gitShow = runGit || (async (spec) => {
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    return (await promisify(execFile)("git", ["show", spec], {
      cwd,
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
    })).stdout;
  });
  let previousSitemap;
  try {
    const previousManifest = await gitShow(`${baselineCommit}:public/route-manifest.js`);
    const dataUrl = `data:text/javascript;base64,${Buffer.from(previousManifest).toString("base64")}`;
    const previousRoutes = await import(dataUrl);
    previousSitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${previousRoutes.PUBLIC_INDEXABLE_PATHS.map((pathname) => {
      const route = previousRoutes.routeFor(pathname);
      return `  <url>\n    <loc>https://getgiffgaff.com${pathname}</loc>\n    <lastmod>${route.lastModified}</lastmod>\n  </url>`;
    }).join("\n")}\n</urlset>\n`;
  } catch (error) {
    throw new Error(`Unable to resolve search-change baseline ${baselineCommit}: ${error.message}`);
  }
  const changedPaths = validateSearchChanges(changedPathsFromSitemaps(
    previousSitemap,
    nextSitemap,
  ));
  const artifact = searchChangesArtifact({ changedPaths, sitemap: nextSitemap });
  await writeFile(
    path.join(releaseRoot, RELEASE_SEARCH_CHANGES_FILE),
    `${JSON.stringify(artifact)}\n`,
  );
  const persisted = await writeReleaseSearchState(cwd, {
    schema: RELEASE_SEARCH_STATE_SCHEMA,
    baselineCommit,
    candidateCommit: candidate,
    changedPaths,
    sitemapSha256: nextSitemapSha256,
    submissionReceipt: changedPaths.length === 0
      ? { outcome: "no_changes", status: "noop", submittedUrls: 0 }
      : null,
  });
  return {
    changedPaths,
    source: baselineCommit,
    candidateCommit: candidate,
    submissionReceipt: persisted.state.submissionReceipt,
    statePath: persisted.statePath,
    reused: false,
  };
}

export async function recordReleaseSearchSubmission({
  cwd = ROOT,
  candidateCommit,
  receipt,
} = {}) {
  const candidate = releaseCommit(candidateCommit, "release search candidate");
  const current = await readReleaseSearchState(cwd);
  if (!current.state || current.state.candidateCommit !== candidate) {
    throw new Error(`No persisted release search state exists for candidate ${candidate}`);
  }
  const persisted = await writeReleaseSearchState(cwd, {
    ...current.state,
    submissionReceipt: submissionReceipt(receipt, current.state.changedPaths),
  });
  return persisted.state.submissionReceipt;
}

function decodeHtmlText(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleFromHtml(html, pathname) {
  const title = decodeHtmlText(
    (html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1],
  );
  if (!title) throw new Error(`${pathname} is missing a title for llms.txt`);
  return title;
}

async function curatedLlmsText(outputRoot) {
  const curatedRoutes = LLMS_TASK_SECTIONS.flatMap((section) =>
    section.pages.map(([pathname]) => pathname));
  if (
    curatedRoutes.length !== PUBLIC_INDEXABLE_PATHS.length
    || new Set(curatedRoutes).size !== curatedRoutes.length
    || PUBLIC_INDEXABLE_PATHS.some((pathname) => !curatedRoutes.includes(pathname))
  ) {
    throw new Error("llms.txt task index must curate every indexable route exactly once");
  }

  const lines = [
    "# getgiffgaff 中文任务索引",
    "",
    "> getgiffgaff 是独立第三方中文教程与销售服务站，不代表 giffgaff 官方、官方客服或授权代表。",
    "",
    "## 身份与事实边界",
    "",
    "- 运营商规则、号码状态、资费和网络能力以操作当日的 giffgaff 官方页面与账户显示为准。",
    "- 本站库存、价格、余额范围、发货和售后安排可能按批次变化，付款前需通过本站购买路径确认。",
    "- 本站不保证号码永久有效、第三方 OTP 送达、搜索引擎收录或排名，也不保证被 AI 系统检索或引用。",
    `- 下列清单只包含本站 ${PUBLIC_INDEXABLE_PATHS.length} 个可索引 canonical URL；方法预览和证据不足页面不在此清单中。`,
  ];

  for (const section of LLMS_TASK_SECTIONS) {
    lines.push("", `## ${section.heading}`, "");
    for (const [pathname, purpose] of section.pages) {
      const html = await readFile(routeFile(outputRoot, pathname), "utf8");
      const title = titleFromHtml(html, pathname);
      lines.push(`- [${title}](https://getgiffgaff.com${pathname})：${purpose}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

export async function buildReleaseArtifact(options = DEFAULT_OUTPUT) {
  const outputRoot =
    typeof options === "string" ? options : options?.outputRoot || DEFAULT_OUTPUT;
  const adsensePublisherId =
    typeof options === "object" && Object.hasOwn(options || {}, "adsensePublisherId")
      ? options.adsensePublisherId
      : undefined;
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });

  await copyTree(LEGACY_ROOT, outputRoot, {
    exclude: new Set(["capture.lock.json", "legacy-freeze-manifest.json"]),
  });
  await rm(path.join(outputRoot, "contact", "wechat-qr.png"), { force: true });

  const related = JSON.parse(
    await readFile(path.join(GROWTH_ROOT, "related-links.json"), "utf8"),
  );
  const freeze = JSON.parse(
    await readFile(path.join(LEGACY_ROOT, "legacy-freeze-manifest.json"), "utf8"),
  );
  if (freeze.schemaVersion !== "legacy-freeze-v2") {
    throw new Error("legacy freeze manifest must use legacy-freeze-v2");
  }
  const frozenByRoute = new Map(freeze.pages.map((page) => [page.route, page]));

  let injectedPages = 0;
  let commerceWidgets = 0;
  let safetyOverrides = 0;
  for (const route of LEGACY_ROUTES) {
    const filename = routeFile(outputRoot, route);
    const original = staticizeLegacyHtml(await readFile(filename, "utf8"));
    const links = related[route];
    let built = ensureGrowthStylesheet(original);
    if (links) built = injectRelatedTutorials(built, links);
    built = injectCommerceWidget(built);
    const frozen = frozenByRoute.get(route);
    if (!frozen) {
      throw new Error(`${route} is missing from the legacy freeze manifest`);
    }
    if (visibleTextSignature(built) !== frozen.visibleTextSha256) {
      throw new Error(`${route} visible copy changed outside the approved growth slot`);
    }
    if (
      !/^[a-f0-9]{64}$/.test(frozen.domSha256 || "") ||
      legacyDomSignature(built) !== frozen.domSha256
    ) {
      throw new Error(`${route} DOM changed outside the approved growth slot`);
    }
    built = replaceRetiredWechatQr(built);
    built = improveShopHeroImageAccessibility(built, route);
    if (route === "/contact/") built = injectVerifiedContactChannels(built);
    const safetyResult = applyLegacySafetyOverrides(built, route);
    built = safetyResult.html;
    built = applyReleaseConversionOverrides(built, route);
    safetyOverrides += safetyResult.applied;
    if (links) injectedPages += 1;
    commerceWidgets += 1;
    await writeFile(filename, built);
  }

  for (const route of [...INDEXABLE_GROWTH_ROUTES, ...NOINDEX_GROWTH_ROUTES]) {
    const source = routeFile(GROWTH_ROOT, route);
    const destination = routeFile(outputRoot, route);
    await mkdir(path.dirname(destination), { recursive: true });
    const growth = applyGrowthSafetyOverrides(await readFile(source, "utf8"), route);
    await writeFile(destination, applyGrowthReleaseConversionOverrides(growth, route));
  }

  for (const route of [
    ...LEGACY_ROUTES,
    ...INDEXABLE_GROWTH_ROUTES,
    ...NOINDEX_GROWTH_ROUTES,
  ]) {
    assertNoUnsupportedCommerceClaims(
      await readFile(routeFile(outputRoot, route), "utf8"),
      route,
    );
  }
  await copyTree(
    path.join(GROWTH_ROOT, "assets"),
    path.join(outputRoot, "growth-assets"),
  );

  for (const filename of [
    "robots.txt",
    "indexnow-key.txt",
    "_worker.js",
    "worker-logic.js",
    "route-manifest.js",
  ]) {
    await copyFile(path.join(PUBLIC_ROOT, filename), path.join(outputRoot, filename));
  }
  const sitemap = sitemapXml();
  await writeFile(path.join(outputRoot, "sitemap.xml"), sitemap);
  await writeFile(
    path.join(outputRoot, RELEASE_SEARCH_CHANGES_FILE),
    `${JSON.stringify(searchChangesArtifact({ changedPaths: [], sitemap }))}\n`,
  );
  await writeFile(
    path.join(outputRoot, "release-provenance.json"),
    `${JSON.stringify(RELEASE_PROVENANCE_PLACEHOLDER)}\n`,
  );
  await writeFile(path.join(outputRoot, "llms.txt"), await curatedLlmsText(outputRoot));
  const adsense = await configureAdsenseVerification({
    outputRoot,
    publisherId: adsensePublisherId,
    routes: [
      ...LEGACY_ROUTES,
      ...INDEXABLE_GROWTH_ROUTES,
      ...NOINDEX_GROWTH_ROUTES,
    ],
  });

  return {
    outputRoot,
    legacyPages: LEGACY_ROUTES.length,
    growthPages: INDEXABLE_GROWTH_ROUTES.length + NOINDEX_GROWTH_ROUTES.length,
    injectedPages,
    commerceWidgets,
    safetyOverrides,
    indexablePages: PUBLIC_INDEXABLE_PATHS.length,
    adsense,
  };
}

const invokedDirectly =
  process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (invokedDirectly) {
  const outputRoot = process.argv[2]
    ? path.resolve(process.argv[2])
    : DEFAULT_OUTPUT;
  const report = await buildReleaseArtifact({
    outputRoot,
    adsensePublisherId: process.env.ADSENSE_PUBLISHER_ID,
  });
  process.stdout.write(`${JSON.stringify(report)}\n`);
}
