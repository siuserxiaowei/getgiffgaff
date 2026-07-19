# 咨询漏斗 Analytics Engine 口径

> 数据集：`getgiffgaff_events_v1`。Binding：`ANALYTICS`。本文定义当前仓库候选的写入和查询口径，不构成部署记录。数据只能从该 binding 首次在生产启用后开始积累，不能反推历史咨询量。

## 写入字段

| Analytics Engine 字段 | 含义 | 允许值或例子 |
| --- | --- | --- |
| `index1` | 事件名，也是主查询索引；发布探针使用与查询键完全一致的低频唯一索引 | 普通事件为 `page_view`、`commerce_click`、`shop_click`、`contact_click`、`growth_related_click`、`tool_result`；发布探针为 `seo_release_canary:<一次性探针 ID>` |
| `blob1` | canonical 路径 | `/`、`/shop/`、`/contact/` |
| `blob2` | 粗粒度或固定分发来源 | `direct`、`internal`、`search`、`social`、`referral`、`ai`、`unknown`，或隐私页披露的 7 个固定 `utm_source` 白名单值 |
| `blob3` | 事件名副本 | 与 `index1` 相同 |
| `blob4` | 条件维度 | `contact_click` 时为 `wechat` 或 `telegram`；`/guides/6-pitfalls/` 的两个固定 `commerce_click` 分支为 `before-purchase` 或 `after-purchase`；生产发布探针时为 `seo_release_canary`；其他事件不写第四个 blob |
| `blob5` | 生产发布探针 ID | 仅生产发布探针写入一次性 256-bit 十六进制 ID；普通访客事件和联系点击不写 |
| `double1` | 原始事件权重 | 固定为 `1` |

联系渠道、避坑页意图与发布探针三类条件维度互斥。意图值只接受两个固定枚举，不读取链接 URL、文案或任意 DOM 值。所有运营查询必须带上 `blob4 != 'seo_release_canary'`；不要把探针当作首页访问。Preview 主机在解析 payload 或触碰 binding 前返回 404，不写生产数据集。

这些是“不含直接身份标识的事件级数据”，不是独立访客、会话或匿名用户档案。自定义数据集不写入 IP、User-Agent、完整 referrer、查询参数、手机号、账号、订单号或支付信息；Cloudflare 作为边缘基础设施提供方仍可能在传输层处理网络元数据。

## 采样与时间边界

Analytics Engine 可能对数据采样。计数必须使用 `SUM(_sample_interval * double1)` 恢复加权事件量，不能直接 `SUM(double1)`，也不能把加权结果解释为独立人数。

SQL API 默认时区是 `Etc/UTC`，本文中的 `NOW()`、`timestamp`、`toStartOfDay(timestamp)` 和“完整自然日”均按 UTC 解释。D1 是生产发布完成后的首个完整 UTC 自然日，发布当日的残缺时段不计入 D1。

## 日常查询

按 UTC 日查看页面访问和两个联系渠道：

```sql
SELECT
  toStartOfDay(timestamp) AS day_utc,
  index1 AS event,
  blob4 AS channel,
  SUM(_sample_interval * double1) AS events
FROM getgiffgaff_events_v1
WHERE timestamp >= NOW() - INTERVAL '28' DAY
  AND blob4 != 'seo_release_canary'
  AND index1 IN ('page_view', 'contact_click')
GROUP BY day_utc, event, channel
ORDER BY day_utc ASC, event ASC, channel ASC
```

按落地页和来源并排诊断 `page_view`、`commerce_click`、`contact_click`，并区分避坑页固定意图：

```sql
SELECT
  blob1 AS canonical_path,
  blob2 AS source,
  index1 AS event,
  blob4 AS channel_or_intent,
  SUM(_sample_interval * double1) AS events
FROM getgiffgaff_events_v1
WHERE timestamp >= NOW() - INTERVAL '7' DAY
  AND blob4 != 'seo_release_canary'
  AND index1 IN ('page_view', 'commerce_click', 'contact_click')
GROUP BY blob1, blob2, index1, blob4
ORDER BY events DESC
```

页面事件不是独立访客数。同一人刷新、重复打开弹窗或多次点击会产生多条记录，且不同事件之间没有访客或会话 ID 可供关联。`commerce_click` 还混合弹窗、内部联系导航、选卡/教程及快团团引导，不能作为 `contact_click` 的稳定漏斗分母。因此这里只能把各事件量作为独立趋势信号，不能计算用户级或顺序漏斗转化率。避坑页的 `before-purchase` / `after-purchase` 只用于比较两个固定分支的事件量，也不证明咨询送达。诊断咨询下滑时，还要与微信、Telegram 实际收到的咨询数按同一 UTC 日期对照；至少积累 7 个完整自然日后再判断趋势，积累 28 个完整自然日后才形成首版基线。

## 发布核验

发布探针使用以下固定请求，不得改成普通访客事件：

```http
POST /analytics-event-v1
Origin: https://getgiffgaff.com
Content-Type: application/json
x-getgiffgaff-release-probe: seo_release_canary_v1
x-getgiffgaff-release-probe-id: <每次请求独立生成的 64 位小写十六进制 ID>

{"version":"analytics_event_v1","path":"/","source":"direct","event":"page_view"}
```

- Preview：相同探针必须返回 404，证明 Preview 隔离；它不得触碰生产 binding。
- 生产：探针必须返回 204，并以 `index1 = 'seo_release_canary:<一次性探针 ID>'`、`blob4 = 'seo_release_canary'`、`blob5 = 一次性探针 ID` 写入。83 字节的唯一 index 未超过 Analytics Engine 的 96 字节限制，并使索引与精确查询键一致，避免从高流量或共享 index 中过滤稀有记录；该唯一索引只用于低频发布探针，不用于普通访客事件。204 只证明处理器接受了请求，不证明 SQL API 已经可见该点。
- 受控生产发布会使用本机 Wrangler 登录态取得 bearer credential（只在子进程内存中使用，不输出），随后通过 SQL API 有界重试并精确回读同一个 `blob5`；从生产 canary 请求开始的请求、退避与等待共用 8 分钟 wall-clock 硬截止，最多查询 19 次，查询时间窗为 30 分钟。2026-07-19 的生产证据显示记录已经写入、但在原 120 秒门限内仍不可查询，约 5 分多钟内才被首次观察到，因此只延长有界可见性窗口，不放宽索引、`blob4`、`blob5` 或响应结构断言。8 分钟是本次证据后的工程门限，不是 Cloudflare SLA；只有该行在截止前可查询时才允许报告 `deployed: true`。查询使用固定账号和数据集，凭证、探针 ID 都不写入 Git 或发布报告。
- 用下面的查询可人工确认近期生产探针可见。采样可能使加权结果不等于精确的请求次数；这里只检查“出现过”，不以它核对访客量。

```sql
SELECT
  toStartOfDay(timestamp) AS day_utc,
  SUM(_sample_interval * double1) AS canary_events
FROM getgiffgaff_events_v1
WHERE timestamp >= NOW() - INTERVAL '1' DAY
  AND index1 = 'seo_release_canary:<本次一次性探针 ID>'
  AND blob4 = 'seo_release_canary'
  AND blob5 = '<本次一次性探针 ID>'
GROUP BY day_utc
ORDER BY day_utc DESC
```

确认后，运营报表仍必须排除 `seo_release_canary`。Analytics Engine 当前保留期为三个月；超过保留期的数据不能依赖该数据集回查。

## 官方口径来源

- [Analytics Engine 入门与采样查询](https://developers.cloudflare.com/analytics/analytics-engine/get-started/)
- [SQL API](https://developers.cloudflare.com/analytics/analytics-engine/sql-api/) 与 [SQL statements](https://developers.cloudflare.com/analytics/analytics-engine/sql-reference/statements/)
- [运算符](https://developers.cloudflare.com/analytics/analytics-engine/sql-reference/operators/)、[日期时间函数](https://developers.cloudflare.com/analytics/analytics-engine/sql-reference/date-time-functions/) 与 [聚合函数](https://developers.cloudflare.com/analytics/analytics-engine/sql-reference/aggregate-functions/)
- [服务限制与三个月保留期](https://developers.cloudflare.com/analytics/analytics-engine/limits/)
