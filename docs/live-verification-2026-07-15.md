# 生产域发布前验证记录（2026-07-15）

状态：`FAIL — production has not been promoted to the local v2 candidate`。

执行命令：

```bash
npm run verify:production
```

验证器对 `https://getgiffgaff.com` 报告 317 个问题。该数量是本次快照的诊断结果，不是长期 KPI；后续应以同一版本验证器重新执行后的结果为准。

主要失败组：

- 线上 sitemap 仍有 34 个 URL，而本地 manifest 期望 28 个；商城、商品、下单、人工充值和待合并页面仍在 sitemap，新信任页尚未上线。
- 线上索引页仍包含指向暂停交易路由的链接、销售 CTA、Product/Offer/FAQPage 等旧 Schema。
- `Authorization` 及 `otp`、`api_key`、`auth_token`、`id_token` 查询未被 400 拒绝，响应也没有 `private,no-store` 与完整 private robots 指令。
- `/privacy/`、`/terms/` 线上为 404；`/llms-full.txt` 仍为 200 而不是 410。
- 404 页面仍带其他页面的 canonical 与 `og:url`。

这份记录证明本地通过不等于生产通过。当前不得向 GSC/Bing/百度提交新 sitemap，不得恢复交易，也不得宣称本计划已经在线生效。

下一次生产验证必须在经批准的候选部署、缓存清理和 Cloudflare 规则核对之后进行；只有零错误结果才能把 G0 标记为通过。完整原始输出保留在本次 Codex 任务日志中，仓库只保存可执行摘要，避免把一次性 317 行日志当作长期来源。
