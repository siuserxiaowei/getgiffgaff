# 增长恢复运营手册（D1–D28）

> 状态：`prepared + partially observed`。本文把已完成的后台读取与尚需人工执行的动作分开。2026-07-19 的账号后台数据是带时间范围的现场快照，不等于长期趋势，也不证明咨询已经恢复。仓库工具只生成本地链接、台账和建议；不会配置账号、发送外联、创建广告、花钱、提交 URL 或发起支付。

## 1. 2026-07-19 已读取的搜索与外链基线

### Google Search Console

现场核验状态：域资源已接通。sitemap 显示成功、39 个 URL、最后读取为 2026-07-18；索引报告仍为 `processing`。

| GSC 时间窗 | Clicks | Impressions | CTR | Average position |
| --- | ---: | ---: | ---: | ---: |
| 后台所选 3 个月，2026-07-19 读取 | 1 | 6 | 16.7% | 21.8 |

这组数据说明当前可见 Google 自然搜索量很小，不能解释过去“每天十几个咨询”，也不能用 1 次点击评价页面质量。原始后台数据只能由有权限账号复核；仓库中的只读权限与导出规范见 [`../research/seo-geo-baseline-2026-07-17/gsc-readonly-handoff.md`](../research/seo-geo-baseline-2026-07-17/gsc-readonly-handoff.md)。

### Bing Webmaster Tools

现场核验状态：站点已接通。sitemap 显示成功、39 个 URL、最后抓取为 2026-07-17、0 error / 0 warning。

| BWT 时间窗 | Clicks | Impressions | CTR | Average position |
| --- | ---: | ---: | ---: | ---: |
| Web + Chat，2026-07-12 至 2026-07-18 | 75 | 918 | 8.17% | 5.9 |

该窗口只有两天出现数据：2026-07-16 为 30 clicks / 446 impressions；2026-07-17 为 45 / 472。因而它证明 Bing 目前是实际发现渠道，但不能建立周趋势、归因到咨询或证明咨询恢复。

BWT 的 Web 页面表现场样本：

| 页面 | Impressions | Clicks |
| --- | ---: | ---: |
| `/guides/6-pitfalls/` | 683 | 50 |
| `/guides/3-app/` | 77 | 5 |
| `/qa/07-voicemail-switch/` | 21 | 5 |
| `/shop/` | 11 | 4 |

因此第一批页面工作应从 `/guides/6-pitfalls/` 开始：保留匹配当前意图的主体内容，核对其查询词、设备、国家和 CTA 行为，再决定标题或 CTA 实验；不要因短窗口数据大改页面。

Bing AI Performance 在 2026-07-19 读取的 3 个月窗口为 2026-04-19 至 2026-07-18：界面显示 `Total Citations = 44`、`Avg Cited Pages = 5`。查询样本“gg卡激活”为 7 citations / 17.95% share，“gg卡”为 5 / 100%。页面样本为 `/guides/6-pitfalls/` 27、`www` 主机的 `/qa/07-voicemail-switch/` 8、`/guides/3-app/` 6、`/guides/2-activate/` 1。这里按界面原名保留指标；它是 Microsoft Copilots 及 partners 的 citation sample，可作为内容发现线索继续处理，但不是站点访问、咨询、收入、排名保证或完整 AI 平台覆盖。

Bing Site Scan 已在 2026-07-19 创建并排队：`getgiffgaff-critical-pages-2026-07-19`，Website scope，根 URL `https://getgiffgaff.com/`，limit 10 pages，email updates 未勾选，现场状态为 `Queued`。它是异步任务，尚无完成结果，不能写成 0 errors。IndexNow Insights UI 当时一度回退营销页，后台提交状态未能可靠读取；本轮不据此声称已经提交。

### Bing 外链快照

BWT 在 2026-07-19 显示 2 referring domains、201 referring pages、4 anchors：`nano-banana.lol` 196 页、`stackmemoai.com` 5 页。抽样页面显示前者从大量 AI/ChatGPT/Cursor 页面，以“海外手机卡 / giffgaff”指向首页；后者以“购买入口”指向无尾斜杠的 `/shop`。

这是高度集中且大量主题不相关的样本，不是健康外链证明。201 个 referring pages 不能替代 referring-domain 多样性、相关性和编辑独立性。后续只争取相关编辑、教育或真实资源页引用，不复制站群、批量目录或重复锚文本模式。外链数据仅来自 BWT 当前索引快照；它不是完整 Web 图谱。

## 2. D0：先完成真机和数据准备

1. 记录正式发布完成时间。D1 是其后的首个完整 UTC 自然日，发布当天残缺时段不进入 D1。
2. 在 iOS、Android 上分别从微信内外打开微信、Telegram 链接并扫码；由渠道所有者在接收端确认测试消息实际到达。结果填入脱敏 notes，只写故障类型和时段，不写账号、手机号或聊天内容。
3. 生成 28 天空白台账：

   ```bash
   node scripts/growth-ops.mjs init-ledger \
     --start-date YYYY-MM-DD \
     --days 28 \
     --out /安全的本地路径/getgiffgaff-daily.csv
   ```

   建议把真实台账保存在仓库外。它只包含聚合计数，不保存姓名、联系方式、完整订单号、消息内容或支付信息。
4. 确认生产 Analytics Engine 回读已经可用。查询口径、采样恢复和 canary 排除规则以 [`analytics-funnel.md`](analytics-funnel.md) 为准。

## 3. 分发链接：固定 UTM，不写个人信息

所有链接只允许一个 `utm_source`。不要加群名、人名、合作方名称、手机号、微信号、文案版本或 `utm_campaign/content/term/medium`。这是渠道级归因，不是人员追踪。

```bash
node scripts/growth-ops.mjs utm-matrix --path /guides/6-pitfalls/
node scripts/growth-ops.mjs utm --source wechat_group --path /guides/6-pitfalls/
```

| 发放场景 | CLI label | 固定 `utm_source` |
| --- | --- | --- |
| 微信社群 | `wechat_group` | `dist_wechat_group` |
| 小红书 | `xiaohongshu` | `dist_xiaohongshu` |
| 微信公众号 | `wechat_official` | `dist_wechat_official` |
| 合作方 | `partner` | `dist_partner` |
| 私聊分享 | `private_share` | `dist_private_share` |
| Google Ads（只有门禁通过后） | `google_ads` | `paid_google` |
| Microsoft Ads（只有门禁通过后） | `microsoft_ads` | `paid_microsoft` |

同一类渠道共用同一个值。若要区分具体群或合作方，只在安全的本地运营台账里做聚合批次记录；不要把身份写入 URL。前端只会接纳这些固定值，并在同一标签页内跨页保留；生产发布和 Analytics Engine 回读完成前，不能宣称归因已经生效。

## 4. 每日数据口径

每天按 UTC 日期填一行全站聚合值。当前 Analytics Engine 的页面事件只保留粗粒度或固定 source，人工收到消息无法可靠逐条回连到事件，因此台账不伪造 source 级端到端归因；source/page 拆分只在单独的 Analytics SQL 诊断中查看。网站端 `page_views`、`commerce_clicks`、`contact_clicks` 是采样加权事件数（可能为小数）；没有用户/会话 ID，不能叫独立访客或用户漏斗。特别是 `commerce_click` 混合多个阶段（弹窗打开、内部联系导航、选卡/教程与快团团引导），不能作为 `contact_click` 的稳定漏斗分母；三类浏览器事件只作独立趋势信号。运营端人工填：

- `received_messages`：客服端实际收到的新咨询线程数；同一线程当天重复消息只计一次。
- `qualified_consultations`：需求、地区/使用场景和可服务性足以继续报价的线程数。
- `quotes_sent`：已提供明确 SKU/方案、价格或下单链接的线程数。
- `payments`：渠道后台可核验的成功付款笔数；点击/回跳不算。
- `revenue_cny`：已成功付款收入的当日聚合金额。
- `variable_cost_cny`：商品、发货、渠道手续费等随订单发生的聚合成本；口径固定后不要中途改变。
- `gross_profit_cny = revenue_cny - variable_cost_cny`，亏损日可以为负数。

空白表示未知或未填，绝不能用 0 代替。工具会在一行开始填计数后要求七个计数字段全部存在，但不会验证 Analytics Engine 与客服后台的真实性。

## 5. D7 与 D28 自动分流

```bash
node scripts/growth-ops.mjs report \
  --file /安全的本地路径/getgiffgaff-daily.csv \
  --window 7 \
  --as-of YYYY-MM-DD

node scripts/growth-ops.mjs report \
  --file /安全的本地路径/getgiffgaff-daily.csv \
  --window 28 \
  --as-of YYYY-MM-DD
```

不足 7/28 个连续、完整、紧邻 `--as-of` 的 UTC 自然日时，结果必须为 `HOLD`，CLI 返回退出码 `3`。工具默认只保留下列内部触发线：日均 page view 事件 10，以及至少 10 条实际消息后 payment/message 10%。`commerce_clicks` 和 `contact_clicks` 只输出日均独立趋势量，不再计算 commerce/page view、contact/commerce 或 message/contact 顺序漏斗阈值。这些阈值是内部诊断信号，不是行业基准、真实用户转化率或因果证明。

| 首个异常信号 | 分流动作 |
| --- | --- |
| 日均 page view 事件低 | 加强带 UTM 的现有渠道分发，优先优化已有 Bing 曝光页；并行人工核验少量相关编辑型外链 |
| 浏览器事件量变化 | 按 page/source 分别查看 page view、commerce click、contact click 趋势，结合同期页面改动解释；不串成用户级漏斗 |
| 实际消息为 0 或异常下降 | 真机修复微信/Telegram 拉起、账号可用性和收件链路 |
| 消息多、付款低 | 先核对价格、SKU、库存、信任、退款/物流；支付门禁全通过后才评估托管结账 |

D7 用于找断点，不用来宣布恢复。D28 才建立首版基线。用 Analytics 端的 source/landing-page 事件拆分与人工端的全站合格咨询、毛利并排复盘；除非未来增加经过隐私审核的安全关联机制，否则不要声称逐 source 成交归因。任何代码发布、账号故障、节假日或推广动作都要写入 notes，防止把干预误当自然趋势。

## 6. GSC 与 Bing 只读接入/复核清单

### GSC

- [x] 2026-07-19 现场确认域资源可访问；此勾选只描述当次读取。
- [ ] 使用独立 service account，仅授予 Full user（非 Owner），客户端只请求 `webmasters.readonly`。
- [ ] 只允许 `sites.list`、`searchanalytics.query`、`sitemaps.list`、`urlInspection.index.inspect`。
- [ ] 28/90 天 query、page、query+page 导出使用相同 final-data 截止日并保存请求元数据。
- [ ] 对当前 sitemap 的 canonical URL 执行只读 indexed-version inspection；不请求索引。
- [ ] 凭证和原始导出只放仓库外 owner-only 目录；endpoint audit 中不能出现写方法。

### Bing

- [x] 2026-07-19 现场确认站点、sitemap、Search Performance 和 Backlinks 可读取。
- [ ] 由账号所有者确认最小权限的 API key/账户成员；凭证不进入 Git、聊天或日志。
- [ ] 导出 Web 与 Chat 的日期、页面、查询、国家/设备（若后台提供）并保留时间窗和筛选条件。
- [ ] 读取 sitemap、URL inspection、crawl/site scan 和 backlink insights；任何“未发现”需区分尚在处理、无数据和真正为 0。
- [ ] 等待已排队 Site Scan 完成后记录状态和真实错误；排队状态不能预填结果。
- [ ] IndexNow 只在真实变更 URL 集合明确时另行执行；Insights 不可访问时记录 `unverified`，不猜测提交状态。

## 7. 7 天与 28 天人工节奏

| 时间 | 操作 | 交付 |
| --- | --- | --- |
| 每日 | 导出事件、填实际消息/合格咨询/报价/付款/毛利，记录故障和分发 | 当日完整 UTC 行 |
| D3 | 提前发现收件链路为 0、账号不可用等硬故障；不算趋势 | 故障修复记录 |
| D7 | 运行 7 日报告；只选择首个漏斗断点行动 | 一条主要假设 + 一项 7 日实验 |
| D8–D14 | 保持其他因素稳定，执行页面/分发/链路实验 | source/page 对照记录 |
| D14 | 人工核验 3–5 个外链机会，只有政策和资产通过才进入个性化预询 | 研究记录；不自动发送 |
| D28 | 运行 28 日报告，按合格咨询成本与毛利决定扩大、停止或继续观察 | 首版渠道经济性基线 |

关联工作流：编辑型外链见 [`../growth/editorial-outreach-workflow.md`](../growth/editorial-outreach-workflow.md)，广告见 [`advertising-experiment-gate.md`](advertising-experiment-gate.md)，支付见 [`payment-readiness-gate.md`](payment-readiness-gate.md)。
