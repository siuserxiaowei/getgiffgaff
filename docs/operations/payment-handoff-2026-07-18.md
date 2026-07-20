# getgiffgaff 支付接入交接（2026-07-18）

> 状态更新（2026-07-19）：本文记录当前仓库候选，不构成生产部署证明。`/pay/` 是旧 URL 兼容别名，不是商品页、支付网关或订单系统。

## 当前仓库边界

- `GET` 或 `HEAD https://getgiffgaff.com/pay/` 只返回 `303`，目标为 `https://getgiffgaff.com/contact/#ktt-giga-card`。
- 响应头 `x-getgiffgaff-payment-mode` 固定为 `contact-qr-handoff`；这表示“回到联系页查看二维码”，不表示支付能力或支付结果。
- `/pay/` 不接收金额、订单号、地址、手机号、Cookie 或银行卡信息。来源请求的查询参数不会转发到 Contact 页。
- 响应保持 `noindex, nofollow, noarchive` 与 `private, no-store`；该旧路径不进入 sitemap。
- 当前站内购买指南只展示 Contact 页的快团团小程序码，不再提供指向 `/pay/` 的按钮。
- 仓库中没有经过核验的 G0/G2 商品直达链接。

仓库代码和二维码文件不能证明扫码后的 SKU、库存、价格、收款方、订单、支付、物流、退款或履约状态，也不能证明第三方页面当前由谁运营。用户扫码后必须在实际页面逐项核对；本站不得根据跳转、回跳或点击事件判断交易结果。

## 授权发布后的生产验证

```bash
curl -sS -D - -o /dev/null --max-redirs 0 https://getgiffgaff.com/pay/
curl -sS -I https://getgiffgaff.com/contact/ktt-giga-card.png
npm run verify:seo -- --base-url https://getgiffgaff.com --expected-url-count 46
```

预期：

- `/pay/` 返回 `303`，`Location` 为 `https://getgiffgaff.com/contact/#ktt-giga-card`，并带 `x-getgiffgaff-payment-mode: contact-qr-handoff`。
- 快团团小程序码返回 `200` 与 `Content-Type: image/png`。
- sitemap 保持批准的 46 个可索引 URL，且不包含 `/pay/`。

这些 HTTP 检查只验证本站的兼容跳转和静态图片，不能替代扫码后的商品、订单、付款、退款或履约核验。

## 未来交易能力的前置条件

当前 Cloudflare Pages 项目没有支付 Secret、订单数据库、支付会话 API 或 webhook。若未来要让本站发起交易并交给合规支付平台处理，必须先由业务负责人确认经营主体和适用地区，再申请相应商户能力；任何平台或支付方式都要以届时的官方准入、商品类别和账户审批结果为准。

立项前至少提供：

- 法律经营主体、注册地址、银行账户与已完成 KYC 的支付商户账户。
- G0/G2 的真实 SKU、服务端价格、币种、库存和每单限购。
- 发货国家/地区、运费、时效、承运商和地址处理流程。
- 已审核的隐私、交易条款、退款与物流政策。
- 供货、经销、品牌使用材料，以及含余额或预付权益商品的支付平台书面审核结果。

支付密钥不得进入 Git、聊天记录或构建产物，只能由账户所有者写入 Cloudflare encrypted secrets。订单和 webhook 的幂等状态应存入 D1 或独立交易数据库，不能使用 Cache API 或 KV 作为支付状态真相。

未来架构只能在上述条件齐全后实施：

```text
浏览器 -> POST /v1/payment-sessions -> 合规支付平台
支付平台 -> POST /v1/webhooks/provider -> 验签与金额核对 -> D1
```

只有验签并核对商户、内部订单、金额和币种后的 webhook 才能确认支付状态。浏览器成功跳转页只能显示“正在确认”，不得直接触发发货。
