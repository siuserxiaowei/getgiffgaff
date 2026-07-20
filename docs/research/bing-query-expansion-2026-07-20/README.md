# Bing 查询扩展与咨询机会研究（2026-07-20）

状态：`research only`。本目录没有登录 Bing/Google、没有改账号设置、没有提交 URL，也没有修改站点页面。分析只使用仓库证据，以及主 Agent 在 2026-07-20 写入本地的 Bing Webmaster Tools 只读 UI 记录。

## 先读：证据边界

本报告严格区分三类内容：

- **事实**：本地文件中有明确时间窗和数值，或可由本地 Git 对象复现。
- **推断**：由多个事实支持、但没有 query×page 或咨询归因证据的解释。
- **建议**：下一步的页面、测量或内容动作，不代表已经获得排名、咨询或收入。

2026-07-20 的 Bing 明细来自主 Agent 的只读 UI 实测，计划/落盘路径为 `docs/research/bing-webmaster-live-2026-07-20.md`。本 Agent 没有独立操作登录态浏览器，也没有取得 Bing CSV 原始导出，因此不会把这批数据写成“本 Agent 亲自复核”。本目录引用该本地记录，但不扩大其证据范围。

## 结论摘要

### 事实

1. 主 Agent 在 Bing Web 的滚动 7 天窗口（2026-07-13 至 2026-07-19）读到 **113 clicks、约 1.6K impressions、CTR 6.97%**。最近三个有数据的日期分别是：7 月 16 日 `30/446`、7 月 17 日 `45/472`、7 月 18 日 `38/703`（clicks/impressions）。来源：`docs/research/bing-webmaster-live-2026-07-20.md`。
2. 仓库较早的账号快照是 Web + Chat、2026-07-12 至 2026-07-18：**75 clicks / 918 impressions / CTR 8.17% / average position 5.9**。它只包含当时已显示数据的 7 月 16、17 日。来源：`docs/operations/growth-operations-runbook-2026-07-19.md`。
3. 两组数字不是同一个固定样本：日期窗不同，旧表标为 Web + Chat，新明细的 Keywords and Pages 标为 Web，且 Bing 后台会继续处理数据。不能用 `75 → 113` 宣称增长，也不能用 `8.17% → 6.97%` 宣称 CTR 下滑。
4. 新窗口中 `/guides/6-pitfalls/` 约有 **1.3K impressions、76 clicks、CTR 5.98%、average position 6.24**；76 clicks 占全站 113 clicks 的约 **67.3%**。按 UI 的约数计算，其曝光约占 1.6K 的 **81%**，只能写“约”。来源：`docs/research/bing-webmaster-live-2026-07-20.md`。
5. 避坑页占大头主要是**曝光量大**，不是 CTR 特别高。同期 `/shop/` 为 14 impressions / 6 clicks / 42.86% CTR，`/qa/07-voicemail-switch/` 为 36 / 9 / 25%，但样本都很小。来源同上。
6. 已看到排名且最接近购买/咨询的查询包括：`giffgaff购买`（5 impressions / 2 clicks / 40% CTR / position 7.00）、`英国gg卡`（8 / 1 / 12.5% / 6.63）、`gg卡`（72 / 6 / 8.33% / 4.15）、`gg卡激活`（3 / 1 / 33.33% / 4.33）。这些是 query 汇总，不是 query×page 配对。来源同上。
7. 最大的明确点击缺口包括：`giffgaff esim`（22 / 0 / 0% / 9.09）、页面 `/guides/2-activate/`（36 / 0 / 0% / 6.92）、`/answers/`（16 / 0 / 0% / 7.13）和 `www` 版本 `/more/03-esim/`（9 / 0 / 0% / 4.22）。查询表和页面表相互独立，不能宣称 `giffgaff esim` 一定落在 `/more/03-esim/`。
8. 设备上 Desktop 约 1.3K impressions / 80 clicks / 5.94% CTR，Mobile 274 / 33 / 12.04%。国家上中国约 1.3K / 76 / 6.01%，美国 178 / 25 / 14.04%。这能用于页面与设备优先级，不能解释用户身份或咨询意图。
9. Bing AI Performance 的 3 个月窗口（2026-04-20 至 2026-07-19）为 115 citations、6 average cited pages；避坑页有 77 citations。citation 不是搜索点击、咨询或销售。
10. Google 的同期本地证据很弱：后台 3 个月视图只显示 2026-07-14 至 07-17 的 1 click / 6 impressions / 16.7% CTR / position 21.8。来源：`docs/operations/google-search-console-update-2026-07-20.md`。
11. Cloudflare Analytics Engine 在 2026-07-20 生成的固定报表里，只有 2026-07-19 一个完整观察日：108 page views、5 commerce clicks、2 contact clicks。`2/108 ≈ 1.85%` 只能叫事件比诊断信号；当前 CLI 不拆 source/page/channel，也不知道消息是否送达。D7/D28 都是 `HOLD`。来源：`docs/research/bing-webmaster-live-2026-07-20.md`、`docs/operations/analytics-report-cli.md`。
12. 仓库没有 Bing CSV/XLS 原始导出，没有完整 41-query 抄录，也没有 query×page 表。不能编造缺失查询、补零或把独立汇总表强行连接。

### 推断

1. **避坑页是“广覆盖支柱页”而非“高 CTR 特例”。** 它的标题、description、H1 和正文同时覆盖购买、激活、账号、保号、短信、验证码、漫游、充值、eSIM、信号、G0/G2；本地静态扫描有约 3,780 个可见字符、7 个 H2、7 个“坑”式 H3、10 个 giffgaff 官方资料链接和多个深层任务入口。该结构能承接大量品牌+任务的长尾变体，是其高曝光的合理解释，但没有 query×page 数据，所以不是已证因果。
2. **中文受众匹配可能放大了支柱页优势。** 中国贡献约 1.3K impressions，而避坑页明确以中文覆盖 GG 卡完整生命周期；二者方向一致，但国家汇总同样没有 page 配对，不能写成“中国流量全部进入避坑页”。
3. **页面的可引用结构可能同时帮助 Bing Web 与 Bing AI。** 避坑页在 Web 与 AI citations 都高度集中；清晰分段、直接边界、官方来源和风险清单是可复制特征。仍不能由此断言 citation 导致点击。
4. **当前 15 个站内来源页指向避坑页，不能解释 7 月 16–18 日的成绩。** Git 证据显示大规模入链是在 2026-07-19 23:35 的 `3675247` 中加入；数据窗口中使用的 `77dc29d` 版本没有 related-links 指向避坑页。当前内链可帮助以后维持主题中心，但不是旧窗口的已证原因。
5. **“咨询下滑”不能等同于“Bing 流量下滑”。** 当前 Bing 一周仍有 113 clicks，而咨询事件只有上线后一个完整日、且无法按来源拆分。仓库也没有“过去每天十几个咨询”的同口径历史台账，因此只能确认测量缺口，不能定位为排名、CTA、客服收件或商品问题中的哪一个。
6. **`www` 页面出现在 BWT 不等于当前存在重复索引。** 本地 canonical 目标是 apex，但 Bing 汇总仍列出若干 `www` URL；这可能是历史主机归并、报告标签或抓取状态。需要 URL inspection/导出后再下结论。

### 建议

1. **先保护避坑页，不做大改。** 冻结其 title/H1/主体信息架构至少一个固定 7 天窗口；仅补测 query×page、来源/页面事件和真实咨询。它已贡献约三分之二 Bing clicks，未经对照的大改风险高。
2. **优先解决“已有 Top 10、但 0 click”的明确缺口。** 第一批是 `giffgaff esim`、`/guides/2-activate/`、`/answers/`、`/more/03-esim/`。先取得 query×page，再分别检查搜索摘要是否回答了“官方切换/激活失败/G0-G2 选择”，不要把多个意图塞回一个标题。
3. **放大高咨询意图而不是泛流量。** `giffgaff购买` 与 `/shop/` CTR 高但曝光少；`英国gg卡`、`gg卡激活` 也已在 Top 10。让避坑页、`/answers/`、`/guides/8-uk-sim-choice/` 和激活页使用准确的购买前/购买后分流进入 Contact，不能写库存、官方身份或验证码保证。
4. **继续观察 7 月 20 日新增的查询页。** `如何查看giffgaff手机号`、`如何查看giffgaff流量查询`、`giffgaff 卡查余额` 已有排名；站点已有 `/guides/9-number-balance-data-check/`，但它不在本次 Bing 数据窗口中。先等一个完整窗口，不另建重复 URL。
5. **保持 voicemail 页的精准答案。** 其 25% CTR 与 9 clicks 值得保护，但意图偏售后，不要强插购买 CTA；只在用户仍无信号/无法操作时提供诊断或咨询路径。
6. **移动端优先做 CTA 真机核验。** Mobile CTR 高于 Desktop，但样本仍小。逐项检查首屏、购买前/购买后分流、微信/Telegram 拉起与二维码；实际收到消息必须由渠道端另记。
7. **所有实验使用固定窗口。** 记录部署时间，使用连续完整 UTC 7 天；同时保留 Bing query/page、Analytics page/source/event 和人工 received/qualified consultations。任何一层缺失都不宣布“咨询恢复”。

## `/guides/6-pitfalls/` 可复制与不可复制的特征

### 数据窗口中已经存在、可合理复用

- 一个页面拥有一个明确的上位意图：`giffgaff 中文教程 / 生命周期避坑`，不与每个细分页抢同一个主词。
- title、description、H1 使用同一主题核心，同时列出用户最常见的任务词。
- 首屏给出适用人群、独立第三方身份和“不保证验证码”的边界。
- 用“误区/坑 → 正确处理”的结构回答高风险问题，再分流到单一任务页。
- 同时覆盖购买前判断与购买后排障，并明确 G0/G2、账号控制、保号、短信、漫游、eSIM 的关系。
- 官方来源、复核日期、编辑责任和纠错入口可见；不靠虚构作者或官方背书。
- 页面正文在 2026-07-16 至当前保持同一 Git blob（`7ed6cef270fffe07068145934e8ab71d60ba132f`），因此这批 Bing 数据至少不是在反复改写正文时产生。

本段来源：`public/guides/6-pitfalls-page.txt`；历史复现命令见下文。

### 当前存在、但不能拿来解释旧窗口

- 当前 `site/growth/related-links.json` 有 15 个路由指向避坑页。
- 当前 release slot 把用户分成购买前咨询与购买后排障，并连接 `/answers/`、激活、保号、eSIM 与漫游费用页。

这些机制主要由 2026-07-19 的提交 `3675247` 加强，晚于 7 月 16–18 日的数据，属于后续可延续结构，不属于旧窗口的因果证据。

### 不应复制

- 不要再建“giffgaff 完整教程”“GG 卡终极指南”等平行支柱页；这会制造 owner 冲突。
- 不要把 citation、平均位置或 sitemap/IndexNow 回执写成咨询或成交证明。
- 不要为“能注册什么平台”制作保证成功的 KYC/OTP 页面；现有 1 impression / 1 click 只证明一次搜索行为。
- 不要把小样本高 CTR 外推为长期转化率，也不要从 0 click 直接推断页面质量差。

## 机会评分如何使用

[`opportunity-scorecard.csv`](opportunity-scorecard.csv) 的分数是研究排序，不是搜索量预测：

- `visibility_score`：观察到的 query impressions 分档，1–5。
- `click_gap_score`：CTR 越低，诊断空间越高，1–5；它不代表改标题一定提升。
- `consultation_fit_score`：基于意图与购买/选卡/紧急排障的接近程度，1–5，属于判断。
- `owner_readiness_score`：是否有明确安全 owner 页及该页 BWT 证据，1–5。
- `priority_score = visibility + click_gap + 2 × consultation_fit + owner_readiness`，满分 25。

CSV 中 query 与 page 数值并列只是为了决定下一步，`pair_status` 全部明确为没有逐行配对；不得把它读成该 query 已由候选 owner 页获得这些点击。

## 可复现核验

在仓库根目录运行：

```bash
rg -n -i 'Bing|IndexNow|Webmaster|Clicks|Impressions|CTR|Average position|咨询' docs scripts public site
```

```bash
rg -n '\b(75|918|50|683)\b' docs/operations docs/distribution
```

```bash
git show 5afdef3:docs/live-verification-2026-07-15.md
git show 77dc29d:site/growth/related-links.json
git show 3675247:site/growth/related-links.json
```

```bash
for c in 77dc29d 6075cef 46a7576 19eb3fd 3675247 HEAD; do
  printf '%s\t' "$c"
  git rev-parse "$c:public/guides/6-pitfalls-page.txt"
done
```

```bash
find . -type f \( -iname '*.csv' -o -iname '*.tsv' -o -iname '*.xlsx' -o -iname '*.xls' -o -iname '*.zip' \) -not -path './.git/*' -print | sort
```

完整证据盘点见 [`inventory.md`](inventory.md)，尚缺数据与最小导出规范见 [`data-gaps.md`](data-gaps.md)。
