# Analytics Engine 只读日报

运行：

```bash
npm run analytics:report
```

该命令只通过本机 Wrangler 登录态读取固定 Cloudflare Analytics Engine SQL；不会请求 `/analytics-event-v1`、不会写发布探针，也不会输出凭证。输出按 UTC 聚合最近 28 个已结束自然日的固定白名单事件，并排除 `seo_release_canary`。

`D1`、`D7`、`D28` 只在对应的每个完整 UTC 日都至少有一条返回的白名单事件记录时显示 `READY`。任何没有返回行的日期都显示为 `MISSING`，窗口状态保持 `HOLD`，不会把它擅自解释为 0 流量。

事件量是 `SUM(_sample_interval * double1)` 的采样加权事件量，不是独立访客、会话或顺序漏斗；联系点击也不代表消息送达或成交。
