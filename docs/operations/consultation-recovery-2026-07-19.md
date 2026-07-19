# 咨询链路恢复与观察记录（2026-07-19）

> 状态：咨询入口和漏斗测量能力已部署上线；当前正式版本以生产 `/release-provenance.json` 返回的完整 Git SHA 为准。本文只证明链路与测量能力已经发布，不表示咨询量已经恢复。

## 诊断与发布证据

| 资产 | SHA-256 | 离线二维码解码结果 |
| --- | --- | --- |
| `/contact/wechat-qr.jpg` | `751f8055949c3ee5d13a69dae6eef3aeef925a9e6f8dda1ca00b48e0399e1b43` | `https://u.wechat.com/MOlSxFZ7nu5enWrw4HtvKC4` |
| `/contact/telegram-qr.jpg` | `9a6ed7d1e30acc7dc35d2dabe2e1078cd2cd0b3ceaecd7bf1d716fa5c1b1b3fa` | `https://t.me/xiaoyuhuai` |

当前发布还具备以下代码级证据：

- Contact 页和全站咨询组件使用上述微信、Telegram 链接及二维码；旧 `/contact/wechat-qr.png` 会永久跳转到新的 `.jpg` 文件。
- Preview 与生产验证脚本会读取两张二维码并核对状态码、JPEG 类型、非空内容和固定 SHA-256，防止静态资产在发布时被误换。
- `/pay/` 只是旧路径兼容：它返回 `303` 到 `/contact/#ktt-giga-card`，让用户查看快团团小程序码，不建立商品、订单或支付链路。详细边界见[支付接入交接](payment-handoff-2026-07-18.md)。
- 咨询点击只写入事件级 Analytics Engine 数据。字段、采样和 canary 排除规则见[咨询漏斗 Analytics Engine 口径](analytics-funnel.md)。

文件哈希和离线解码只能证明“发布文件未变”和“二维码编码了哪个 URL”，不能证明账号归属、账号仍可用、第三方应用能拉起或客服会收到消息。

## 上线后的真机验收

`curl`、桌面浏览器和自动化测试不能证明微信 Universal Link 会在真实手机上拉起微信。生产部署完成后，至少覆盖以下矩阵，并保存日期、系统版本、入口、实际结果和必要的脱敏截图：

| 环境 | 微信直达链接 | Telegram 直达链接 | 用另一台设备扫描两张二维码 |
| --- | --- | --- | --- |
| iOS，微信外 | 记录打开网页、App 或失败 | 记录打开网页、App 或失败 | 核对实际落地目标与账号显示 |
| iOS，微信内 | 记录微信内实际行为 | 记录微信内实际行为 | 核对实际落地目标与账号显示 |
| Android，微信外 | 记录打开网页、App 或失败 | 记录打开网页、App 或失败 | 核对实际落地目标与账号显示 |
| Android，微信内 | 记录微信内实际行为 | 记录微信内实际行为 | 核对实际落地目标与账号显示 |

验收时必须记录真实结果，不能把“预期会打开 App”预填为通过。若出现中间页、应用未安装、地区限制或微信内拦截，也要原样记录。二维码或链接点击成功仍不证明消息已发送、客服已收到、订单已生成或付款已完成；若要做收发消息测试，需由渠道所有者确认测试账号并人工核对接收端。

## Analytics 发布核验

- Pages Preview 的合法 analytics probe 必须返回 404，且不得触碰生产 binding。
- 生产 canary 必须返回 204，并写入查询键对齐的 `index1 = 'seo_release_canary:<一次性探针 ID>'`、`blob4 = 'seo_release_canary'` 与一次性 `blob5` 探针 ID。204 只证明处理器接受请求；受控生产发布随后必须在最多 19 次、8 分钟 wall-clock 硬截止内通过 SQL API 精确回读同一个 ID，回读失败时不得报告 `deployed: true`。该门限覆盖本次观测到的数分钟可见性延迟，不是 Cloudflare SLA。
- 所有运营查询必须排除 `seo_release_canary`，并用 `SUM(_sample_interval * double1)` 处理采样。

## D1–D7 诊断与 D1–D28 基线

D1 定义为生产部署完成后的首个完整 UTC 自然日；发布当日不计入 D1。按同一 UTC 日期记录下列数据：

- `page_view → commerce_click → contact_click` 的采样加权事件量与微信、Telegram 渠道拆分。
- 微信和 Telegram 人工实际收到的咨询数，只记录聚合计数，不把聊天内容或个人信息写入仓库。
- 真机链路故障、渠道不可用时段、代码发布和推广活动等可能影响解释的事件。

D1–D7 每日查看，用来发现页面访问、咨询组件打开、渠道点击或实际咨询之间是否有明显断点；7 天只形成诊断趋势。D1–D28 继续按日采集、按周汇总，28 个完整 UTC 自然日后形成首版基线。

Analytics 数据没有访客或会话 ID，无法把三类事件串成用户级漏斗。事件间比例只能作为诊断信号，不是独立用户转化率；点击也不能推断消息、订单、支付、收入、退款或履约转化。
