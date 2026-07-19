# 站内支付 readiness / NO-GO 门禁

> 当前结论（2026-07-19）：`NO-GO`。当前 `/pay/` 只是联系页交接，不是订单或支付系统。支付能减少已有购买意愿的付款摩擦，不能产生上游流量。

## 本地门禁

```bash
node scripts/growth-ops.mjs payment-gate --input /安全的本地路径/payment-readiness.json
```

```json
{
  "businessIdentityAndKyc": false,
  "serverSideSkuPriceStock": false,
  "reviewedPolicies": false,
  "ordersAndIdempotentWebhooks": false,
  "fulfillmentRefundReconciliation": false,
  "evidencePackageValidated": false,
  "paymentFrictionObserved": false
}
```

全部为 true 也只输出 `GO-FOR-CONTROLLED-PILOT-REVIEW`；仍须商户平台审批、法务/业务审核和明确实施授权。

## GO 必备证据

- [ ] 法律经营主体、注册地址、结算银行账户、适用地区与完成 KYC 的商户账户。
- [ ] 先选一个受控 SKU（优先低复杂度 G0），服务端保存价格、币种、库存和限购；浏览器金额不可作为真相。
- [ ] 隐私、交易条款、退款、物流政策已由事实负责人和适用专业人员审核；当前信息待确认页不能当完成状态。
- [ ] 订单数据库、支付 session API、webhook 验签、幂等键、金额/币种/商户核对和失败重试设计齐全。
- [ ] 发货、库存扣减、退款、售后和每日对账有负责人、SLA 与异常处理。
- [ ] G0/G2 的 SKU、订单、付款、履约、退款、售后脱敏证据包通过 `npm run validate:commerce-evidence -- --file ...`；结构通过仍不代替源系统复核。
- [ ] 至少 28 个连续完整 UTC 日显示消息量存在，且至少 10 条实际消息后的付款信号低于内部 10% 触发线；并经聊天原因/人工记录确认主要阻力确实是支付流程，而非价格、库存、信任或物流。

## 通过后的受控试点边界

只做一个 SKU、小库存、单地区、托管 Checkout；成功跳转页显示“确认中”。只有验签并核对后的 webhook 可标记付款和触发履约。密钥只放 Cloudflare encrypted secrets，不进 Git、聊天或构建产物；订单状态使用 D1 或交易数据库，不使用 Cache/KV 作为支付真相。

完整架构和现状证据见 [`payment-handoff-2026-07-18.md`](payment-handoff-2026-07-18.md) 与 [`cloudflare-and-commerce-evidence.md`](cloudflare-and-commerce-evidence.md)。
