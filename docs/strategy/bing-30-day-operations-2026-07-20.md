# Bing 30 天无障碍增长操作手册（2026-07-20）

适用站点：`https://getgiffgaff.com/`

状态：`manual operations plan`。本文把已有 Bing 证据转成 30 天人工操作顺序，不登录账户、不提交 URL、不创建或启用广告、不授权花费，也不预测流量、咨询或收入。

## 1. 无障碍执行约定

这份手册按屏幕阅读器和纯键盘使用设计：

1. 所有判断都依赖文字字段、数字、状态词和日期，不依赖颜色、折线形状、悬停提示或图标。
2. 遇到图表时，先找 `Table`、`View data`、`Download`、`Export` 或同义文字入口；没有表格就把该项记为 `UNAVAILABLE`，不要凭图形估读。
3. 每个导出文件名都包含开始日、结束日和范围。例如：`bing-web-query-2026-07-20--2026-07-26.csv`。
4. 日期统一按 `YYYY-MM-DD` 记录。站内 Analytics 和人工咨询台账按 UTC；Bing/Microsoft 账户若用其他时区，必须在运行清单中写明，不静默换算。
5. 表格逐行阅读时，列顺序固定为：`impressions, clicks, CTR, average position`。不要沿用不同后台页面的视觉顺序。
6. 每次只做一个主要实验。标题/摘要、首屏、内链、广告和联系链路不能在同一 7 天观察块内同时改变。
7. 未知留空或写 `MISSING/UNAVAILABLE/HOLD`；绝不能把缺失补成 0。

## 2. 已知基线与数据限制

执行前朗读并记录以下事实：

- 2026-07-20 主 Agent 的 Bing Web 只读 UI 记录，滚动 7 天范围为 2026-07-13 至 2026-07-19：113 clicks、约 1.6K impressions、CTR 6.97%。
- `/guides/6-pitfalls/` 约 1.3K impressions、76 clicks、CTR 5.98%、average position 6.24；76 clicks 占总点击约 67.3%。它是高曝光支柱页，不是最高 CTR 页。
- 已有明确查询机会包括 `giffgaff购买`、`英国gg卡`、`gg卡`、`gg卡激活`；明确 0-click 缺口包括 `giffgaff esim`。
- 页面级 0-click 缺口包括 `/guides/2-activate/`、`/answers/` 和 `www` 版本 `/more/03-esim/`。
- Bing query 表和 page 表是独立汇总，没有 query×page 配对。不能因主题相似就把两表连接。
- Bing 没有本地 CSV/XLS 原始导出；41 个可见 queries 只抄录了 19 个，未抄录行未知。
- Analytics Engine 当前只有 2026-07-19 一个完整观察日：108 page views、5 commerce clicks、2 contact clicks。固定 CLI 不拆 source/page/channel，D7/D28 为 `HOLD`。
- `contact_click` 不是收到消息；收到消息不是合格咨询；合格咨询不是付款。
- 旧 75/918 快照与新 113/~1.6K 快照日期范围和范围标签不同，不能拿来计算增长或下滑。
- Bing AI citation 不是点击、咨询、收入或排名保证。

证据来源：

- `docs/research/bing-webmaster-live-2026-07-20.md`
- `docs/research/bing-query-expansion-2026-07-20/README.md`
- `docs/research/bing-query-expansion-2026-07-20/inventory.md`
- `docs/research/bing-query-expansion-2026-07-20/data-gaps.md`

## 3. 30 天固定日历

本手册把 2026-07-20 设为准备日 D0。D1 是 2026-07-21，D30 是 2026-08-19。若实际开始日晚于 2026-07-20，整体顺延，但每个观察窗仍须是连续完整自然日。

| 日次 | 日期 | 必做事项 | 允许变更 |
| --- | --- | --- | --- |
| D0 | 07-20 | 建私有目录、初始化 30 日台账、保存现有基线、检查报表是否可导出 | 不改页、不提交、不投放 |
| D1–D6 | 07-21 至 07-26 | 每日填站内事件和人工咨询；记录故障、发布与分发 | 只修复硬故障 |
| D7 | 07-27 | 导出窗口 W1：07-20 至 07-26；运行 7 日 Analytics/咨询报告；选一个实验 | 最多批准一个实验 |
| D8 | 07-28 | 若 W1 达到触发门槛，发布一个自然搜索实验；记录 commit、部署和抓取状态 | 标题/摘要或首屏二选一 |
| D9–D13 | 07-29 至 08-02 | 保持实验不变；每日填数据；只读看硬故障 | 不加第二实验 |
| D14 | 08-03 | 导出窗口 W2：07-27 至 08-02；与 W1 同口径比较；决定保留、回退或继续观察 | 只按决策树行动 |
| D15–D20 | 08-04 至 08-09 | 若需要，开始第二个独立自然搜索实验；否则冻结页面并补数据缺口 | 每次仅一个页面/一类元素 |
| D21 | 08-10 | 导出窗口 W3：08-03 至 08-09；完成三周 query/page/咨询盘点；广告仍需单独门禁 | 可准备暂停广告草稿 |
| D22 | 08-11 | 仅在全部付费门禁通过且 owner 明确授权后执行广告 A0；否则保持暂停并继续自然观察 | owner 手动启用或保持暂停 |
| D23–D27 | 08-12 至 08-16 | 执行广告 A1–A5；每日清理明显无关搜索词并检查止损 | 不改落地页、不扩词 |
| D28 | 08-17 | 运行 28 日站内/人工台账报告（07-20 至 08-16）；执行广告 A6 冻结；不足完整日则 HOLD | 不补 0 |
| D29 | 08-18 | 导出窗口 W4：08-10 至 08-16；执行广告 A7，由 owner 手动暂停；自然与付费分表 | 不混合归因、不自动续投 |
| D30 | 08-19 | 写出 `STOP/HOLD/CONTINUE` 决策、下一 30 天唯一优先级和证据缺口 | 不自动续投、不批量改页 |

说明：Bing Search Performance 可能有处理延迟。每周报告统一使用“结束日前一个完整、后台可用的 7 日窗口”。若 07-20 至 07-26 在 D7 尚不完整，就顺延读取，并把实际 start/end 写入清单；不能改用另一个范围却仍称 W1。可选广告测试的 A1–A7 为账户时区的七个完整自然日（08-12 至 08-18）；若 A0 延后，A1–A7 和 D30 广告结论也必须顺延，不能压缩天数。

## 4. 每日 10 分钟记录

每天固定在北京时间 17:00 执行。若当天无法执行，第二天补录真实值并标注 `late-entry`，不得猜测。

1. 读取生产状态：核心页面是否 200、联系入口是否可操作。
2. 运行只读事件报表：

   ```bash
   npm run analytics:report
   ```

3. 把返回的完整 UTC 日写入仓库外台账。`MISSING` 原样保留。
4. 由渠道所有者填写同一 UTC 日的：

   - `received_messages`
   - `qualified_consultations`
   - `quotes_sent`
   - `payments`
   - `revenue_cny`
   - `variable_cost_cny`
   - `gross_profit_cny`

5. 在 notes 记录页面发布、广告、社群分发、客服不可用、节假日和技术故障。不得保存人名、号码、聊天内容、验证码或完整订单号。
6. 任一联系入口、收件账号或落地页故障，标记 `HARD-STOP-CONTACT`；当天不做 SEO 或广告效果判断。

首次建台账：

```bash
node scripts/growth-ops.mjs init-ledger \
  --start-date 2026-07-20 \
  --days 30 \
  --out /安全的仓库外路径/getgiffgaff-bing-daily-2026-07-20.csv
```

如果目标文件已存在，命令会拒绝覆盖。不要删除旧台账重建。

## 5. 每周 Bing 报表读取顺序

每个 D7、D14、D21、D29 都按同一顺序。UI 名称可能变化；优先搜索页面标题中的 `Search Performance`、`Keywords`、`Pages`、`Devices`、`Countries`。

### 5.1 固定范围

| 周次 | 数据范围 | 执行日 | 目的 |
| --- | --- | --- | --- |
| W1 | 2026-07-20 至 2026-07-26 | D7 或后台数据完整后 | 无改动基线 |
| W2 | 2026-07-27 至 2026-08-02 | D14 或数据完整后 | 第一实验观察 |
| W3 | 2026-08-03 至 2026-08-09 | D21 或数据完整后 | 第二实验或冻结观察 |
| W4 | 2026-08-10 至 2026-08-16 | D29 或数据完整后 | 月末决策 |

每次记录：property、scope（Web/Chat/其他）、start date、end date、timezone、filters、读取时间、UI 总量、导出行数、是否使用 `K` 约数。不同 scope 不比较。

### 5.2 报表 A：Daily totals

字段：

```text
date
impressions
clicks
ctr
average_position
scope
```

目的：识别无数据、处理延迟、单日异常和整周总量。没有日期行时写 `MISSING`，不是 0。

### 5.3 报表 B：Queries

字段：

```text
query_raw
impressions
clicks
ctr
average_position
start_date
end_date
scope
```

必须导出完整行，不只抄 Top queries。query 可能包含敏感或异常文本；原始文件只放 owner-only 目录，Git 中只保存隐私审核后的聚合。

### 5.4 报表 C：Pages

字段：

```text
page_raw
page_canonical_normalized
host_label
impressions
clicks
ctr
average_position
start_date
end_date
scope
```

保留原始 `www`/apex URL；另加 normalized 列用于分析，但不覆盖原值。报告出现 `www` 不足以宣布重复索引。

### 5.5 报表 D：Query × Page

若 UI/API/导出支持，字段固定为：

```text
query_raw
page_raw
page_canonical_normalized
host_label
impressions
clicks
ctr
average_position
start_date
end_date
scope
country_filter
device_filter
exported_at
```

质量检查：

1. 逐行 `CTR = clicks / impressions`，允许平台四舍五入。
2. clicks 不能大于 impressions。
3. start/end/scope 必须全表一致。
4. 记录总行数和分页次数。
5. 不删除 0-click 行。
6. 不把没有返回的 query/page 组合补 0。

若 Bing 不提供 query×page，写：

```text
query_page_status=UNAVAILABLE
reason=<UI/API 的实际限制>
checked_at=<时间>
```

然后停止 query→page 归因；不能按词义相似度自行连接 Queries 和 Pages。

### 5.6 报表 E：Device 与 Country

字段：维度值、impressions、clicks、CTR、average position、scope、start/end。只有单一页面能够应用相同 filter 时，才讨论该页在设备/国家的差异；全站维度不能强加给避坑页。

### 5.7 报表 F：Sitemaps、URL Inspection、Site Scan、IndexNow Insights

只读记录：

- sitemap status、discovered URLs、last crawled、errors、warnings；
- 目标 URL 的 raw URL、final URL、canonical/crawl/index 状态（以 UI 实际字段为准）；
- Site Scan 状态与真实错误；`Queued` 不能写 0 errors；
- IndexNow received/processed 等 UI 原字段与读取时间。

这些字段是技术诊断，不是排名 KPI。

## 6. 自然搜索实验触发阈值

阈值是内部风险门禁，不是行业基准，也不是效果保证。任何标题或首屏实验必须满足共同门槛：

1. 有一个完整 7 日 query×page 行；若 query×page 不可用，不改 title，只允许做不改变搜索承诺的可访问性/故障修复。
2. 该 query×page 在最近 7 日 `impressions >= 20`。
3. average position 在 `3.0–10.0`，说明已在第一页附近；position > 10 优先补内容与 owner 对齐，不先把问题归给 CTR。
4. 页面没有 404、noindex、错误 canonical、明显过时事实或联系链路故障。
5. 与前一完整 7 日窗口使用相同 scope/filter，且页面在观察窗内没有其他实质改动。
6. 实验 owner、原文、新文、commit、部署时间、IndexNow 变更集合和回退文本已记录。

### 6.1 标题或 description 改写触发

满足共同门槛后，还需符合以下任一条件：

- `clicks = 0`，且 `impressions >= 20`；或
- `CTR < 2%`，且 `impressions >= 50`；或
- 连续两个完整 7 日窗口，impressions 合计 `>= 100`，CTR 都低于 `3%`，average position 变化不超过 2 位。

执行规则：

- 一次只改 title 或 description 中的一类主信息，H1 与正文主题保持一致。
- 标题先回答真实任务，不堆同义词，不冒充官方，不承诺库存、验证码、KYC、保号或成功率。
- `/guides/6-pitfalls/` 是保护页：只有 query×page 显示同一高价值 query 达到上述阈值，才可小改 description；30 天内默认不改 title/H1。
- 小样本高 CTR 不触发复制。例如 5 impressions / 2 clicks 不能证明长期 40% CTR。

### 6.2 首屏改写触发

满足共同门槛后，还需同时符合：

- 页面已有 `clicks >= 10`；
- Analytics 能按 `path + source=search + event` 输出连续 7 个完整日；
- search page views `>= 30`；
- 实际 `received_messages = 0`，或 contact_click 低于 2 个；
- 联系链路真机测试通过，且客服端能够收到脱敏测试消息。

执行规则：

- 只改首屏任务分流、CTA 名称或信息顺序，不同时改 title/description。
- 购买前路径说清 G0/G2、当前信息与咨询边界；购买后路径进入激活/信号/短信诊断。
- `contact_click / page_view` 只能叫事件比，不叫转化率；没有会话 ID，不能据此预测咨询数。
- 当前固定 CLI 不拆 path/source，因此在增加安全聚合报表前，首屏实验保持 `HOLD`。

### 6.3 不触发改写的情形

- impressions < 20；
- 只有 page 汇总或 query 汇总，没有配对；
- 页面刚上线或 Bing 尚未重新抓取；
- 7 日内有发布、分发、广告、客服故障等混杂因素；
- query 是拼写错误、政策敏感平台注册词或与业务不符；
- 只看到 AI citations、sitemap success 或 IndexNow receipt。

## 7. CTR、曝光与咨询事件决策树

按顺序判断，命中一个分支后停止，不同时执行多项修复。

1. **是否有 7 个完整日？**
   - 否：`HOLD-DATA`，继续采集。
   - 是：进入第 2 步。
2. **query×page 是否可用？**
   - 否：`HOLD-PAIRING`，只做 query/page 独立盘点，不改标题。
   - 是：进入第 3 步。
3. **impressions 是否下降？**
   - 同 scope、相邻完整窗口下降 30% 以上，且前一窗口 impressions >= 100：先查 sitemap、robots、canonical、HTTP、Bing crawl/site scan、部署和季节/范围；不先改 CTA。
   - 未达到：进入第 4 步。
4. **average position 是否变差？**
   - 变差超过 3 位，且 impressions >= 50：检查页面 owner、内容事实、重复页、抓取版本和 SERP 意图；不先用标题刺激点击。
   - 未达到：进入第 5 步。
5. **位置 3–10 且 CTR 低吗？**
   - 达到第 6.1 节阈值：运行一个标题/description 实验。
   - 未达到：保持页面，继续观察或扩大完整数据，而不是“优化一切”。
6. **搜索点击存在，但站内 search page views 不存在吗？**
   - 是：先查 Analytics 接收、source 分类、缓存和日期时区；不宣称用户未到站。
   - 否：进入第 7 步。
7. **search page views 存在，但 contact clicks/实际消息弱吗？**
   - 联系链路失败：立即修复链路，停止页面/广告实验。
   - 链路正常且达到第 6.2 节阈值：只做首屏分流实验。
   - 数据不足：`HOLD-FUNNEL`。
8. **实际消息存在，但合格咨询弱吗？**
   - 检查 query 意图、页面承诺、库存/价格/身份/服务范围；不要买更多流量。
9. **合格咨询存在，但报价/付款弱吗？**
   - 检查商品、交付、支付、退款、信任与毛利；这不是 CTR 问题。

“下降 30%”“位置变差 3 位”等是内部异常触发线，只用于决定先查什么；不能写成算法阈值或统计显著性。

## 8. IndexNow 操作规则

### 8.1 何时允许提交

只在以下全部满足时提交：

1. 生产已经部署真实搜索变更；
2. 变更属于 title、description、H1、主要正文、canonical、indexability、重要内链或主要咨询/购买路径；
3. 生产 URL 为 200、自指正确 canonical、可索引，发布门禁通过；
4. `release-search-changes.json` 已按生产 provenance 计算出非空、去重的 changed URL 集合；
5. 由有权限的发布负责人批准提交并保留回执。

正常路径是受控发布完成后，由现有发布流程只提交 changed URLs。不要手工拼 URL。

### 8.2 何时不提交

- 只是查看报表、改文档、样式微调、埋点或共享页脚；
- 页面没有部署到生产；
- changed set 为空；
- URL 为 noindex、重定向、404、隐私/政策占位页；
- 为了“催收录”重复提交未变化 URL；
- Bing Insights 无法读取，试图用重提代替诊断。

### 8.3 命令与回执边界

常规 changed-set 提交：

```bash
npm run submit:indexnow
```

`--all` 只在负责人明确批准重提全部 canonical URL，并记录具体技术理由时使用：

```bash
npm run submit:indexnow:all
```

HTTP 200/202 只表示 IndexNow 收到批次，不表示抓取、收录或排名。提交后在下一次周报只读核对 Insights；不因没有即时变化再次提交。

## 9. UTM 命名

每个 URL 只允许一个 `utm_source`。自然 Bing 搜索不添加 UTM；Microsoft Ads 使用固定值：

```text
utm_source=paid_microsoft
```

允许示例：

```text
https://getgiffgaff.com/guides/6-pitfalls/?utm_source=paid_microsoft
https://getgiffgaff.com/answers/?utm_source=paid_microsoft
```

禁止：

- `utm_source=bing` 与 `paid_microsoft` 混用；
- `utm_campaign`、`utm_term`、`utm_content`、`utm_medium`；
- 人名、群名、搜索词、手机号、账号或广告创意文本；
- 依赖 `msclkid` 做用户级归因。

站内现有 UTM 生成器：

```bash
node scripts/growth-ops.mjs utm --source microsoft_ads --path /guides/6-pitfalls/
```

输出必须包含且只包含 `utm_source=paid_microsoft`。生成器输出不是投放授权。

## 10. Microsoft Ads 最低风险小额测试

### 10.1 当前默认状态

默认 `PAUSED / NO-GO`。手册作者、脚本和自动化不得代用户登录、添加付款方式、点击 Enable/Launch/Publish 或产生花费。账户所有者只能在下列门禁全部通过后手动启用：

1. 明确书面批准平台、地区、日期、币种、付款方式、日预算、7 日最大总损失和暂停负责人；
2. 已有连续 7 个完整 UTC 日的站内事件与真实消息/合格咨询/报价/付款台账；
3. 合格咨询定义已固定并实际使用；
4. 单笔已实现贡献毛利和历史 `付款/合格咨询` 比例有真实样本；没有样本则保持暂停，除非 owner 明确批准纯获客研究的最大损失；
5. 商标、独立第三方身份、广告政策、隐私、交易、退款、物流和落地页事实均经负责人审核；
6. `paid_microsoft` 的 page_view/contact_click 聚合可只读回读，真机联系链路可用；
7. 仓库门禁输出 `GO-FOR-MANUAL-CAMPAIGN-REVIEW`。该输出仍不是启用授权。

门禁命令：

```bash
node scripts/growth-ops.mjs ads-gate --input /安全的仓库外路径/ads-readiness.json
```

### 10.2 首轮结构

- 一个 Search campaign：`CN_Search_GG_PrePurchase_7D`。
- 地区：中国大陆；位置选项若可用，使用“位于目标地区的人”。
- 语言：简体中文。
- 网络：只保留 Search；关闭 Audience Network、search partners（若可独立关闭）、PMax、Shopping、Dynamic Search、Display 和受众扩展。
- Ad group 1：明确购买 giffgaff/GG 实体卡，落地 `/guides/6-pitfalls/`。
- Ad group 2：G0/G2 比较，落地 `/answers/`。
- 英国卡泛选择、激活、保号、短信、售后组首轮保持暂停。
- 只使用 Exact/Phrase；不开 Broad，不自动应用平台建议。
- 每日读取 Search terms，把官方客服、免费、破解、接码、群发、批量注册和明显售后词加为 Exact/Phrase negative；不删除历史词。

### 10.3 预算与出价

先由 owner 填：

```text
M = 单笔已实现贡献毛利
R = 付款数 / 合格咨询数（真实历史窗口和样本）
CPAq_max = M × R × 0.5
H = 7 日最大可承受总损失
D = 日预算
CPC_cap = 最高 CPC
Nq = 最小合格咨询数，建议至少 3
```

所有门禁通过后，首轮草稿上限：CNY 50/日，连续 7 日，名义上限 CNY 350。实际日预算必须向下取值：

```text
D = min(CNY 50 的账户币种等值, H / 7, CPAq_max)
```

人工安全线：

```text
H_safe = 0.8 × H
```

累计已报告花费达到 `H_safe` 就暂停，等待账单稳定。若计算预算低于平台最低值或不足以取得一次点击，不擅自提高；保持暂停并请 owner 决定是否放弃测试。

优先 Manual CPC；若仅有 Maximize Clicks，必须设置 maximum CPC limit。`CPC_cap` 取 owner 批准值、Keyword Planner 建议区间和 `D/5` 三者最低值。不用 Maximize Conversions、Target CPA 或 Target ROAS。

### 10.4 7 日测试操作

| 日次 | 读取字段 | 动作 |
| --- | --- | --- |
| A0 | 状态、地域、语言、网络、预算、日期、URL、UTM、政策与联系链路 | owner 手动启用购买/对比两组；其余保持暂停 |
| A1 | impressions、clicks、spend、avg CPC、审核状态、paid_microsoft page views | 修 URL/审核硬故障；不因低展示加价 |
| A2 | Search terms、match type、spend、实际消息 | 加明显否定词；不改落地页 |
| A3 | 累计 spend、H_safe、contact clicks、实际消息 | 真机复测联系链路 |
| A4 | ad group、device、location、search-term relevance、qualified consultations | 只处理浪费或故障，不开 Broad |
| A5 | 报价、付款、库存、客服可用时段 | 不放宽止损 |
| A6 | 全部字段 | 冻结新增词和文案，准备导出 |
| A7 | spend、queries、clicks、qualified consultations、CPAq、payments、gross profit | owner 手动 Pause；等待报表稳定后判定 |

自然搜索 Bing clicks 和 paid_microsoft clicks 必须分表，不合并为“Bing 流量”。

## 11. 停止条件

### 11.1 全部活动立即停止

任一条件命中，先停止页面/广告实验并记录时间：

- 落地页非 200、出现 noindex/错误 canonical、联系按钮或微信/Telegram 收件故障；
- 页面、广告或摘要出现错误官方身份、无法核验价格/库存、永久保号、验证码/KYC/平台注册保证；
- 账号、付款、商标、隐私、恶意流量或个人数据风险；
- 报表 scope/date/filter 无法确认，或缺失被错误补 0；
- 同一窗口发生第二个无法隔离的页面/渠道变更。

### 11.2 自然搜索实验停止/回退

- 发布后生产门禁失败：立即回退或向前修复，不等 7 日；
- 同 scope 下一完整 7 日，目标 query×page impressions >= 50，CTR 相对基线下降 30% 以上，且 average position 没有改善至少 1 位：回退实验；
- average position 变差超过 3 位且 impressions >= 50：回退并检查 intent/canonical/crawl；
- impressions 低于 20 或数据不完整：`HOLD`，不宣称成功/失败，也不叠加新改动；
- 出现政策、事实或安全错误：立即回退，不等待样本。

相对下降阈值只用于内部保护，不代表统计显著性。

### 11.3 付费测试立即暂停

- 累计 reported spend 达到 `H_safe`，或账单延迟使剩余预算未知；
- 有合格咨询但 `CPAq > CPAq_max`；
- 累计花费达到 `CPAq_max` 仍为 0 条合格咨询；
- 搜索词主要为售后、官方客服、免费、接码、群发、破解或其他不服务意图，否定词不能及时控制；
- `paid_microsoft` 回读或真实收件链路失效；
- owner 撤回授权或无法及时响应咨询。

A7 判定：

- `STOP`：触发任一暂停条件；保持暂停。
- `HOLD`：未触发止损，但合格咨询少于 `Nq`；不扩量，下一块必须重新批准损失上限。
- `CONTINUE`：合格咨询不少于 `Nq`、`CPAq <= CPAq_max`、搜索词相关、链路/政策正常；最多再跑一个重新批准的 7 日块。
- `SCALE`：满足 Continue，且 `CPAq <= 0.7 × CPAq_max`、至少一笔可核验付款、测试期已实现贡献毛利不为负；每 3 个完整日最多提高预算 10%–20%，每次重新审核。

CTR、点击量或平台优化分数不能单独触发 Continue/Scale。

## 12. D30 最终输出模板

按下面顺序写，保证屏幕阅读器可线性读取：

```text
决策：STOP / HOLD / CONTINUE
自然搜索范围：start_date / end_date / scope / timezone
自然搜索总量：impressions / clicks / CTR / average position
目标 query×page：query / page / impressions / clicks / CTR / position
自然实验：变更元素 / commit / deployed_at / kept_or_reverted
站内事件：page_view / commerce_click / contact_click / MISSING days
人工结果：received / qualified / quotes / payments / gross_profit
付费测试：NOT_STARTED / PAUSED / spend / clicks / qualified / CPAq
技术状态：sitemap / crawl / site scan / IndexNow readback
无法回答：逐项列出
下一 30 天唯一优先级：只写一项
```

不得输出“预计增长”“预计咨询”“SEO 恢复百分比”或没有固定来源的行业基准。

## 13. 30 天执行检查表

### 数据

- [ ] 四个固定 Bing 7 日窗口使用相同 scope/filter。
- [ ] 完整 query、page、daily、device、country 文件在 owner-only 目录。
- [ ] query×page 已导出，或明确记录 UNAVAILABLE。
- [ ] MISSING 没有补 0。
- [ ] 28 日站内/人工台账状态为 READY；否则 D30 为 HOLD。

### 页面

- [ ] 避坑页 title/H1 默认保持不变。
- [ ] 每个 7 日块最多一个主要实验。
- [ ] 触发阈值、原文、新文、commit、部署、回退文本已记录。
- [ ] 搜索摘要不含官方身份、库存、价格或结果保证。

### IndexNow

- [ ] 只提交真实生产 changed URLs。
- [ ] 空集合、文档/样式/埋点变更未提交。
- [ ] 200/202 只记录为 received，不写 crawled/indexed。
- [ ] 没有为催收录重复提交。

### 付费

- [ ] owner 授权、7 日基线、合格咨询定义、毛利、政策、归因、真机链路全部通过。
- [ ] UTM 只有 `utm_source=paid_microsoft`。
- [ ] Campaign、ad group、关键词和广告在启用前均为 Paused。
- [ ] 预算使用向下取值公式，`H_safe` 已记录。
- [ ] Exact/Phrase only；Broad、Audience、PMax、再营销和自动建议关闭。
- [ ] A7 owner 手动暂停，没有自动续期。

## 14. 关联文档

- Bing 研究结论：`docs/research/bing-query-expansion-2026-07-20/README.md`
- 机会评分：`docs/research/bing-query-expansion-2026-07-20/opportunity-scorecard.csv`
- 数据缺口：`docs/research/bing-query-expansion-2026-07-20/data-gaps.md`
- Analytics 口径：`docs/operations/analytics-funnel.md`
- Analytics CLI：`docs/operations/analytics-report-cli.md`
- 增长台账：`docs/operations/growth-operations-runbook-2026-07-19.md`
- Microsoft Ads 完整门禁与文案：`docs/distribution/microsoft-ads-7-day-playbook.md`
- SEO/IndexNow 发布边界：`docs/seo-release-runbook.md`

本文中的阈值、预算上限和日程都是风险控制工具，不是流量或商业结果预测。数据无法支持结论时，正确动作是 `HOLD`。
