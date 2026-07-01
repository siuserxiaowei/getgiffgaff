# getgiffgaff: giffgaff / GG 卡中文教程和避坑指南

这是 getgiffgaff.com 的公开引流仓库，用来沉淀 giffgaff 英国手机卡、GG 卡、G0 新卡、G2 有余额卡、国内激活、保号、充值、收短信、eSIM 和常见踩坑问题。

线上教程入口：

- [giffgaff 使用教程和避坑清单](https://getgiffgaff.com/guides/6-pitfalls/)
- [giffgaff 手机卡购买与中文教程首页](https://getgiffgaff.com/)
- [G0 / G2 手机卡商城](https://getgiffgaff.com/shop/)
- [购买前联系确认库存和余额范围](https://getgiffgaff.com/contact/)

## 适合谁看

- 想在国内购买 giffgaff 英国实体 SIM 卡的人。
- 已经有 GG 卡，但不清楚怎么激活、充值、保号或排查信号的人。
- 想用英国 +44 手机号作为海外平台备用号码，但不想被“万能验证码”说法误导的人。

## 先看结论

- G0 新卡适合会自己激活、能处理首次充值的人。
- G2 有余额卡更适合第一次购买、急用或不想卡在付款环节的人。
- giffgaff 保号不是放着不管，官方 inactive 规则要求 6 个月内至少有一次有效使用或充值。
- 国内收短信要同时看信号、漫游、号码状态、平台风控、IP 和设备环境，不承诺所有验证码都能送达。
- eSIM 切换后旧实体 SIM 或旧 eSIM 会停止工作，操作前必须确认账号、App、邮箱和短信验证都可用。

## 仓库内容

- [`docs/giffgaff-usage-pitfalls.md`](docs/giffgaff-usage-pitfalls.md)：GitHub Markdown 版使用教程和避坑清单。
- [`public/guides/6-pitfalls-page.txt`](public/guides/6-pitfalls-page.txt)：线上页面的 HTML 内容，由 Cloudflare Pages Worker 以 `/guides/6-pitfalls/` 返回。
- [`public/worker-logic.js`](public/worker-logic.js)：Cloudflare Pages Worker 热修逻辑，负责新增教程页、目录链接、sitemap 注入和联系页快团团弹窗。

## 重要边界

getgiffgaff 不是 giffgaff 官方运营商。号码状态、资费、漫游规则、活动、eSIM 流程和风控规则都可能变化，购买和操作前请以 giffgaff 官方当前页面与本站客服确认为准。

## 官方参考

- [Activating your giffgaff SIM](https://help.giffgaff.com/en/articles/240393-activating-your-giffgaff-sim)
- [Understanding why your number has been deactivated](https://help.giffgaff.com/en/articles/242797-understanding-why-your-number-has-been-deactivated)
- [Roaming charges with giffgaff](https://www.giffgaff.com/roaming-charges)
- [Everything to know about Credit](https://help.giffgaff.com/en/articles/240847-everything-to-know-about-credit)
- [Switching to an eSIM with giffgaff](https://help.giffgaff.com/en/articles/261570-switching-to-an-esim-with-giffgaff)
