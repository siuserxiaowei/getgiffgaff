# Google / Microsoft 搜索广告实验门禁

> 当前结论（2026-07-19）：`NO-GO`。本站已有 Bing 自然点击信号，但不足 7 个连续完整 UTC 日；固定 `paid_google` / `paid_microsoft` 归因也必须先生产部署并通过 Analytics Engine 回读。本文不会创建广告或授权花费。

## 本地门禁

把已人工确认的布尔值写入仓库外 JSON，再运行：

```bash
node scripts/growth-ops.mjs ads-gate --input /安全的本地路径/ads-readiness.json
```

```json
{
  "explicitOwnerAuthorization": false,
  "paidAttributionDeployedAndReadBack": false,
  "sevenCompleteUtcDays": false,
  "qualifiedConsultationRecorded": false,
  "contributionMarginKnown": false,
  "landingPageAndPolicyReviewed": false,
  "budgetAndStopLossApproved": false
}
```

全部为 true 也只输出 `GO-FOR-MANUAL-CAMPAIGN-REVIEW`，不是自动创建授权。

## 每项通过证据

| Gate | 必须保留的证据 |
| --- | --- |
| explicit owner authorization | 账户所有者批准平台、地区、总预算、日预算、日期、付款方式和停止条件 |
| paid attribution deployed/read back | 生产事件能分别回读 `paid_google`、`paid_microsoft`，且不包含搜索词或个人信息 |
| seven complete UTC days | 7 个连续完整日的事件 + 实际消息/合格咨询/付款台账 |
| qualified consultation recorded | 统一且已实际使用的“合格咨询”定义，而不是所有点击/消息 |
| contribution margin known | 单笔收入减商品、发货、手续费、退款/售后预期成本；记录币种与取数日 |
| landing page/policy reviewed | 页面与广告意图一致；价格/库存不做无法核验的承诺；隐私和交易事实经负责人审核 |
| budget and stop-loss approved | 预先批准最大总损失、单日限制、单个合格咨询最高成本和无效词暂停规则 |

## 通过后的最小实验设计

- Google 与 Microsoft 分开 campaign 和固定 UTM；绝不共用 `search` 或伪装成自然分发。
- 只投英国 SIM/giffgaff 购买、激活、保号等高意图精确/词组匹配；上线前人工复核品牌、商标和平台政策。
- 先用相同落地页、相同地区/时间、相同合格咨询定义做可比测试；搜索词报告每日人工加否定词。
- 不使用客户名单、手机号、聊天内容、相似受众或未经同意的再营销。
- KPI 顺序：合格咨询数 → 每个合格咨询成本 → 付款 → 贡献毛利；点击、CTR 只作诊断。
- 建议先运行 7–14 日且设硬总额。具体金额必须由账户所有者根据当时单笔贡献毛利批准，本文不替用户决定或花费。

停止条件：累计广告支出达到批准的硬总额；归因失效；落地页/联系方式故障；产生合格咨询但其成本超过批准上限；或连续达到预先约定的最小样本仍无合格咨询。不能在启动后临时放宽止损来“等优化”。
