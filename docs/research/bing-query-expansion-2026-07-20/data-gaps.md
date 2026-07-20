# 数据缺口与最小安全导出规范

截至 2026-07-20，本地证据足以确认 Bing 已有可见度和若干 Top 10 机会，但不足以把 query、page、站内点击和咨询连起来。以下缺口按阻断程度排列。

## P0：阻断 query → page → 咨询判断

### 1. 没有 Bing 原始 Search Performance 导出

已知：最新 UI 显示 41 个 queries，本地记录只抄录 19 个；page 表也只是主要行。

缺少：

- 完整 query 行，而不是筛选后的主要行；
- 完整 page 行；
- 每日行；
- 精确 impressions（当前总量和避坑页使用 `K` 约数）；
- Web 与 Chat/其他 vertical 的明确拆分；
- UI/导出时的 filter、timezone、数据最终性和抓取时间。

最小导出要求：固定 `type/scope`，记录 start/end、timezone、filter、导出时间、总行数和 pagination；原始文件不加工保存，再生成脱敏汇总。不要把未返回的行补 0。

建议私有路径：

```text
/Users/siuserxiaowei/.local/share/getgiffgaff/seo/bing/2026-07-20/
```

建议文件：

```text
run-manifest.json
search-7d-daily.csv
search-7d-query.csv
search-7d-page.csv
search-7d-device.csv
search-7d-country.csv
ai-performance-3m-query.csv
ai-performance-3m-page.csv
```

凭证、Cookie 和账号标识不得进入导出目录或 Git。

### 2. 没有 query×page 配对

这是本轮最关键缺口。当前只能看到独立 query 汇总和 page 汇总，因此不能证明：

- `giffgaff` 或 `gg卡` 的点击进入避坑页；
- `giffgaff esim` 的 22 impressions 属于 `/more/03-esim/` 还是 `/more/04-esim-qrcode/`；
- `gg卡激活` 是否进入 `/guides/2-activate/`；
- `/answers/` 的 16 impressions 来自什么 query。

如果 Bing 当前导出/API支持 query+page 维度，保存完整逐行表；如果不支持，明确记录 `unavailable`，不要按主题相似度 join。候选 owner 只能叫 editorial hypothesis。

### 3. Analytics CLI 不拆 source/page/channel

当前只有 2026-07-19 一天的 event totals：108 page views、5 commerce clicks、2 contact clicks。固定 CLI 没有输出：

- landing page；
- `source=search`；
- `/guides/6-pitfalls/`；
- before-purchase / after-purchase；
- wechat / telegram；
- Bing 与其他 search/referral 的区别。

需要使用 `docs/operations/analytics-funnel.md` 已定义的安全字段，按 UTC 产出 `day × path × source × event × channel_or_intent` 聚合；仍然不能创建用户 ID 或把事件串成会话。

### 4. 没有实际消息与合格咨询台账

`contact_click` 不证明 App 拉起、加好友、发消息或收到回复。必须由渠道所有者按同一 UTC 日记录：

- received_messages；
- qualified_consultations；
- quotes_sent；
- payments；
- 影响解释的账号故障、发布和分发动作。

只保留聚合数，不保存姓名、手机号、聊天内容、完整订单号或验证码。未知留空，不能填 0。

### 5. 没有同口径历史咨询基线

仓库提到过去“每天十几个咨询”，但没有日期、渠道、咨询定义或原始台账。Analytics Engine 只能从 2026-07-19 上线后开始积累，无法反推历史。

因此目前无法量化“下滑百分比”，也无法判断搜索流量、CTA、客服账号、消息送达、库存/价格或支付哪个环节先断。首个可用结论至少需要 7 个连续完整 UTC 日；首版基线需要 28 日。

## P1：阻断页面优化归因

### 6. 滚动窗口与范围不一致

旧值是 Web + Chat、07-12 至 07-18；新值是 07-13 至 07-19，且 Keywords and Pages 只含 Web。Bing 还会回填数据。

需要两个不重叠、相同 scope/filter、完整 final 的 7 天窗口。不要把当前两个快照作环比。

### 7. `www` 与 apex 归并状态未知

BWT 页面表仍显示若干 `www` 行。本地页面 canonical 指向 apex，但没有 Bing URL inspection、last crawl、selected canonical 或 host-normalized 原始导出。

需要对这些 URL 只读核对：

- raw report URL；
- HTTP final URL；
- page canonical；
- Bing inspection/crawl state（如后台提供）；
- 是否为历史报告标签。

在证据齐全前不改 canonical、不提交 URL、不声称重复索引。

### 8. 页面变更与 Bing 数据的生效时间没有对齐

已知避坑页正文在数据窗口中稳定；但 15 个反向 related-links 与加强分流在 2026-07-19 23:35 才进入 Git。缺少生产部署时间、Bing last crawl 与缓存版本的逐页对齐。

以后每次实验至少记录：commit、生产 provenance、部署时间、page lastmod 是否实质变化、Bing last crawl、实验窗口。未重新抓取前不评价页面改动效果。

### 9. 0-click 页面缺少真实查询和摘要证据

`/guides/2-activate/` 36/0、`/answers/` 16/0、`/more/03-esim/` 9/0 都已在 Top 10 附近，但不知道触发词、实际 Bing title/snippet、SERP 竞争和国家/设备组合。

优化前至少取得 query×page 或受控 SERP 快照；否则只做低风险的意图审查，不直接重写。

### 10. 新页没有完整观察窗

`/guides/9-number-balance-data-check/`、`/guides/apn-settings/`、`/more/esim-new-phone/`、`/more/esim-deleted/` 在 2026-07-20 的 Google 记录中仍是新增页状态；也不在本轮 Bing 7 天的完整生效窗口。

查询 `如何查看giffgaff手机号`、`如何查看giffgaff流量查询`、`giffgaff 卡查余额` 已出现，但不能据此立即建更多页面。等待一个固定窗口并检查 owner overlap。

## P1：阻断 IndexNow / 技术状态判断

### 11. IndexNow Insights 没有可靠 readback

仓库只证明 2026-07-16 的 39-URL batch 收到 HTTP 202；202 不等于抓取或收录。2026-07-19 Insights UI 一度回退营销页。

需要只读记录：batch/URL received time、key validation、processed/crawled 状态（以 UI 实际字段为准）及读取时间。不为取得状态重新提交 URL。

### 12. Bing Site Scan 仍缺完成结果

2026-07-19 的 10-page scan 当时为 `Queued`。需要等待完成后只读记录真实状态与错误；队列不能预填 0 errors。

### 13. sitemap 成功不等于页面索引

当前只知道 sitemap success、39 URL、0 error/warning。仍缺逐 URL index/crawl/canonical readback，尤其是 BWT 中带 `www` 的行。

## P2：扩展判断所需的辅助证据

### 14. AI citation 原始行与问题上下文不完整

115 citations 和页面/grounding query 样本可作为发现线索，但缺完整 query/page、回答上下文、引用位置和去重规则。不能把 citation share 当 CTR 或咨询概率。

### 15. 直接指向避坑页的外链未知

现有 BWT 外链样本主要描述首页与 `/shop`，没有避坑页直接外链证据。若要解释支柱页优势，需要 target URL 级 backlink export；不要从 201 referring pages 推断避坑页权重。

### 16. Google 对照样本太小

Google 只有 1 click / 6 impressions，不能拿来判断 Bing 机会是否可迁移到 Google。未来应按 `gsc-readonly-handoff.md` 的 28/90 天 query/page/query+page 规范导出，和 Bing 分开分析。

## 最小验收标准

下一轮只有同时满足以下条件，才可以写“某 query 通过某 page 带来咨询机会”：

1. 固定、同范围的 Bing query×page 行存在，或明确记录平台无法提供；
2. landing page/source/event 的 UTC 聚合存在，且没有把事件当用户；
3. 实际 received/qualified consultation 由渠道所有者按同日聚合记录；
4. 页面改动、部署、抓取与观察窗时间可对齐；
5. 至少 7 个连续完整日，无 MISSING 补 0；
6. 结论使用“关联信号”，除非存在经过隐私审核的可靠归因机制；
7. 没有登录凭证、个人数据、URL 提交或账号写操作进入研究流程。
