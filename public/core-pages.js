import { ogImageUrlFor } from "./og-images.js";

const CANONICAL_ORIGIN = "https://getgiffgaff.com";
const UPDATED = "2026-07-15";

const official = Object.freeze({
  help: { title: "giffgaff Help", url: "https://help.giffgaff.com/en/" },
  terms: { title: "giffgaff Terms & Conditions", url: "https://www.giffgaff.com/boiler-plate/terms" },
  gettingStarted: { title: "Getting started on giffgaff", url: "https://help.giffgaff.com/en/articles/240912-getting-started-on-giffgaff" },
  activation: { title: "Activating your giffgaff SIM", url: "https://help.giffgaff.com/en/articles/240393-activating-your-giffgaff-sim" },
  creditPlans: { title: "The difference between credit, plans and contracts", url: "https://help.giffgaff.com/en/articles/234199-the-difference-between-credit-plans-and-contracts" },
  login: { title: "Logging into your giffgaff account", url: "https://help.giffgaff.com/en/articles/627242-logging-into-your-giffgaff-account" },
  accountSecurity: { title: "Protecting your giffgaff account", url: "https://help.giffgaff.com/en/articles/246068-protecting-your-giffgaff-account" },
  app: { title: "Everything you need to know about the giffgaff app", url: "https://help.giffgaff.com/en/articles/242198-everything-you-need-to-know-about-the-giffgaff-app" },
  chinaRoaming: { title: "Roaming in China", url: "https://www.giffgaff.com/roaming/china" },
  travelAddons: { title: "Travel Data add-ons and how they work", url: "https://help.giffgaff.com/en/articles/365501-giffgaff-travel-data-add-ons-and-how-they-work" },
  esim: { title: "Switching to an eSIM with giffgaff", url: "https://help.giffgaff.com/en/articles/261570-switching-to-an-esim-with-giffgaff" },
  memberName: { title: "Changing your member name when setting up your account", url: "https://help.giffgaff.com/en/articles/344912-changing-your-member-name-when-setting-up-your-account" },
  changeNumber: { title: "Changing your giffgaff number", url: "https://help.giffgaff.com/en/articles/240695-changing-your-giffgaff-number" },
  credit: { title: "Everything to know about credit", url: "https://help.giffgaff.com/en/articles/240847-everything-to-know-about-credit" },
  topup: { title: "giffgaff Top-up", url: "https://www.giffgaff.com/top-up" },
  usageStatement: { title: "Guide to the usage statement", url: "https://help.giffgaff.com/en/articles/258872-guide-to-the-usage-statement" },
  topupMissing: { title: "What to do if a top-up is not showing", url: "https://help.giffgaff.com/en/articles/466381-what-to-do-if-you-ve-topped-up-but-it-s-not-showing" },
  paymentIssues: { title: "Issues buying a plan or adding credit", url: "https://help.giffgaff.com/en/articles/258274-issues-buying-a-plan-or-adding-credit" },
  lostSim: { title: "What to do if you have lost your SIM or phone", url: "https://help.giffgaff.com/en/articles/240710-what-to-do-if-you-ve-lost-your-sim-or-phone" },
  keepNumber: { title: "Joining giffgaff and keeping an existing number", url: "https://help.giffgaff.com/en/articles/240398-joining-us-keep-your-existing-number" },
  voicemail: { title: "Everything you need to know about voicemail", url: "https://help.giffgaff.com/en/articles/629442-everything-you-need-to-know-about-voicemail" },
  shortcodes: { title: "Useful network shortcodes", url: "https://help.giffgaff.com/en/articles/245290-useful-network-shortcodes" },
  payback: { title: "Everything you need to know about Payback", url: "https://help.giffgaff.com/en/articles/240850-everything-you-need-to-know-about-payback" },
  paybackPage: { title: "giffgaff Payback", url: "https://www.giffgaff.com/payback" },
});

const link = (title, url, description) => Object.freeze({ title, url, description });
const section = (title, label, paragraphs, items = []) =>
  Object.freeze({ title, label, paragraphs: Object.freeze(paragraphs), items: Object.freeze(items) });

const pages = {
  "/": {
    kind: "home",
    title: "giffgaff 中文使用与风险导航",
    description: "独立第三方 giffgaff 中文信息站：按激活、账号、保号、信号、eSIM、漫游和既有订单支持选路；当前新客交易暂停。",
    h1: "giffgaff 中文使用与风险导航",
    answer: "getgiffgaff 是独立第三方中文信息与既有订单支持站，不是 giffgaff Limited 官方网站、官方客服或授权代表。当前不提供新客购买、库存、报价或 G2 推荐；需要操作时，请先看对应风险边界，再回到 giffgaff 官方页面核验。",
    sections: [
      section("按问题开始", "本站选路", ["先判断你正在处理的是激活、账号、保号、短信信号、eSIM 还是漫游。每个问题由一个主页面负责，避免在多篇文章里得到互相冲突的结论。"], ["首次使用：从激活与卡状态开始。", "账号异常：先保住邮箱、登录与恢复方式。", "收不到短信：先区分无信号、普通短信失败和单一平台 OTP 失败。", "eSIM 与漫游：只按当前官方条件操作，不保存静态价格。"]),
      section("当前交易状态", "发布门禁", ["品牌许可、供货证明、账户控制权和真实经营资料尚未全部通过门禁，因此商城、下单、人工充值和 G2 推荐保持关闭。G0/G2 只作为市场与本站历史资料中的风险分类，不是 giffgaff 官方产品名称。"]),
      section("本站能做与不能做", "责任边界", ["本站可以整理官方入口、解释风险、提供不收集账号信息的本地工具，并处理既有订单与本站内容纠错。运营商账号权限、网络覆盖、第三方平台验证码和未来规则不由本站控制。"]),
    ],
    links: [
      link("教程总览", "/guides/", "按 SIM 生命周期进入唯一教程。"),
      link("G0/G2 风险说明", "/answers/", "只解释状态、来源与账户控制权。"),
      link("常见问题", "/qa/", "账号、充值、补卡、号码与语音信箱。"),
      link("既有订单与使用支持", "/contact/", "查看可处理事项与敏感信息禁传清单。"),
    ],
    sources: [official.gettingStarted, official.terms],
  },
  "/guides/": {
    kind: "hub",
    title: "giffgaff 中文教程总览：按生命周期选路",
    description: "从认识 SIM、激活、账号、保号、信号、旅行数据到避坑，按当前问题进入唯一主教程。",
    h1: "giffgaff 中文教程：按生命周期选路",
    answer: "不要从购买入口或旧截图开始。先确定当前卡状态，再依次处理激活、账号、日常使用、信号与漫游；遇到失败时回到对应主教程，不在多个页面重复尝试。",
    sections: [
      section("第一次接触", "选路建议", ["不确定卡是否激活、Credit 与 plan 有什么区别时，先看入门与激活。不要把 G0/G2 当作官方 SKU。"]),
      section("已经有账号和号码", "选路建议", ["账号登录、恢复与多账号管理属于账号页；保号提醒、有效动作边界属于使用页。两类问题不要混在同一步处理。"]),
      section("信号、eSIM 与旅行", "选路建议", ["普通短信、平台 OTP、网络注册、eSIM 切换和旅行数据是不同层级的问题。先保留可恢复路径，再改变 SIM 或网络状态。"]),
    ],
    links: [
      link("认识 SIM 与使用边界", "/guides/0-intro/", "激活前检查和 Credit/plan 区别。"),
      link("国内激活与失败排查", "/guides/2-activate/", "从卡状态、账号和激活码开始。"),
      link("账号登录与安全", "/guides/3-account/", "登录、恢复和 2-step verification。"),
      link("保号与本地提醒", "/guides/3-usage/", "规则过期或缺复核人时工具自动关闭。"),
      link("短信与信号排查", "/guides/4-signal/", "区分运营商层与单一平台风控。"),
      link("旅行数据与漫游", "/guides/5-travel-data/", "不写死资费，按官方页面核验。"),
      link("使用避坑总览", "/guides/6-pitfalls/", "把高风险动作放回正确顺序。"),
    ],
    sources: [official.help, official.terms],
  },
  "/guides/0-intro/": {
    kind: "article",
    title: "giffgaff SIM 入门：激活前先检查什么",
    description: "解释 giffgaff SIM 激活前的设备、覆盖、卡状态、账号和 Credit/plan 检查，不提供购买或验证码承诺。",
    h1: "giffgaff SIM 入门：激活前先确认状态与责任",
    answer: "开始前先确认设备未被运营商锁定、卡的真实状态、长期可用邮箱和官方激活入口。Credit、plan 与合同不是同一概念；G0/G2 也不是 giffgaff 官方分类。本站不保证中国境内激活、网络覆盖或平台验证码结果。",
    sections: [
      section("先确认卡和设备", "官方规则", ["使用官方 Getting started 与激活页面核对设备、覆盖、SIM 标识和激活入口。未知来源或已做前置处理的卡，应先停止并确认登记责任和账户控制权。"]),
      section("分清 Credit 与 plan", "官方规则", ["Credit 和 plan 的用途、扣费与购买方式不同。不要把账户余额、套餐状态或卖家描述合并成一个“已可用”结论。"]),
      section("本站的失败边界", "本站风险建议", ["操作前保留卡板、账号邮箱和错误提示，但不要向本站发送密码、验证码、完整卡号或 eSIM 二维码。页面或规则变化时以官方页面为准。"]),
    ],
    links: [link("激活教程", "/guides/2-activate/", "按症状分步排查。"), link("账号安全", "/guides/3-account/", "先建立可恢复账号。"), link("G0/G2 风险说明", "/answers/", "理解非官方分类。")],
    sources: [official.gettingStarted, official.activation, official.creditPlans],
  },
  "/guides/3-account/": {
    kind: "article",
    title: "giffgaff 账号管理：登录、恢复与安全边界",
    description: "用官方登录、账号保护和 App 帮助页整理 giffgaff 账号恢复、2-step verification 与多账号切换边界。",
    h1: "giffgaff 账号管理：先保证你能安全恢复",
    answer: "账号问题先从官方登录页、长期可用邮箱和 2-step verification 开始。不要共享密码、验证码或恢复材料，也不要接受由他人长期控制的账号。多个号码通常对应独立账号，App 只是帮助切换和管理。",
    sections: [
      section("登录与找回", "官方规则", ["优先使用当前官方登录与找回路径。记录错误类型和时间即可，不要把密码、一次性验证码或完整身份材料发给第三方。"]),
      section("保护账号", "官方规则", ["开启并维护官方支持的账号保护方式，确保邮箱和验证设备长期可用。更换号码、SIM 或 eSIM 前先确认恢复路径。"]),
      section("多账号不是共享账号", "本站风险建议", ["需要管理多个号码时，应分别确认每个账号的登录凭据与号码归属。不要为了省事复用他人的邮箱、密码或已登录会话。"]),
    ],
    links: [link("找回 member name", "/qa/00-username/", "区分名称修改和登录找回。"), link("多个号码怎么管理", "/qa/05-multiple-number/", "一个号码对应一个有效账号链路。"), link("eSIM 转换", "/more/03-esim/", "切换前先证明账号可恢复。")],
    sources: [official.login, official.accountSecurity, official.app],
  },
  "/guides/5-travel-data/": {
    kind: "article",
    title: "giffgaff 中国漫游与旅行数据：核验条件再计算",
    description: "中国漫游与 Travel Data add-on 的风险说明；不缓存静态资费、汇率、包量、覆盖或 OTP 成功率。",
    h1: "giffgaff 中国漫游：先核验当前分类、资费与计费单位",
    answer: "漫游目的地、资费、计费单位和 add-on 条件会变化。操作当天应打开 giffgaff 的 China roaming 与 Travel Data 官方页面核对；本站在费率声明没有真实复核人和到期日时不计算，也不承诺覆盖、速度或验证码送达。",
    sections: [
      section("先看目的地官方页", "官方规则", ["不要从旧教程截图推断当前漫游分类。直接查看 China roaming 页面，并记录页面日期、币种、服务类型和最小计费单位。"]),
      section("区分 PAYG 与 Travel Data", "官方规则", ["Travel Data add-on 与 plan、Airtime Credit 的关系应以当前官方说明和 App 实际展示为准。不要把数据 add-on 推导成短信、通话或 OTP 保证。"]),
      section("成本工具为什么关闭", "本站风险建议", ["当前 Claim Registry 没有通过复核的完整中国费率声明，所以工具只显示方法边界，不返回任何静态数字。关闭数据漫游和后台数据仍是避免意外用量的基本措施。"]),
    ],
    links: [link("信号与短信排查", "/guides/4-signal/", "先判断网络注册层。"), link("保号与有效动作", "/guides/3-usage/", "漫游不等于保号证明。"), link("使用避坑总览", "/guides/6-pitfalls/", "把费用和账号风险一起检查。")],
    sources: [official.chinaRoaming, official.travelAddons, official.creditPlans],
  },
  "/more/": {
    kind: "hub",
    title: "giffgaff eSIM、设备与安全专题",
    description: "把 eSIM 转换、二维码安全和设备风险分开解释；不提供凭证提取、上传或第三方写卡步骤。",
    h1: "eSIM 与设备专题：先保住账号和恢复路径",
    answer: "eSIM 不是一张可随意复制的图片。切换前先核对设备与地区版本、官方 App、账号登录和短信验证条件；任何要求上传二维码、Cookie、LPA 凭证或共享账号的流程都应立即停止。",
    sections: [
      section("官方切换路径", "官方规则", ["只从 giffgaff 当前帮助页和 App 进入 eSIM 切换。按钮名称、设备支持与验证步骤可能变化。"]),
      section("二维码不是公开素材", "本站风险建议", ["二维码及激活凭证可能包含敏感配置。不要上传到群聊、网盘、第三方写卡站或所谓代操作客服。"]),
      section("失败时先回退", "本站风险建议", ["无法登录账号、收不到验证或设备版本不确定时，先停止切换并保留原 SIM 可用状态。"]),
    ],
    links: [link("实体卡与 eSIM 转换", "/more/03-esim/", "设备、账号和旧 SIM 失效边界。"), link("eSIM 二维码安全", "/more/04-esim-qrcode/", "识别凭证提取与上传风险。"), link("账号管理", "/guides/3-account/", "先建立恢复路径。")],
    sources: [official.esim, official.accountSecurity],
  },
  "/qa/": {
    kind: "hub",
    title: "giffgaff 常见问题：账号、充值、补卡与号码",
    description: "giffgaff 常见问题选路页：每个问题只给短答案并链接唯一主页面，不使用 FAQPage Schema。",
    h1: "giffgaff 常见问题：先找到唯一答案页",
    answer: "这里不堆叠重复 FAQ。账号名称、换号、充值、补卡、号码选择、多账号、语音信箱和 Payback 各有一个主页面；精确金额、时限、资格和 App 路径都要在操作当天回到官方来源复核。",
    sections: [
      section("账号与号码", "问题分流", ["登录或名称问题先看 member name；更换号码、保留号码和多账号管理分别处理，不把它们混成“挑号”。"]),
      section("余额、付款与补卡", "问题分流", ["Credit、plan、top-up 记录和 usage statement 是不同对象。丢卡或损坏先保护账号和号码，再按官方补卡或 SIM swap 路径处理。"]),
      section("功能与奖励", "问题分流", ["语音信箱短码和 Payback 资格都可能变化。本页面只解释官方规则，不提供推广码、收益承诺或招募入口。"]),
    ],
    links: [link("member name 与登录", "/qa/00-username/", "修改入口和找回边界。"), link("更换号码", "/qa/01-change-number/", "随机号码与旧号不可恢复风险。"), link("充值与余额", "/qa/02-topup/", "只讲官方自助路径。"), link("丢卡与补卡", "/qa/03-reissue/", "先挂失和保护账号。"), link("能否自选号码", "/qa/04-choose-number/", "不声称有靓号库存。"), link("多个号码", "/qa/05-multiple-number/", "多个独立账号的管理方式。"), link("语音信箱", "/qa/07-voicemail-switch/", "操作前核对官方短码。"), link("Payback", "/qa/09-spread/", "不展示静态奖励金额。")],
    sources: [official.help, official.terms],
  },
  "/qa/00-username/": {
    kind: "article",
    title: "giffgaff member name：修改与找回边界",
    description: "区分 giffgaff member name 的初始修改入口和登录找回；不代找回、不索要密码或验证码。",
    h1: "giffgaff member name：先区分修改还是找回",
    answer: "如果 Dashboard 当前仍显示 member name 修改入口，可按官方说明核对是否有一次初始修改机会；忘记名称时，优先使用号码登录或官方找回路径。本站不代改、不代找回，也不会索要密码、验证码或完整身份材料。",
    sections: [section("查看当前入口", "官方规则", ["菜单和资格可能变化，只按当前 Dashboard 与官方帮助页操作。看不到入口时不要依赖旧截图反复尝试。"]), section("忘记名称时", "官方规则", ["先尝试官方支持的号码登录与找回方式，并确认邮箱仍可访问。不要把登录验证码交给第三方。"]), section("提交支持前", "本站风险建议", ["只记录错误提示、发生时间和已尝试的官方入口；遮盖账号标识、电话号码和任何一次性凭据。"])],
    links: [link("账号登录与安全", "/guides/3-account/", "建立可恢复路径。"), link("多个号码管理", "/qa/05-multiple-number/", "避免登录错账号。"), link("联系与支持", "/contact/", "查看敏感信息禁传清单。")],
    sources: [official.memberName, official.login, official.accountSecurity],
  },
  "/qa/01-change-number/": {
    kind: "article",
    title: "giffgaff 更换号码：随机新号与不可逆风险",
    description: "解释官方更换号码流程的随机号码、旧号恢复和第三方 2FA 风险，不承诺指定号码或完成时限。",
    h1: "giffgaff 更换号码：先解除旧号的账号依赖",
    answer: "官方当前更换流程提供随机新号码，不是指定号码挑选。旧号一旦更换可能无法恢复；操作前先解除邮箱、支付、社交和其他平台对旧号的登录或 2FA 依赖，并以官方页面当日提示为准。",
    sections: [section("更换前", "本站风险建议", ["列出绑定旧号的重要账号，补齐邮箱、恢复码和备用验证方式。任何无法迁移的账号都应先处理。"]), section("官方流程边界", "官方规则", ["新号由当前官方流程决定，不提供自选或靓号保证。页面显示不可逆提示时，不要在未备份的情况下继续。"]), section("更换后", "本站风险建议", ["记录新号码并逐一更新第三方绑定。不要把“能收普通短信”当成所有平台 OTP 都恢复的证据。"])],
    links: [link("能否自选号码", "/qa/04-choose-number/", "随机换号与 PAC 的区别。"), link("账号安全", "/guides/3-account/", "先准备恢复方式。"), link("短信排查", "/guides/4-signal/", "区分普通短信与平台 OTP。")],
    sources: [official.changeNumber, official.accountSecurity],
  },
  "/qa/02-topup/": {
    kind: "article",
    title: "giffgaff 充值与余额：Credit、plan 和记录怎么查",
    description: "只讲 giffgaff 官方 Credit、plan、top-up、usage statement 与付款故障自助路径；不提供人工代充或处理时限承诺。",
    h1: "giffgaff 充值与余额：先分清对象，再查官方记录",
    answer: "先确认你要处理的是 Airtime Credit、plan、top-up 订单还是 usage statement。它们的用途和记录位置不同。本站不提供人工代充、外卡成功承诺或到账时限；金额、付款条件和当前入口以官方页面为准。",
    sections: [section("Credit 与 plan", "官方规则", ["Credit 与 plan 不是同一余额。先查看官方区别说明，再决定要查的是可用余额、套餐状态还是订单记录。"]), section("官方自助核对", "官方规则", ["从官方 top-up、订单历史和 usage statement 核对时间、金额与状态。不要只凭支付工具扣款截图判断运营商侧已经入账。"]), section("付款或余额未显示", "官方规则", ["停止重复提交，保存脱敏后的时间和错误类型，再按官方 payment issues 或 top-up not showing 页面排查。不要发送完整卡号、验证码或账户密码。"])],
    links: [link("账号登录与安全", "/guides/3-account/", "先确认登录的是正确账号。"), link("保号与有效动作", "/guides/3-usage/", "充值不等于永久有效保证。"), link("既有订单支持", "/contact/", "只处理本站既有订单边界。")],
    sources: [official.credit, official.topup, official.usageStatement, official.topupMissing, official.paymentIssues],
  },
  "/qa/03-reissue/": {
    kind: "article",
    title: "giffgaff SIM 丢失或损坏：挂失、补卡与 SIM swap",
    description: "先保护账号和号码，再按 giffgaff 官方丢卡、补卡或 SIM swap 路径操作；不提供绕过验证方法。",
    h1: "giffgaff SIM 丢失或损坏：先保护账号，再处理替换",
    answer: "丢卡或手机丢失时先按官方路径保护账号和号码。补卡或 SIM swap 必须在要保留号码的原账号内操作；不要把未知来源 SIM 激活进已有有效账号，也不要向第三方发送验证码或恢复材料。",
    sections: [section("先挂失和保护账号", "官方规则", ["确认邮箱、登录与验证方式仍由本人控制，再使用官方丢卡帮助路径。设备同时丢失时还要处理设备锁和第三方账号。"]), section("补卡与 SIM swap", "官方规则", ["在正确原账号内确认替换目的。一张已有有效号码的账号中激活另一张 SIM 可能触发 SIM swap，而不是新增第二个号码。"]), section("无法验证时停止", "本站风险建议", ["不要尝试绕过 MFA、借用他人身份或共享登录会话。只向官方支持提交其明确要求的最少材料。"])],
    links: [link("账号安全", "/guides/3-account/", "先恢复登录。"), link("多个号码管理", "/qa/05-multiple-number/", "避免误触 SIM swap。"), link("激活教程", "/guides/2-activate/", "确认新卡与替换卡入口。")],
    sources: [official.lostSim, official.activation, official.terms],
  },
  "/qa/04-choose-number/": {
    kind: "article",
    title: "giffgaff 能否自选号码：随机换号与 PAC 边界",
    description: "官方换号当前提供随机号码；保留已有英国号码走 PAC 转入。本站没有靓号库存、前缀或指定号码保证。",
    h1: "giffgaff 能否自选号码：不要把随机换号当成挑号",
    answer: "当前官方换号流程提供随机新号码，没有找到支持选择指定新号码的官方路径。若要保留自己已有的英国号码，应核对 PAC 转入流程。本站不提供靓号库存、前缀保证或付费挑号服务。",
    sections: [section("随机换号", "官方规则", ["更换前先处理旧号绑定与恢复风险。新号码由当前官方流程分配，不应根据旧教程承诺可选。"]), section("保留已有号码", "官方规则", ["已有英国号码需要转入时，使用当前官方 keep existing number/PAC 指南，并核对时间窗和账户信息。"]), section("本站不做的承诺", "本站风险建议", ["不展示靓号、可选前缀、库存、价格或成功率，也不接受为挑号而反复换号的建议。"])],
    links: [link("更换号码风险", "/qa/01-change-number/", "先解除旧号依赖。"), link("多个号码管理", "/qa/05-multiple-number/", "独立账号与号码关系。"), link("账号安全", "/guides/3-account/", "保护恢复方式。")],
    sources: [official.changeNumber, official.keepNumber],
  },
  "/qa/05-multiple-number/": {
    kind: "article",
    title: "giffgaff 多个号码：独立账号与 App 管理",
    description: "解释每张有效 SIM 的独立账号链路和 App 多账号管理；不要在已有账号激活第二张卡误触 SIM swap。",
    h1: "giffgaff 多个号码：不是一个账号挂多张有效 SIM",
    answer: "每张有效 SIM 通常需要独立账号。App 可以帮助切换和管理多个账号，但不会把多个有效号码合并到同一账号。若在已有有效号码的账号里激活另一张 SIM，可能触发 SIM swap。",
    sections: [section("一个号码一条账号链路", "官方规则", ["为每张 SIM 保存对应的 member name、邮箱和号码关系。共用邮箱时尤其要确认当前登录的是哪一个账号。"]), section("App 的作用", "官方规则", ["App 可用于访问多个账号，但每个账号仍有独立登录与恢复责任。不要共享密码或已登录会话。"]), section("避免 SIM swap", "本站风险建议", ["新增号码与替换 SIM 是不同操作。看到替换、迁移余额或旧卡停用提示时先停止并核对官方激活说明。"])],
    links: [link("账号管理", "/guides/3-account/", "登录、恢复与安全。"), link("丢卡与补卡", "/qa/03-reissue/", "替换卡的正确边界。"), link("激活教程", "/guides/2-activate/", "确认入口和卡状态。")],
    sources: [official.activation, official.app, official.login],
  },
  "/qa/07-voicemail-switch/": {
    kind: "article",
    title: "giffgaff 语音信箱：开启、关闭与境外边界",
    description: "按 2026-07-15 官方帮助页核对 voicemail 和 network shortcodes；操作前再次确认，不推导漫游费用或通知保证。",
    h1: "giffgaff 语音信箱：先核对当前官方短码",
    answer: "2026-07-15 核验的官方页面列出：1616 开启语音信箱、1626 关闭、443 访问。短码和境外可用性可能变化，操作前请重新打开官方页面；关闭语音信箱不等于保证仍有未接来电通知，也不能据此推导漫游费用。",
    sections: [section("当前官方短码", "官方规则", ["只在确认当前 SIM、网络注册和官方页面一致时使用短码。若页面已经更新，以更新后的官方说明为准。"], ["开启：1616。", "关闭：1626。", "访问：443。"]), section("境外操作", "本站风险建议", ["境外网络、漫游状态和短码路由可能不同。无法操作时不要连续重试，转到官方支持确认。"]), section("不要过度推导", "本站风险建议", ["关闭 voicemail 只改变语音信箱设置，不能证明未接来电通知、漫游费用或第三方平台通话行为。"] )],
    links: [link("信号与短信排查", "/guides/4-signal/", "先确认网络注册。"), link("旅行与漫游", "/guides/5-travel-data/", "不写死费用。"), link("常见问题目录", "/qa/", "返回问题分流。")],
    sources: [official.voicemail, official.shortcodes],
  },
  "/qa/09-spread/": {
    kind: "article",
    title: "giffgaff Payback：资格、领取与推广边界",
    description: "只解释 giffgaff 官方 Payback 的资格与领取边界；不展示固定奖励金额、收益测算、邀请码或招募 CTA。",
    h1: "giffgaff Payback：以 Dashboard 和当前条款为准",
    answer: "Payback 是受资格、活动周期和当前条款约束的官方参与奖励。本站不提供邀请码、招募入口、固定收益或到账保证，也不静态展示奖励金额；是否有资格、如何领取和截止日期应以本人 Dashboard 与官方 Payback 页面为准。",
    sections: [section("先看本人资格", "官方规则", ["不同参与行为、周期和账户状态可能对应不同结果。不要根据第三方截图推断自己已经获得奖励。"]), section("领取与截止期", "官方规则", ["领取方式和时间窗应直接查看本人 Dashboard 与当前 Payback 页面。页面未显示时，不要向第三方支付所谓代领费用。"]), section("本站推广边界", "本站风险建议", ["在品牌许可门禁通过前，本站不作为 Spread、Super Recruiter 或类似推广渠道，不发布收益计算器、邀请码或招募文案。"] )],
    links: [link("品牌与独立身份声明", "/disclaimer/", "了解本站与 giffgaff 的关系。"), link("账号安全", "/guides/3-account/", "保护 Dashboard 登录。"), link("编辑与纠错", "/editorial-policy/#corrections", "提交规则变更线索。")],
    sources: [official.payback, official.paybackPage, official.terms],
  },
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function breadcrumbItems(pathname, page) {
  const items = [{ name: "首页", item: `${CANONICAL_ORIGIN}/` }];
  if (pathname.startsWith("/guides/") && pathname !== "/guides/") {
    items.push({ name: "教程", item: `${CANONICAL_ORIGIN}/guides/` });
  }
  if (pathname.startsWith("/qa/") && pathname !== "/qa/") {
    items.push({ name: "常见问题", item: `${CANONICAL_ORIGIN}/qa/` });
  }
  items.push({ name: page.h1, item: `${CANONICAL_ORIGIN}${pathname}` });
  return items.map((entry, index) => ({ "@type": "ListItem", position: index + 1, ...entry }));
}

function schemasFor(pathname, page) {
  const canonical = `${CANONICAL_ORIGIN}${pathname}`;
  if (page.kind === "home") {
    return [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${CANONICAL_ORIGIN}/#organization`,
        name: "getgiffgaff",
        url: `${CANONICAL_ORIGIN}/`,
        description: "独立第三方中文信息与既有订单支持站，不是 giffgaff Limited 官方网站、官方客服或授权代表。",
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${CANONICAL_ORIGIN}/#website`,
        name: "getgiffgaff",
        url: `${CANONICAL_ORIGIN}/`,
        inLanguage: "zh-CN",
        publisher: { "@id": `${CANONICAL_ORIGIN}/#organization` },
      },
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        name: page.h1,
        url: canonical,
        description: page.description,
        dateModified: UPDATED,
        isPartOf: { "@id": `${CANONICAL_ORIGIN}/#website` },
        about: { "@type": "Brand", name: "giffgaff", url: "https://www.giffgaff.com/" },
      },
    ];
  }

  const pageSchema = page.kind === "hub"
    ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": `${canonical}#collection`,
        name: page.h1,
        url: canonical,
        description: page.description,
        dateModified: UPDATED,
        isPartOf: { "@id": `${CANONICAL_ORIGIN}/#website` },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: page.links.map((entry, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: entry.title,
            url: `${CANONICAL_ORIGIN}${entry.url}`,
          })),
        },
      }
    : {
        "@context": "https://schema.org",
        "@type": "Article",
        "@id": `${canonical}#article`,
        mainEntityOfPage: canonical,
        headline: page.h1,
        description: page.description,
        url: canonical,
        inLanguage: "zh-CN",
        dateModified: UPDATED,
        author: { "@id": `${CANONICAL_ORIGIN}/#organization`, "@type": "Organization", name: "getgiffgaff" },
        publisher: { "@id": `${CANONICAL_ORIGIN}/#organization` },
        about: { "@type": "Brand", name: "giffgaff", url: "https://www.giffgaff.com/" },
        citation: page.sources.map(({ url }) => url),
      };
  return [
    pageSchema,
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems(pathname, page),
    },
  ];
}

function renderSections(page) {
  return page.sections.map((entry, index) => `<section id="section-${index + 1}">
    <p class="evidence-label">${escapeHtml(entry.label)}</p>
    <h2>${escapeHtml(entry.title)}</h2>
    ${entry.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
    ${entry.items.length ? `<ul>${entry.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
  </section>`).join("\n");
}

const styles = `<style>
  :root{color-scheme:light;--ink:#142019;--muted:#58645d;--green:#315f43;--line:#dbe6dd;--soft:#f3f8f3;--gold:#fff5d9}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;color:var(--ink);background:#fff;font-family:Inter,"Noto Sans SC","PingFang SC","Microsoft YaHei",system-ui,sans-serif}a{color:var(--green)}.skip-link{position:fixed;z-index:100;left:16px;top:12px;transform:translateY(-180%);padding:10px 14px;border-radius:8px;background:#142019;color:#fff;font-weight:800}.skip-link:focus{transform:none}.site-header{display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:72px;padding:14px max(20px,calc((100vw - 1080px)/2));border-bottom:1px solid var(--line)}.brand{color:var(--ink);text-decoration:none;font-weight:900}.brand small{display:block;color:var(--muted);font-weight:500}.site-header nav{display:flex;flex-wrap:wrap;gap:16px}.site-header nav a{color:var(--ink);font-weight:750;text-decoration:none}.hero{background:linear-gradient(135deg,#f8fbf7,#edf6ee 60%,var(--gold));border-bottom:1px solid var(--line)}.hero-inner,.layout,.footer-inner{width:min(1080px,calc(100% - 32px));margin:auto}.hero-inner{padding:54px 0 40px}.breadcrumbs{display:flex;gap:8px;flex-wrap:wrap;color:var(--muted);font-size:14px}.eyebrow,.evidence-label{color:var(--green);font-weight:900;letter-spacing:.07em;text-transform:uppercase;font-size:13px}h1{max-width:900px;margin:12px 0;font-size:clamp(34px,5vw,58px);line-height:1.12}.deck{max-width:850px;color:var(--muted);font-size:18px;line-height:1.8}.layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:40px;padding:42px 0 72px}article{font-size:17px;line-height:1.85}.answer{padding:22px;border:1px solid #bfd5c5;border-radius:16px;background:var(--soft)}article section{margin-top:44px;scroll-margin-top:20px}h2{margin:6px 0 12px;font-size:clamp(25px,3vw,34px);line-height:1.25}li{margin:8px 0}.side{align-self:start;position:sticky;top:18px}.panel{margin-bottom:18px;padding:20px;border:1px solid var(--line);border-radius:14px}.panel h2{font-size:20px}.link-card{display:block;margin:11px 0;padding:14px;border:1px solid var(--line);border-radius:12px;text-decoration:none}.link-card strong,.link-card span{display:block}.link-card span{margin-top:4px;color:var(--muted);font-size:14px;line-height:1.5}.source-list{padding-left:20px}.editor-note{margin-top:42px;padding:18px;border-left:4px solid var(--green);background:#fafcf9}.footer{border-top:1px solid var(--line);background:#f8faf8}.footer-inner{padding:28px 0;color:var(--muted);line-height:1.7}@media(max-width:800px){.site-header{align-items:flex-start;flex-direction:column}.layout{grid-template-columns:1fr}.side{position:static}}
</style>`;

export const CORE_PAGES = Object.freeze(
  Object.fromEntries(Object.entries(pages).map(([pathname, page]) => [pathname, Object.freeze({ ...page })])),
);

export const CORE_PAGE_PATHS = Object.freeze(Object.keys(CORE_PAGES));

export function isCorePage(pathname) {
  return Boolean(CORE_PAGES[pathname]);
}

export function renderCorePage(
  pathname,
  { articleAddon = "", headAddon = "" } = {},
) {
  const page = CORE_PAGES[pathname];
  if (!page) return null;
  const canonical = `${CANONICAL_ORIGIN}${pathname}`;
  const ogImage = ogImageUrlFor(CANONICAL_ORIGIN, pathname);
  const breadcrumbs = breadcrumbItems(pathname, page);
  const schemas = schemasFor(pathname, page);
  return `<!doctype html><html lang="zh-CN"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(page.title)} · getgiffgaff</title>
  <meta name="description" content="${escapeHtml(page.description)}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="${page.kind === "article" ? "article" : "website"}">
  <meta property="og:locale" content="zh_CN"><meta property="og:site_name" content="getgiffgaff">
  <meta property="og:title" content="${escapeHtml(page.title)}">
  <meta property="og:description" content="${escapeHtml(page.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${ogImage}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(page.title)}"><meta name="twitter:description" content="${escapeHtml(page.description)}"><meta name="twitter:image" content="${ogImage}">
  ${headAddon}
  ${styles}
  ${schemas.map((schema) => `<script type="application/ld+json">${jsonLd(schema)}</script>`).join("\n")}
  </head><body><a class="skip-link" href="#main-content">跳到主要内容</a>
  <header class="site-header"><a class="brand" href="/">getgiffgaff<small>独立第三方使用与风险信息</small></a><nav aria-label="主导航"><a href="/guides/">教程</a><a href="/more/">eSIM 专题</a><a href="/qa/">常见问题</a><a href="/about/">关于</a><a href="/contact/">支持</a></nav></header>
  <main id="main-content" tabindex="-1"><section class="hero"><div class="hero-inner"><nav class="breadcrumbs" aria-label="面包屑">${breadcrumbs.map((entry, index) => `${index ? "<span>/</span>" : ""}<a href="${new URL(entry.item).pathname}">${escapeHtml(entry.name)}</a>`).join("")}</nav><p class="eyebrow">Independent evidence guide</p><h1>${escapeHtml(page.h1)}</h1><p class="deck">${escapeHtml(page.description)}</p><p><time datetime="${UPDATED}">核验日期：${UPDATED}</time></p></div></section>
  <div class="layout"><article><div class="answer"><strong>直接答案</strong><p>${escapeHtml(page.answer)}</p></div>${renderSections(page)}${articleAddon}<div class="editor-note"><strong>编辑与纠错</strong><p>编辑责任主体：getgiffgaff。当前未公开个人作者或审核人，本站不虚构署名；本文未经 giffgaff Limited 审核或背书。发现官方规则变化，请使用<a href="/editorial-policy/#corrections">纠错入口</a>。</p></div></article>
  <aside class="side"><section class="panel" aria-labelledby="related-title"><h2 id="related-title">继续处理</h2>${page.links.map((entry) => `<a class="link-card" href="${escapeHtml(entry.url)}"><strong>${escapeHtml(entry.title)}</strong><span>${escapeHtml(entry.description)}</span></a>`).join("")}</section><section class="panel" aria-labelledby="sources-title"><h2 id="sources-title">直接来源</h2><ul class="source-list">${page.sources.map((source) => `<li><a href="${escapeHtml(source.url)}" rel="external noopener">${escapeHtml(source.title)}</a></li>`).join("")}</ul><p>界面、金额、时限和资格可能变化，操作当日请重新打开来源。</p></section></aside></div></main>
  <footer class="footer"><div class="footer-inner"><strong>getgiffgaff 是独立第三方信息站。</strong><p>不承诺号码永久有效、网络覆盖、静态价格或第三方平台验证码送达。</p></div></footer></body></html>`;
}
