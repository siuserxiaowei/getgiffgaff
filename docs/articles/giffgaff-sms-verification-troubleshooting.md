# giffgaff 收不到短信验证码怎么排查

> [!CAUTION]
> 状态：`ARCHIVED / NOT FOR PUBLISHING`（2026-07-15）。本文保留用于历史研究，可能包含已暂停的交易链接、旧周期或未通过 Claim Registry 的声明；不得复制到网站、OG、Schema、CTA 或 `/llms.txt`。现行内容以 `public/route-manifest.js`、`public/claim-registry.js` 和本地页面渲染器为准。

giffgaff 收不到短信验证码，不一定是卡坏了。GG 卡在国内使用时，验证码送达会受到信号、漫游、号码状态、平台风控、IP、设备和请求频率影响。

线上教程：[giffgaff 使用教程和避坑清单](https://getgiffgaff.com/guides/6-pitfalls/)

## 先分清两种情况

第一种是所有短信都收不到，包括普通短信和官方短信。这时优先排查 SIM、信号、漫游、手机和账号状态。

第二种是普通短信能收到，但某个平台验证码不到。这时更可能是目标平台的风控、号码限制、IP、设备或账号资料问题。

## 排查顺序

建议按这个顺序来：

1. 确认 giffgaff 账号能登录，号码还在账号里。
2. 确认 SIM 已激活，没有被停用。
3. 确认手机无锁，SIM 接触正常。
4. 打开数据漫游和短信相关权限。
5. 重启手机，等待网络注册。
6. 仍然无信号时，尝试手动选网或换手机测试。
7. 先测普通短信，再测平台验证码。
8. 某个平台失败时，不要连续狂点验证码，先停一段时间。

官方排查参考：

- [Network & Service Troubleshooting](https://help.giffgaff.com/en/articles/639659-network-service-troubleshooting)
- [How to perform a Manual Roam](https://help.giffgaff.com/en/articles/258873-how-to-perform-a-manual-roam)

## 为什么普通短信能到，验证码不到

常见原因包括：

- 平台不接受该号段或英国号码。
- 账号环境异常。
- IP 和手机号国家不匹配。
- 同一设备请求过多。
- 同一号码短时间请求过多验证码。
- 平台把该号码判断为高风险。

这种时候继续点验证码通常没用，反而可能加重风控。

## 国内使用要注意漫游

中国属于英国/EU 之外的漫游场景。接收短信通常不是你最担心的扣费点，主动发短信、打电话、使用移动数据才更容易产生资费。操作前先看余额和当前官方资费。

官方资费页：[Roaming charges with giffgaff](https://www.giffgaff.com/roaming-charges)

## 联系售后前准备什么

如果你是从 getgiffgaff 购买，联系售后前建议准备：

- 订单信息。
- 手机型号和系统版本。
- 当前所在城市。
- 是否能登录 giffgaff 账号。
- 是否有信号截图。
- 是否能收到普通短信。
- 具体哪个平台验证码不到。

信息越完整，越容易判断是卡状态、设备、漫游还是平台风控。

## 继续阅读

- [giffgaff 手机卡国内激活步骤和常见问题](giffgaff-activation-in-china.md)
- [giffgaff 保号规则：6 个月不用会怎样](giffgaff-keep-number-active.md)
- [GG 卡是什么？giffgaff 英国手机卡适合谁用](gg-card-guide.md)
