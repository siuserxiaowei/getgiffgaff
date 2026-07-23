const REVIEWED_AT = "2026-07-17";
const EXPIRES_AT = "2026-08-15";
const SEARCH_CONTENT_REVIEWED_AT = "2026-07-20";
const ACCOUNT_VERIFICATION_REVIEWED_AT = "2026-07-20";
const LOCAL_SEARCH_REVIEWED_AT = "2026-07-24";

const official = Object.freeze({
  activation: {
    label: "giffgaff 官方 SIM 激活说明",
    url: "https://help.giffgaff.com/en/articles/240393-activating-your-giffgaff-sim",
  },
  credit: {
    label: "giffgaff 官方 Credit 说明",
    url: "https://help.giffgaff.com/en/articles/240847-everything-to-know-about-credit",
  },
  usageStatement: {
    label: "giffgaff 官方使用明细说明",
    url: "https://help.giffgaff.com/en/articles/258872-guide-to-the-usage-statement",
  },
  network: {
    label: "giffgaff 官方网络与服务排障",
    url: "https://help.giffgaff.com/en/articles/639659-network-service-troubleshooting",
  },
  lostSim: {
    label: "giffgaff 丢失 SIM 或手机处理",
    url: "https://help.giffgaff.com/en/articles/240710-what-to-do-if-you-ve-lost-your-sim-or-phone",
  },
  simOrder: {
    label: "giffgaff 英国及境外订卡说明",
    url: "https://help.giffgaff.com/en/articles/240676-ordering-a-sim-in-the-uk-or-abroad",
  },
  plans: {
    label: "giffgaff 当前 SIM 套餐类型",
    url: "https://www.giffgaff.com/sim-only-deals",
  },
  esim: {
    label: "giffgaff 官方 eSIM 切换说明",
    url: "https://help.giffgaff.com/en/articles/261570-switching-to-an-esim-with-giffgaff",
  },
  esimNewPhone: {
    label: "giffgaff 官方 eSIM 换机说明",
    url: "https://help.giffgaff.com/en/articles/240399-continuing-to-use-your-esim-if-you-switch-to-a-different-phone",
  },
  esimDeleted: {
    label: "giffgaff 官方 eSIM 误删恢复说明",
    url: "https://help.giffgaff.com/en/articles/240403-what-to-do-if-you-delete-your-esim",
  },
  apn: {
    label: "giffgaff 官方互联网 APN 设置",
    url: "https://help.giffgaff.com/en/articles/245215-internet-apn-settings-guide",
  },
  roamingTroubleshooting: {
    label: "giffgaff 官方境外漫游故障排查",
    url: "https://help.giffgaff.com/en/articles/229483-i-m-having-problems-roaming-abroad",
  },
  roamingChina: {
    label: "giffgaff 中国漫游费率",
    url: "https://www.giffgaff.com/roaming/china",
  },
  travelAddOn: {
    label: "giffgaff 非欧盟 Travel Data Add-on 说明",
    url: "https://help.giffgaff.com/en/articles/365501-giffgaff-travel-data-add-ons-and-how-they-work",
  },
  inactive: {
    label: "giffgaff 号码停用说明",
    url: "https://help.giffgaff.com/en/articles/242797-understanding-why-your-number-has-been-deactivated",
  },
  manualRoam: {
    label: "giffgaff 手动选网说明",
    url: "https://help.giffgaff.com/en/articles/258873-how-to-perform-a-manual-roam",
  },
  volte: {
    label: "giffgaff Wi-Fi Calling 与 VoLTE 说明",
    url: "https://help.giffgaff.com/en/articles/258841-understanding-wifi-calling-and-volte",
  },
  smsPolicy: {
    label: "giffgaff 短信使用政策",
    url: "https://help.giffgaff.com/en/articles/246074-policy-to-manage-illegitimate-sms-usage",
  },
  terms: {
    label: "giffgaff 当前条款",
    url: "https://www.giffgaff.com/boiler-plate/terms",
  },
  ofcomCoverage: {
    label: "Ofcom 英国移动网络覆盖比较",
    url: "https://www.ofcom.org.uk/mobile-coverage-checker?language=en",
  },
  heathrowSim: {
    label: "希思罗机场英国 SIM 与手机服务",
    url: "https://www.heathrow.com/zh/at-the-airport/airport-services/uk-sims-and-phones",
  },
  manchesterStudentCommunications: {
    label: "曼彻斯特大学国际学生通信费用说明",
    url: "https://www.manchester.ac.uk/study/international/finance-and-scholarships/communications/",
  },
  tflMobileCoverage: {
    label: "TfL 伦敦地铁移动网络与 Wi-Fi 说明",
    url: "https://tfl.gov.uk/modes/tube/station-wifi",
  },
  claudeIdentity: {
    label: "Claude 官方身份验证说明",
    url: "https://support.claude.com/en/articles/14328960-identity-verification-on-claude",
  },
  claudePhone: {
    label: "Claude 官方手机号验证说明",
    url: "https://support.claude.com/en/articles/8287232-verify-your-phone-number",
  },
  claudeAppeals: {
    label: "Claude 官方保障措施警告与申诉说明",
    url: "https://support.claude.com/en/articles/8241253-safeguards-warnings-and-appeals",
  },
  claudeRestrictedAppeal: {
    label: "Claude 个人账号官方申诉入口",
    url: "https://claude.ai/restricted",
  },
  claudeIdentityHelp: {
    label: "Claude 身份验证官方帮助表单",
    url: "https://claude.com/form/identity-verification-help",
  },
  anthropicPrivacy: {
    label: "Anthropic 官方隐私政策",
    url: "https://www.anthropic.com/legal/privacy",
  },
  claudeLogin: {
    label: "Claude 官方账号登录说明",
    url: "https://support.claude.com/en/articles/13189465-log-in-to-your-claude-account",
  },
  claudeLocations: {
    label: "Claude 官方支持地区说明",
    url: "https://support.claude.com/en/articles/8461763-where-can-i-access-claude",
  },
  roamingRestOfWorld: {
    label: "giffgaff 官方境外漫游使用说明",
    url: "https://help.giffgaff.com/en/articles/229548-using-your-mobile-phone-in-the-rest-of-the-world",
  },
});

function page(frontmatter) {
  return Object.freeze({
    updatedAt: REVIEWED_AT,
    reviewedAt: REVIEWED_AT,
    author: Object.freeze({ type: "Organization", name: "getgiffgaff" }),
    ...frontmatter,
  });
}

function policyStatusPage({
  path,
  title,
  h1,
  policyName,
  missingFacts,
  confirmedFactsHtml = "",
}) {
  return page({
    path,
    indexPolicy: "noindex",
    schemaType: "WebPage",
    intent: `${policyName}状态与资料缺口`,
    title,
    description: `${policyName}尚待经营负责人按真实业务流程确认；本页公开资料缺口并暂停把不完整说明当作正式政策使用。`,
    h1,
    deck: "信息待经营负责人确认；在完整政策通过审核前，本页保持 noindex。",
    directAnswer: `这不是完整${policyName}。目前缺少经营负责人确认的真实业务事实，因此不能用通用模板补全。涉及付款、下单或提交个人资料时，请先暂停并通过联系页取得与具体订单对应的书面说明；未取得前请勿付款。`,
    threshold: `经营负责人提交并审核真实流程，至少补齐：${missingFacts}；完成后还需复核页面、交易流程和证据留档，才能评估是否开放索引。`,
    sections: [
      {
        id: "status",
        title: "当前状态",
        html: `<p><strong>信息待经营负责人确认。</strong>本站没有在此虚构经营主体、渠道、期限、费用或例外。本页仍不是完整${policyName}，也不表示任何默认承诺。</p>${confirmedFactsHtml}<p>如果具体订单需要依赖本页尚未确认的信息，请暂停付款并联系本站索取书面说明；无法取得时请勿付款。</p>`,
      },
      {
        id: "missing",
        title: "发布完整页面前必须补齐什么",
        html: `<p>${missingFacts}。所有字段都要来自真实流程、实际渠道或负责人书面确认，并保留审核日期和版本记录。</p>`,
      },
      {
        id: "boundary",
        title: "本页不能证明什么",
        html: `<p>本页不能证明某项服务一定可用，也不能证明价格、发货、退款、数据处理或售后结果。giffgaff 运营商规则不能替代本站作为独立第三方销售服务站应提供的自身说明。</p>`,
      },
    ],
    sources: [],
    relatedRoutes: [
      { href: "/contact/", label: "联系本站确认具体订单" },
      { href: "/guides/1-order/", label: "查看购买风险边界" },
      { href: "/guides/7-arrival-checklist/", label: "查看收卡验收清单" },
    ],
    commerceTarget: { href: "/contact/", label: "先确认再决定是否付款" },
  });
}

export const GROWTH_PAGES = Object.freeze([
  page({
    path: "/guides/claude-identity-verification/",
    indexPolicy: "index",
    schemaType: "Article",
    updatedAt: ACCOUNT_VERIFICATION_REVIEWED_AT,
    reviewedAt: ACCOUNT_VERIFICATION_REVIEWED_AT,
    intent: "Claude 身份验证、KYC 与失败处理",
    title: "Claude 身份验证与 KYC｜证件、自拍和失败处理",
    description:
      "Claude 身份验证与手机号验证不是一回事：核对政府签发的实体照片证件、实时自拍、Persona 流程、失败重试、账号申诉与隐私安全边界。",
    h1: "Claude 身份验证 / KYC：证件、自拍与失败处理",
    deck: "先判断你遇到的是政府证件身份核验，还是六位短信手机号验证；两者需要的资料和解决路径完全不同。",
    directAnswer:
      "Claude 官方身份验证是一项真实身份核验：在部分场景中，用户需要提交本人持有的、政府签发且带照片的实体证件，并可能完成实时自拍；截图、扫描件、数字证件和学生证不符合当前官方说明。它不是手机号短信验证，英国号码不能替代证件、自拍、年龄或地区资格。失败时只按官方页面重新拍摄、改用本人其他合格证件或联系官方支持，不要购买身份资料、借用证件或找人代验证。",
    answerSources: [official.claudeIdentity],
    sections: [
      {
        id: "identity-or-phone",
        title: "先分清：身份 KYC 还是手机号短信验证",
        html: `<div class="growth-table-wrap" role="region" tabindex="0" aria-label="Claude 身份验证与手机号验证区别"><table><caption>两个流程不能互相替代</caption><thead><tr><th>流程</th><th>核验什么</th><th>giffgaff 是否相关</th></tr></thead><tbody><tr><th>身份验证 / KYC</th><td>本人政府照片证件，并可能进行实时自拍</td><td>不相关；手机号不能替代身份资料</td></tr><tr><th>手机号验证</th><td>用户能否访问一个可收短信的受支持号码</td><td>可能与实体英国号码和普通短信有关，但平台是否接受与发送不保证</td></tr></tbody></table></div><p>当前官方身份验证说明见<a href="${official.claudeIdentity.url}" target="_blank" rel="noopener noreferrer">${official.claudeIdentity.label}</a>（核验 ${ACCOUNT_VERIFICATION_REVIEWED_AT}）。如果页面向你发送六位短信代码，请转到<a href="/guides/claude-phone-verification/">Claude 手机号验证排查</a>。</p>`,
      },
      {
        id: "prepare",
        title: "提交前准备本人实体证件和拍摄环境",
        html: `<p>官方列举的常见合格证件包括护照、驾照或州/省身份证、国家身份证；具体国家和证件是否接受仍由当前验证流程判断。</p><ul class="growth-list"><li>使用本人当前有效、政府签发且带照片的原始实体证件。</li><li>清洁镜头，在光线均匀、无反光和无遮挡的环境拍摄完整证件。</li><li>如流程要求自拍，必须由证件本人实时完成，不使用旧照片、滤镜或合成图。</li><li>只在 Claude 官方页面跳转的身份验证流程中提交，不通过微信、Telegram 或陌生表单发送证件。</li></ul><p><a href="${official.claudeIdentity.url}" target="_blank" rel="noopener noreferrer">${official.claudeIdentity.label}</a>当前明确不接受复印件、截图、扫描件、照片翻拍、数字或移动证件、非政府证件（包括学生证、员工卡、图书证和银行卡）以及临时纸质证件（核验 ${ACCOUNT_VERIFICATION_REVIEWED_AT}）。</p>`,
      },
      {
        id: "persona-privacy",
        title: "Persona 与验证数据怎么处理",
        html: `<p>Anthropic 当前选择 Persona Identities 作为身份验证合作方。<strong>Anthropic 是数据控制者</strong>，决定验证数据的用途和保留规则；Persona 按 Anthropic 的指示代为处理、收集和保存证件与自拍。Anthropic 可在需要时通过 Persona 平台访问验证记录，但官方称不会把证件和自拍图片复制或存储到自己的系统。</p><p>官方当前还说明验证数据不用于训练模型或营销，并按既定保留限制与适用法律删除；这些是动态政策，不应扩张为“永久不保存任何数据”。详见<a href="${official.claudeIdentity.url}" target="_blank" rel="noopener noreferrer">${official.claudeIdentity.label}</a>与<a href="${official.anthropicPrivacy.url}" target="_blank" rel="noopener noreferrer">${official.anthropicPrivacy.label}</a>（核验 ${ACCOUNT_VERIFICATION_REVIEWED_AT}）。</p>`,
      },
      {
        id: "failed",
        title: "身份验证失败后怎么处理",
        html: `<ol class="growth-steps"><li>保存不含证件号码和人脸图像的错误文字与发生时间。</li><li>按官方提示重新拍摄，检查证件有效期、边缘、清晰度、光线和遮挡。</li><li>如果本人持有另一种官方接受的实体政府照片证件，可改用该证件。</li><li>用尽流程内提供的尝试次数后，使用<a href="${official.claudeIdentityHelp.url}" target="_blank" rel="noopener noreferrer">${official.claudeIdentityHelp.label}</a>联系官方；不要把证件、密码或验证码交给本站。</li></ol><p>官方身份说明也提到验证后账号仍可能被停用；只有官方明确显示账号禁用时，才转到<a href="/guides/claude-account-disabled-appeal/">Claude 封号与申诉页</a>。身份验证帮助表单不能替代账号封禁申诉，本页也不能判断个案原因或申诉结果（核验 ${ACCOUNT_VERIFICATION_REVIEWED_AT}）。</p>`,
      },
      {
        id: "privacy-boundary",
        title: "隐私与合规边界：本站不能代做什么",
        html: `<p class="growth-warning">本站不接收证件、人脸照片、密码、Cookie、一次性验证码或申诉账号；不提供假身份、借证、证件生成、代刷脸、地区伪装或绕过验证服务。</p><p>手机号验证、身份核验、年龄核验、地区资格和账号申诉是不同任务。购买英国号码不会改变你的真实身份、年龄、所在地或平台资格，也不能解封已有账号。</p>`,
      },
    ],
    sources: [official.claudeIdentity, official.claudeIdentityHelp, official.anthropicPrivacy, official.claudePhone, official.claudeAppeals],
    relatedRoutes: [
      { label: "Claude 手机号验证与六位短信代码", href: "/guides/claude-phone-verification/" },
      { label: "Claude 被禁用或 403 后的官方申诉", href: "/guides/claude-account-disabled-appeal/" },
      { label: "英国手机号收不到验证码的基础排查", href: "/guides/4-signal/" },
      { label: "giffgaff 账号、激活与 OTP 避坑总览", href: "/guides/6-pitfalls/" },
    ],
    commerceWidget: false,
    commerceHeading: "先判断是否真的卡在短信验证",
    commerceDescription: "证件 KYC 和封号申诉不能靠买号码解决；只有实际需要长期英国实体号码时，才继续查看手机号验证规则。",
    commerceTarget: { label: "实际卡在短信验证？先看手机号规则", href: "/guides/claude-phone-verification/" },
  }),
  page({
    path: "/guides/claude-phone-verification/",
    indexPolicy: "index",
    schemaType: "Article",
    updatedAt: ACCOUNT_VERIFICATION_REVIEWED_AT,
    reviewedAt: ACCOUNT_VERIFICATION_REVIEWED_AT,
    intent: "Claude 手机号验证、验证码与号码限制",
    title: "Claude 手机号验证｜收不到六位验证码与号码限制",
    description:
      "按 Claude 官方规则排查手机号验证：支持地区、实体移动号码、六位短信验证码、VoIP 限制、号码使用次数、无法换绑及 giffgaff 普通短信边界。",
    h1: "Claude 手机号验证：收不到六位验证码怎么办",
    deck: "先核对平台资格和号码类型，再用普通短信判断是 giffgaff 通信故障，还是 Claude 平台没有接受或发送 OTP。",
    directAnswer:
      "Claude 当前官方说明要求新账号使用来自支持地区、能接收短信的电话号码，并发送六位代码验证；VoIP、Google Voice、应用生成号码和座机不被接受，也不能跳过该步骤。号码验证后目前不能更改，因此应使用本人长期控制的号码。giffgaff 实体英国号码只可能满足“实体移动号码和普通短信”这一层，不能证明用户位于支持地区，也不保证 Claude 接受具体号码、发送代码或让账号通过审核。",
    answerSources: [official.claudePhone, official.claudeLocations],
    sections: [
      {
        id: "requirements",
        title: "Claude 当前接受什么样的电话号码",
        html: `<p>Claude 官方称手机号验证用于防止垃圾信息和滥用，并确认用户能访问该号码；它不是政府证件身份核验。</p><ul class="growth-list"><li>用户与号码必须满足 Claude 当前支持地区要求。</li><li>号码需要能接收普通短信，并由本人长期访问和控制。</li><li>官方当前不接受 VoIP、Google Voice、应用生成号码、座机或其他不能正常接收短信的号码。</li><li>没有符合要求的号码时，官方说明不能跳过手机号验证。</li></ul><p>以上条件来自<a href="${official.claudePhone.url}" target="_blank" rel="noopener noreferrer">${official.claudePhone.label}</a>与<a href="${official.claudeLocations.url}" target="_blank" rel="noopener noreferrer">${official.claudeLocations.label}</a>（核验 ${ACCOUNT_VERIFICATION_REVIEWED_AT}）。英国号码不等于用户身处英国，也不改变真实地区资格。</p>`,
      },
      {
        id: "no-code",
        title: "收不到六位验证码：先做二分诊断",
        html: `<ol class="growth-steps"><li><strong>先测普通短信：</strong>如果所有普通短信都收不到，检查 SIM 是否激活、号码是否停用、漫游开关、设备和手动选网。境外漫游、网络排查和手动选网分别见<a href="${official.roamingRestOfWorld.url}" target="_blank" rel="noopener noreferrer">${official.roamingRestOfWorld.label}</a>、<a href="${official.roamingTroubleshooting.url}" target="_blank" rel="noopener noreferrer">${official.roamingTroubleshooting.label}</a>和<a href="${official.manualRoam.url}" target="_blank" rel="noopener noreferrer">${official.manualRoam.label}</a>（核验 ${ACCOUNT_VERIFICATION_REVIEWED_AT}）；也可继续看<a href="/guides/4-signal/">英国手机号收不到验证码的基础排查</a>。</li><li><strong>普通短信正常：</strong>如果只有 Claude 代码不到，问题更可能在号码接受规则、账号、平台风控或发送路由；换 APN 或充值不能保证解决。</li><li><strong>等满五分钟：</strong>代码可能延迟几分钟；超过五分钟仍未收到，按官方界面点 <code>Try again</code> 重置，再重新输入并核对号码。官方没有给出无限重试或其他“安全频率”。</li><li><strong>代码过期：</strong>临时代码会失效，只使用最新一次收到的六位代码；重开流程后尽快输入新代码。</li><li><strong>显示号码已使用或使用过多：</strong>这可能表示另一个 Claude 账号已经绑定该号码。知道对应邮箱时，登录原账号联系官方 Support 请求 unlink；否则可使用一个符合地区和号码类型要求、且尚未用于 Claude 验证的本人长期号码。这不是绕过封禁、地区资格或平台风控的方法。</li></ol><p>上述五分钟、<code>Try again</code>、发送错误、临时代码和号码解除关联分支均来自<a href="${official.claudePhone.url}" target="_blank" rel="noopener noreferrer">${official.claudePhone.label}</a>（核验 ${ACCOUNT_VERIFICATION_REVIEWED_AT}）。</p>`,
      },
      {
        id: "cannot-change",
        title: "为什么验证前要规划长期保号",
        html: `<p>Claude 官方当前说明，电话号码完成验证后不能更改。把号码用于重要账号前，应确认号码由本人长期控制，并为停用、丢卡、换卡、漫游失效和账号恢复预留方案。Claude 日常登录当前使用 Google 或邮件安全链接；跨设备代码属于邮件登录流程，不应误当成每次都通过 SMS 登录，见<a href="${official.claudeLogin.url}" target="_blank" rel="noopener noreferrer">${official.claudeLogin.label}</a>（核验 ${ACCOUNT_VERIFICATION_REVIEWED_AT}）。</p><p>giffgaff SIM 连续六个月没有官方列出的有效使用可能停用。有效动作包括主动通话、主动发送短信或 MMS、移动数据连接、购买 Airtime Credit 或 plan；<strong>只接收验证码不在官方列出的保活动作中</strong>。详见<a href="${official.inactive.url}" target="_blank" rel="noopener noreferrer">${official.inactive.label}</a>（核验 ${ACCOUNT_VERIFICATION_REVIEWED_AT}）、<a href="/guides/3-usage/">保号规则教程</a>和<a href="/tools/keep-number-reminder/">本地保号提醒工具</a>。它们降低号码意外停用风险，但不保证第三方平台继续接受该号码。</p>`,
      },
      {
        id: "giffgaff-boundary",
        title: "giffgaff 能解决什么，不能解决什么",
        html: `<div class="growth-table-wrap" role="region" tabindex="0" aria-label="giffgaff 与 Claude 手机号验证边界"><table><caption>购买前先按责任层分流</caption><thead><tr><th>可以检查</th><th>不能承诺</th></tr></thead><tbody><tr><td>实体卡交付、激活、号码状态、设备、漫游、普通短信</td><td>Claude 接受具体号码、验证码必达、地区资格、身份 KYC 或账号批准</td></tr><tr><td>长期保号和丢卡后的运营商恢复准备</td><td>绕过号码次数、平台风控、封号或官方申诉结果</td></tr></tbody></table></div><p class="growth-warning">咨询时不要发送密码、Cookie、六位验证码、证件或完整账号资料。客服只能排查卡片与普通通信，不能代过验证。</p>`,
      },
    ],
    sources: [official.claudePhone, official.claudeLocations, official.claudeLogin, official.roamingRestOfWorld, official.roamingTroubleshooting, official.manualRoam, official.network, official.inactive],
    relatedRoutes: [
      { label: "英国手机号收不到验证码的基础排查", href: "/guides/4-signal/" },
      { label: "Claude 身份 KYC、证件与自拍", href: "/guides/claude-identity-verification/" },
      { label: "giffgaff 六个月 inactive 保号规则", href: "/guides/3-usage/" },
      { label: "按旅行、留学与长期收短信需求选卡", href: "/guides/8-uk-sim-choice/" },
      { label: "查看当前 giffgaff 卡片分类", href: "/shop/" },
    ],
    commerceHeading: "确实需要长期控制的英国实体号码？",
    commerceDescription: "可咨询卡片交付、激活、漫游与普通短信；不保证 Claude 接受号码、发送验证码或批准账号，也不要发送密码、证件或验证码。",
    commerceTarget: { label: "微信或 Telegram 咨询实体卡与普通短信", href: "/contact/" },
  }),
  page({
    path: "/guides/claude-account-disabled-appeal/",
    indexPolicy: "index",
    schemaType: "Article",
    updatedAt: ACCOUNT_VERIFICATION_REVIEWED_AT,
    reviewedAt: ACCOUNT_VERIFICATION_REVIEWED_AT,
    intent: "Claude 封号、403 与官方申诉",
    title: "Claude 封号或 403｜判断账号禁用并走官方申诉",
    description:
      "Claude 封号、账号被禁用或出现 403 时，先区分登录错误、个人账号禁用与组织暂停，再保存错误信息并通过官方申诉；新号码不能解封。",
    h1: "Claude 封号 / 账号被禁用 / 403：怎么申诉",
    deck: "403 不自动等于封号；先保存官方错误原文和账号类型，再决定是登录排障、组织管理员处理，还是官方账号申诉。",
    directAnswer:
      "看到 Claude 403、登录失败或无法使用时，不要先认定为封号。先记录错误原文、时间、入口和账号类型，区分普通登录故障、个人账号被禁用、组织工作区被暂停或客户端/API 技术错误；只有 Claude 明确提示账号被禁用或终止时，才进入官方申诉。新买手机号、换 giffgaff 卡、重注册账号或修改地区都不能恢复已被禁用的原账号，也不应被当作绕过平台措施的方法。",
    answerSources: [official.claudeAppeals, official.claudeLogin],
    sections: [
      {
        id: "diagnose",
        title: "先判断 403、登录失败还是明确账号禁用",
        html: `<div class="growth-table-wrap" role="region" tabindex="0" aria-label="Claude 账号状态分流"><table><caption>按你实际看到的状态处理</caption><thead><tr><th>可观察状态</th><th>下一步</th></tr></thead><tbody><tr><th>邮件登录链接、Google 登录或会话失败</th><td>按<a href="${official.claudeLogin.url}" target="_blank" rel="noopener noreferrer">${official.claudeLogin.label}</a>核对原登录方式、邮箱、垃圾邮件或隔离区、浏览器与服务状态（核验 ${ACCOUNT_VERIFICATION_REVIEWED_AT}）。</td></tr><tr><th>手机号发送错误、代码过期或号码已使用</th><td>这是手机号验证故障，转到<a href="/guides/claude-phone-verification/">Claude 手机号验证页</a>，不能使用封号申诉入口。</td></tr><tr><th>身份验证拍摄失败</th><td>转到<a href="/guides/claude-identity-verification/">Claude 身份验证页</a>；身份帮助表单不能替代账号申诉。</td></tr><tr><th>客户端或 API 显示 403，但网页没有禁用通知</th><td>记录请求入口、时间和错误原文，先做产品、API 或组织权限排查，不把状态码单独当作封号证明。</td></tr><tr><th>个人账号明确显示 disabled / terminated</th><td>阅读官方通知与邮件，登录原被限制账号后使用个人账号申诉入口。</td></tr><tr><th>个人账号正常，但组织因 unusual activity 被 hold</th><td>登录 restricted screen，选择受影响组织并点击 <code>Request a review</code>；一般成员或账单权限问题仍应联系组织管理员。</td></tr><tr><th>Usage Policy warning 有异议</th><td>按官方当前说明发送邮件到 <a href="mailto:usersafety@anthropic.com" target="_blank" rel="noopener noreferrer" data-link-role="contact-channel">usersafety@anthropic.com</a>，说明情况和必要账号上下文；该邮箱不能替代个人账号封禁申诉。</td></tr></tbody></table></div><p>组织 <code>Request a review</code> 和 warning 邮箱的分流来自<a href="${official.claudeAppeals.url}" target="_blank" rel="noopener noreferrer">${official.claudeAppeals.label}</a>（核验 ${ACCOUNT_VERIFICATION_REVIEWED_AT}）。</p>`,
      },
      {
        id: "possible-reasons",
        title: "官方列举的是可能原因，不是个案结论",
        html: `<p>Claude 官方申诉说明列举的可能原因包括：重复违反 Usage Policy、从不支持的地区创建账号，以及违反 Terms of Service。身份验证页还单独列出未满 18 岁使用这一可能情况。</p><p>这些只能帮助准备申诉，不能据此判断你的实际原因。平台可能使用未公开的个案证据，本站也没有权限查看。来源：<a href="${official.claudeAppeals.url}" target="_blank" rel="noopener noreferrer">${official.claudeAppeals.label}</a>与<a href="${official.claudeIdentity.url}" target="_blank" rel="noopener noreferrer">${official.claudeIdentity.label}</a>（核验 ${ACCOUNT_VERIFICATION_REVIEWED_AT}）。</p>`,
      },
      {
        id: "prepare-appeal",
        title: "官方申诉前准备什么",
        html: `<ul class="growth-list"><li>账号使用的邮箱和原登录方式，不在公开文章或第三方群聊展示。</li><li>Claude 官方显示的完整错误文字、发生时间、使用入口和账号/组织类型。</li><li>说明你认为判断有误的具体原因，以及你已经采取的纠正措施；只写可验证事实。</li><li>如官方要求关联支持工单或通知编号，只通过官方表单提交。</li></ul><p>个人账号必须先登录被限制的原账号，再进入<a href="${official.claudeRestrictedAppeal.url}" target="_blank" rel="noopener noreferrer">${official.claudeRestrictedAppeal.label}</a>；匿名访问可能被拒绝。申诉入口和其他状态的分流以<a href="${official.claudeAppeals.url}" target="_blank" rel="noopener noreferrer">${official.claudeAppeals.label}</a>为准（核验 ${ACCOUNT_VERIFICATION_REVIEWED_AT}）。本站不知道个案原因，也没有官方申诉成功率或固定处理时间。</p>`,
      },
      {
        id: "identity-branch",
        title: "身份验证失败与验证后禁用不是同一件事",
        html: `<p>证件拍摄失败时，应先回到<a href="/guides/claude-identity-verification/">Claude 身份验证与 KYC 排查</a>；身份流程完成后又明确显示账号禁用时，再走申诉。不能根据时间先后就推断真实封禁原因。</p><p><a href="${official.claudeIdentity.url}" target="_blank" rel="noopener noreferrer">${official.claudeIdentity.label}</a>列出的只是可能导致账号停用的情况和官方衔接，不足以替平台对具体账号下结论（核验 ${ACCOUNT_VERIFICATION_REVIEWED_AT}）。</p>`,
      },
      {
        id: "do-not-bypass",
        title: "不要用换号、买号或改地区绕过",
        html: `<p class="growth-warning">不要发送密码、Cookie、API Key、一次性代码、恢复码、证件、完整付款信息或完整支持邮件给本站；不要购买“解封服务”、批量账号、假身份或临时号码。</p><p>新号码最多只可能在平台允许的手机号验证流程中证明号码控制权，不能恢复既有账号，也不能替代原账号的登录方式、原邮箱、既有可信设备、政策申诉或真实身份。不要使用代理或 VPN 伪装地区、换设备或修改设备指纹、重新注册账号来规避平台限制。此页面不放购卡硬入口，因为换卡不是解封工具。</p>`,
      },
    ],
    sources: [official.claudeAppeals, official.claudeRestrictedAppeal, official.claudeLogin, official.claudeIdentity],
    relatedRoutes: [
      { label: "Claude 身份验证失败与证件要求", href: "/guides/claude-identity-verification/" },
      { label: "Claude 手机号验证和收不到代码", href: "/guides/claude-phone-verification/" },
      { label: "英国号码普通短信与平台 OTP 分层排查", href: "/guides/4-signal/" },
      { label: "giffgaff 账号与恢复信息管理", href: "/guides/3-account/" },
    ],
    commerceWidget: false,
    commerceHeading: "账号禁用只走官方申诉",
    commerceDescription: "本站不销售解封服务，也不收集账号、证件、密码或验证码；新号码不能恢复被禁用的原账号。",
    commerceTarget: { label: "返回 Claude 身份验证与官方分流", href: "/guides/claude-identity-verification/" },
  }),
  page({
    path: "/guides/7-arrival-checklist/",
    indexPolicy: "index",
    schemaType: "Article",
    intent: "giffgaff G0/G2 收卡验收",
    title: "giffgaff 收卡验收清单｜G0/G2 到手检查与售后",
    description:
      "国内收到 giffgaff G0/G2 后，按包装、卡状态、账号控制、余额、网络和普通短信逐项验收；附失败分流、分类页与联系咨询入口。",
    h1: "giffgaff G0/G2 收卡验收清单",
    deck: "先确认卡片和订单交付是否一致，再进入激活、充值或平台验证。",
    directAnswer:
      "收到卡后先核对订单与实际交付是否一致：卡种、数量、卡状态、账号控制方式和余额都要能验证，再分别测试网络与普通短信。任一项不一致就停止后续充值、改资料或绑定平台，保留脱敏证据；订单交付问题走本站售后，账号、号码状态或计费问题转 giffgaff 官方支持。",
    sections: [
      {
        id: "complete",
        title: "怎样才算验收完成",
        html: `<p>验收不是“手机里出现信号”就结束。你需要确认收到的 SKU、数量、卡状态与订单一致，并且自己能够按订单约定管理或使用这张卡。</p><div class="growth-check-grid"><div><strong>订单一致</strong><p>卡种、数量、包装和发货信息对得上。</p></div><div><strong>控制方式明确</strong><p>账号、邮箱和后续恢复责任没有模糊地带。</p></div><div><strong>基础功能有结果</strong><p>网络注册与普通短信分别完成测试或留下失败记录。</p></div></div>`,
      },
      {
        id: "prepare",
        title: "拆封前准备订单与设备",
        html: `<ul class="growth-list"><li>准备订单记录、当前 SKU 和卖家说明的交付状态。</li><li>使用一台无网络锁、已知可正常使用 SIM 的手机。</li><li>准备稳定 Wi-Fi，避免把网络下载问题误判成卡片故障。</li><li>开箱照片只记录必要信息，遮住完整 ICCID、激活码和订单号。</li></ul>`,
      },
      {
        id: "seven-steps",
        title: "七步检查包装、卡、账号、余额、网络与短信",
        html: `<ol class="growth-steps"><li><strong>核对包装：</strong>卡板、SIM、数量和订单 SKU 一致。</li><li><strong>留下脱敏证据：</strong>拍摄外观和异常位置，不公开完整识别码。</li><li><strong>判断卡状态：</strong>G0 重点核对激活码；不要在已有号码账号里误触 SIM swap。参见<a href="${official.activation.url}" target="_blank" rel="noopener noreferrer">${official.activation.label}</a>（核验 ${REVIEWED_AT}）。</li><li><strong>确认交付控制：</strong>G2 是本站库存分类，不是运营商官方产品名；只按本批订单承诺核对。</li><li><strong>核对余额：</strong>只以官方 Dashboard 或 App 显示为依据，余额与 Credit 的含义见<a href="${official.credit.url}" target="_blank" rel="noopener noreferrer">${official.credit.label}</a>（核验 ${REVIEWED_AT}）。</li><li><strong>测试网络：</strong>记录城市、设备、系统、自动或手动选网及结果；排障顺序见<a href="${official.network.url}" target="_blank" rel="noopener noreferrer">${official.network.label}</a>（核验 ${REVIEWED_AT}）。</li><li><strong>测试普通短信：</strong>先确认普通短信，再测试具体平台；普通短信成功不代表 OTP 必达。<a href="${official.smsPolicy.url}" target="_blank" rel="noopener noreferrer">${official.smsPolicy.label}</a>只界定短信服务使用边界，不作第三方平台送达承诺（核验 ${REVIEWED_AT}）。</li></ol>`,
      },
      {
        id: "g0-g2",
        title: "G0 和 G2 分别多检查什么",
        html: `<div class="growth-table-wrap" role="region" tabindex="0" aria-label="G0 与 G2 验收差异"><table><caption>G0 与 G2 到手验收重点</caption><thead><tr><th>类型</th><th>重点</th><th>发现异常</th></tr></thead><tbody><tr><th>G0 新卡</th><td>激活码、未激活状态、后续由谁创建账号</td><td>暂停激活，保存错误和卡板证据</td></tr><tr><th>G2 有余额卡</th><td>本批卡状态、余额范围、买方控制方式</td><td>不要改账号资料或继续消费，先联系订单售后</td></tr></tbody></table></div>`,
      },
      {
        id: "failure",
        title: "发现问题后怎么分流",
        html: `<p>订单内容、数量、卡状态或余额与承诺不一致，走本站订单售后；账号权限、号码状态和运营商计费由 giffgaff 控制，应转官方帮助。不要在多个设备和窗口里连续重复激活。</p><p class="growth-warning">联系支持时只提供订单号后四位、设备和错误摘要。不要发送密码、短信验证码、完整支付资料或完整 ICCID。</p>`,
      },
    ],
    sources: [official.activation, official.credit, official.network, official.smsPolicy, official.lostSim],
    relatedRoutes: [
      { label: "G0 与 G2 怎么选", href: "/answers/" },
      { label: "国内激活教程", href: "/guides/2-activate/" },
      { label: "无信号与短信排查", href: "/guides/4-signal/" },
      { label: "购卡、激活和保号避坑总览", href: "/guides/6-pitfalls/" },
      { label: "查看当前实体卡分类", href: "/shop/" },
    ],
    commerceTarget: { label: "微信或 Telegram 咨询订单与售后", href: "/contact/" },
  }),
  page({
    path: "/guides/8-uk-sim-choice/",
    indexPolicy: "index",
    schemaType: "Article",
    intent: "英国手机卡怎么选",
    title: "英国手机卡怎么选｜留学、旅行、保号与 giffgaff",
    description:
      "按停留时间、英国邮编覆盖、流量、合约、实体卡或 eSIM、漫游和保号需求选择英国手机卡，并判断 giffgaff 与 G0/G2 是否适合。",
    h1: "英国手机卡怎么选：按场景判断 giffgaff 是否适合",
    deck: "不做没有方法的“最佳卡”榜单，先按地点、时长和维护需求排除不合适方案。",
    directAnswer:
      "giffgaff 使用 O2 网络，但邮编覆盖图只是预测，不保证某栋建筑、交通线路或设备一定有信号。需要 eSIM 时还要确认具体机型兼容、设备无锁并可使用最新版 App；切换成功后旧 SIM 会停止工作。它更适合能自行管理账号、付款和保活动作的人；若需要确定的中国信号、平台 OTP 保证或代管账号，就不适合选择。",
    answerSources: [official.terms, official.ofcomCoverage, official.esim],
    sections: [
      {
        id: "six-questions",
        title: "选卡前先回答六个问题",
        html: `<ol class="growth-steps"><li>主要使用地点和英国邮编是什么？</li><li>停留几天、几个月，还是长期生活？</li><li>每月大约需要多少流量、通话和短信？</li><li>是否接受合约、自动续费或信用检查？</li><li>手机是否解锁并原生支持 eSIM？</li><li>回国后是否需要漫游、保号或接收低频短信？</li></ol>`,
      },
      {
        id: "scenarios",
        title: "旅行、留学和跨境保号分别看什么",
        html: `<div class="growth-table-wrap" role="region" tabindex="0" aria-label="英国手机卡场景选择"><table><caption>三类使用场景的优先检查项</caption><thead><tr><th>场景</th><th>优先检查</th><th>常见误区</th></tr></thead><tbody><tr><th>短期旅行</th><td>停留天数、总流量、机场到住宿地覆盖</td><td>只看月费，不看激活和到手时间</td></tr><tr><th>留学生活</th><td>学校与住址覆盖、续费、英国本地通话</td><td>把全国覆盖图当成具体室内保证</td></tr><tr><th>跨境保号</th><td>有效动作、漫游成本、账号恢复</td><td>把收短信当作唯一保活动作</td></tr></tbody></table></div>`,
      },
      {
        id: "fit",
        title: "什么情况适合或不适合 giffgaff",
        html: `<p>giffgaff 使用 O2 网络，但覆盖仍要按具体邮编和设备核对；<a href="${official.terms.url}" target="_blank" rel="noopener noreferrer">${official.terms.label}</a>将覆盖描述为预测而非保证（核验 ${REVIEWED_AT}）。适合希望使用预付费方式、能够自己管理账号和维护动作的人；如果你需要确定性的中国境内信号、特定平台验证码保证或人工代管账号，它并不是合适选择。</p><p><a href="${official.ofcomCoverage.url}" target="_blank" rel="noopener noreferrer">${official.ofcomCoverage.label}</a>用于比较预测，不是室内、地铁或每台设备的服务承诺（核验 ${REVIEWED_AT}）。</p>`,
      },
      {
        id: "sim-or-esim",
        title: "实体 SIM 与 eSIM 怎么选",
        html: `<p>实体卡适合需要可见卡片、设备不支持 eSIM 或希望在多台兼容设备间人工换卡的人。eSIM 需要设备原生支持、无网络锁并能使用最新 giffgaff App；切换后旧 SIM 会停止工作。操作前查看<a href="${official.esim.url}" target="_blank" rel="noopener noreferrer">${official.esim.label}</a>（核验 ${REVIEWED_AT}）。</p>`,
      },
      {
        id: "cost",
        title: "不要只看月费：完整成本清单",
        html: `<ul class="growth-list"><li>卡片、国内或英国寄送与可能的服务费用；官方直寄范围以<a href="${official.simOrder.url}" target="_blank" rel="noopener noreferrer">${official.simOrder.label}</a>为准（核验 ${REVIEWED_AT}）。</li><li>首次 Credit 或套餐、后续续费和支付手续费。</li><li>中国漫游的短信、通话和后台数据成本；个人短信的使用边界见<a href="${official.smsPolicy.url}" target="_blank" rel="noopener noreferrer">${official.smsPolicy.label}</a>（核验 ${REVIEWED_AT}）。</li><li>激活、排障和保号提醒所需时间。</li><li>设备兼容、账号恢复和换卡失败的风险缓冲。</li></ul><p>官方境外寄送国家、套餐和 eSIM 条件可能变化；超过核验周期时只使用下方官方入口，不依赖静态结论。</p>`,
      },
    ],
    sources: [official.ofcomCoverage, official.terms, official.plans, official.simOrder, official.esim, official.roamingChina, official.smsPolicy],
    relatedRoutes: [
      { label: "比较 G0 与 G2", href: "/answers/" },
      { label: "希思罗机场落地后的手机卡使用顺序", href: "/guides/uk-sim-at-heathrow/" },
      { label: "曼彻斯特留学手机卡与宿舍邮编", href: "/guides/manchester-student-sim/" },
      { label: "伦敦留学手机卡与地铁通勤覆盖", href: "/guides/london-student-sim/" },
      { label: "eSIM 换新手机前检查设备与短信 MFA", href: "/more/esim-new-phone/" },
      { label: "购买与发货流程", href: "/guides/1-order/" },
      { label: "确定适合后查看购买、激活和保号避坑", href: "/guides/6-pitfalls/" },
    ],
    commerceTarget: { label: "微信或 Telegram 咨询选卡", href: "/contact/" },
  }),
  page({
    path: "/guides/uk-sim-at-heathrow/",
    indexPolicy: "index",
    schemaType: "Article",
    updatedAt: LOCAL_SEARCH_REVIEWED_AT,
    reviewedAt: LOCAL_SEARCH_REVIEWED_AT,
    intent: "希思罗机场落地后英国手机卡与 giffgaff 使用",
    title: "希思罗机场手机卡｜落地后 giffgaff 激活与上网",
    description:
      "到希思罗机场后按已有实体卡、eSIM 或现场购卡三种情况处理；先用机场 Wi-Fi，依次检查激活、网络注册、移动数据、APN 和住宿地邮编覆盖。",
    h1: "希思罗机场落地后，giffgaff 手机卡怎么用",
    deck: "机场只是第一个测试点；真正决定是否适合的是住宿、学校或工作地点和日常路线。",
    location: { name: "Heathrow Airport", addressCountry: "GB" },
    directAnswer:
      "到希思罗后先保留机场 Wi-Fi，不要一开机就反复激活。已经提前激活 giffgaff 的人，依次检查线路启用、网络注册、普通网页和移动数据；有信号但不能上网时再检查数据线路与 APN。还没有卡的人可以比较机场现场 PAYG SIM、提前准备的实体 SIM 和兼容 eSIM，但希思罗提供 SIM 服务不等于现场一定有 giffgaff 库存。机场测试成功也不能代表酒店、宿舍、地铁或后续城市一定可用，仍要按目的地邮编核对并实测。",
    answerSources: [official.heathrowSim, official.network, official.ofcomCoverage],
    sections: [
      {
        id: "choose-branch",
        title: "先按三种到达状态选择路径",
        html: `<div class="growth-table-wrap" role="region" tabindex="0" aria-label="希思罗落地手机卡路径"><table><caption>落地后不要把三种情况混在一起</caption><thead><tr><th>到达状态</th><th>第一步</th><th>主要风险</th></tr></thead><tbody><tr><th>已有且已激活的 giffgaff</th><td>开启线路，等待网络注册后测试网页</td><td>误把机场拥堵或设置问题当成卡失效</td></tr><tr><th>已有但尚未激活</th><td>连接稳定 Wi-Fi，确认激活码和付款条件后再操作</td><td>在弱网下重复提交或用错账号</td></tr><tr><th>没有英国卡</th><td>比较现场 PAYG SIM、提前准备实体卡和兼容 eSIM</td><td>默认机场一定有某个品牌或套餐</td></tr></tbody></table></div><p><a href="${official.heathrowSim.url}" target="_blank" rel="noopener noreferrer">${official.heathrowSim.label}</a>说明机场提供英国 SIM 相关服务，但页面不构成 giffgaff 库存或价格承诺（核验 ${LOCAL_SEARCH_REVIEWED_AT}）。</p>`,
      },
      {
        id: "arrival-sequence",
        title: "落地后的六步联网顺序",
        html: `<ol class="growth-steps"><li>先连接机场 Wi-Fi，保存住宿地址、联系人和离线路线。</li><li>确认手机无网络锁、giffgaff 线路已启用，并关闭不需要的数据线路。</li><li>开关一次飞行模式或重启，让设备重新注册网络；不要连续反复激活。</li><li>先打开普通网页测试移动数据，再测试基础通话或普通短信；平台 OTP 不作为基础联网验收。</li><li>有信号但数据失败时，检查默认数据线路、移动数据开关和<a href="/guides/apn-settings/">giffgaff APN 设置</a>。</li><li>记录时间、航站楼、设备和错误文字；仍失败时按<a href="${official.network.url}" target="_blank" rel="noopener noreferrer">${official.network.label}</a>分层排查（核验 ${LOCAL_SEARCH_REVIEWED_AT}）。</li></ol>`,
      },
      {
        id: "postcode-check",
        title: "机场有信号，不代表住宿地和路线都有信号",
        html: `<p>出发前和落地后至少核对三个地点：希思罗到达点、第一晚住宿、接下来主要学校或工作地点。长期使用再加入日常通勤节点，不要用“伦敦有覆盖”替代具体邮编。</p><p><a href="${official.ofcomCoverage.url}" target="_blank" rel="noopener noreferrer">${official.ofcomCoverage.label}</a>可按邮编比较 O2 等网络的室内外覆盖和当地表现；结果仍是预测，建筑材料、拥堵、天气和设备都会造成差异（核验 ${LOCAL_SEARCH_REVIEWED_AT}）。</p>`,
      },
      {
        id: "sim-or-esim",
        title: "实体 SIM、eSIM 和机场现场购卡怎么选",
        html: `<ul class="growth-list"><li><strong>提前准备实体 SIM：</strong>适合设备不支持 eSIM，或希望在出发前把卡、激活条件和到手时间核对清楚的人。</li><li><strong>giffgaff eSIM：</strong>先确认设备原生兼容、无网络锁并能使用当前 App；已有实体卡转 eSIM 后旧卡会停止工作，见<a href="${official.esim.url}" target="_blank" rel="noopener noreferrer">${official.esim.label}</a>（核验 ${LOCAL_SEARCH_REVIEWED_AT}）。</li><li><strong>机场现场购卡：</strong>适合没有提前准备且愿意按现场实际品牌、库存和价格重新选择的人；不要把机场官方服务页理解成 giffgaff 现货保证。</li></ul>`,
      },
      {
        id: "stop-and-escalate",
        title: "什么时候停止尝试并改用备用方案",
        html: `<p class="growth-warning">如果激活状态、付款结果、账号归属或 SIM 状态不明确，停止重复提交。先继续使用机场 Wi-Fi、离线地图和住宿方联系方式，再保存脱敏错误文字。</p><p>订单交付问题联系本站；账号、号码、网络状态和运营商计费问题使用 giffgaff 官方帮助。不要通过聊天发送密码、验证码、完整 ICCID、eSIM 二维码或支付资料。</p>`,
      },
    ],
    sources: [official.heathrowSim, official.activation, official.network, official.apn, official.ofcomCoverage, official.esim, official.simOrder],
    relatedRoutes: [
      { label: "英国手机卡按场景怎么选", href: "/guides/8-uk-sim-choice/" },
      { label: "G0/G2 到手后的完整验收", href: "/guides/7-arrival-checklist/" },
      { label: "有信号但不能上网：检查 APN", href: "/guides/apn-settings/" },
      { label: "激活失败分层排查", href: "/guides/2-activate/" },
      { label: "伦敦留学手机卡与通勤覆盖", href: "/guides/london-student-sim/" },
    ],
    commerceHeading: "确认到英日期、卡片状态和落地备用方案",
    commerceDescription: "咨询前准备到达日期、手机型号、是否已有卡以及第一晚住宿区域；不要发送激活码、密码或验证码。",
    commerceTarget: { label: "微信或 Telegram 咨询落地方案", href: "/contact/" },
  }),
  page({
    path: "/guides/manchester-student-sim/",
    indexPolicy: "index",
    schemaType: "Article",
    updatedAt: LOCAL_SEARCH_REVIEWED_AT,
    reviewedAt: LOCAL_SEARCH_REVIEWED_AT,
    intent: "曼彻斯特留学英国手机卡与 giffgaff 选择",
    title: "曼彻斯特留学手机卡怎么选｜宿舍邮编与 giffgaff",
    description:
      "曼彻斯特留学生按宿舍、校区和通勤路线邮编比较英国手机卡；区分 PAYG 与合约、实体 SIM 与 eSIM，并判断 giffgaff 是否适合。",
    h1: "曼彻斯特留学手机卡：按宿舍邮编和通勤选",
    deck: "“曼城有信号”不是可执行答案；把宿舍、校区、通勤节点和回国后的号码需求分开判断。",
    location: { name: "Manchester", addressCountry: "GB" },
    directAnswer:
      "曼彻斯特留学选手机卡时，不要只查一个市中心地点。先取得宿舍和实际校区邮编，再加入每周高频通勤节点，分别比较 O2 等网络的室内外预测；到校后用同一台手机实测。短期交换或不想承担长期合同的人可以优先比较 PAYG，长期学习再结合数据量、付款条件和回国后是否保号判断。giffgaff 使用 O2 网络，是否适合取决于这些具体地点、设备和自主管理能力，而不是“曼城”这个城市名。",
    answerSources: [official.manchesterStudentCommunications, official.ofcomCoverage, official.terms],
    sections: [
      {
        id: "four-locations",
        title: "先建立曼彻斯特四地点清单",
        html: `<ol class="growth-steps"><li><strong>住宿：</strong>使用合同或学校住宿页面上的准确邮编，不用“Manchester”代替。</li><li><strong>校区：</strong>核对自己实际就读校区；如果是曼彻斯特大学主地址，可从学校当前页面看到 Oxford Road, M13 9PL，但不同教学楼和宿舍仍需分别检查。</li><li><strong>通勤：</strong>加入每天换乘、等车或步行时间最长的节点；室外预测不能替代车内、站内和建筑物内实测。</li><li><strong>常用生活地点：</strong>工作、图书馆、超市或每周高频活动区域至少选一个。</li></ol><p>这些地点用于选择和到校验收，不要公开个人完整住址或订单资料。</p>`,
      },
      {
        id: "coverage-method",
        title: "用邮编比较 O2，而不是搜索“曼城信号最好”",
        html: `<p>giffgaff 使用 O2 网络，但城市级结论会掩盖宿舍墙体、楼层、局部拥堵和设备差异。把四个地点逐一输入<a href="${official.ofcomCoverage.url}" target="_blank" rel="noopener noreferrer">${official.ofcomCoverage.label}</a>，记录室内、室外和当地性能提示，再与其他网络比较（核验 ${LOCAL_SEARCH_REVIEWED_AT}）。</p><div class="growth-table-wrap" role="region" tabindex="0" aria-label="曼彻斯特手机卡覆盖记录"><table><caption>每个地点都单独记录</caption><thead><tr><th>地点</th><th>出发前记录</th><th>到校后复核</th></tr></thead><tbody><tr><th>宿舍</th><td>邮编、室内/室外预测</td><td>房间、公共区域和楼外</td></tr><tr><th>校区</th><td>教学楼或校区邮编</td><td>常用教室和图书馆</td></tr><tr><th>通勤节点</th><td>路线与换乘点</td><td>高峰和非高峰各一次</td></tr></tbody></table></div>`,
      },
      {
        id: "payg-or-contract",
        title: "PAYG 还是合约：先按停留时间与付款条件排除",
        html: `<p><a href="${official.manchesterStudentCommunications.url}" target="_blank" rel="noopener noreferrer">${official.manchesterStudentCommunications.label}</a>把英国移动服务区分为 PAYG 与合约，并提醒国际通信成本需要单独注意（核验 ${LOCAL_SEARCH_REVIEWED_AT}）。短期交换、刚到英国或尚未确定用量时，PAYG 更方便先控制支出和实测；考虑合约时，再核对期限、付款方式、信用条件和提前结束成本。</p><p>不要只比较月费。把卡片/寄送、首次充值、套餐、国际通话、漫游和维护号码的时间成本放在同一张清单里。</p>`,
      },
      {
        id: "giffgaff-fit",
        title: "什么情况下 giffgaff 更匹配曼城留学",
        html: `<ul class="growth-list"><li>宿舍、校区和高频路线的 O2 预测没有明显短板，并接受到校后再实测。</li><li>手机无网络锁；需要 eSIM 时，设备和当前 App 条件已核对。</li><li>愿意自行管理账号、付款、续费、换卡和回国后的保活动作。</li><li>不把第三方平台 OTP、宿舍室内信号或整个城市覆盖当成保证。</li></ul><p><a href="${official.terms.url}" target="_blank" rel="noopener noreferrer">${official.terms.label}</a>把覆盖信息视为预测，并说明墙体、技术问题和拥堵等因素会影响服务（核验 ${LOCAL_SEARCH_REVIEWED_AT}）。</p>`,
      },
      {
        id: "first-week",
        title: "到校第一周完成三次实测再决定长期方案",
        html: `<ol class="growth-steps"><li>入住当天分别测试房间、楼道和楼外。</li><li>第一次上课日在校区和通勤节点测试网页、基础通话与普通短信。</li><li>高峰时段再复测一次；如只有移动数据失败，检查<a href="/guides/apn-settings/">giffgaff APN</a>，不要直接把卡判定失效。</li><li>记录结果后再决定是否续费、换网或保留为备用号码。</li></ol>`,
      },
    ],
    sources: [official.manchesterStudentCommunications, official.ofcomCoverage, official.terms, official.network, official.plans, official.esim],
    relatedRoutes: [
      { label: "英国手机卡全国选择框架", href: "/guides/8-uk-sim-choice/" },
      { label: "伦敦留学手机卡与地铁通勤覆盖", href: "/guides/london-student-sim/" },
      { label: "到手后检查卡片、网络和普通短信", href: "/guides/7-arrival-checklist/" },
      { label: "giffgaff APN 与移动数据排查", href: "/guides/apn-settings/" },
      { label: "离英后生成保号提醒", href: "/tools/keep-number-reminder/" },
    ],
    commerceHeading: "按宿舍、校区和停留时间核对 G0/G2",
    commerceDescription: "咨询时只需提供到英日期、学校/区域、手机型号和是否需要长期保号；不要发送完整住址、证件或账号资料。",
    commerceTarget: { label: "微信或 Telegram 咨询曼城选卡", href: "/contact/" },
  }),
  page({
    path: "/guides/london-student-sim/",
    indexPolicy: "index",
    schemaType: "Article",
    updatedAt: LOCAL_SEARCH_REVIEWED_AT,
    reviewedAt: LOCAL_SEARCH_REVIEWED_AT,
    intent: "伦敦留学英国手机卡与 giffgaff 选择",
    title: "伦敦留学手机卡怎么选｜邮编、地铁与 giffgaff",
    description:
      "伦敦留学生按住宿、校区、机场与地铁通勤路线选择英国手机卡；核对邮编覆盖、地下移动网络、实体 SIM/eSIM 和 giffgaff 适配条件。",
    h1: "伦敦留学手机卡：住宿邮编与地铁路线一起查",
    deck: "伦敦不是一个统一信号点；机场、宿舍、校区、地面路线和地下通勤要分别判断。",
    location: { name: "London", addressCountry: "GB" },
    directAnswer:
      "伦敦留学选手机卡时，至少分别检查住宿邮编、实际校区和日常通勤路线；从希思罗或其他机场落地时的信号不能代表长期使用。giffgaff 使用 O2 网络，可先用 Ofcom 按邮编比较，再到房间、教学楼和高峰通勤时实测。伦敦地铁的 4G/5G 正在分区段铺设，TfL 当前页面列出的线路和区段会变化，因此不能把“伦敦地铁有信号”写成全网连续覆盖保证。",
    answerSources: [official.ofcomCoverage, official.tflMobileCoverage, official.terms],
    sections: [
      {
        id: "location-sheet",
        title: "伦敦选卡先填五个地点，不先看运营商榜单",
        html: `<ol class="growth-steps"><li>抵达机场或车站，只作为落地测试点。</li><li>住宿准确邮编，是室内使用的首要输入。</li><li>实际校区和最常用教学楼，不用学校名称代替地点。</li><li>每天通勤的线路、换乘站和地下区段。</li><li>工作、图书馆或每周高频生活地点。</li></ol><p>每个地点分别标记“必须稳定”“有 Wi-Fi 可备用”或“偶尔使用”，再决定哪个网络的局部短板能够接受。</p>`,
      },
      {
        id: "postcode-first",
        title: "住宿与校区先按邮编比较 O2",
        html: `<p>把住宿、校区和地面高频地点逐一输入<a href="${official.ofcomCoverage.url}" target="_blank" rel="noopener noreferrer">${official.ofcomCoverage.label}</a>。该工具区分室内外预测和当地性能，并明确提示建筑、拥堵、天气及设备会影响实际结果（核验 ${LOCAL_SEARCH_REVIEWED_AT}）。</p><p>giffgaff 使用 O2，但“O2 在伦敦覆盖”不能替代某栋宿舍、地下层教室或具体手机的判断。抵达后要在同一台设备上复核。</p>`,
      },
      {
        id: "tube-check",
        title: "地铁通勤必须单独查当前覆盖区段",
        html: `<p><a href="${official.tflMobileCoverage.url}" target="_blank" rel="noopener noreferrer">${official.tflMobileCoverage.label}</a>显示，4G/5G 正在伦敦地下交通网络逐步铺设，当前只有页面列出的线路和区段可用；尚未覆盖的场景可使用车站 Wi-Fi，但隧道连续性仍取决于具体区段（核验 ${LOCAL_SEARCH_REVIEWED_AT}）。</p><ul class="growth-list"><li>先写下每天实际乘坐的线路、起点、换乘和终点。</li><li>打开 TfL 当前页面核对覆盖区段，不使用过期截图。</li><li>把“站内可连 Wi-Fi”“站台有移动网络”和“隧道连续覆盖”分开记录。</li><li>重要导航、住宿地址和紧急联系人提前离线保存。</li></ul>`,
      },
      {
        id: "arrival-versus-daily",
        title: "机场落地可用，不等于伦敦日常使用合格",
        html: `<div class="growth-table-wrap" role="region" tabindex="0" aria-label="伦敦手机卡落地与长期使用差异"><table><caption>两个验收阶段分别判断</caption><thead><tr><th>阶段</th><th>验收目标</th><th>不要外推</th></tr></thead><tbody><tr><th>机场落地</th><td>能注册网络、打开网页、找到住宿路线</td><td>不能证明宿舍和校区室内表现</td></tr><tr><th>第一周日常</th><td>房间、教学楼、高峰通勤和普通短信</td><td>不能由一次成功保证长期或平台 OTP</td></tr></tbody></table></div><p>如果从希思罗入境，可先看<a href="/guides/uk-sim-at-heathrow/">希思罗机场落地后的联网顺序</a>。</p>`,
      },
      {
        id: "sim-esim-fit",
        title: "实体 SIM、eSIM 与 giffgaff 适配检查",
        html: `<ul class="growth-list"><li>实体 SIM 适合设备不支持 eSIM、希望提前验收卡片或需要人工换机的人。</li><li>eSIM 需要设备原生兼容、无网络锁并满足当前 App 条件；转换后旧实体 SIM 会停止工作，见<a href="${official.esim.url}" target="_blank" rel="noopener noreferrer">${official.esim.label}</a>（核验 ${LOCAL_SEARCH_REVIEWED_AT}）。</li><li>giffgaff 更适合愿意自行管理账号、套餐、换卡和离英后保号的人。</li><li>如果住宿或高频路线的 O2 预测明显弱，或要求地下全程连续连接，就应继续比较其他网络，不因品牌偏好勉强选择。</li></ul>`,
      },
    ],
    sources: [official.ofcomCoverage, official.tflMobileCoverage, official.terms, official.network, official.esim, official.heathrowSim],
    relatedRoutes: [
      { label: "希思罗机场落地后的联网顺序", href: "/guides/uk-sim-at-heathrow/" },
      { label: "英国手机卡全国选择框架", href: "/guides/8-uk-sim-choice/" },
      { label: "曼彻斯特留学手机卡与宿舍邮编", href: "/guides/manchester-student-sim/" },
      { label: "有信号但数据失败：检查 APN", href: "/guides/apn-settings/" },
      { label: "离英后生成保号提醒", href: "/tools/keep-number-reminder/" },
    ],
    commerceHeading: "按住宿、校区和地铁路线核对选卡条件",
    commerceDescription: "咨询时可提供到英日期、学校/区域、主要线路、手机型号和是否长期保号；不要发送完整住址或账号凭证。",
    commerceTarget: { label: "微信或 Telegram 咨询伦敦选卡", href: "/contact/" },
  }),
  page({
    path: "/guides/9-number-balance-data-check/",
    indexPolicy: "index",
    schemaType: "Article",
    updatedAt: SEARCH_CONTENT_REVIEWED_AT,
    reviewedAt: SEARCH_CONTENT_REVIEWED_AT,
    intent: "giffgaff 手机号、Credit、套餐和使用记录查询",
    title: "giffgaff 怎么查手机号、余额和流量｜Credit 与使用记录",
    description:
      "查询 giffgaff 手机号、Credit、套餐、流量与使用记录时，分别使用官方 Dashboard、App 或短信入口；查不到时按激活、账号和网络状态分层排查。",
    h1: "giffgaff 怎么查手机号、余额、套餐和流量",
    deck: "先分清号码、Credit、当前 plan 与 Usage statement；它们对应不同的官方入口，不能互相替代。",
    directAnswer:
      "查询 giffgaff 手机号可登录官方 Dashboard、查看 App 首页，或在能正常发短信时向 43430 发送 Number。查询 Credit 与当前 plan，优先看 Dashboard 或 App，也可向 85075 发送 INFO；已产生的通话、短信和数据使用记录则看 App 中的 Usage statement。若无法登录、无信号或短信没有回复，先排查激活、账号和网络状态，不要把一次查询失败直接当成号码或余额不存在。",
    answerSources: [official.activation, official.credit, official.usageStatement],
    sections: [
      {
        id: "before-checking",
        title: "先分清：未激活、已激活但无信号，还是只是找不到信息",
        html: `<div class="growth-table-wrap" role="region" tabindex="0" aria-label="giffgaff 查询前的状态分流"><table><caption>先按可观察状态分流</caption><thead><tr><th>你现在看到的情况</th><th>先做什么</th><th>不要据此推断什么</th></tr></thead><tbody><tr><th>新卡还没有号码或不能正常使用</th><td>先完成官方激活流程；激活最长可能需要 24 小时。</td><td>不要把卡板上的识别码当作已可用手机号。</td></tr><tr><th>可登录账号，但不确定手机号</th><td>查看 Dashboard、App 首页，或按官方方式发送 Number 到 43430。</td><td>不要公开完整手机号、SIM 序列号或验证码。</td></tr><tr><th>想看余额、套餐或使用情况</th><td>先区分 Credit、当前 plan 和流量使用；优先 Dashboard 或 App。</td><td>不要把 Credit 余额当成所有套餐或流量都仍可用的证明。</td></tr><tr><th>查不到或短信无回复</th><td>保留时间、网络和错误信息，转入网络/短信排查。</td><td>不要连续大量发送查询短信或重复提交激活。</td></tr></tbody></table></div>`,
      },
      {
        id: "find-number",
        title: "查 giffgaff 手机号：三个官方入口",
        html: `<ol class="growth-steps"><li><strong>Dashboard：</strong>登录 giffgaff 官方 Dashboard 后查看号码。</li><li><strong>App 首页：</strong>打开 giffgaff App 的首页查看号码；App 可用不代表短信或网络一定正常。</li><li><strong>短信查询：</strong>向 <code>43430</code> 发送 <code>Number</code>。这需要卡已经能正常发送短信；无法收到或发送短信时，不要把没有回复直接当成号码不存在。</li></ol><p>以上三个入口由<a href="${official.activation.url}" target="_blank" rel="noopener noreferrer">${official.activation.label}</a>列明（核验 ${SEARCH_CONTENT_REVIEWED_AT}）。若卡还在激活阶段，官方说明可能需要最多 24 小时；先按激活状态处理。</p>`,
      },
      {
        id: "check-credit-and-plan",
        title: "查 Credit、套餐和流量：先看 Dashboard 或 App",
        html: `<p><strong>Credit</strong> 是账户中用于套餐以外服务或套餐到期后服务的金额，不等同于“所有流量”。官方说明可以在 Dashboard 或 App 查看 Credit 与套餐信息；也可向 <code>85075</code> 发送 <code>INFO</code> 获得 Credit 和套餐信息的短信回复。见<a href="${official.credit.url}" target="_blank" rel="noopener noreferrer">${official.credit.label}</a>（核验 ${SEARCH_CONTENT_REVIEWED_AT}）。</p><p>若要看已产生的通话、短信或数据使用记录，查看官方的 Usage statement；官方说明该记录可以在 giffgaff App 中查看。见<a href="${official.usageStatement.url}" target="_blank" rel="noopener noreferrer">${official.usageStatement.label}</a>（核验 ${SEARCH_CONTENT_REVIEWED_AT}）。</p><ul class="growth-list"><li>先记录你看到的是 Credit、当前 plan，还是使用量，避免把页面字段混在一起。</li><li>如果在境外，优先用 Wi-Fi 登录 Dashboard 或 App，避免为了一次查询产生额外移动数据费用。</li><li>页面显示的当前信息只说明当时的账户展示；实际扣费、套餐条件与漫游以操作当日官方页面和账单为准。</li></ul>`,
      },
      {
        id: "when-it-does-not-work",
        title: "查询无结果时，按层排查而不是反复重试",
        html: `<p>如果 Dashboard/App 无法登录，先核对账号与恢复方式；如果可登录但手机无信号、任何短信无法收发或查询短信无回复，记录设备、所在国家/地区、网络名称和时间后，按<a href="${official.network.url}" target="_blank" rel="noopener noreferrer">${official.network.label}</a>逐层排查（核验 ${SEARCH_CONTENT_REVIEWED_AT}）。普通短信正常而某个平台 OTP 不到，则属于另一条问题线，不能用余额或号码页面替代诊断。</p><p class="growth-warning">联系支持时不要发送密码、短信验证码、完整 SIM 序列号、完整 ICCID 或支付资料。只提供必要的错误摘要、设备和时间线。</p>`,
      },
    ],
    sources: [official.activation, official.credit, official.usageStatement, official.network],
    relatedRoutes: [
      { label: "激活失败或新卡状态不明确时怎么处理", href: "/guides/2-activate/" },
      { label: "无信号、短信或验证码异常的分层排查", href: "/guides/4-signal/" },
      { label: "保号与有效动作规则", href: "/guides/3-usage/" },
      { label: "用本地工具生成第 5 个月保号提醒", href: "/tools/keep-number-reminder/" },
      { label: "购买前查看完整避坑清单", href: "/guides/6-pitfalls/" },
    ],
    commerceTarget: { label: "微信或 Telegram 咨询订单问题", href: "/contact/" },
  }),
  page({
    path: "/guides/apn-settings/",
    indexPolicy: "index",
    schemaType: "Article",
    updatedAt: SEARCH_CONTENT_REVIEWED_AT,
    reviewedAt: SEARCH_CONTENT_REVIEWED_AT,
    intent: "giffgaff APN 与移动数据故障排查",
    title: "giffgaff APN 设置｜有信号但移动数据不能用怎么办",
    description:
      "giffgaff 有信号、通话短信正常但移动数据或热点不能用时，按官方 APN 参数检查 iPhone 和 Android 设置，并区分余额、漫游与网络故障。",
    h1: "giffgaff APN 设置：有信号但移动数据不能用怎么办",
    deck: "APN 只负责设备如何接入移动数据；无信号、账号停用、余额不足或漫游未开启时，改 APN 不能解决根因。",
    directAnswer:
      "如果 giffgaff 已有信号且通话、短信正常，但移动数据不能用，可以核对官方 Internet APN：APN 为 giffgaff.com，用户名 gg，密码 p，MCC 234，MNC 10，认证类型 PAP，APN protocol 为 IPv4v6，APN roaming protocol 为 IPv4，Proxy 留空。保存后重启数据连接；如果仍失败，再检查 Credit/plan、移动数据与数据漫游、可用网络和账号状态。",
    answerSources: [official.apn, official.network],
    sections: [
      {
        id: "when-apn-applies",
        title: "先判断是不是 APN 问题",
        html: `<p>APN 更适合处理“手机已经注册到网络，通话或短信可用，但移动数据打不开”的情况。若状态栏完全没有运营商、账号中的号码消失、SIM/eSIM 线路未启用，或所有通话短信数据都失败，应先回到网络、账号和 SIM 层排查，不要连续新建多个 APN。</p><div class="growth-table-wrap" role="region" tabindex="0" aria-label="APN 问题分流"><table><caption>症状与优先排查层级</caption><thead><tr><th>症状</th><th>先查什么</th><th>APN 是否优先</th></tr></thead><tbody><tr><th>有信号、短信正常、数据失败</th><td>移动数据开关、Credit/plan、APN</td><td>是</td></tr><tr><th>境外有信号、数据失败</th><td>数据漫游、余额/适用产品、APN、可用网络</td><td>可检查，但不是唯一原因</td></tr><tr><th>无信号且所有服务失败</th><td>账号、SIM/eSIM、设备锁、选网与当地网络</td><td>否</td></tr><tr><th>只有热点失败</th><td>先确认手机本机数据可用，再查热点与系统限制</td><td>第二步</td></tr></tbody></table></div>`,
      },
      {
        id: "official-values",
        title: "官方 Internet APN 参数",
        html: `<p>giffgaff 官方 Internet APN 页面在 ${SEARCH_CONTENT_REVIEWED_AT} 核验时列出以下参数。界面名称会因系统、地区和制造商而变化，实际填写前请重新打开<a href="${official.apn.url}" target="_blank" rel="noopener noreferrer">${official.apn.label}</a>核对。</p><div class="growth-table-wrap" role="region" tabindex="0" aria-label="giffgaff 官方 Internet APN 参数"><table><caption>Internet APN 参数（核验 ${SEARCH_CONTENT_REVIEWED_AT}）</caption><thead><tr><th>字段</th><th>值</th></tr></thead><tbody><tr><th>APN</th><td><code>giffgaff.com</code></td></tr><tr><th>Username</th><td><code>gg</code></td></tr><tr><th>Password</th><td><code>p</code></td></tr><tr><th>Proxy</th><td>留空</td></tr><tr><th>MCC / MNC</th><td><code>234</code> / <code>10</code></td></tr><tr><th>Authentication type</th><td><code>PAP</code></td></tr><tr><th>APN protocol</th><td><code>IPv4v6</code></td></tr><tr><th>APN roaming protocol</th><td><code>IPv4</code></td></tr></tbody></table></div><p class="growth-warning">不要从论坛旧帖复制额外代理、端口或 MMS 参数到 Internet APN；MMS 是另一组用途不同的设置。</p>`,
      },
      {
        id: "iphone-android",
        title: "iPhone 和 Android 在哪里检查",
        html: `<p>官方当前说明，Apple 设备通常从“设置 → 蜂窝网络/移动服务 → 蜂窝数据网络”进入；Android 通常在“移动网络/网络 → 移动网络 → 接入点名称（APN）”中检查。不同系统版本的翻译和菜单层级可能不同。</p><ol class="growth-steps"><li>先截取现有设置的脱敏画面，避免改错后无法回退。</li><li>只保留一组用于 Internet 的正确 APN；不要同时启用多组来源不明的重复配置。</li><li>Android 新建或修改后要在菜单中点击保存，并选中该 APN。</li><li>关闭再开启移动数据，必要时重启手机；不要在同一分钟内反复重置所有网络设置。</li><li>确认本机移动数据恢复后，再单独测试热点。热点是否可用还会受设备系统与连接端设置影响。</li></ol>`,
      },
      {
        id: "still-not-working",
        title: "参数正确仍不能上网：按这四层继续排查",
        html: `<ol class="growth-steps"><li><strong>账户层：</strong>登录 Dashboard 或 App，确认号码、Credit/plan 和服务状态；APN 不会补足余额或恢复停用号码。</li><li><strong>设备层：</strong>确认移动数据线路选择正确、飞行模式关闭、设备无网络锁，双卡手机没有把数据分配给另一张卡。</li><li><strong>漫游层：</strong>境外使用时确认数据漫游与当前产品适用范围。中国使用前可先查看<a href="/tools/china-roaming-cost/">中国漫游费用试算</a>，避免后台流量意外扣费。</li><li><strong>网络层：</strong>记录时间、地点、设备、系统、信号和错误，按<a href="${official.network.url}" target="_blank" rel="noopener noreferrer">${official.network.label}</a>及<a href="${official.roamingTroubleshooting.url}" target="_blank" rel="noopener noreferrer">${official.roamingTroubleshooting.label}</a>继续排查（核验 ${SEARCH_CONTENT_REVIEWED_AT}）。</li></ol><p>如果通话短信和数据全部失败，请转到无信号排查；如果普通数据正常、只有某个 App 或网站失败，则还要检查该服务自身、DNS、权限或平台限制。</p>`,
      },
    ],
    sources: [official.apn, official.network, official.roamingTroubleshooting],
    relatedRoutes: [
      { label: "无信号、短信与验证码分层排查", href: "/guides/4-signal/" },
      { label: "旅行数据与漫游设置", href: "/guides/5-travel-data/" },
      { label: "试算中国 PAYG 漫游费用", href: "/tools/china-roaming-cost/" },
      { label: "在 App 检查账户和套餐", href: "/guides/3-app/" },
      { label: "购买、激活和使用避坑总览", href: "/guides/6-pitfalls/" },
    ],
    commerceTarget: { label: "微信或 Telegram 咨询订单问题", href: "/contact/" },
  }),
  page({
    path: "/more/esim-new-phone/",
    indexPolicy: "index",
    schemaType: "Article",
    updatedAt: SEARCH_CONTENT_REVIEWED_AT,
    reviewedAt: SEARCH_CONTENT_REVIEWED_AT,
    intent: "giffgaff eSIM 换手机迁移",
    title: "giffgaff eSIM 换手机怎么迁移｜新旧手机与 MFA 检查",
    description:
      "已有 giffgaff eSIM 换新手机时，先确认新机兼容、账号可登录和短信 MFA，再按官方 App 的 Replace my SIM 流程切换。",
    h1: "giffgaff eSIM 换手机：先保住 MFA，再开始迁移",
    deck: "这页只处理已经在用 eSIM 后更换设备；第一次把实体 SIM 转成 eSIM，请回到 eSIM 转换总指南。",
    directAnswer:
      "giffgaff 官方当前说明：新手机必须兼容 eSIM；可在设置中检查，或拨 *#06# 查看是否出现 EID。随后在新手机下载并登录 giffgaff App，进入 Account → SIM → Replace my SIM → Switch to new eSIM，按屏幕步骤完成。切换需要短信 MFA；旧手机、旧 eSIM 和账号恢复方式在成功前不要提前删除或清空。",
    answerSources: [official.esimNewPhone, official.esim],
    sections: [
      {
        id: "before-moving",
        title: "开始前的五项 Go / No-Go 检查",
        html: `<ol class="growth-steps"><li><strong>具体新机兼容：</strong>不要只看系列名；核对型号、地区版本与系统是否原生支持 eSIM。官方提示可查看设置或拨 <code>*#06#</code>，出现 EID 才是一个可用信号。</li><li><strong>设备无锁：</strong>确认新机没有运营商网络锁，并能正常安装最新版 giffgaff App。</li><li><strong>账号可恢复：</strong>先在新机登录正确的 giffgaff 账号，确认邮箱、密码和必要验证可用。</li><li><strong>短信 MFA 可接收：</strong>官方当前说明换机需要短信安全码；若旧线路已经收不到短信，不要贸然开始。</li><li><strong>保留回退条件：</strong>新 eSIM 正常注册、账号和基础服务确认前，不抹掉旧手机，不删除旧 eSIM，也不转发任何激活凭证。</li></ol>`,
      },
      {
        id: "official-flow",
        title: "官方 App 的换机路径",
        html: `<p>根据<a href="${official.esimNewPhone.url}" target="_blank" rel="noopener noreferrer">${official.esimNewPhone.label}</a>（核验 ${SEARCH_CONTENT_REVIEWED_AT}），在新手机上下载并登录 giffgaff App，进入 <strong>Account → SIM → Replace my SIM → Switch to new eSIM</strong>，再按屏幕提示完成。</p><p>按钮名称属于当前界面，不应当作永久不变的路径。如果 App 未显示 eSIM 选项，先停下来核对设备兼容、App 版本和账号状态；不要安装改版 App，也不要尝试从旧设备提取或上传 eSIM 激活信息。</p>`,
      },
      {
        id: "mfa-failure",
        title: "收不到 MFA 时不要连续重试",
        html: `<p>官方页面明确提示，完成 eSIM swap 需要短信发送的 MFA 安全码。如果短信无法接收，页面还提到可以评估先换到实体 SIM。这里的重点不是绕过安全检查，而是保留一个能够恢复号码和账号的官方路径。</p><ul class="growth-list"><li>先确认旧线路仍启用、有信号且能收到普通短信。</li><li>不要在多个设备、多个账号或多个窗口同时触发替换流程。</li><li>若短信基线失败，先按<a href="/guides/4-signal/">信号与短信排查</a>处理。</li><li>账号不可登录或已失去验证条件时，停止自助切换并联系 giffgaff 官方支持。</li></ul>`,
      },
      {
        id: "after-moving",
        title: "切换后按顺序验收，不要只看信号格",
        html: `<ol class="growth-steps"><li>确认 App 和 Dashboard 中仍是原来的号码与正确账号。</li><li>确认新 eSIM 线路已启用，记录运营商名称和网络注册结果。</li><li>先测试基础服务，再测试普通短信；第三方平台 OTP 另行判断，不能承诺必到。</li><li>需要移动数据时检查 APN、数据线路和漫游设置，可参考<a href="/guides/apn-settings/">giffgaff APN 设置</a>。</li><li>全部验收完成后，再按设备厂商的安全流程处理旧手机。</li></ol><p>第一次从实体 SIM 切换到 eSIM 的前置条件和旧卡失效边界，仍由<a href="/more/03-esim/">eSIM 转换总指南</a>负责；本页不重复建立平行入口。</p>`,
      },
    ],
    sources: [official.esimNewPhone, official.esim, official.network],
    relatedRoutes: [
      { label: "第一次实体卡转 eSIM 的完整检查", href: "/more/03-esim/" },
      { label: "eSIM 误删后的恢复边界", href: "/more/esim-deleted/" },
      { label: "账号与恢复方式检查", href: "/guides/3-account/" },
      { label: "换机后无信号或短信时排查", href: "/guides/4-signal/" },
      { label: "eSIM 二维码与第三方写卡安全边界", href: "/more/04-esim-qrcode/" },
    ],
    commerceTarget: { label: "微信或 Telegram 咨询订单问题", href: "/contact/" },
  }),
  page({
    path: "/more/esim-deleted/",
    indexPolicy: "index",
    schemaType: "Article",
    updatedAt: SEARCH_CONTENT_REVIEWED_AT,
    reviewedAt: SEARCH_CONTENT_REVIEWED_AT,
    intent: "giffgaff eSIM 误删恢复",
    title: "giffgaff eSIM 误删了怎么办｜实体 SIM 中转与账号恢复",
    description:
      "误删 giffgaff eSIM 后不能直接恢复原配置；按官方说明先换到从未激活、状态可核验的实体 SIM，再至少间隔 24 小时切换为新 eSIM。",
    h1: "giffgaff eSIM 误删：原配置不能直接恢复",
    deck: "不要寻找旧二维码、缓存或第三方提取工具。先判断账号能否登录，再选择官方实体 SIM 中转或支持恢复。",
    directAnswer:
      "giffgaff 官方当前说明，删除 eSIM 会把它从设备永久移除，不能靠重新选择原 eSIM 直接恢复。仍能登录账号时，需要一张从未激活、状态可核验的 giffgaff 实体 SIM：先登录原账号，把号码换到实体 SIM；至少等待 24 小时后，再通过 App 把实体 SIM 换成新的 eSIM。若误删后无法登录或无法接收验证码，应联系 giffgaff 官方帮助恢复账号。",
    answerSources: [official.esimDeleted, official.activation],
    sections: [
      {
        id: "stop-first",
        title: "先停止三种高风险操作",
        html: `<ul class="growth-list"><li>不要反复扫描旧截图、旧二维码或从聊天记录中寻找激活凭证；官方已说明被删 eSIM 不能直接恢复。</li><li>不要把账号 Cookie、密码、短信验证码、二维码或激活字符串交给第三方“恢复工具”。</li><li>不要在另一个新账号里激活替换卡，否则可能无法接回原号码、plan 和 Credit。</li></ul><p>误删 eSIM 是线路恢复问题，不等于号码已经永久丢失；但是否能自助恢复，取决于原账号访问权、验证条件和一张从未激活且状态可核验的实体 SIM。</p>`,
      },
      {
        id: "account-branch",
        title: "先分支：原账号还能不能登录",
        html: `<div class="growth-table-wrap" role="region" tabindex="0" aria-label="eSIM 误删恢复分支"><table><caption>按账号访问权选择路径</caption><thead><tr><th>当前条件</th><th>正确方向</th><th>不要做什么</th></tr></thead><tbody><tr><th>能登录原账号，也有从未激活且状态可核验的实体 SIM</th><td>按官方两次 SIM swap 路径恢复</td><td>不要创建新账号</td></tr><tr><th>能登录，但暂时没有实体 SIM</th><td>先取得一张从未激活且状态可核验的 giffgaff SIM</td><td>不要强行跳过实体 SIM 中转</td></tr><tr><th>不能登录或无法通过验证</th><td>联系 giffgaff 官方支持恢复访问</td><td>不要向本站或陌生人发送凭证</td></tr><tr><th>人在境外且只有这一条验证线路</th><td>优先保护账号并准备替代通信方式</td><td>不要假设立刻恢复</td></tr></tbody></table></div>`,
      },
      {
        id: "two-swaps",
        title: "官方恢复路径：先实体 SIM，再新 eSIM",
        html: `<p>根据<a href="${official.esimDeleted.url}" target="_blank" rel="noopener noreferrer">${official.esimDeleted.label}</a>（核验 ${SEARCH_CONTENT_REVIEWED_AT}），自助恢复要完成两次替换：</p><ol class="growth-steps"><li>准备一张从未激活、状态可核验的 giffgaff 实体 SIM。</li><li><strong>先登录原号码对应的账号</strong>，再从 App 的 Account → SIM → Replace my SIM → Switch to a new physical SIM，或从网页 Dashboard 的 Replace my SIM 进入。</li><li>按屏幕步骤把原号码换到实体 SIM，等待线路完成切换。</li><li>官方当前要求两次 SIM switch 之间至少等待 24 小时；不要在等待期重复提交。</li><li>再次登录 giffgaff App，进入 Account → SIM → Replace my SIM → Switch to a new eSIM，按屏幕提示取得新的 eSIM。</li></ol><p>官方页面还列出当前可操作时间窗；时间窗可能更新，执行当日必须打开官方页面重核，本站不把静态时间写成永久规则。</p>`,
      },
      {
        id: "after-recovery",
        title: "恢复后做四项验收与安全收尾",
        html: `<ol class="growth-steps"><li>核对 Dashboard/App 中号码、Credit 和 plan 是否仍属于原账号。</li><li>测试信号、基础通话或普通短信；平台 OTP 结果不能代替基础服务验收。</li><li>检查新 eSIM 线路与移动数据，必要时参考<a href="/guides/apn-settings/">官方 APN 参数</a>。</li><li>更新自己的设备与恢复记录，但不要保存或转发 eSIM 凭证、完整 ICCID、密码或验证码。</li></ol><p>如果收到替换卡后号码、余额或账号不符合预期，停止继续换卡，保留脱敏时间线并交给 giffgaff 官方 agent。第三方写卡与凭证处理的停止条件见<a href="/more/04-esim-qrcode/">eSIM 安全边界</a>。</p>`,
      },
    ],
    sources: [official.esimDeleted, official.activation, official.esim],
    relatedRoutes: [
      { label: "eSIM 换手机前的 MFA 检查", href: "/more/esim-new-phone/" },
      { label: "第一次实体 SIM 转 eSIM", href: "/more/03-esim/" },
      { label: "账号无法登录时先检查恢复方式", href: "/guides/3-account/" },
      { label: "实体 SIM 丢失或损坏后的补卡路径", href: "/qa/03-reissue/" },
      { label: "eSIM 凭证与第三方写卡安全边界", href: "/more/04-esim-qrcode/" },
    ],
    commerceTarget: { label: "微信或 Telegram 咨询订单问题", href: "/contact/" },
  }),
  page({
    path: "/tools/keep-number-reminder/",
    indexPolicy: "index",
    schemaType: "WebApplication",
    updatedAt: "2026-07-23",
    socialImage: "/growth-assets/keep-number-reminder-og.png",
    intent: "giffgaff 保号提醒日期计算",
    title: "giffgaff 保号提醒工具｜本地生成第 5 个月提醒",
    description:
      "输入最近一次有效动作日期，在浏览器本地生成第 5 个月提醒并导出 .ics；不上传号码、账号或日期，不承诺永久保号。",
    h1: "giffgaff 保号提醒：生成本地日历",
    deck: "日期只在当前浏览器内计算，不发送到本站服务器。",
    productIntroHtml: `<section class="growth-product-intro" id="english-overview" lang="en" aria-labelledby="english-product-title"><p class="growth-product-kicker">Free browser tool · no sign-up · local-only</p><h2 id="english-product-title">UK SIM Keep-Number Reminder</h2><p>Turn the date of your last qualifying giffgaff activity into a fifth-month calendar reminder. The date stays in your browser, and the exported .ics file contains no phone number or account details.</p><div class="growth-product-actions"><a class="btn btn-primary" href="#tool">Create a reminder</a><a class="btn btn-secondary" href="#rule">Read the rule and limits</a></div><ul class="growth-product-points"><li>Runs locally in your browser</li><li>Exports a standard calendar file</li><li>Uses an early reminder, not a service guarantee</li></ul></section>`,
    directAnswer:
      "官方停用边界是连续 6 个月没有列明的有效动作；可记为“最近一次有效动作 + 6 个月”，本站在第 5 个月提前生成缓冲提醒。日期只在本机计算，不保证号码状态。号码一旦被停用就不能重新激活；如需保留号码，应在停用后的 30 天内按官方说明申请 PAC。",
    tool: "keep-number",
    sections: [
      {
        id: "rule",
        title: "当前官方规则与本站缓冲提醒",
        html: `<p>官方当前规则可写成：连续 6 个月没有列明的有效动作会进入停用边界；本站用“最近一次有效动作 + 6 个月”记录最晚复核点。列明动作包括主动通话、主动 SMS/MMS、移动数据连接、购买 Airtime Credit 或 plan，单纯接收短信不在列表中。<a href="${official.inactive.url}" target="_blank" rel="noopener noreferrer">${official.inactive.label}</a>（核验 ${REVIEWED_AT}）。</p><p>第 5 个月是本站给异常排查预留时间的缓冲提醒，不是官方把周期改成了 5 个月。</p>`,
      },
      {
        id: "tool",
        title: "输入最近一次有效动作",
        html: `<div class="growth-tool" data-tool="keep-number" data-locale="bilingual" data-expires="${EXPIRES_AT}" role="group" aria-label="UK SIM keep-number reminder / 本地保号提醒工具"><label>Last qualifying activity / 最近一次可验证动作日期<input type="date" name="last-action" required></label><button class="btn btn-primary" type="button" data-calculate>Create fifth-month reminder / 生成提醒</button><output aria-live="polite"></output><button class="btn btn-secondary" type="button" data-download-ics disabled>Download .ics / 下载日历</button></div>`,
      },
      {
        id: "privacy",
        title: "日历里不会写入号码或账号",
        html: `<p>导出的日历只包含提醒日期、规则复核提示和官方来源，不包含号码、邮箱、用户名、订单信息或卡片识别码。工具不使用浏览器长期存储。</p>`,
      },
      {
        id: "expired",
        title: "超过周期或号码已停用怎么办",
        html: `<p>不要把计算日期当成号码仍然有效的证明。立即登录官方账号检查号码、余额和服务状态。官方说明号码一旦停用就不能重新激活；如仍需保留号码，应在停用后的 30 天内按当前页面申请 PAC 并转出。<a href="${official.inactive.url}" target="_blank" rel="noopener noreferrer">${official.inactive.label}</a>（核验 ${REVIEWED_AT}）。</p>`,
      },
    ],
    sources: [official.inactive, official.credit],
    relatedRoutes: [
      { label: "保号与有效动作教程", href: "/guides/3-usage/" },
      { label: "自助充值问答", href: "/qa/02-topup/" },
      { label: "中国漫游成本工具", href: "/tools/china-roaming-cost/" },
      { label: "保号、充值和漫游的完整避坑清单", href: "/guides/6-pitfalls/" },
    ],
    commerceTarget: { label: "微信或 Telegram 咨询订单问题", href: "/contact/" },
  }),
  page({
    path: "/tools/china-roaming-cost/",
    indexPolicy: "index",
    schemaType: "WebApplication",
    intent: "giffgaff 中国 PAYG Credit 漫游费用试算",
    title: "giffgaff 中国 PAYG 漫游费用计算器｜短信、通话与流量",
    description:
      "按 giffgaff 当前中国 PAYG Credit 漫游费率试算短信、单次通话和流量成本；不包含 Travel Data Add-on，费率过期停止给出总价。",
    h1: "giffgaff 中国 PAYG 漫游费用计算器",
    deck: `PAYG Credit 费率核验日期 ${REVIEWED_AT}，到 ${EXPIRES_AT} 前用于估算；不包含 Travel Data Add-on，实际扣费以运营商账单为准。`,
    directAnswer:
      "本页只试算中国 PAYG Credit：数据费用 = MB × £0.20，发出短信费用 = 条数 × £0.30；拨出电话最低单位为 30 秒，即 30 秒是最低计费单位，之后按秒；接听电话逐通按分钟向上取整，所以多通电话必须分别计算。本工具不包含通过 App 购买、30 天有效的 Travel Data Add-on。",
    tool: "roaming-cost",
    sections: [
      {
        id: "status",
        title: "当前中国 PAYG Credit 费率核验状态",
        html: `<div class="growth-rate-status"><strong>已核验：${REVIEWED_AT}</strong><span>失效日：${EXPIRES_AT}</span><p>当前公开页显示：数据 20p/MB；拨打 £1/分钟，首 30 秒起计、之后按秒；接听 £1/分钟，每次通话按整分钟向上取整；发短信 30p，收短信免费。见<a href="${official.roamingChina.url}" target="_blank" rel="noopener noreferrer">${official.roamingChina.label}</a>（核验 ${REVIEWED_AT}）。</p></div>`,
      },
      {
        id: "tool",
        title: "输入预计用量",
        html: `<div class="growth-tool" data-tool="roaming-cost" data-rate-per-megabyte="0.2" data-rate-per-sms="0.3" data-rate-per-outgoing-minute="1" data-rate-per-incoming-minute="1" data-expires="${EXPIRES_AT}" role="group" aria-label="中国 PAYG Credit 漫游费用试算工具"><label>预计 PAYG 流量（MB）<input type="number" name="megabytes" min="0" step="0.01" value="0" required></label><label>预计发出短信（条）<input type="number" name="sms" min="0" step="1" value="0" required></label><label>单次预计拨打时长（分钟）<input type="number" name="outgoing-minutes" min="0" step="0.01" value="0" required></label><label>单次预计接听时长（分钟）<input type="number" name="incoming-minutes" min="0" step="0.01" value="0" required></label><button class="btn btn-primary" type="button" data-calculate>计算 PAYG Credit 估算费用</button><output aria-live="polite"></output></div>`,
      },
      {
        id: "method",
        title: "通话和流量计费单位说明",
        html: `<p>公开公式是：数据 = MB × £0.20；发出短信 = 条数 × £0.30；拨出电话逐通计算，首 30 秒按最低计费单位、之后按秒；接听电话逐通按分钟向上取整。若预计多次通话，应逐通计算后相加，不能先合并分钟，否则每通各自的最低单位或取整会被低估。后台同步可能在你没有主动打开网页时产生 PAYG 数据。</p><p>本页只估算 PAYG Credit，明确不包含 Travel Data Add-on。中国另有通过 App 购买的非欧盟 Travel Data Add-on，购买后 30 天有效；规格和当前价格先查看<a href="${official.travelAddOn.url}" target="_blank" rel="noopener noreferrer">${official.travelAddOn.label}</a>（核验 ${REVIEWED_AT}）。</p><p class="growth-warning">如果费率超过失效日，数值结果会关闭。先打开官方中国漫游页复核，再重新发布配置。</p>`,
      },
      {
        id: "boundaries",
        title: "漫游动作、保号与 OTP 是三件事",
        html: `<p>产生漫游费用不自动证明特定平台 OTP 会到达；收到 OTP 也不等于完成官方列明的保活动作。分别记录号码状态、普通短信基线和平台结果。</p>`,
      },
    ],
    sources: [official.roamingChina, official.travelAddOn, official.inactive, official.network],
    relatedRoutes: [
      { label: "中国漫游与流量教程", href: "/guides/5-travel-data/" },
      { label: "网络和短信排查", href: "/guides/4-signal/" },
      { label: "生成保号提醒", href: "/tools/keep-number-reminder/" },
      { label: "中国漫游、短信和保号避坑总览", href: "/guides/6-pitfalls/" },
    ],
    commerceTarget: { label: "微信或 Telegram 咨询当前卡片", href: "/contact/" },
  }),
  page({
    path: "/tools/g0-g2-total-cost/",
    indexPolicy: "index",
    schemaType: "WebApplication",
    intent: "G0/G2 用户输入现金支出",
    title: "G0/G2 现金支出计算器｜卡价、运费、充值与使用支出",
    description:
      "自行输入一条 G0 或 G2 路径的卡价、运费、首次充值和预计额外使用支出，计算人民币现金支出；英镑余额单列且不折算。",
    h1: "giffgaff G0/G2 现金支出计算器",
    deck: "G0/G2 是本站库存分类，计算结果完全取决于你的输入，不代替卡状态确认。",
    directAnswer:
      "公开现金公式是：现金支出 = 卡价 + 运费 + 首次充值 + 预计额外使用支出。每次只试算一条购买路径；可用余额以英镑单独展示，不按未知汇率折算或抵扣人民币现金支出。要比较 G0 与 G2，必须分别运行两次并保持相同时间范围，结果不判断账号控制、激活、OTP 或哪张卡一定更好。",
    answerSources: [],
    tool: "total-cost",
    sections: [
      {
        id: "scope",
        title: "计算器能比较什么、不能判断什么",
        html: `<p>计算器只处理一条路径的金额。公开公式为：现金支出 = 卡价 + 国内运费 + 首次充值 + 预计额外使用支出；可用余额只记录、不参与人民币现金合计。它不能判断账号控制权、激活成功率、平台 OTP 或未来号码状态。</p>`,
      },
      {
        id: "classification",
        title: "G0/G2 是本站库存分类",
        html: `<p>G0 用于描述全新未激活卡，G2 用于描述本站当前有余额卡库存。它们不是 giffgaff 官方套餐或官方产品名称；每批卡状态、余额范围、价格和发货安排应在付款前确认。</p>`,
      },
      {
        id: "tool",
        title: "输入一条购买路径的成本",
        html: `<div class="growth-tool" data-tool="total-cost" role="group" aria-label="G0 G2 总成本试算工具"><label>卡价（人民币）<input type="number" name="card" min="0" step="0.01" required></label><label>可用余额（英镑，仅记录）<input type="number" name="balance" min="0" step="0.01" value="0" required></label><label>国内运费（人民币）<input type="number" name="shipping" min="0" step="0.01" value="0" required></label><label>首次充值（人民币）<input type="number" name="topup" min="0" step="0.01" required></label><label>预计额外使用支出（人民币）<input type="number" name="usage" min="0" step="0.01" value="0" required></label><button class="btn btn-primary" type="button" data-calculate>计算本次现金支出</button><output aria-live="polite"></output></div>`,
      },
      {
        id: "interpret",
        title: "怎样解读结果",
        html: `<p>结果只表述为“按本次输入，现金支出为……”。每次只试算一条购买路径；可用英镑余额单独展示，不按未知汇率折算或抵扣人民币成本。比较 G0 与 G2 时分别运行两次，使用相同时间范围，再检查差额来自卡价、运费、首次充值还是后续支出。</p>`,
      },
      {
        id: "before-order",
        title: "下单前仍要核对的卡状态",
        html: `<ul class="growth-list"><li>当前库存、实付价格和发货方式。</li><li>G2 本批余额范围与交付控制方式。</li><li>激活或账号资料由谁创建、谁负责恢复。</li><li>出现订单问题时使用哪个售后入口。</li></ul>`,
      },
    ],
    sources: [official.activation, official.credit, official.plans, official.terms],
    relatedRoutes: [
      { label: "先理解 G0/G2 差别", href: "/answers/" },
      { label: "购买与发货流程", href: "/guides/1-order/" },
      { label: "试算后继续核对购买与使用风险", href: "/guides/6-pitfalls/" },
      { label: "查看当前实体卡分类", href: "/shop/" },
    ],
    commerceTarget: { label: "微信或 Telegram 咨询本批状态", href: "/contact/" },
  }),
  page({
    path: "/tools/esim-compatibility/",
    indexPolicy: "noindex",
    schemaType: "WebApplication",
    intent: "giffgaff eSIM 精确设备兼容方法",
    title: "giffgaff eSIM 兼容性检查方法｜数据采集中",
    description:
      "按精确型号、地区版本、系统与 giffgaff App 版本核对 eSIM 前提条件；证据不足时只显示需核对，不提供第三方写卡方案。",
    h1: "giffgaff eSIM 设备兼容检查器",
    deck: "证据不足阶段只公开方法，不把同系列设备或第三方写卡经验当成兼容证明。",
    directAnswer:
      "先用精确型号、地区版本、系统与 giffgaff App 版本匹配证据。找不到完全一致的记录就显示“需核对”，不会把同系列手机或第三方写卡经验当成兼容证明。",
    threshold: "至少 20 条字段完整、未过期、经人工复核的精确型号记录。",
    sections: [
      {
        id: "why-exact",
        title: "为什么同系列手机不能直接视为兼容",
        html: `<p>同一系列在不同国家或运营商渠道可能使用不同硬件配置。精确型号、地区版本、系统、App 版本和网络锁状态缺一项，就只能显示“需核对”。</p>`,
      },
      {
        id: "method",
        title: "兼容、需核对和不支持怎样判定",
        html: `<ul class="growth-list"><li>官方或制造商明确支持原生 eSIM，且精确版本证据未过期：满足当前公开前提。</li><li>无原生 eSIM、设备锁定或官方明确不支持：不满足前提。</li><li>记录冲突、版本不完整、超过 90 天或仅有第三方线索：需核对。</li></ul>`,
      },
      {
        id: "boundary",
        title: "只使用官方 App 路径",
        html: `<p>本页不提供 Cookie、二维码、SM-DP+、手动激活码、修改版 App 或第三方写卡步骤。开始前还要确认邮箱、账号恢复、稳定网络和旧 SIM 失效边界。</p>`,
      },
      {
        id: "threshold",
        title: "开放索引门槛",
        html: `<p class="growth-insufficient"><strong>证据不足：</strong>当前尚未达到 20 条精确记录。字段完整、未过期且完成人工复核的记录才计入门槛；在此之前保持 noindex。</p>`,
      },
    ],
    sources: [official.esim, official.network],
    relatedRoutes: [
      { label: "官方路径 eSIM 教程", href: "/more/03-esim/" },
      { label: "二维码与写卡风险", href: "/more/04-esim-qrcode/" },
      { label: "无信号排查", href: "/guides/4-signal/" },
      { label: "继续使用实体卡", href: "/shop/" },
    ],
    commerceTarget: { label: "微信或 Telegram 咨询实体卡", href: "/contact/" },
  }),
  page({
    path: "/research/china-network-sms/",
    indexPolicy: "noindex",
    schemaType: "CollectionPage",
    intent: "giffgaff 中国网络与普通短信采集方法",
    title: "giffgaff 中国网络与短信｜采集方法与样本门槛",
    description:
      "公开按城市、设备、系统、SIM 形态和选网方式采集网络与普通短信记录的方法；当前没有合格样本结果，达到门槛前保持 noindex。",
    h1: "giffgaff 中国网络与短信采集计划",
    deck: "当前只发布方法和门槛，没有近期样本结果；成功和失败都必须记录。",
    directAnswer:
      "本页当前没有可发布的近期实测样本，只公开未来记录特定城市、设备、系统和选网环境的方法。达到门槛后也只能描述有日期和环境边界的样本，不能承诺中国境内永久有信号或短信必达。",
    threshold: "最近 90 天至少 30 条已复核记录，覆盖 3 个城市、3 个设备/系统组合，以及自动选网与手动选网两类网络环境。",
    sections: [
      {
        id: "current",
        title: "当前样本量与证据不足提示",
        html: `<p class="growth-insufficient"><strong>证据不足：</strong>当前只发布数据结构和测试方法，不发布兼容率或全国性结论。</p>`,
      },
      {
        id: "method",
        title: "测试方法：一次只改一个变量",
        html: `<ol class="growth-steps"><li>记录城市、精确设备、地区版本、系统和 SIM 形态。</li><li>先检查账号状态，再分别测试自动选网和手动选网。</li><li>把网络注册、普通短信、通话和数据分开记录。</li><li>记录尝试次数与等待时间，成功和失败都保留。</li><li>超过 90 天的记录转为历史样本，不进入近期聚合。</li></ol>`,
      },
      {
        id: "reading",
        title: "怎样解读成功、失败与未测试",
        html: `<p>每个筛选结果显示“成功数/已测试数”。少于 5 条的子组只展示记录，不显示百分比；普通短信和平台 OTP 属于不同层，不能混在同一成功率里。</p>`,
      },
      {
        id: "threshold",
        title: "开放索引门槛",
        html: `<ul class="growth-list"><li>最近 90 天内 30 条已批准记录。</li><li>至少 3 个城市和 3 个设备/系统组合。</li><li>同时覆盖自动选网与手动选网两类网络环境。</li><li>每条纳入记录必须包含普通短信基线。</li></ul>`,
      },
    ],
    sources: [official.roamingChina, official.network, official.manualRoam, official.volte],
    relatedRoutes: [
      { label: "网络与短信诊断", href: "/guides/4-signal/" },
      { label: "中国漫游成本", href: "/tools/china-roaming-cost/" },
      { label: "平台 OTP 状态板", href: "/research/otp-status/" },
      { label: "未购卡先看选卡", href: "/answers/" },
    ],
    commerceTarget: { label: "微信或 Telegram 咨询排查信息", href: "/contact/" },
  }),
  page({
    path: "/research/otp-status/",
    indexPolicy: "noindex",
    schemaType: "CollectionPage",
    intent: "giffgaff 平台 OTP 样本采集方法",
    title: "giffgaff 验证码状态板｜采集方法与开放门槛",
    description:
      "公开带普通短信基线的平台 OTP 采集方法、环境字段和失败类型；当前没有合格样本结果，不提供接码、绕过验证或永久兼容承诺。",
    h1: "giffgaff OTP 验证码采集计划",
    deck: "当前只发布采集方法，没有近期样本结果；平台风控和网络状态必须分开判断。",
    directAnswer:
      "验证码是否送达同时受平台风控、账号状态、设备和网络影响。本页当前没有可发布的近期样本，只公开带普通短信基线的采集方法；不提供接码、绕过验证或“某平台永久可用”的保证。",
    threshold: "至少 50 个已复核事件、5 个平台、每平台 5 条、3 类环境，并且每条均有普通短信基线。",
    sections: [
      {
        id: "difference",
        title: "为什么普通短信成功仍不代表 OTP 必达",
        html: `<p>普通短信验证的是号码和网络层，OTP 还会经过平台发送策略、账号风险、请求频率和地区限制。两者必须分别记录。</p>`,
      },
      {
        id: "outcomes",
        title: "收到、超时、平台拒绝与限频分开记录",
        html: `<div class="growth-table-wrap" role="region" tabindex="0" aria-label="OTP 结果分类"><table><caption>OTP 状态板结果定义</caption><thead><tr><th>结果</th><th>含义</th></tr></thead><tbody><tr><th>收到</th><td>在记录的等待时间内收到本次请求</td></tr><tr><th>超时</th><td>普通短信基线正常，但本次 OTP 未在窗口内到达</td></tr><tr><th>平台拒绝</th><td>平台明确不接受请求或号码</td></tr><tr><th>限频</th><td>平台提示请求过多，不能当成运营商短信失败</td></tr></tbody></table></div>`,
      },
      {
        id: "privacy",
        title: "投稿只接收环境，不接收账号内容",
        html: `<p>记录可以包含平台、请求类型、城市、设备、系统、网络、尝试次数和等待时间；不得包含号码、邮箱、用户名、密码、验证码、Cookie 或聊天截图。</p>`,
      },
      {
        id: "threshold",
        title: "开放索引门槛",
        html: `<p class="growth-insufficient"><strong>证据不足：</strong>达到 50 个已复核事件、5 个平台、每平台至少 5 条、3 类环境且全部具备普通短信基线之前，本页保持 noindex。</p><p>即使达到门槛，也只展示“近期样本比例”，不称为永久兼容率。</p>`,
      },
    ],
    sources: [official.network, official.manualRoam, official.smsPolicy],
    relatedRoutes: [
      { label: "先排查普通短信", href: "/guides/4-signal/" },
      { label: "查看中国网络实测方法", href: "/research/china-network-sms/" },
      { label: "未购卡先比较 G0/G2", href: "/answers/" },
      { label: "查看当前手机卡", href: "/shop/" },
    ],
    commerceTarget: { label: "微信或 Telegram 咨询排查信息", href: "/contact/" },
  }),
  policyStatusPage({
    path: "/privacy/",
    title: "隐私说明状态｜信息待经营负责人确认",
    h1: "隐私说明：信息待经营负责人确认",
    policyName: "隐私政策",
    missingFacts: "经营主体、实际收集的数据、处理目的与法律依据、支付和客服第三方、存储位置与期限、用户权利、安全事件与未成年人处理",
    confirmedFactsHtml: `<section aria-labelledby="privacy-confirmed-facts"><h3 id="privacy-confirmed-facts">已确认的有限事实</h3><ul><li>公开隐私联系邮箱：<a href="mailto:siuserxy@gmail.com" target="_blank" rel="noopener noreferrer" data-link-role="contact-channel">siuserxy@gmail.com</a>。</li><li>本站尚未启用 Google AdSense，当前没有 AdSense 账号、publisher ID、广告脚本或广告 Cookie。</li><li>本站使用 Cloudflare Analytics Engine 记录不含直接身份标识的事件级页面与咨询漏斗数据，包括 canonical 路径、固定来源类别、事件名称，以及微信、Telegram 这两类白名单联系渠道。事件用于判断页面访问、咨询指引打开和联系点击情况；这些记录不是按访客汇总的匿名用户档案。</li><li>如果访问 URL 的 <code>utm_source</code> 精确匹配固定白名单，本站会把该来源值用于本次标签页的归因。当前白名单仅包括 <code>dist_partner</code>、<code>dist_private_share</code>、<code>dist_wechat_group</code>、<code>dist_wechat_official</code>、<code>dist_xiaohongshu</code>、<code>paid_google</code> 和 <code>paid_microsoft</code>；其他值不会写入统计载荷或浏览器存储。白名单来源只写入当前标签页的 <code>sessionStorage</code>，关闭该标签页后不用于跨会话识别，也不会记录完整查询参数。</li><li>该自定义统计不使用 Cookie 作为识别或存储机制；本站写入 Analytics Engine 的自定义数据集不记录或保存 IP、User-Agent、完整 referrer、URL 查询参数、手机号、账号、订单号或支付信息。来源只归类为 direct、internal、search、social、referral、AI、unknown 或上述固定分发来源；事件只允许 page_view、contact_click 等固定名称。</li><li>与其他网站请求一样，Cloudflare 作为边缘基础设施提供方仍可能在传输和基础设施层处理 IP、User-Agent、请求头等网络元数据；这些字段不由本站事件代码写入上述自定义数据集。Cloudflare Analytics Engine 的数据保留期按其当前服务规则为三个月。</li><li>本页仍不是完整隐私政策；其余数据与经营事实未闭环前不开放索引。</li></ul></section>`,
  }),
  policyStatusPage({
    path: "/terms/",
    title: "交易条款状态｜信息待经营负责人确认",
    h1: "交易条款：信息待经营负责人确认",
    policyName: "交易条款",
    missingFacts: "真实经营主体、商品与 G0/G2 定义、价格和支付渠道、订单成立时间、库存与取消规则、账号控制边界、责任限制、争议处理和有效联系方式",
  }),
  policyStatusPage({
    path: "/refund/",
    title: "退款说明状态｜信息待经营负责人确认",
    h1: "退款说明：信息待经营负责人确认",
    policyName: "退款政策",
    missingFacts: "可取消与不可取消场景、退货资格、申请窗口、卡片和账号状态要求、证据清单、退款路径与时限、费用承担、拒绝理由、升级与申诉流程",
  }),
  policyStatusPage({
    path: "/shipping/",
    title: "物流说明状态｜信息待经营负责人确认",
    h1: "物流说明：信息待经营负责人确认",
    policyName: "物流政策",
    missingFacts: "实际发货地、覆盖地区、承运商、运费、处理与预计时效、追踪方式、延误与丢损处理、地址修改和签收责任",
  }),
]);

export function growthPageFor(pathname) {
  return GROWTH_PAGES.find((entry) => entry.path === pathname) || null;
}
