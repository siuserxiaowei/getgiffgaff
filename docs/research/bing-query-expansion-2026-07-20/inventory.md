# 本地 Bing、IndexNow、搜索表现与咨询数据盘点

盘点日期：2026-07-20。范围：当前 Git 工作树、可读取的本地 Git 历史，以及主 Agent 同日新增的本地只读实测记录。没有调用登录态浏览器或账号 API。

## 盘点结果总览

| 类别 | 时间窗/日期 | 本地证据路径 | 能证明什么 | 不能证明什么 |
| --- | --- | --- | --- | --- |
| Bing Web 最新实测 | 2026-07-13 至 2026-07-19；2026-07-20 读取 | `docs/research/bing-webmaster-live-2026-07-20.md` | 113 clicks、约 1.6K impressions、query/page/device/country 的部分 UI 行 | 不是 CSV 原始导出；本 Agent 未独立复核 UI；没有 query×page |
| Bing 旧账号快照 | Web + Chat，2026-07-12 至 2026-07-18；2026-07-19 读取 | `docs/operations/growth-operations-runbook-2026-07-19.md` | 75/918/8.17%/5.9、两日拆分、四个页面样本、sitemap 状态 | 不是长期趋势；页面样本不是完整表；不能和新窗口直接做增减 |
| Microsoft Ads 派生手册 | 引用 2026-07-12 至 2026-07-18 | `docs/distribution/microsoft-ads-7-day-playbook.md` | 复述旧 Bing 与 Google 快照并定义暂停门禁 | 不是独立数据源，不是广告效果或启用授权 |
| Bing AI Performance 旧快照 | 2026-04-19 至 2026-07-18；2026-07-19 读取 | `docs/operations/growth-operations-runbook-2026-07-19.md` | 44 citations、5 avg cited pages，部分 query/page citation 行 | citation 不是访问、排名、咨询或完整 AI 平台覆盖 |
| Bing AI Performance 新快照 | 2026-04-20 至 2026-07-19；2026-07-20 读取 | `docs/research/bing-webmaster-live-2026-07-20.md` | 115 citations、6 avg cited pages；日期、query 和 page 样本 | 后台会继续处理；不是 Web 点击或销售 |
| Bing sitemap / property | 2026-07-19 读取 | `docs/operations/growth-operations-runbook-2026-07-19.md` | 站点接通；sitemap success、39 URL、last crawled 2026-07-17、0 error/0 warning | 不等于 39 URL 全部收录或排名 |
| Bing Site Scan | 2026-07-19 | `docs/operations/growth-operations-runbook-2026-07-19.md` | 名为 `getgiffgaff-critical-pages-2026-07-19` 的 10-page scan 当时为 Queued | 没有完成结果，不能写 0 errors |
| Bing 外链快照 | 2026-07-19 | `docs/operations/growth-operations-runbook-2026-07-19.md`、`docs/growth/editorial-outreach-workflow.md` | 2 referring domains、201 pages、4 anchors；196+5 页高度集中 | 不是完整 Web 图谱；没有避坑页直接外链证据 |
| Bing 公开查询观察 | 2026-07-17 | `docs/research/seo-geo-baseline-2026-07-17/public-search-observations.tsv`、`public-search-results.tsv` | 7 个意图的公开发现尝试；保号等公开结果样本 | 位置/设备不可控，不是 BWT 数据、稳定排名或需求量 |
| Query owner 基线 | 2026-07-17 | `docs/research/seo-geo-baseline-2026-07-17/query-owners.tsv` | 激活、保号、OTP、漫游、eSIM、英国选卡、收卡验收的候选 owner | 标为 provisional；不是已有排名证明 |
| Query owner 扩展 | 2026-07-17 | `docs/research/seo-geo-hive-2026-07-17/query-ownership-r27.tsv` | 生命周期支柱、交易、App、充值、eSIM 等 owner/overlap 边界 | 不是 query×page 表，也不是自动改页授权 |
| IndexNow 初次回执 | 2026-07-16 | `docs/seo-release-runbook.md`、`docs/HANDOFF-2026-07-16.md` | 39 canonical URLs 提交到 api.indexnow.org，HTTP 202 | 202 只代表收到批次、key 校验待完成；不等于抓取/收录 |
| IndexNow 代码 | 当前仓库；初次提交 `77dc29d` | `scripts/submit-indexnow.mjs`、`public/indexnow-key.txt`、`test/indexnow-submission.test.mjs`、`package.json` | key 验证、变更 URL/all 模式、200/202 收据边界有代码与测试 | 本轮没有执行提交；代码存在不证明后台处理状态 |
| IndexNow 协议证据 | 2026-07-17 | `docs/research/seo-geo-hive-2026-07-17/evidence_cards.tsv` 的 EC-R17-03/04/05 | 官方协议边界、Bing 后台验证要求、仓库 39 URL/202 历史记录 | 没有当前 IndexNow Insights 导出 |
| IndexNow Insights | 2026-07-19 | `docs/operations/growth-operations-runbook-2026-07-19.md` | 当时 UI 回退营销页，状态无法可靠读取 | 不能声称已经处理、抓取或失败 |
| Bing 后端历史缺口 | 2026-07-17 | `docs/research/seo-geo-hive-2026-07-17/evidence_cards.tsv` 的 EC-R17-07、EC-R04-04 | 当时无授权 readback/API/export，状态明确 blocked | 不能用公开页面代替 property 数据 |
| Google 最新表现 | 2026-07-14 至 2026-07-17 可用图表；2026-07-20 读取 | `docs/operations/google-search-console-update-2026-07-20.md` | 1 click / 6 impressions / 16.7% / position 21.8；query/page 小样本 | 不能判断长期趋势或单页质量 |
| Google 旧快照 | 后台所选 3 个月；2026-07-19 读取 | `docs/operations/growth-operations-runbook-2026-07-19.md` | 同一极小量级快照，说明当时 Google 不是稳定大量入口 | 没有完整 query×page 导出 |
| Google 导出规范 | 未来授权运行 | `docs/research/seo-geo-baseline-2026-07-17/gsc-readonly-handoff.md` | 定义 28/90 天 query/page/query+page、final data、URL inspection 的安全口径 | 状态为 prepared, not executed |
| 咨询 Analytics 数据 | 报表生成 2026-07-20T05:19:01.584Z；固定范围 2026-06-22 至 07-19 | `docs/research/bing-webmaster-live-2026-07-20.md` | 仅 07-19 OBSERVED：108 page view、5 commerce、2 contact 等；D1 READY | 不拆 source/page/channel；D7/D28 HOLD；不是用户/消息/订单 |
| Analytics 数据定义 | 自 2026-07-19 生产启用后 | `docs/operations/analytics-funnel.md` | 字段、采样、UTC、canary、查询与非用户级边界 | 不能反推历史咨询量或串联用户漏斗 |
| Analytics 固定 CLI | 当前仓库 | `docs/operations/analytics-report-cli.md`、`scripts/analytics-report.mjs` | 只读按日/event 报告；MISSING 不补 0 | 当前不提供 landing page/source/channel 诊断表 |
| 咨询恢复记录 | 2026-07-19 | `docs/operations/consultation-recovery-2026-07-19.md` | 联系入口、二维码、埋点能力已部署 | 不表示咨询量已恢复，不证明消息送达 |
| 历史“每天十几个咨询”陈述 | 2026-07-19 文档引用过去状态 | `docs/operations/growth-operations-runbook-2026-07-19.md` | 只证明仓库记录过该业务陈述 | 没有原始台账、时间窗、渠道或统一咨询定义，不能量化下滑 |
| 早期 Bing/GSC 接入记录 | 2026-07-15，当前树已删除但 Git 对象可读 | `git show 5afdef3:docs/live-verification-2026-07-15.md`、`git show 5afdef3:docs/external-gate-state.json` | Bing CNAME verified、sitemap success/28 discovered；GSC 接入状态 | 不是当前 URL 数或当前搜索表现 |
| 7/16 交接 | 2026-07-16 | `docs/HANDOFF-2026-07-16.md` | 39 URL、IndexNow 202、Bing/GSC 仍需后台 readback 的历史边界 | 不能替代 7/19、7/20 UI 实测 |
| SEO/GEO 研究基线 | 2026-07-17 | `docs/research/seo-geo-baseline-2026-07-17/README.md` | 39 URL public baseline、缺口、成功指标定义 | 公开 HTTP/HTML 观察不是排名数据 |
| 避坑页当前源 | published 2026-07-01；markup modified 2026-07-15；Git blob 自 7/16 稳定 | `public/guides/6-pitfalls-page.txt` | title/meta/H1、约 3,780 字符、7 H2/7 H3、官方来源与任务链接 | 结构特征不是排名因果证明 |
| 避坑页历史版本 | 数据发生时附近 `77dc29d` / `6075cef` | `git show 77dc29d:public/guides/6-pitfalls-page.txt` | 与当前同一 blob `7ed6cef...`，正文稳定 | 不能证明 Bing 首次抓取日期或缓存版本 |
| 当前内链图 | 2026-07-19 23:35 后 | `site/growth/related-links.json`、commit `3675247` | 当前 15 个路由指向避坑页，避坑页分流到细分页 | 晚于主要数据日期，不能解释 7/16–7/18 表现 |

## 原始导出盘点

在仓库与工作区父目录中按 `*.csv/*.tsv/*.xlsx/*.xls/*.zip` 及 Bing/Webmaster/query/traffic 文件名检索：

- 找到的 CSV/TSV 主要是研究台账、query owner、公开搜索观察与外链候选；它们不是 Bing Webmaster Search Performance 导出。
- 找不到 Bing Search Performance 的 CSV/XLS/XLSX、完整 query 表、完整 page 表或 query×page 表。
- `docs/research/bing-webmaster-live-2026-07-20.md` 是 UI 数值的本地人工记录，不是平台原始导出。
- 当前最新 UI 显示 41 个 queries，但本地记录只抄录 19 个与主题/CTR/业务机会相关的行；其余 22 行未知，不得补零或猜词。

## 数据沿革与冲突处理

### 旧 75/918 与新 113/~1.6K

保留两份快照，不覆盖旧值：

| 快照 | 时间窗 | 范围标签 | 读数 | 解释 |
| --- | --- | --- | --- | --- |
| 2026-07-19 仓库快照 | 07-12 至 07-18 | Web + Chat | 75 / 918 / 8.17% / pos 5.9 | 当时只显示 07-16、07-17 有数据 |
| 2026-07-20 主 Agent 实测 | 07-13 至 07-19 | Web；Keywords and Pages 只含 Web | 113 / ~1.6K / 6.97% | 新增可见 07-18 为 38 / 703；后台继续处理 |

它们不是相同的固定 cohort，不能作环比。若要趋势，必须用平台导出锁定两个不重叠、同范围、final 的 7 天窗口。

### 页面 host

新 UI 记录中 `/guides/4-signal/`、`/more/04-esim-qrcode/`、`/more/03-esim/`、`/qa/01-change-number/`、`/more/00-wechat/` 带 `www` 标签，而其他行是 apex。盘点保留原标签，不自行合并，也不据此宣布 canonical 冲突。导出后应同时保存 raw URL 与 canonical-normalized URL。

### 流量与咨询

Bing clicks、Analytics `contact_click`、客服实际收到消息、合格咨询和付款是不同层：

```text
Bing query/page aggregate
  -> site page/event aggregate
  -> external contact click
  -> actual message received
  -> qualified consultation
  -> quote/payment
```

当前只有前两层的不同时间/聚合口径，以及 2 个不知来源的 `contact_click`。任何端到端归因都属于数据缺口。
