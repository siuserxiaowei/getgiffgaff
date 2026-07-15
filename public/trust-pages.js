import { ogImageUrlFor } from "./og-images.js";

const CANONICAL_ORIGIN = "https://getgiffgaff.com";
const ORGANIZATION_ID = `${CANONICAL_ORIGIN}/#organization`;
const WEBSITE_ID = `${CANONICAL_ORIGIN}/#website`;
const GIFFGAFF_BRAND_ID = "https://www.giffgaff.com/#brand";

const TRUST_PAGES = Object.freeze({
  "/contact/": {
    title: "联系 getgiffgaff｜订单、发货与使用支持",
    description:
      "getgiffgaff 既有订单、发货异常与使用问题的独立第三方支持说明，包含可提供资料和敏感信息禁传清单。",
    h1: "联系 getgiffgaff：订单、发货与使用支持",
    pageType: "ContactPage",
    robots: "index, follow, max-snippet:-1, max-image-preview:large",
    eyebrow: "Existing order support",
    intro:
      "本页仅处理已有订单与使用问题。新交易暂停；在品牌、交易路径与责任主体完成核验前，本站不提供新订单或商品推荐。",
    notice:
      "getgiffgaff 是独立第三方信息与支持网站，非 giffgaff Limited 官方网站、官方客服或授权代表。",
    sections: [
      {
        id: "supported-issues",
        title: "当前可协助的问题",
        paragraphs: [
          "可协助核对已有订单的交付记录、发货异常、收货后的卡片状态以及使用故障的基础分流。",
          "涉及运营商账户、号码归属、官方系统审核或第三方平台验证码时，本站只能提供排查建议，不能代替相关机构处理或承诺结果。",
        ],
      },
      {
        id: "support-materials",
        title: "联系时可提供的资料",
        paragraphs: [
          "请使用原订单已有会话渠道发起支持。本页暂不公布未经核验的新联络账号，联系方式与服务时间待经营主体确认。",
        ],
        items: [
          "订单号、下单日期与已选商品的公开名称。",
          "经打码的问题截图、发生时间与页面错误文字。",
          "手机型号、系统版本、所在城市和已尝试的排查步骤。",
          "物流异常所需的非敏感节点信息；不要把完整收件信息放入公开页面。",
        ],
      },
      {
        id: "do-not-send",
        title: "不要发送的敏感信息",
        paragraphs: [
          "如果对方要求提供以下信息，请停止发送并先核对渠道身份。",
        ],
        items: [
          "任何账户密码、短信验证码、备用恢复码或会话 Cookie/token。",
          "完整支付卡号、CVV、网银密码或完整身份证件。",
          "eSIM 二维码、LPA 字符串、完整 IMSI 或其他可用于接管通信服务的凭证。",
        ],
      },
      {
        id: "response-boundary",
        title: "响应与升级边界",
        paragraphs: [
          "当前不公布未经营主体确认的响应 SLA。需要运营商账户或网络级处理时，应转向 giffgaff 官方支持；需要平台风控解除时，应转向相应平台。",
        ],
      },
    ],
  },

  "/about/": {
    title: "关于 getgiffgaff｜独立第三方身份与责任边界",
    description:
      "了解 getgiffgaff 的独立第三方定位、当前编辑范围、交易暂停状态与待确认的经营主体信息。",
    h1: "关于 getgiffgaff",
    pageType: "AboutPage",
    robots: "index, follow, max-snippet:-1, max-image-preview:large",
    eyebrow: "Identity and responsibility",
    intro:
      "getgiffgaff 当前是面向中文用户的独立第三方信息与已有订单支持站，重点整理官方规则、使用边界与可验证的排查步骤。",
    notice:
      "本站与 giffgaff Limited 无官方、客服、授权代表或母子公司关系。",
    sections: [
      {
        id: "current-role",
        title: "当前角色",
        paragraphs: [
          "本站用自己的结构编写中文教程，优先引用可直接核对的运营商资料，并将官方规则、本站风险建议和本站实测分开标注。",
          "目前不接受新交易；交易暂停不影响对已有订单的基础支持。",
        ],
      },
      {
        id: "operator-status",
        title: "责任主体公开状态",
        paragraphs: [
          "经营主体、实名联络方式与可验证资质待经营主体确认。在完成确认前，本站不用虚构主体、地址、电话、作者或审核人填补信息空缺。",
        ],
      },
      {
        id: "accountability",
        title: "如何承担编辑责任",
        paragraphs: [
          "每页应公开来源、适用条件、复核日期和失效边界。当来源失效或规则过期时，高风险结论停止展示，不延续旧数字。",
          "发现错误可前往编辑与纠错政策的纠错段落。",
        ],
        links: [{ href: "/editorial-policy/#corrections", label: "查看纠错流程" }],
      },
    ],
  },

  "/shipping/": {
    title: "发货说明｜既有订单的核对与异常处理",
    description:
      "getgiffgaff 既有订单的发货记录核对、收件信息保护和物流异常处理边界；当前交易暂停。",
    h1: "发货说明",
    pageType: "WebPage",
    robots: "index, follow, max-snippet:-1, max-image-preview:large",
    eyebrow: "Existing orders only",
    intro:
      "新交易暂停，本页不发布未经核验的发货时效、运费、承运商或服务区域承诺。已有订单以下单时形成的实际记录为核对起点。",
    notice:
      "本站是独立第三方；经营主体与正式履约政策待经营主体确认。",
    sections: [
      {
        id: "existing-order-record",
        title: "已有订单如何核对",
        items: [
          "保留订单号、下单日期、实际付款记录与当时显示的交付说明。",
          "有物流编号时，优先在承运商官方入口核对，不向陌生人提供完整收件信息。",
          "记录最后一个可见节点的时间与状态，不把预估时间写成必达承诺。",
        ],
      },
      {
        id: "exception-routing",
        title: "异常处理顺序",
        paragraphs: [
          "先区分未发货、轨迹长时间无更新、显示签收但未收到、包装损坏或内容不符，再通过原订单渠道提供已打码证据。",
          "补发、退回或补偿的适用条件必须根据实际订单、物流证据和适用法律判断，本页不预先虚构统一结果。",
        ],
      },
      {
        id: "publication-gap",
        title: "待公开信息",
        paragraphs: [
          "发货范围、运费、常用承运商、处理节点和责任主体待经营主体确认。确认前不用历史广告语代替现行政策。",
        ],
      },
    ],
  },

  "/returns/": {
    title: "退货与退款说明｜既有订单处理边界",
    description:
      "getgiffgaff 既有订单的退货、退款与争议证据说明；不虚构退款期限，当前交易暂停。",
    h1: "退货与退款说明",
    pageType: "WebPage",
    robots: "index, follow, max-snippet:-1, max-image-preview:large",
    eyebrow: "Returns and refunds",
    intro:
      "新交易暂停。既有订单的退货、退款或补救方案，需要依实际交付状态、证据、当时交易约定与适用消费者权益规则判断。",
    notice:
      "本站是独立第三方；正式卖方身份和统一售后条款待经营主体确认。",
    sections: [
      {
        id: "start-a-case",
        title: "发起既有订单问题",
        items: [
          "通过原订单渠道提供订单号、付款日期、收货日期和具体问题。",
          "物理损坏或内容不符时，保留包装、物品与物流标签的打码照片。",
          "功能问题时，记录手机型号、系统版本、错误信息和已尝试步骤。",
        ],
      },
      {
        id: "decision-boundary",
        title: "处理边界",
        paragraphs: [
          "本页不虚构退款天数、必退情形或到账时效。实际结果需区分未履约、物流损伤、商品状态不符、运营商系统问题和第三方平台风控。",
          "消费者依法享有的权利不因本页的信息空缺而被排除。存在争议时，保留付款和交付证据，并根据实际交易关系寻求专业建议。",
        ],
      },
      {
        id: "publication-gap",
        title: "待公开信息",
        paragraphs: [
          "退货地址、退回运费承担、审核节点、退款路径和责任主体待经营主体确认。",
        ],
      },
    ],
  },

  "/editorial-policy/": {
    title: "编辑与纠错政策｜来源、复核与修订",
    description:
      "getgiffgaff 的来源优先级、声明标签、复核、失效处理与公开纠错流程。",
    h1: "编辑与纠错政策",
    pageType: "WebPage",
    robots: "index, follow, max-snippet:-1, max-image-preview:large",
    eyebrow: "Editorial accountability",
    intro:
      "本政策约束 getgiffgaff 的信息型内容。本站是独立第三方，不把自身建议写成运营商官方结论。",
    notice:
      "责任主体待经营主体确认；交易暂停期间，编辑内容不用于绕过商业发布门禁。",
    sections: [
      {
        id: "source-policy",
        title: "来源与证据",
        paragraphs: [
          "关键结论优先使用运营商官方帮助、条款和资费页；引用第三方经验时必须标明其局限，不复制其全文、图片或结构。",
          "每页关键声明应靠近标注来源、适用条件、核验日期与失效边界。",
        ],
      },
      {
        id: "labels",
        title: "三类内容标签",
        items: [
          "官方规则：可直接追溯到运营商官方页面的信息。",
          "本站风险建议：用于预留缓冲和降低操作风险，不声称是官方规则。",
          "本站实测：必须公开方法、样本量、测试时间和不能外推的边界。",
        ],
      },
      {
        id: "review-and-authorship",
        title: "复核、署名与失效",
        paragraphs: [
          "不使用虚构作者或审核人。真实责任人未公开时，页面必须如实标记待确认，不用“编辑部”等无法验证的名称替代。",
          "商业、资费、安全或隐私相关声明的来源变更、失效或过期时，下线相关文案和转化入口，而不是继续展示旧结论。",
        ],
      },
      {
        id: "corrections",
        title: "纠错流程",
        paragraphs: [
          "请通过原有支持渠道提供页面 URL、存疑原文、可核对来源与发现日期；不要附带密码、验证码或订单个人信息。",
          "接收后先标记风险，再核对一手来源。确认错误后修正正文、相关元数据和结构化数据，并在页面修订记录中说明变更。响应时间待经营主体确认。",
        ],
        links: [{ href: "/editorial-policy/#corrections", label: "纠错流程永久链接" }],
      },
    ],
  },

  "/disclaimer/": {
    title: "免责声明｜独立第三方与信息边界",
    description:
      "getgiffgaff 的独立第三方身份、运营商规则、验证码、号码及外部链接的信息边界。",
    h1: "免责声明",
    pageType: "WebPage",
    robots: "index, follow, max-snippet:-1, max-image-preview:large",
    eyebrow: "Independent information boundary",
    intro:
      "getgiffgaff 是独立第三方信息与支持网站，非 giffgaff Limited 官方网站、官方客服或授权代表。",
    notice:
      "经营主体待经营主体确认；在完成确认与审核前，交易暂停。",
    sections: [
      {
        id: "rules-change",
        title: "规则与资费会变化",
        paragraphs: [
          "运营商界面、资费、漫游区域、账户规则和处理时间可能随时更新。本站尽量提供来源和复核日期，但操作前仍应打开当日官方页面。",
        ],
      },
      {
        id: "outcome-boundary",
        title: "不承诺的结果",
        items: [
          "不承诺号码永久有效、网络一定可用或某地区信号强度。",
          "不承诺任何第三方平台验证码送达、账户审核通过或风控解除。",
          "不承诺文章中的历史数字在未来继续适用。",
        ],
      },
      {
        id: "external-services",
        title: "外部网站与专业建议",
        paragraphs: [
          "外部链接指向各自运营的网站，其内容、可用性与隐私处理由对应主体负责。",
          "本站内容不是商标、通信服务转售、消费者权益、税务或个人信息处理的法律意见。",
        ],
      },
    ],
  },

  "/privacy/": {
    title: "隐私说明｜最小化收集与敏感信息保护",
    description:
      "getgiffgaff 当前无站内联系表单状态下的数据最小化、安全日志、外部聊天渠道与敏感信息边界。",
    h1: "隐私说明",
    pageType: "WebPage",
    robots: "noindex, follow, noarchive",
    eyebrow: "Data minimisation",
    intro:
      "当前未提供站内联系表单，访客不上传号码、账户或支付资料；本站未启用要求这些资料的站内功能，交易暂停。",
    notice:
      "隐私责任主体、正式联络方式和保留周期待经营主体确认。本站是独立第三方。",
    sections: [
      {
        id: "current-collection",
        title: "当前站内收集状态",
        paragraphs: [
          "当前公开页面未提供账户注册、结账或文件上传。为交付页面和防止滥用，托管与边缘基础设施可能处理 IP 地址、User-Agent、请求路径、时间和响应状态等必要技术信息。",
          "应用日志不应记录原始查询参数、Cookie 或 Authorization，也不应记录订单号、邮箱、电话或聊天截图。启用分析工具前必须先更新本页并完成数据责任审核。",
        ],
      },
      {
        id: "support-channels",
        title: "外部支持渠道",
        paragraphs: [
          "既有订单如果通过外部聊天渠道联系，聊天渠道可能按其自身政策处理信息。发送前应查阅该渠道政策并最小化资料。",
          "请仅提供订单号与打码证据，不要发送密码、验证码、完整支付卡、身份证件、eSIM 二维码或 LPA 凭证。",
        ],
      },
      {
        id: "rights-and-contact",
        title: "权利与联系空缺",
        paragraphs: [
          "正式隐私联系人、数据保留周期、基础设施地区与权利请求流程待经营主体确认。在这些项目公布前，不启用新的个人信息收集功能。",
        ],
      },
    ],
  },

  "/terms/": {
    title: "使用条款｜信息使用与支持边界",
    description:
      "getgiffgaff 公开信息、既有订单支持、独立第三方身份、外部服务与交易暂停的使用边界。",
    h1: "使用条款",
    pageType: "WebPage",
    robots: "noindex, follow, noarchive",
    eyebrow: "Site use boundaries",
    intro:
      "当前网站主要提供公开信息与既有订单支持，不提供新交易、站内账户或站内支付功能。",
    notice:
      "正式合同责任主体待经营主体确认；确认前交易暂停。本站是独立第三方。",
    sections: [
      {
        id: "information-use",
        title: "信息使用",
        paragraphs: [
          "站内教程用于一般信息和风险排查，不构成 giffgaff 的官方承诺，也不替代运营商官方帮助、实时资费、平台规则或专业意见。",
          "用户可为个人查阅合理引用页面，但不应移除来源和风险边界，也不应将本站描述为运营商官方渠道。",
        ],
      },
      {
        id: "existing-order-support",
        title: "既有订单支持",
        paragraphs: [
          "使用原订单渠道请求支持时，应仅提供完成核对所需的最少资料，不得发送密码、验证码、完整支付卡或 eSIM 凭证。",
          "本页不增加、减少或替代适用法律下的消费者权利。具体交易争议应按实际卖方、付款和交付证据判断。",
        ],
      },
      {
        id: "availability",
        title: "可用性与变更",
        paragraphs: [
          "公开信息可能因来源更新、安全事件或纠错而更改或下线。本站不承诺永久可用或某项外部服务持续存在。",
          "完整、可执行的交易条款、适用法律、管辖与正式联系方式待经营主体确认。在此之前不恢复新交易。",
        ],
      },
    ],
  },
});

export const TRUST_PAGE_PATHS = Object.freeze(Object.keys(TRUST_PAGES));
const TRUST_PAGE_SET = new Set(TRUST_PAGE_PATHS);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function pageSchema(pathname, page) {
  const canonical = `${CANONICAL_ORIGIN}${pathname}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: "getgiffgaff",
        url: `${CANONICAL_ORIGIN}/`,
        description:
          "独立第三方信息与已有订单支持网站；责任主体信息待确认。",
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: "getgiffgaff",
        url: `${CANONICAL_ORIGIN}/`,
        inLanguage: "zh-CN",
        publisher: { "@id": ORGANIZATION_ID },
      },
      {
        "@type": "Brand",
        "@id": GIFFGAFF_BRAND_ID,
        name: "giffgaff",
        url: "https://www.giffgaff.com/",
      },
      {
        "@type": page.pageType,
        "@id": `${canonical}#webpage`,
        name: page.title,
        description: page.description,
        url: canonical,
        inLanguage: "zh-CN",
        isPartOf: { "@id": WEBSITE_ID },
        publisher: { "@id": ORGANIZATION_ID },
        about: { "@id": GIFFGAFF_BRAND_ID },
      },
    ],
  };
}

function renderSection(section) {
  return `<section id="${escapeHtml(section.id)}">
          <h2>${escapeHtml(section.title)}</h2>
          ${(section.paragraphs || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n          ")}
          ${section.items?.length ? `<ul>${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
          ${(section.links || []).map(({ href, label }) => `<p><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></p>`).join("\n          ")}
        </section>`;
}

const STYLES = `<style>
    :root { color-scheme:light; --ink:#15221a; --muted:#536158; --green:#28593c; --line:#d9e5dc; --soft:#f4f8f4; --warn:#fff7dd; }
    * { box-sizing:border-box; }
    html { scroll-behavior:smooth; }
    body { margin:0; color:var(--ink); background:#fff; font-family:Inter,"Noto Sans SC","PingFang SC","Microsoft YaHei",system-ui,sans-serif; line-height:1.75; }
    a { color:var(--green); text-underline-offset:.2em; }
    a:focus-visible, summary:focus-visible { outline:3px solid #df9f00; outline-offset:3px; }
    .skip-link { position:absolute; z-index:10; left:16px; top:0; transform:translateY(-140%); padding:10px 14px; color:#fff; background:var(--green); border-radius:0 0 8px 8px; }
    .skip-link:focus { transform:translateY(0); }
    .site-header { display:flex; align-items:center; justify-content:space-between; gap:24px; min-height:72px; padding:14px max(20px,calc((100vw - 1040px)/2)); border-bottom:1px solid var(--line); }
    .brand { color:var(--ink); font-size:20px; font-weight:900; text-decoration:none; }
    .site-header nav { display:flex; flex-wrap:wrap; gap:18px; }
    .site-header nav a { color:var(--ink); font-weight:700; }
    .hero { border-bottom:1px solid var(--line); background:linear-gradient(135deg,#f8fbf8,#edf5ee 62%,#fff7dd); }
    .hero-inner, .content, .footer-inner { width:min(920px,calc(100% - 32px)); margin:0 auto; }
    .hero-inner { padding:52px 0 40px; }
    .eyebrow { margin:0 0 8px; color:var(--green); font-size:13px; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }
    h1 { margin:0; font-size:clamp(34px,6vw,56px); line-height:1.14; letter-spacing:-.02em; }
    .intro { max-width:780px; margin:18px 0 0; color:var(--muted); font-size:18px; }
    .content { padding:36px 0 72px; font-size:17px; }
    .notice { margin:0 0 28px; border:1px solid #ead9a8; border-radius:14px; padding:18px; background:var(--warn); font-weight:750; }
    section { scroll-margin-top:20px; padding:8px 0; }
    h2 { margin:34px 0 12px; font-size:clamp(25px,4vw,34px); line-height:1.25; }
    p { margin:10px 0; }
    li { margin:8px 0; }
    .status { margin-top:36px; border:1px solid var(--line); border-radius:14px; padding:18px; background:var(--soft); }
    footer { border-top:1px solid var(--line); background:#f8faf8; }
    .footer-inner { padding:28px 0; color:var(--muted); }
    .footer-links { display:flex; flex-wrap:wrap; gap:14px; }
    @media (max-width:700px) { .site-header { align-items:flex-start; flex-direction:column; } }
    @media (prefers-reduced-motion:reduce) { html { scroll-behavior:auto; } }
  </style>`;

export function isTrustPage(pathname) {
  return TRUST_PAGE_SET.has(pathname);
}

export function renderTrustPage(pathname) {
  const page = TRUST_PAGES[pathname];
  if (!page) return null;

  const canonical = `${CANONICAL_ORIGIN}${pathname}`;
  const ogImage = ogImageUrlFor(CANONICAL_ORIGIN, pathname);
  const schema = pageSchema(pathname, page);

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(page.title)}</title>
  <meta name="description" content="${escapeHtml(page.description)}">
  <meta name="robots" content="${escapeHtml(page.robots)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="zh_CN">
  <meta property="og:site_name" content="getgiffgaff">
  <meta property="og:title" content="${escapeHtml(page.title)}">
  <meta property="og:description" content="${escapeHtml(page.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(page.title)}">
  <meta name="twitter:description" content="${escapeHtml(page.description)}">
  <meta name="twitter:image" content="${ogImage}">
  ${STYLES}
  <script type="application/ld+json">${jsonLd(schema)}</script>
</head>
<body>
  <a class="skip-link" href="#main-content">跳到主要内容</a>
  <header class="site-header">
    <a class="brand" href="/" aria-label="getgiffgaff 首页">getgiffgaff</a>
    <nav aria-label="主导航"><a href="/guides/">使用教程</a><a href="/about/">关于</a><a href="/editorial-policy/">编辑政策</a><a href="/contact/">联系支持</a></nav>
  </header>
  <main id="main-content" tabindex="-1">
    <div class="hero"><div class="hero-inner">
      <p class="eyebrow">${escapeHtml(page.eyebrow)}</p>
      <h1>${escapeHtml(page.h1)}</h1>
      <p class="intro">${escapeHtml(page.intro)}</p>
    </div></div>
    <article class="content">
      <p class="notice">${escapeHtml(page.notice)}</p>
      ${page.sections.map(renderSection).join("\n      ")}
      <aside class="status" aria-label="当前公开状态">
        <strong>当前公开状态</strong>
        <p>经营主体信息：待经营主体确认。新交易状态：交易暂停。本站是独立第三方，不代表 giffgaff Limited。</p>
      </aside>
    </article>
  </main>
  <footer><div class="footer-inner">
    <strong>getgiffgaff 是独立第三方信息与支持网站，非 giffgaff Limited 官方网站、官方客服或授权代表。</strong>
    <p>经营主体：待经营主体确认。新交易：交易暂停。</p>
    <nav class="footer-links" aria-label="政策导航"><a href="/shipping/">发货</a><a href="/returns/">退款</a><a href="/privacy/">隐私</a><a href="/terms/">条款</a><a href="/disclaimer/">免责</a><a href="/editorial-policy/#corrections">纠错</a></nav>
  </div></footer>
</body>
</html>`;
}
