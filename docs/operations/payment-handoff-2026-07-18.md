# getgiffgaff 支付接入交接（2026-07-18）

## 当前已上线模式

- 支付入口：`https://getgiffgaff.com/pay/`
- 当前提供方：快团团托管下单与支付。
- `/pay/` 不接收金额、订单号、地址、手机号、Cookie 或银行卡信息；只以 `303` 跳转到本站 Contact 页的快团团小程序码。
- 响应固定为 `noindex, nofollow, noarchive` 与 `private, no-store`，并丢弃来源请求中的查询参数。
- G0/G2、微信小玉、快团团二维码、旧教程正文和紫色视觉继续保留。

这不是站内支付网关。商品、金额、库存、收货地址、支付状态与退款仍由快团团承接；本站不得根据浏览器回跳自行判断“已付款”。

## 生产验证

```bash
curl -sS -D - -o /dev/null https://getgiffgaff.com/pay/
curl -I https://getgiffgaff.com/contact/ktt-giga-card.png
npm run postdeploy
```

预期：

- `/pay/` 返回 `303`，Location 为 `https://getgiffgaff.com/contact/#ktt-giga-card`。
- 快团团小程序码返回 `200 image/png`。
- sitemap 仍只有 39 个可索引 URL；支付入口不进入 sitemap。

## 站内托管收银台尚缺的外部条件

当前 Cloudflare Pages 项目没有支付 Secret、订单数据库、checkout API 或 webhook。要升级为真正站内发起、支付平台托管收银台，需要业务负责人先确定并开通以下任一合规商户路径：

1. 真实英国/香港主体：Stripe Checkout；再按账户审批结果启用银行卡、Alipay、WeChat Pay。
2. 中国大陆合格企业主体：微信支付或支付宝网站支付；需满足商户、网站备案和行业材料要求。

中国大陆不在 Stripe 直接开户地区：[Stripe global availability](https://stripe.com/global)。Paddle 与 Lemon Squeezy 不接受实体商品，不用于实体 SIM。

## 原生支付上线前必须提供

- 法律经营主体、注册地址、银行账户与已完成 KYC 的支付商户账户。
- G0/G2 的真实 SKU、服务端价格、币种、库存和每单限购。
- 发货国家/地区、运费、时效、承运商和地址处理流程。
- 已审核的隐私、条款、退款与物流政策。
- 供货/经销/品牌使用材料，以及含余额或预付权益商品的支付平台书面审核结果。

支付密钥不得进入 Git、聊天记录或构建产物，只能由账户所有者写入 Cloudflare encrypted secrets。订单与 webhook 幂等状态应存入 D1 或独立交易数据库，不能使用 Cache API 或 KV 作为付款真相。

## 推荐原生架构

```text
浏览器 -> POST /v1/checkout -> 支付平台托管收银台
支付平台 -> POST /v1/webhooks/provider -> 验签 -> D1
```

只有验签并核对商户、内部订单、金额和币种后的 webhook 才能把订单改为已付款。成功跳转页只显示“正在确认”，不得触发发货。
