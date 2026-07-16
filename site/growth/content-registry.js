const REVIEWED_AT = "2026-07-16";
const EXPIRES_AT = "2026-08-15";

const official = Object.freeze({
  activation: {
    label: "giffgaff 官方 SIM 激活说明",
    url: "https://help.giffgaff.com/en/articles/240393-activating-your-giffgaff-sim",
  },
  credit: {
    label: "giffgaff 官方 Credit 说明",
    url: "https://help.giffgaff.com/en/articles/240847-everything-to-know-about-credit",
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
  roamingChina: {
    label: "giffgaff 中国漫游费率",
    url: "https://www.giffgaff.com/roaming/china",
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
});

function page(frontmatter) {
  return Object.freeze({
    updatedAt: REVIEWED_AT,
    reviewedAt: REVIEWED_AT,
    author: Object.freeze({ type: "Organization", name: "getgiffgaff" }),
    ...frontmatter,
  });
}

export const GROWTH_PAGES = Object.freeze([
  page({
    path: "/guides/7-arrival-checklist/",
    indexPolicy: "index",
    schemaType: "Article",
    intent: "giffgaff G0/G2 收卡验收",
    title: "giffgaff 收卡验收清单｜G0/G2 到手检查与售后",
    description:
      "国内收到 giffgaff G0/G2 后，按包装、卡状态、账号控制、余额、网络和普通短信逐项验收；附失败分流、商品页与微信小玉售后入口。",
    h1: "giffgaff G0/G2 收卡验收清单",
    deck: "先确认卡片和订单交付是否一致，再进入激活、充值或平台验证。",
    directAnswer:
      "收到卡后先别急着充值或绑定平台。依次核对外观、卡状态、账号控制权、余额、普通短信和网络；任一信息对不上，先保留脱敏证据并联系小玉处理。",
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
        html: `<ol class="growth-steps"><li><strong>核对包装：</strong>卡板、SIM、数量和订单 SKU 一致。</li><li><strong>留下脱敏证据：</strong>拍摄外观和异常位置，不公开完整识别码。</li><li><strong>判断卡状态：</strong>G0 重点核对激活码；不要在已有号码账号里误触 SIM swap。</li><li><strong>确认交付控制：</strong>G2 是本站库存分类，不是运营商官方产品名；只按本批订单承诺核对。</li><li><strong>核对余额：</strong>只以官方 Dashboard 或 App 显示为依据。</li><li><strong>测试网络：</strong>记录城市、设备、系统、自动或手动选网及结果。</li><li><strong>测试普通短信：</strong>先确认普通短信，再测试具体平台；普通短信成功不代表 OTP 必达。</li></ol>`,
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
    sources: [official.activation, official.credit, official.network, official.lostSim],
    relatedRoutes: [
      { label: "G0 与 G2 怎么选", href: "/answers/" },
      { label: "国内激活教程", href: "/guides/2-activate/" },
      { label: "无信号与短信排查", href: "/guides/4-signal/" },
      { label: "查看 G0 新卡", href: "/shop/giffgaff-g0/" },
      { label: "查看 G2 有余额卡", href: "/shop/giffgaff-g2/" },
    ],
    commerceTarget: { label: "微信联系小玉处理订单与售后", href: "/contact/" },
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
      "短期旅行先看停留天数和流量，留学生再看英国本地覆盖、续费与合约，跨境保号则重点看维护动作和漫游成本。giffgaff 只是候选之一，不适合就不要硬选。",
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
        html: `<p>giffgaff 使用 O2 网络，但覆盖仍要按具体邮编和设备核对。适合希望使用预付费方式、能够自己管理账号和维护动作的人；如果你需要确定性的中国境内信号、特定平台验证码保证或人工代管账号，它并不是合适选择。</p><p>Ofcom 的覆盖工具用于比较预测，不是室内、地铁或每台设备的服务承诺。</p>`,
      },
      {
        id: "sim-or-esim",
        title: "实体 SIM 与 eSIM 怎么选",
        html: `<p>实体卡适合需要可见卡片、设备不支持 eSIM 或希望在多台兼容设备间人工换卡的人。eSIM 需要设备原生支持、无网络锁并能使用最新 giffgaff App；切换后旧 SIM 会停止工作。</p>`,
      },
      {
        id: "cost",
        title: "不要只看月费：完整成本清单",
        html: `<ul class="growth-list"><li>卡片、国内或英国寄送与可能的服务费用。</li><li>首次 Credit 或套餐、后续续费和支付手续费。</li><li>中国漫游的短信、通话和后台数据成本。</li><li>激活、排障和保号提醒所需时间。</li><li>设备兼容、账号恢复和换卡失败的风险缓冲。</li></ul><p>官方境外寄送国家、套餐和 eSIM 条件可能变化；超过核验周期时只使用下方官方入口，不依赖静态结论。</p>`,
      },
    ],
    sources: [official.ofcomCoverage, official.plans, official.simOrder, official.esim, official.roamingChina, official.smsPolicy],
    relatedRoutes: [
      { label: "比较 G0 与 G2", href: "/answers/" },
      { label: "查看当前手机卡", href: "/shop/" },
      { label: "购买与发货流程", href: "/guides/1-order/" },
      { label: "收卡验收清单", href: "/guides/7-arrival-checklist/" },
    ],
    commerceTarget: { label: "微信咨询小玉确认场景与库存", href: "/contact/" },
  }),
  page({
    path: "/tools/keep-number-reminder/",
    indexPolicy: "index",
    schemaType: "WebApplication",
    intent: "giffgaff 保号提醒日期计算",
    title: "giffgaff 保号提醒工具｜本地生成第 5 个月提醒",
    description:
      "输入最近一次有效动作日期，在浏览器本地生成第 5 个月提醒并导出 .ics；不上传号码、账号或日期，不承诺永久保号。",
    h1: "giffgaff 保号提醒：生成本地日历",
    deck: "日期只在当前浏览器内计算，不发送到本站服务器。",
    directAnswer:
      "输入最近一次可验证的有效动作日期，工具会在本机生成第5个月操作提醒。日期不会上传，提醒也不代表运营商对号码状态或永久保号作出保证。",
    tool: "keep-number",
    sections: [
      {
        id: "rule",
        title: "当前官方规则与本站缓冲提醒",
        html: `<p>官方当前列出的保活动作包括主动通话、主动 SMS/MMS、移动数据连接、购买 Airtime Credit 或 plan。单纯接收短信不在列表中。<a href="${official.inactive.url}" target="_blank" rel="noopener noreferrer">${official.inactive.label}</a>（核验 ${REVIEWED_AT}）。</p><p>第 5 个月是本站给异常排查预留时间的建议，不是官方把周期改成了 5 个月。</p>`,
      },
      {
        id: "tool",
        title: "输入最近一次有效动作",
        html: `<div class="growth-tool" data-tool="keep-number" data-expires="${EXPIRES_AT}" role="group" aria-label="本地保号提醒工具"><label>最近一次可验证动作日期<input type="date" name="last-action" required></label><button class="btn btn-primary" type="button" data-calculate>生成第 5 个月提醒</button><output aria-live="polite"></output><button class="btn btn-secondary" type="button" data-download-ics disabled>下载 .ics 日历</button></div>`,
      },
      {
        id: "privacy",
        title: "日历里不会写入号码或账号",
        html: `<p>导出的日历只包含提醒日期、规则复核提示和官方来源，不包含号码、邮箱、用户名、订单信息或卡片识别码。工具不使用浏览器长期存储。</p>`,
      },
      {
        id: "expired",
        title: "超过周期或号码已停用怎么办",
        html: `<p>不要把计算日期当成号码仍然有效的证明。立即登录官方账号检查号码、余额和服务状态；已经停用时按官方页面的当前处理窗口联系官方支持。</p>`,
      },
    ],
    sources: [official.inactive, official.credit],
    relatedRoutes: [
      { label: "保号与有效动作教程", href: "/guides/3-usage/" },
      { label: "自助充值问答", href: "/qa/02-topup/" },
      { label: "中国漫游成本工具", href: "/tools/china-roaming-cost/" },
      { label: "需要备用卡时查看商城", href: "/shop/" },
    ],
    commerceTarget: { label: "微信联系小玉处理订单问题", href: "/contact/" },
  }),
  page({
    path: "/tools/china-roaming-cost/",
    indexPolicy: "index",
    schemaType: "WebApplication",
    intent: "giffgaff 中国漫游费用试算",
    title: "giffgaff 中国漫游费用计算器｜短信、通话与流量",
    description:
      "按 giffgaff 当前中国漫游费率试算短信、通话和流量成本；显示来源与核验日，费率过期自动停止给出总价。",
    h1: "giffgaff 中国漫游费用计算器",
    deck: `费率核验日期 ${REVIEWED_AT}，到 ${EXPIRES_AT} 前用于估算；实际扣费以运营商账单为准。`,
    directAnswer:
      "输入短信、通话和流量用量，即可按当前中国漫游费率试算。费率过期或来源失效时，工具会停止给出总价并要求先打开官方页面复核。",
    tool: "roaming-cost",
    sections: [
      {
        id: "status",
        title: "当前中国漫游费率核验状态",
        html: `<div class="growth-rate-status"><strong>已核验：${REVIEWED_AT}</strong><span>失效日：${EXPIRES_AT}</span><p>当前公开页显示：数据 20p/MB、拨打电话 £1/分钟、接听 £1/分钟、发短信 30p、收短信免费。通话计费单位见<a href="${official.roamingChina.url}" target="_blank" rel="noopener noreferrer">${official.roamingChina.label}</a>（核验 ${REVIEWED_AT}）。</p></div>`,
      },
      {
        id: "tool",
        title: "输入预计用量",
        html: `<div class="growth-tool" data-tool="roaming-cost" data-rate-per-megabyte="0.2" data-rate-per-sms="0.3" data-rate-per-outgoing-minute="1" data-rate-per-incoming-minute="1" data-expires="${EXPIRES_AT}" role="group" aria-label="中国漫游费用试算工具"><label>预计流量（MB）<input type="number" name="megabytes" min="0" step="0.01" value="0" required></label><label>预计发出短信（条）<input type="number" name="sms" min="0" step="1" value="0" required></label><label>预计拨打电话（分钟）<input type="number" name="outgoing-minutes" min="0" step="0.01" value="0" required></label><label>预计接听电话（分钟）<input type="number" name="incoming-minutes" min="0" step="0.01" value="0" required></label><button class="btn btn-primary" type="button" data-calculate>计算估算费用</button><output aria-live="polite"></output></div>`,
      },
      {
        id: "method",
        title: "通话和流量计费单位说明",
        html: `<p>简化计算器把你输入的通话分钟数按整段预计时间估算，不能替代官方对最低计费时长、按秒或按分钟取整的账单逻辑。后台同步可能在你没有主动打开网页时产生数据。</p><p class="growth-warning">如果费率超过失效日，数值结果会关闭。先打开官方中国漫游页复核，再重新发布配置。</p>`,
      },
      {
        id: "boundaries",
        title: "漫游动作、保号与 OTP 是三件事",
        html: `<p>产生漫游费用不自动证明特定平台 OTP 会到达；收到 OTP 也不等于完成官方列明的保活动作。分别记录号码状态、普通短信基线和平台结果。</p>`,
      },
    ],
    sources: [official.roamingChina, official.inactive, official.network],
    relatedRoutes: [
      { label: "中国漫游与流量教程", href: "/guides/5-travel-data/" },
      { label: "网络和短信排查", href: "/guides/4-signal/" },
      { label: "生成保号提醒", href: "/tools/keep-number-reminder/" },
      { label: "需要实体备用卡", href: "/shop/" },
    ],
    commerceTarget: { label: "微信咨询小玉确认当前卡片", href: "/contact/" },
  }),
  page({
    path: "/tools/g0-g2-total-cost/",
    indexPolicy: "index",
    schemaType: "WebApplication",
    intent: "G0/G2 用户输入总成本",
    title: "G0/G2 总成本计算器｜卡价、充值、时间与维护费用",
    description:
      "自行输入 G0/G2 卡价、运费、首次充值和预计使用成本，分别计算现金支出；无当前商品证据时不填默认价格。",
    h1: "giffgaff G0/G2 总成本计算器",
    deck: "G0/G2 是本站库存分类，计算结果完全取决于你的输入，不代替卡状态确认。",
    directAnswer:
      "这个工具只比较你输入的卡价、运费、首次充值和预计使用成本，不替你判断哪张卡一定更好。商品默认值没有当前证据时保持空白，结果也不代表账号或验证码保证。",
    tool: "total-cost",
    sections: [
      {
        id: "scope",
        title: "计算器能比较什么、不能判断什么",
        html: `<p>计算器只处理金额：卡价、国内运费、首次充值、可用余额和预计使用支出。它不能判断账号控制权、激活成功率、平台 OTP 或未来号码状态。</p>`,
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
        html: `<p>结果只表述为“按本次输入，现金支出为……”。可用英镑余额单独展示，不擅自按未知汇率抵扣人民币成本。比较 G0 与 G2 时分别计算，再检查差额来自卡价、运费、首次充值还是后续支出。</p>`,
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
      { label: "查看 G0 商品", href: "/shop/giffgaff-g0/" },
      { label: "查看 G2 商品", href: "/shop/giffgaff-g2/" },
    ],
    commerceTarget: { label: "微信联系小玉确认本批状态", href: "/contact/" },
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
    commerceTarget: { label: "微信联系小玉确认实体卡", href: "/contact/" },
  }),
  page({
    path: "/research/china-network-sms/",
    indexPolicy: "noindex",
    schemaType: "CollectionPage",
    intent: "giffgaff 中国网络与普通短信实测",
    title: "giffgaff 中国网络与短信实测｜方法与数据门槛",
    description:
      "按城市、设备、系统、SIM 形态和选网方式展示近期网络与普通短信结果；样本不足时只公开方法，不承诺永久覆盖。",
    h1: "giffgaff 中国网络与短信实测矩阵",
    deck: "成功和失败都要记录；旧样本不参与“近期”聚合。",
    directAnswer:
      "本页只展示特定城市、设备、系统和选网环境下的近期实测，不承诺中国境内永久有信号或短信必达。样本不足时只公开方法，并明确标记“证据不足”。",
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
    commerceTarget: { label: "微信联系小玉整理排查信息", href: "/contact/" },
  }),
  page({
    path: "/research/otp-status/",
    indexPolicy: "noindex",
    schemaType: "CollectionPage",
    intent: "giffgaff 平台 OTP 近期样本",
    title: "giffgaff 验证码状态板｜近期实测与失败边界",
    description:
      "展示带普通短信基线的平台 OTP 近期样本、环境、等待时间和失败类型；不提供接码、绕过验证或永久兼容承诺。",
    h1: "giffgaff OTP 验证码近期状态板",
    deck: "平台风控和网络状态必须分开判断，不能把个别成功写成永久兼容。",
    directAnswer:
      "验证码是否送达同时受平台风控、账号状态、设备和网络影响。本页只展示带普通短信基线的近期样本，不提供接码、绕过验证或“某平台永久可用”的保证。",
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
    commerceTarget: { label: "微信联系小玉整理排查信息", href: "/contact/" },
  }),
]);

export function growthPageFor(pathname) {
  return GROWTH_PAGES.find((entry) => entry.path === pathname) || null;
}
