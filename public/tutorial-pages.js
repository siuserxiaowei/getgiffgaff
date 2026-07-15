import { ogImageUrlFor } from "./og-images.js";

const CANONICAL_ORIGIN = "https://getgiffgaff.com";
const PUBLISHED = "2026-07-15";
const EDITOR = "getgiffgaff";
const REVIEW_METHOD = "逐项对照本页列明的 giffgaff 官方页面并记录修订日期";

const official = {
  activation: {
    title: "giffgaff 官方：Activating your giffgaff SIM",
    url: "https://help.giffgaff.com/en/articles/240393-activating-your-giffgaff-sim",
    scope: "激活码、SIM 序列号、账号与 SIM swap 边界；具体处理时间需在操作当日复核。",
  },
  deactivation: {
    title: "giffgaff 官方：Understanding why your number has been deactivated",
    url: "https://help.giffgaff.com/en/articles/242797-understanding-why-your-number-has-been-deactivated",
    scope: "inactive 判断、有效使用类型与停用后的处理入口；具体周期和时间窗需在操作当日复核。",
  },
  credit: {
    title: "giffgaff 官方：Everything to know about Credit",
    url: "https://help.giffgaff.com/en/articles/240847-everything-to-know-about-credit",
    scope: "Airtime Credit 的用途、充值渠道、余额查询与海外使用边界。",
  },
  esim: {
    title: "giffgaff 官方：Switching to an eSIM with giffgaff",
    url: "https://help.giffgaff.com/en/articles/261570-switching-to-an-esim-with-giffgaff",
    scope: "eSIM 兼容条件、App 切换路径、激活窗口、旧 SIM 失效与故障处理。",
  },
  network: {
    title: "giffgaff 官方：Network & Service Troubleshooting",
    url: "https://help.giffgaff.com/en/articles/639659-network-service-troubleshooting",
    scope: "无信号、通话、短信、数据的基础排查，以及跨设备判断 SIM 或手机问题。",
  },
  manualRoam: {
    title: "giffgaff 官方：How to perform a Manual Roam",
    url: "https://help.giffgaff.com/en/articles/258873-how-to-perform-a-manual-roam",
    scope: "手动选网的作用、通用操作与 SMS 服务中心号码。",
  },
  roaming: {
    title: "giffgaff 官方：Roaming",
    url: "https://www.giffgaff.com/roaming",
    scope: "最新漫游区域、当前资费与适用条件；价格不在本文静态转述。",
  },
  terms: {
    title: "giffgaff 官方：Terms & Conditions",
    url: "https://www.giffgaff.com/boiler-plate/terms",
    scope: "个人使用、滥用、服务、品牌与推广边界。",
  },
};

const commonRelated = [
  { title: "giffgaff 使用教程和避坑清单", url: "/guides/6-pitfalls/" },
  { title: "G0/G2 对比与选卡", url: "/answers/" },
  { title: "既有订单与使用支持", url: "/contact/" },
];

export const TUTORIAL_PAGES = Object.freeze({
  "/guides/2-activate/": {
    primaryKeyword: "giffgaff 国内激活",
    title: "giffgaff 国内激活教程：激活码、账号与失败排查",
    description: "中国境内激活 giffgaff SIM 的原创流程：准备激活码或 13 位序列号，避免误触 SIM swap，并按症状排查失败。",
    headline: "giffgaff 国内激活：先保住账号，再处理信号",
    deck: "这不是对某篇第三方教程的复制，而是把 giffgaff 官方规则和国内用户常见故障拆成可验证的检查顺序。",
    intent: "操作教程 / 故障排查",
    answer:
      "国内激活的核心不是连续重试，而是确认 SIM 身份、账号归属和当前处理阶段。新卡从官方激活页开始；激活码无法使用时，官方说明可尝试 SIM 上的 13 位序列号。一张已有号码的卡不要随意在其他已激活账号里操作，否则可能触发 SIM swap。来自推广或转售渠道的卡还应先核对 giffgaff 当前条款与卖家合规边界。",
    author: EDITOR,
    reviewMethod: REVIEW_METHOD,
    dateModified: PUBLISHED,
    sections: [
      {
        id: "prepare",
        title: "开始前的 7 项准备",
        paragraphs: [
          "先区分你拿到的是尚未激活的新卡，还是已经有账号、号码或余额的卡。两者的正确入口不同。",
          "只使用 giffgaff 官方激活页或官方 App。第三方文章中的界面截图可能已经过时，不要根据旧按钮名强行对照。",
        ],
        items: [
          "SIM 卡、卡板与可辨识的激活码。",
          "SIM 上的 13 位序列号，作为激活码失效时的备用。",
          "长期可使用的邮箱、可保存的密码和账号恢复方式。",
          "稳定 Wi-Fi，以及一台无运营商锁的兼容手机。",
          "当前卡的来源、订单号和卖家声明的卡状态。",
          "对费用的可接受上限；任何当前价格都以官方页实时显示为准。",
          "一份操作记录，保存时间、页面错误和结果，但不记录完整密码或验证码。",
        ],
      },
      {
        id: "new-sim",
        title: "新卡激活的稳妥顺序",
        paragraphs: [
          "官方激活页会引导你识别 SIM、建立账号并完成激活所需的当前步骤。由于界面会更新，本文只锁定不变的决策点。",
        ],
        steps: [
          "退出其他 giffgaff 账号，打开官方 Activate my SIM 入口。",
          "输入激活码；看不清或不工作时，根据官方帮助页尝试 13 位 SIM 序列号。",
          "为这张 SIM 建立对应账号；每张有效 SIM 应有自己的账号。",
          "只按官方当前页面完成付款、Credit 或 plan 步骤，不使用虚假个人资料去绕过校验。",
          "保存号码、账号邮箱和官方确认页，然后再插卡检查网络。",
          "等待时间以官方当前页面和账号状态为准。处理中不要反复提交同一流程；超出官方当日列明的正常范围后再收集证据联系支持。",
        ],
      },
      {
        id: "avoid-sim-swap",
        title: "最容易忽略的风险：SIM swap",
        paragraphs: [
          "giffgaff 官方帮助页明确说明，一个账号同时只能有一张有效 SIM。在已有号码的账号上激活另一张 SIM，可能把号码和余额迁移到新 SIM，并使旧 SIM 失效。",
          "因此，当你收到已有号码、账号或余额的卡时，不要从“Activate a new SIM”重新开始。先确认账号归属、号码和卡状态，不确定时先问订单售后。",
        ],
        callout: "不要把“页面能继续”当成“这个操作对原号码无影响”。",
      },
      {
        id: "terms-boundary",
        title: "推广、转售与账号资料的条款边界",
        paragraphs: [
          "giffgaff 当前条款要求会员使用自己的登记资料，并对推广参与者、Participant SIM 与激活地点设置条件。本站无法仅凭卡片名称判断某一批次、某种预处理或中国境内操作是否符合这些条件。",
          "如果卡来自卖家、推广链接或已做前置处理，付款和激活前应打开当前条款，确认卡的来源、激活状态、账户登记责任和适用地区；必要时向 giffgaff 或专业法律顾问确认。本站教程不是运营商授权或合规结论。",
        ],
        callout: "不要使用虚假姓名、地址、支付资料，也不要把他人的已登记账号当成可直接继受的商品。",
      },
      {
        id: "diagnose",
        title: "按症状排查，不要一次改五个变量",
        table: {
          headers: ["症状", "先查什么", "暂时不要做什么"],
          rows: [
            ["激活码不识别", "字符是否读错；改用 13 位 SIM 序列号", "连续猜测和快速重提"],
            ["网页提交卡住", "清理 Cookie/Cache；换浏览器或设备", "同时在多窗口操作"],
            ["账号已显示卡，但没信号", "等待激活窗口、重启、检查设备锁与漫游", "立即重新激活另一张卡"],
            ["普通短信可收，某平台验证码不到", "转入平台风控排查", "把问题当成 SIM 激活失败"],
          ],
        },
      },
      {
        id: "evidence",
        title: "联系支持时提供可诊断证据",
        items: [
          "订单号、卡类型和卡片来源。",
          "官方账号是否可登录，是否已显示号码与余额。",
          "错误页截图与发生时间；遮住邮箱、卡号、订单个人信息。",
          "手机型号、系统版本、所在城市与当前信号状态。",
          "已尝试的步骤及每步结果。不要发送密码、短信验证码或完整支付卡信息。",
        ],
      },
    ],
    faq: [
      {
        question: "激活码看不清还能激活吗？",
        answer: "可先根据 giffgaff 官方帮助页尝试 SIM 上的 13 位序列号。不要靠反复猜测激活码。",
      },
      {
        question: "激活后多久有信号？",
        answer: "本站当前没有通过真实作者与复核人门禁的处理时长声明，因此不展示缓存数字。请查看操作当日的官方激活页和账号状态；任何时长都不是到点必然成功的承诺。",
      },
      {
        question: "多张卡可以放在一个账号吗？",
        answer: "官方说明一个账号同时只能有一张有效 SIM。在有效账号激活另一张卡可能触发 SIM swap。",
      },
    ],
    sources: [official.activation, official.credit, official.network, official.terms],
    related: [
      commonRelated[0],
      { title: "giffgaff 收不到短信验证码排查", url: "/guides/4-signal/" },
      { title: "giffgaff eSIM 切换前检查", url: "/more/03-esim/" },
      commonRelated[2],
    ],
    revisions: [
      {
        date: PUBLISHED,
        note: "证据型版本全面重写；根据 2026-07-15 可访问的官方激活、Credit、网络排查与条款页复核，并补充推广/转售边界。",
      },
    ],
  },

  "/guides/3-usage/": {
    primaryKeyword: "giffgaff 保号",
    title: "giffgaff 保号规则：如何核对 inactive 状态",
    description: "说明如何在操作当日核对 giffgaff inactive 规则、记录有效动作与处理停用；未通过复核的周期和时间窗不在本站展示。",
    headline: "giffgaff 保号：不要把“收到短信”当成有效使用",
    deck: "保号页只解释核对方法，不承诺号码继续有效或任何第三方平台验证码送达。",
    intent: "规则解释 / 操作清单",
    answer:
      "本站当前没有通过真实作者与复核人门禁的保号周期、有效动作列表或停用恢复时间窗声明，因此不展示缓存数字，也不开放提醒导出。实际操作前请直接打开本页列出的 giffgaff 官方 inactive 帮助页，核对当日规则、账号状态和可验证动作；收到短信本身不能被本站当成保号成功证明。",
    author: EDITOR,
    reviewMethod: REVIEW_METHOD,
    dateModified: PUBLISHED,
    sections: [
      {
        id: "official-rule",
        title: "先确认当前声明状态",
        paragraphs: [
          "运营商可能调整 inactive 判断、有效动作和停用后的处理窗口。本站的周期声明目前因缺少真实作者与复核人而 fail closed。",
          "任何保号操作前，都应打开本文下方的官方来源，查看页面当前文字，并以账号里的实际状态为准。",
        ],
        items: [
          "记录官方页面的查看日期与页面地址。",
          "区分主动使用、购买记录与单纯收到消息，不自行把不同事件视为等价。",
          "选择动作前核对当前资费、余额、网络条件和官方列明的排除项。",
        ],
        callout: "没有当前 ACTIVE 声明时，本站不告诉你一个固定周期或把某个动作写成保证。",
      },
      {
        id: "review-workflow",
        title: "怎样建立可复核的保号记录",
        paragraphs: [
          "提醒应根据你当日核对到的官方规则自行设置，并保留安全缓冲。本站不会在声明门禁失败时替你计算日期。",
        ],
        steps: [
          "登录正确账号，确认号码、邮箱与恢复方式仍由本人控制。",
          "打开官方 inactive 规则和当前费用页，记录查看日期。",
          "按官方当日规则选择可验证、且成本与风险可接受的动作。",
          "完成后记录时间、账号可见结果和必要的交易确认；不要保存密码或验证码。",
          "根据刚刚核对到的规则自行设置下一次复核提醒。",
        ],
      },
      {
        id: "choose-action",
        title: "怎样选择保活动作",
        table: {
          headers: ["动作", "优点", "需要先核对"],
          rows: [
            ["主动发送 SMS", "记录相对清晰", "当前漫游费率、余额、收件号码是否属于有效对象"],
            ["建立移动数据连接", "官方列为有效动作", "数据漫游可能快速扣费，应严格控制用量"],
            ["购买 Credit 或 plan", "账号记录清晰", "当前最低金额、支付方式和是否真有需求"],
            ["只接收短信", "无需主动操作", "不在官方列明的保活动作中，不应作为唯一依据"],
          ],
        },
        callout: "本站不在文章中写死价格。漫游资费和 Credit 金额以操作当日官方页面为准。",
      },
      {
        id: "after-deactivation",
        title: "已经停用时的处理边界",
        paragraphs: [
          "停用后的恢复资格、号码转移和处理窗口属于高变动性规则。本站当前没有通过复核的时间窗声明，不转述具体天数。",
          "如果账号或官方页面显示已停用，应立即打开官方帮助页并使用官方支持入口，保存当前状态与时间线，不要依赖搜索摘要或旧教程数字。",
        ],
      },
      {
        id: "record",
        title: "一张卡的最低维护记录",
        items: [
          "号码和对应账号邮箱（不在共享文档保存密码）。",
          "最近一次有效使用的日期、动作类型和可见结果。",
          "操作前后的余额或官方订单记录。",
          "预提醒、操作提醒和二次检查日期。",
          "当时参考的官方规则 URL 与查看日期。",
        ],
      },
    ],
    faq: [
      {
        question: "收到验证码算保号吗？",
        answer: "本站不会把收到验证码单独当成保号成功证明。请以操作当日官方 inactive 页面列出的有效动作和账号记录为准。",
      },
      {
        question: "本站为什么不直接给一个固定周期？",
        answer: "因为当前声明缺少真实作者与复核人，且运营商规则可能变化。门禁恢复前，本站只提供核对方法，不展示缓存周期或生成提醒。",
      },
    ],
    sources: [official.deactivation, official.credit, official.roaming],
    related: [
      commonRelated[0],
      { title: "giffgaff 收不到短信验证码排查", url: "/guides/4-signal/" },
      { title: "giffgaff 国内激活流程", url: "/guides/2-activate/" },
      commonRelated[2],
    ],
    revisions: [
      {
        date: PUBLISHED,
        note: "把具体周期、动作列表与恢复时间窗改为 fail closed；待真实作者、复核人和复核日期齐全后再由 Claim Registry 控制发布。",
      },
    ],
  },

  "/more/03-esim/": {
    primaryKeyword: "giffgaff eSIM 转换",
    title: "giffgaff eSIM 转换指南：兼容、切换与失败边界",
    description: "把 giffgaff 实体 SIM 转为 eSIM 前，先核对设备、App、账号和旧 SIM 失效风险；含切换后排查与回退决策。",
    headline: "giffgaff eSIM 转换：先证明你能恢复账号",
    deck: "eSIM 不是把号码复制一份。完成切换后，旧实体 SIM 或旧 eSIM 会停止工作。",
    intent: "操作教程 / 风险检查",
    answer:
      "只有在手机硬件支持 eSIM、无运营商锁、能运行最新 giffgaff App，且账号、邮箱和当前 SIM 均可用时，才建议开始切换。官方说明切换需在 App 中完成；新 eSIM 激活后，旧 SIM 会停止工作。如果你只有一台设备且无法确认兼容性，先不要转。",
    author: EDITOR,
    reviewMethod: REVIEW_METHOD,
    dateModified: PUBLISHED,
    sections: [
      {
        id: "go-no-go",
        title: "转换前的 Go / No-Go 检查",
        table: {
          headers: ["检查点", "可以继续", "应暂停"],
          rows: [
            ["设备", "确认原生支持 eSIM 且无网络锁", "只看到同系列其他版本支持，本机未核对"],
            ["App", "能安装并登录最新 giffgaff App", "App 不可用或帐号在当前设备无法登录"],
            ["账号恢复", "邮箱、密码、必要验证均可用", "依赖已丢失邮箱或只有当前 SIM 才能恢复"],
            ["网络", "操作设备有稳定 Wi-Fi/数据", "网络不稳定或准备中途换设备"],
            ["旧 SIM", "接受切换后旧 SIM 停止工作", "仍想把旧实体 SIM 作为同号备份"],
          ],
        },
      },
      {
        id: "official-flow",
        title: "官方流程中的稳定决策点",
        paragraphs: [
          "新用户和已有 giffgaff 用户的起点不同。新用户可在 App 中建立账号并激活 eSIM；已有用户的当前官方路径为 Account > SIM > Replace my SIM > Switch to a new eSIM。",
          "官方帮助页还说明，即使从网站启动订单，仍需在将实际使用 eSIM 的设备上通过 App 完成安装和激活。",
        ],
        steps: [
          "备份账号信息，记录号码、余额和当前 SIM 状态。",
          "在将使用 eSIM 的手机上更新 App，连接稳定网络并登录正确账号。",
          "按官方当前界面进入 SIM 替换流程，逐项阅读确认提示。",
          "安装 eSIM，确认系统已启用该线路；按提示重启或切换飞行模式。",
          "先检查账号与运营商信号，再测普通短信，最后才测第三方平台。",
        ],
      },
      {
        id: "time-window",
        title: "如何理解处理窗口与等待状态",
        paragraphs: [
          "官方页面会显示当前 eSIM switching 的可用条件与处理提示。本站没有通过真实作者与复核人门禁的时长声明，因此不展示缓存小时数；开始前必须直接查看官方页当时显示。",
          "不要把第三方教程换算的“北京时间”当成永久规则，英国夏令时和官方运营窗口都会使固定换算失效。",
        ],
        callout: "这也是本页不写死北京时间的原因。",
      },
      {
        id: "after-switch",
        title: "切换后无信号：先判断是安装、线路还是网络",
        steps: [
          "在 iOS/Android 设置里确认 eSIM 已出现且该线路已启用。",
          "检查 giffgaff 账号是否仍显示正确号码、余额与 SIM 状态。",
          "重启手机，或按官方建议开关一次飞行模式。",
          "若已激活但无网络，进入网络排查；不要立即再发起一次 SIM 替换。",
          "超过官方当前列明的正常处理时间，收集截图和时间线，联系 giffgaff 官方 agent。",
        ],
      },
      {
        id: "third-party",
        title: "第三方二维码、写卡和转移设备的边界",
        paragraphs: [
          "中文社区常把“eSIM”、“二维码”、“写入设备”和“官方 App 切换”混在一起。它们不是同一个支持边界。",
          "本站只把 giffgaff 官方帮助页和 App 流程当作规则来源。任何第三方写入方案都只能作为用户经验，不能写成官方支持或必然成功。",
        ],
      },
    ],
    faq: [
      {
        question: "转成 eSIM 后实体卡还能用吗？",
        answer: "不能作为同号备份继续使用。官方说明新 eSIM 激活后，旧实体 SIM 会停止工作。",
      },
      {
        question: "网站上启动切换后能不能不用 App？",
        answer: "官方当前说明，仍需在将使用 eSIM 的设备上通过最新 App 完成安装和激活。",
      },
    ],
    sources: [official.esim, official.activation, official.network],
    related: [
      commonRelated[0],
      { title: "eSIM 二维码与第三方写卡的安全边界", url: "/more/04-esim-qrcode/" },
      { title: "giffgaff 国内激活流程", url: "/guides/2-activate/" },
      { title: "giffgaff 短信与验证码排查", url: "/guides/4-signal/" },
      commonRelated[2],
    ],
    revisions: [
      {
        date: PUBLISHED,
        note: "证据型版本全面重写；根据 2026-07-15 可访问的官方 eSIM、激活与网络排查页复核。",
      },
    ],
  },

  "/more/04-esim-qrcode/": {
    primaryKeyword: "giffgaff eSIM 二维码安全",
    title: "giffgaff eSIM 二维码与第三方写卡：安全边界",
    description: "解释 giffgaff 官方 eSIM、二维码、激活凭证与第三方写卡的区别；不提供改版 App、凭证提取、上传或绕过兼容检测的步骤。",
    headline: "giffgaff eSIM 二维码：先判断是不是官方支持路径",
    deck: "这个页面负责划清边界，不教你提取、转发或上传 eSIM 激活凭证。优先使用 giffgaff 官方 App 与原生兼容设备。",
    intent: "安全解释 / 支持边界",
    answer:
      "如果设备原生支持 eSIM，应优先按 giffgaff 官方 App 流程安装或切换。不要把二维码截图、激活字符串、账号 Cookie、短信验证码或改版 App 交给第三方。本站不提供抓取 LPA 凭证、把凭证上传到公共工具、修改 App 或绕过官方兼容检测的操作步骤；无法使用官方路径时，保留实体 SIM 通常是风险更低的选择。",
    author: EDITOR,
    reviewMethod: REVIEW_METHOD,
    dateModified: PUBLISHED,
    sections: [
      {
        id: "four-concepts",
        title: "先分清 4 个经常被混用的概念",
        table: {
          headers: ["概念", "它解决什么", "本站边界"],
          rows: [
            ["官方 eSIM", "在兼容设备上通过官方 App 安装或替换 SIM", "可依据官方帮助页说明流程与风险"],
            ["系统安装界面/二维码", "把运营商签发的配置安装到设备", "可能包含敏感激活信息，不应公开或转发"],
            ["第三方写卡/适配器", "让不原生支持 eSIM 的设备尝试使用配置", "不属于本站可验证的官方支持路径"],
            ["改版 App/凭证提取", "绕过原有界面取得或处理配置", "本站不提供、托管或推荐"],
          ],
        },
      },
      {
        id: "safe-route",
        title: "优先选择的安全路径",
        steps: [
          "在设备设置和制造商资料中确认本机具体型号、地区版本与系统支持 eSIM。",
          "确认设备无运营商锁，账号邮箱、密码和必要验证都可恢复。",
          "安装最新 giffgaff App，只在官方账号和官方帮助页指引下继续。",
          "接受新 eSIM 生效后旧 SIM 停止工作的后果，再开始切换。",
          "完成后先检查账号、线路和普通短信；有问题时按官方网络排查并联系官方 agent。",
        ],
        callout: "看见第三方教程能成功，不等于你的设备、账号或当前运营商规则同样适用。",
      },
      {
        id: "stop-signals",
        title: "遇到这些要求，应立即停止",
        items: [
          "要求上传二维码截图、完整激活字符串、账号 Cookie、密码或短信验证码。",
          "要求安装来源不明或被修改的运营商 App，并关闭系统安全检查。",
          "声称可以永久复制同一号码到多张卡，或保证绕过设备兼容限制。",
          "无法说明配置如何保存、谁能访问、何时删除以及失败后如何恢复。",
          "要求用虚假身份、地址或支付资料规避校验。",
        ],
      },
      {
        id: "decision",
        title: "官方路径不可用时怎么选",
        table: {
          headers: ["情况", "更稳妥的决定", "原因"],
          rows: [
            ["手机原生兼容且账号可恢复", "使用官方 App 路径", "支持边界、恢复入口和证据更清晰"],
            ["只有一台手机，兼容性未确认", "先保留实体 SIM", "避免旧 SIM 失效后失去账号验证链路"],
            ["设备不原生支持 eSIM", "继续使用实体 SIM 或更换兼容设备", "不需要暴露配置凭证或依赖未知工具"],
            ["已向第三方提交敏感信息", "停止继续操作并保护账号", "先改密码、检查账号状态，再联系官方支持"],
          ],
        },
      },
      {
        id: "evidence-policy",
        title: "本站以后如何评估第三方方案",
        paragraphs: [
          "第三方方案只能作为需要核查的线索，不会因为视频播放量、论坛回帖或单次成功截图就被标成推荐路径。",
          "若未来建立设备兼容矩阵，只收录可复现、注明设备具体型号、地区版本、系统版本、测试日期和失败边界的记录；任何包含账号或 eSIM 激活秘密的数据都不得进入公开资料库。",
        ],
      },
    ],
    faq: [
      {
        question: "可以把 eSIM 二维码截图发给客服代操作吗？",
        answer: "不要发送给本站客服或不明第三方。优先在本人兼容设备上走官方流程；官方支持需要什么信息，以其当次安全指引为准。",
      },
      {
        question: "手机不支持 eSIM，第三方写卡就是唯一选择吗？",
        answer: "不是。继续使用实体 SIM 或更换原生兼容设备通常能避免凭证泄露、工具供应链和恢复路径不明等额外风险。",
      },
      {
        question: "这个页面为什么不提供具体提取步骤？",
        answer: "因为提取、转发或上传激活凭证会扩大账号和通信配置泄露风险，也不属于本站能够验证并承诺的官方支持路径。",
      },
    ],
    sources: [official.esim, official.activation, official.terms],
    related: [
      { title: "giffgaff 官方 eSIM 转换检查", url: "/more/03-esim/" },
      { title: "giffgaff 国内激活流程", url: "/guides/2-activate/" },
      { title: "giffgaff 短信与验证码排查", url: "/guides/4-signal/" },
      commonRelated[0],
      commonRelated[2],
    ],
    revisions: [
      {
        date: PUBLISHED,
        note: "将原第三方二维码/写卡意图重构为安全边界页；仅保留官方 eSIM 路径、停止条件和恢复决策，不提供凭证提取或上传步骤。",
      },
    ],
  },

  "/guides/4-signal/": {
    primaryKeyword: "giffgaff 收不到验证码",
    title: "giffgaff 收不到验证码：从无信号到平台风控的排查树",
    description: "giffgaff 在中国收不到短信或某平台验证码时，先区分运营商故障与平台风控，再按账号、设备、选网和请求频率排查。",
    headline: "giffgaff 收不到验证码：先问“是所有短信，还是只有一个平台？”",
    deck: "本页不建立“必到平台名单”。号段政策、平台风控和漫游路由都会变化。",
    intent: "故障排查 / 诊断树",
    answer:
      "先测账号是否正常、是否有信号、能否收到普通短信或官方短信。如果所有短信都失败，先按 giffgaff 官方网络排查处理 SIM、设备、账号和漫游。如果普通短信能到，只有某个平台验证码不到，问题更可能在平台对号段、账号、IP、设备或请求频率的判定。本站和卖家都不能承诺第三方 OTP 必然送达。",
    author: EDITOR,
    reviewMethod: REVIEW_METHOD,
    dateModified: PUBLISHED,
    sections: [
      {
        id: "decision-tree",
        title: "第一步：把问题放到正确分支",
        table: {
          headers: ["可观测结果", "更可能的问题层", "下一步"],
          rows: [
            ["无信号，通话/短信/数据均不可用", "SIM、设备、账号、漫游或当地网络", "走官方 Network & Service Troubleshooting"],
            ["有信号，但任何短信都不到", "短信服务、选网、SIM 状态或设备", "检查账号、换机交叉测试、按官方指南重建网络连接"],
            ["普通短信和官方短信可到，某平台 OTP 不到", "平台风控或路由策略", "停止高频重试，核对号码格式、账号、IP/设备环境和平台支持"],
            ["曾经可到，快速重试后不到", "请求限频或风控", "停止请求，等待平台冷却时间，不反复切 IP 和设备"],
          ],
        },
      },
      {
        id: "carrier-layer",
        title: "运营商层：按不破坏现场的顺序排查",
        steps: [
          "登录 giffgaff 账号，确认号码仍在、SIM 未 inactive，并检查当前 Credit/plan 状态。",
          "重启手机，确认 SIM/eSIM 线路启用、漫游相关设置和短信权限。",
          "记录当前运营商名称与信号，不要立即重置全部网络设置。",
          "按 giffgaff 官方手动选网指南重新建立网络连接；不要根据旧教程强选一个永久固定的中国运营商。",
          "在另一台无锁手机中测试 SIM，或在当前手机中测试另一张可用 SIM，用交叉测试分离卡和设备问题。",
          "仍然所有短信失败时，把时间线、设备、运营商和测试结果交给 giffgaff 官方 agent。",
        ],
      },
      {
        id: "platform-layer",
        title: "平台层：为什么“卡正常”也可能收不到 OTP",
        paragraphs: [
          "验证码是由目标平台发起的交易型短信。平台可以根据号段、国家/地区、账号状态、IP、设备指纹、历史请求频率或其短信供应商路由决定是否发送。",
          "因此，“某人昨天成功”只是个案，不能升级为“该平台支持 giffgaff”。我们只能用标注时间、环境和样本量的状态板表达测试结果。",
        ],
        items: [
          "确认号码是按 +44 国际格式输入，不重复保留英国本地前导 0。",
          "确认平台明确接受英国号码，并检查是否提供语音、邮件或备用验证方式。",
          "保持账号资料、所在地、IP 和设备环境合理一致，不用虚假资料绕过风控。",
          "不连点验证码、不在多设备并发请求、不使用自动化收发短信。",
        ],
      },
      {
        id: "evidence-pack",
        title: "用一个“最小证据包”避免来回问话",
        items: [
          "时间、所在国家/城市、手机型号和系统版本。",
          "当前网络名称、信号截图和 SIM/eSIM 线路状态。",
          "账号是否可登录、号码是否可见，不提供密码和验证码。",
          "普通短信、giffgaff 官方短信和目标平台 OTP 三者分别的测试结果。",
          "目标平台显示的完整错误文案和已等待的时间。",
        ],
      },
      {
        id: "testing-board",
        title: "未来的兼容性状态板应该怎么写",
        paragraphs: [
          "后续可以建立验证码兼容性状态板，但不应设置永久的“支持/不支持”二元结论。每条记录至少要包含平台、日期、手机系统、国家/网络环境、测试次数、成功次数和可复现错误。",
          "只有真实完成的测试才能入库。没有原始记录的读者投稿只标为线索，不计入结论。",
        ],
      },
    ],
    faq: [
      {
        question: "普通短信能收，为什么验证码不到？",
        answer: "这说明 SIM 不是完全离线，但不能证明目标平台一定向该号段和当前账号环境发送 OTP。",
      },
      {
        question: "换一个 IP 就一定能收到吗？",
        answer: "不能保证。IP 只是可能的风控变量之一，频繁切换 IP、设备和重复请求还可能进一步提高风险。",
      },
    ],
    sources: [official.network, official.manualRoam, official.terms],
    related: [
      commonRelated[0],
      { title: "giffgaff 国内激活与失败排查", url: "/guides/2-activate/" },
      { title: "giffgaff 保号规则", url: "/guides/3-usage/" },
      commonRelated[2],
    ],
    revisions: [
      {
        date: PUBLISHED,
        note: "证据型版本全面重写；根据 2026-07-15 可访问的官方网络排查、手动选网和条款页复核。",
      },
    ],
  },

  "/answers/": {
    primaryKeyword: "giffgaff G0 G2 区别",
    title: "G0 与 G2：状态、账户控制权与风险边界",
    description: "解释 G0/G2 这组市场分类的来源、账户控制权与条款风险；不提供库存、报价或购买推荐。",
    headline: "G0 与 G2：先看来源、账户控制权与条款边界",
    deck: "G0/G2 是本站及部分市场资料使用的状态分类，不是 giffgaff 官方产品名称，也不代表运营商认可预激活、余额或账号交付方式。",
    intent: "风险解释 / 决策边界",
    answer:
      "G0 通常指由使用者按官方流程自行激活的新卡；G2 通常指卖家声称已做前置处理或带有某种账户状态的卡。两者都不是 giffgaff 官方产品名称。本站当前不提供库存、报价或购买建议；这里只解释来源、登记责任、账户控制权和条款风险，也不承诺任何平台验证码送达。",
    author: EDITOR,
    reviewMethod: REVIEW_METHOD,
    dateModified: PUBLISHED,
    sections: [
      {
        id: "definitions",
        title: "先把名词说清楚",
        paragraphs: [
          "在本站风险说明中，G0 通常表示由使用者按官方流程完成激活和首次账号设置的新卡；G2 只是部分市场资料对已做前置处理、或声称带有某种余额和号码状态的卡所用称呼。",
          "“通常”不代表任何具体交付状态，也不表示这种前置处理获得 giffgaff 认可。本站未核验当前商品、余额、库存或价格，因此不发布相关承诺。",
        ],
        callout: "G0/G2 不是 giffgaff 官方 SKU、plan 或账户等级。",
      },
      {
        id: "comparison",
        title: "核心对比：状态链路和新增风险",
        table: {
          headers: ["风险项", "所谓 G0 新卡", "所谓 G2 前置处理卡"],
          rows: [
            ["状态起点", "通常由使用者从官方激活流程建立状态链路", "已有前置处理，但具体步骤和责任可能无法独立核验"],
            ["必须核对", "激活入口、本人资料、账号恢复方式与首次入网状态", "来源、激活状态、登记责任、条款边界与买方控制权"],
            ["主要风险", "激活码、支付、网页、账号与 SIM swap 操作错误", "预处理不符合当前条款、登记资料不属于买方，或交付状态与声明不一致"],
            ["本站立场", "只解释官方流程和操作风险，不提供购买推荐", "证据和许可不足，销售与推荐保持关闭"],
            ["不会因此改变的事", "保号、漫游、平台验证码仍存在外部不确定性", "保号、漫游、平台验证码仍存在外部不确定性"],
          ],
        },
      },
      {
        id: "total-cost",
        title: "为什么本页不展示总成本或报价",
        paragraphs: [
          "总成本会随卡的真实状态、Credit/plan、物流、支付、漫游和维护动作变化。当前缺少可持续核验的供货、账户控制权与实时价格证据，因此不能把静态数字包装成可靠结论。",
          "只有品牌、交易和证据门禁全部通过后，本站才可能发布可复核的计算器；在此之前，本节只列出风险变量，不产生购买结果。",
        ],
        items: [
          "卡的真实激活状态与账户登记责任。",
          "官方流程当日要求的 Credit/plan 与付款条件。",
          "物流、失败重试、时间和售后边界。",
          "未来保号、漫游与账号维护的不确定成本。",
        ],
      },
      {
        id: "checkout-checklist",
        title: "接触第三方交付说法时要核验什么",
        items: [
          "当批卡到底是未激活、已激活，还是只做了某些前置处理。",
          "号码和账户当前登记在谁名下；买方是否能按 giffgaff 当前规则使用本人资料取得控制，不能接受他人身份或共享账号。",
          "若卖家称已激活或已预处理，依据哪条当前规则操作，是否涉及推广 Participant SIM、激活地点或个人使用限制。",
          "余额是精确值、范围，还是不承诺；以何时的账号截图为准。",
          "物流从哪里发、预计时间、丢件或外观损坏的处理规则。",
          "收货后无信号、账号无法登录或余额不符时，需要什么证据与多久内反馈。",
          "卖家能处理的是订单/交付问题，还是运营商账号问题；哪些必须转 giffgaff 官方 agent。",
        ],
      },
      {
        id: "recommendation",
        title: "当前结论：不做购买推荐",
        paragraphs: [
          "G0 让使用者从官方激活起点建立自己的状态链路，但仍有激活、支付和账号操作风险。所谓 G2 可能声称减少部分前置步骤，却新增来源、登记资料、条款适用与控制权风险。",
          "在书面品牌许可、供货证明、登记责任和账户控制权证据通过前，本站不恢复 G2 销售、推荐或购买入口。任何第三方无法说明这些边界时，都不应仅凭 G0/G2 标签作决定。",
        ],
      },
    ],
    faq: [
      {
        question: "G0/G2 是 giffgaff 官方分类吗？",
        answer: "不是。它们是本站及部分市场资料使用的状态分类，不能替代对来源、登记责任与账户控制权的核验。",
      },
      {
        question: "G2 是否保证某个平台验证码能到？",
        answer: "不保证。平台 OTP 还受号段、账号、IP、设备、请求频率和平台路由影响。",
      },
    ],
    sources: [official.activation, official.credit, official.deactivation, official.terms],
    related: [
      commonRelated[0],
      { title: "giffgaff 国内激活流程", url: "/guides/2-activate/" },
      { title: "giffgaff 保号规则", url: "/guides/3-usage/" },
      { title: "giffgaff 短信与信号排查", url: "/guides/4-signal/" },
      commonRelated[2],
    ],
    revisions: [
      {
        date: PUBLISHED,
        note: "改为纯风险解释；删除商品、库存和购买导向，并用官方激活、Credit、inactive 与条款页限定决策边界。",
      },
    ],
  },
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderList(items, ordered = false) {
  if (!items?.length) return "";
  const tag = ordered ? "ol" : "ul";
  return `<${tag}>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</${tag}>`;
}

function renderTable(table, fallbackCaption = "本节对照表") {
  if (!table) return "";
  const caption = table.caption || fallbackCaption;
  return `<div class="table-scroll" tabindex="0" role="region" aria-label="${escapeHtml(caption)}"><table><caption>${escapeHtml(caption)}</caption><thead><tr>${table.headers
    .map((header) => `<th scope="col">${escapeHtml(header)}</th>`)
    .join("")}</tr></thead><tbody>${table.rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell, index) =>
            index === 0
              ? `<th scope="row">${escapeHtml(cell)}</th>`
              : `<td>${escapeHtml(cell)}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("")}</tbody></table></div>`;
}

function renderSection(section) {
  return `<section id="${escapeHtml(section.id)}">
    <h2>${escapeHtml(section.title)}</h2>
    ${(section.paragraphs || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
    ${renderList(section.items)}
    ${renderList(section.steps, true)}
    ${renderTable(section.table, section.title)}
    ${section.callout ? `<p class="callout">${escapeHtml(section.callout)}</p>` : ""}
  </section>`;
}

function articleSchema(pathname, page) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${CANONICAL_ORIGIN}${pathname}#article`,
    mainEntityOfPage: `${CANONICAL_ORIGIN}${pathname}`,
    headline: page.headline,
    description: page.description,
    url: `${CANONICAL_ORIGIN}${pathname}`,
    inLanguage: "zh-CN",
    dateModified: page.dateModified,
    author: {
      "@type": "Organization",
      "@id": `${CANONICAL_ORIGIN}/#organization`,
      name: page.author,
      url: `${CANONICAL_ORIGIN}/`,
    },
    publisher: { "@id": `${CANONICAL_ORIGIN}/#organization` },
    isPartOf: { "@id": `${CANONICAL_ORIGIN}/#website` },
    about: {
      "@type": "Brand",
      "@id": "https://www.giffgaff.com/#brand",
      name: "giffgaff",
      url: "https://www.giffgaff.com/",
    },
    citation: page.sources.map(({ url }) => url),
  };
}

function breadcrumbTrail(pathname, page) {
  const items = [{ name: "首页", url: "/" }];
  if (pathname.startsWith("/guides/")) {
    items.push({ name: "教程", url: "/guides/" });
  } else if (pathname.startsWith("/more/")) {
    items.push({ name: "更多玩法", url: "/more/" });
  }
  items.push({ name: page.headline, url: pathname });
  return items;
}

function breadcrumbSchema(pathname, page) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbTrail(pathname, page).map(({ name, url }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: `${CANONICAL_ORIGIN}${url}`,
    })),
  };
}

function renderBreadcrumbs(pathname, page) {
  return breadcrumbTrail(pathname, page)
    .map(({ name, url }, index, items) =>
      index === items.length - 1
        ? `<span>${escapeHtml(page.primaryKeyword)}</span>`
        : `<a href="${escapeHtml(url)}">${escapeHtml(name)}</a><span>/</span>`,
    )
    .join("");
}

function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

const styles = `<style>
  :root { color-scheme: light; --ink:#122019; --muted:#536159; --green:#2f5e41; --line:#dce7df; --soft:#f3f8f2; --gold:#fff6dc; }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { margin:0; color:var(--ink); background:#fff; font-family:Inter,"Noto Sans SC","PingFang SC","Microsoft YaHei",system-ui,sans-serif; }
  a { color:var(--green); }
  .skip-link { position:fixed; left:16px; top:12px; z-index:10000; transform:translateY(-180%); border-radius:8px; background:#122019; padding:10px 14px; color:#fff; font-weight:800; }
  .skip-link:focus { transform:translateY(0); }
  .site-header { display:flex; align-items:center; justify-content:space-between; gap:20px; min-height:72px; padding:14px max(20px,calc((100vw - 1120px)/2)); border-bottom:1px solid var(--line); background:#fff; }
  .brand { display:flex; align-items:center; gap:10px; color:var(--ink); text-decoration:none; }
  .brand-mark { display:grid; place-items:center; width:38px; height:38px; border-radius:10px; background:var(--green); color:#fff; font-weight:900; }
  .brand small { display:block; color:var(--muted); }
  .site-header nav { display:flex; flex-wrap:wrap; gap:16px; }
  .site-header nav a { color:var(--ink); font-weight:700; text-decoration:none; }
  .hero { border-bottom:1px solid var(--line); background:linear-gradient(135deg,#f8fbf7 0%,#edf6ee 56%,var(--gold) 100%); }
  .hero-inner,.layout,.footer-inner { width:min(1120px,calc(100% - 32px)); margin:0 auto; }
  .hero-inner { padding:56px 0 40px; }
  .breadcrumbs { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:20px; color:var(--muted); font-size:14px; }
  .eyebrow { margin:0 0 10px; color:var(--green); font-size:13px; font-weight:900; letter-spacing:.09em; text-transform:uppercase; }
  h1 { max-width:900px; margin:0; font-size:clamp(34px,5vw,58px); line-height:1.1; letter-spacing:-.02em; }
  .deck { max-width:820px; margin:18px 0 0; color:var(--muted); font-size:18px; line-height:1.8; }
  .meta { display:flex; flex-wrap:wrap; gap:9px; margin-top:22px; }
  .meta span { border:1px solid rgba(47,94,65,.18); border-radius:999px; background:rgba(255,255,255,.8); padding:8px 11px; color:var(--green); font-size:14px; font-weight:800; }
  .layout { display:grid; grid-template-columns:240px minmax(0,1fr); gap:38px; padding:40px 0 72px; }
  .toc { position:sticky; top:18px; align-self:start; border:1px solid var(--line); border-radius:14px; padding:18px; background:#fff; }
  .toc strong { display:block; margin-bottom:9px; }
  .toc a { display:block; margin:9px 0; font-size:14px; line-height:1.45; text-decoration:none; }
  article { min-width:0; font-size:17px; line-height:1.85; }
  .answer { margin:0 0 28px; border:1px solid rgba(47,94,65,.2); border-radius:16px; background:var(--soft); padding:22px; }
  .answer strong { display:block; margin-bottom:8px; color:var(--green); font-size:20px; }
  article section { scroll-margin-top:20px; }
  h2 { margin:42px 0 14px; font-size:clamp(26px,3vw,36px); line-height:1.25; }
  h3 { margin:26px 0 8px; font-size:22px; }
  p { margin:12px 0; }
  li { margin:8px 0; }
  .callout { border-left:4px solid var(--green); background:var(--soft); padding:14px 16px; color:var(--green); font-weight:800; }
  .table-scroll { overflow-x:auto; margin:18px 0; }
  .table-scroll:focus { outline:3px solid #2f5e41; outline-offset:3px; }
  table { width:100%; min-width:680px; border-collapse:collapse; border:1px solid var(--line); }
  caption { padding:10px 0; color:var(--muted); font-weight:800; text-align:left; }
  th,td { border-bottom:1px solid var(--line); padding:12px 14px; text-align:left; vertical-align:top; }
  thead th { background:var(--soft); color:var(--green); }
  tbody th { width:24%; background:#fbfdfb; }
  .trust-box,.sources,.related,.revisions,.faq { margin-top:42px; border-top:1px solid var(--line); padding-top:10px; }
  .trust-box { border:1px solid var(--line); border-radius:14px; background:#fbfdfb; padding:20px; }
  .source-item { margin:14px 0; padding:16px; border:1px solid var(--line); border-radius:12px; }
  .source-item a { font-weight:900; }
  .source-item p { margin:5px 0 0; color:var(--muted); font-size:15px; }
  .related-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
  .related-grid a { display:block; border:1px solid var(--line); border-radius:12px; padding:14px; font-weight:800; text-decoration:none; }
  .faq details { border-bottom:1px solid var(--line); padding:14px 0; }
  .faq summary { cursor:pointer; font-weight:900; }
  footer { border-top:1px solid var(--line); background:#f8faf8; }
  .footer-inner { padding:28px 0; color:var(--muted); line-height:1.7; }
  @media (max-width:800px) { .site-header { align-items:flex-start; flex-direction:column; } .layout { grid-template-columns:1fr; } .toc { position:static; } .related-grid { grid-template-columns:1fr; } }
</style>`;

export function renderTutorialPage(
  pathname,
  { articleAddon = "", headAddon = "" } = {},
) {
  const page = TUTORIAL_PAGES[pathname];
  if (!page) return null;
  const canonical = `${CANONICAL_ORIGIN}${pathname}`;
  const ogImage = ogImageUrlFor(CANONICAL_ORIGIN, pathname);
  const schema = [articleSchema(pathname, page), breadcrumbSchema(pathname, page)];

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(page.title)} · getgiffgaff</title>
  <meta name="description" content="${escapeHtml(page.description)}">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="article">
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
  <link rel="icon" href="/favicon.svg">
  ${headAddon}
  ${styles}
  ${schema.map((entry) => `<script type="application/ld+json">${jsonLd(entry)}</script>`).join("\n  ")}
</head>
<body>
  <a class="skip-link" href="#main-content">跳到主要内容</a>
  <header class="site-header">
    <a class="brand" href="/" aria-label="getgiffgaff 首页"><span class="brand-mark">GG</span><span><strong>getgiffgaff</strong><small>独立第三方使用与风险信息</small></span></a>
    <nav aria-label="主导航"><a href="/guides/6-pitfalls/">使用总览</a><a href="/guides/">教程</a><a href="/research/">资料库</a><a href="/contact/">联系</a></nav>
  </header>
  <main id="main-content" tabindex="-1">
    <section class="hero">
      <div class="hero-inner">
        <nav class="breadcrumbs" aria-label="面包屑">${renderBreadcrumbs(pathname, page)}</nav>
        <p class="eyebrow">Evidence-led guide</p>
        <h1>${escapeHtml(page.headline)}</h1>
        <p class="deck">${escapeHtml(page.deck)}</p>
        <div class="meta"><span>搜索意图：${escapeHtml(page.intent)}</span><span>证据型版本：${page.dateModified}</span><span>规则可能变化，请操作前复核</span></div>
      </div>
    </section>
    <div class="layout">
      <aside class="toc" aria-label="本页目录"><strong>本页目录</strong>${page.sections
        .map((section) => `<a href="#${escapeHtml(section.id)}">${escapeHtml(section.title)}</a>`)
        .join("")}<a href="#official-sources">官方来源</a><a href="#revision-log">修订记录</a></aside>
      <article>
        <div class="answer"><strong>直接答案</strong><p>${escapeHtml(page.answer)}</p></div>
        <div class="trust-box"><strong>编辑责任与复核方法</strong><p>编辑责任主体：${escapeHtml(page.author)}；复核方法：${escapeHtml(page.reviewMethod)}。当前未公开个人作者或复核者，本站不使用虚构署名；本文未经 giffgaff Limited 审核或背书。发现规则变化可<a href="/contact/">提交纠错</a>。</p></div>
        ${page.sections.map(renderSection).join("\n")}
        ${articleAddon}
        <section class="faq" id="faq"><h2>常见问题</h2>${page.faq
          .map(({ question, answer }) => `<details><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`)
          .join("")}</section>
        <section class="sources" id="official-sources"><h2>官方来源</h2><p>下列页面用于核对规则。界面、价格、时间窗和流程可能更新，操作当日请再打开原页。</p>${page.sources
          .map(({ title, url, scope }) => `<div class="source-item"><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a><p>${escapeHtml(scope)}</p></div>`)
          .join("")}</section>
        <section class="related"><h2>继续阅读</h2><div class="related-grid">${page.related
          .map(({ title, url }) => `<a href="${escapeHtml(url)}">${escapeHtml(title)}</a>`)
          .join("")}</div></section>
        <section class="revisions" id="revision-log"><h2>修订记录</h2>${renderList(
          page.revisions.map(({ date, note }) => `${date}：${note}`),
        )}</section>
      </article>
    </div>
  </main>
  <footer><div class="footer-inner"><strong>getgiffgaff 是独立第三方服务站，不是 giffgaff Limited 官方网站、官方客服或授权代表。</strong><p>本页不承诺号码永久有效、实时库存、静态价格或第三方平台验证码送达。运营商规则以操作当日官方页面为准。</p></div></footer>
</body>
</html>`;
}
