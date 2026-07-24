# Uneed / TinyLaunch 双工具发布运行手册

状态：代码与素材已准备；按顺序只开放一个来源。  
预算：0；不购买插队、Premium、批量目录、badge 或链接交换。  
主目标：有效咨询，不以榜单、点赞或 DR 作为成功。

## 固定发布顺序

| 阶段 | 产品 | 平台 | 落地 URL | 开放条件 |
|---|---|---|---|---|
| 1 | UK SIM Keep-Number Reminder | Uneed 免费队列 | `https://getgiffgaff.com/tools/keep-number-reminder/?utm_source=dist_uneed` | 生产验证通过后提交 |
| 2 | UK SIM Keep-Number Reminder | TinyLaunch Standard Launch | `https://getgiffgaff.com/tools/keep-number-reminder/?utm_source=dist_tinylaunch` | 阶段 1 满 7 个完整 UTC 日 |
| 3 | China PAYG Roaming Cost Calculator | Uneed 免费队列 | `https://getgiffgaff.com/tools/china-roaming-cost/?utm_source=dist_uneed` | 阶段 2 满 7 日；费率证据仍有效并复核 |
| 4 | China PAYG Roaming Cost Calculator | TinyLaunch Standard Launch | `https://getgiffgaff.com/tools/china-roaming-cost/?utm_source=dist_tinylaunch` | 阶段 3 满 7 个完整 UTC 日 |

不得同时开放两个平台。平台登录、验证码、账户确认和真实 maker 资料由站点 owner 完成；不得虚构公司主体或 giffgaff 官方关系。

## 产品 1：Uneed / TinyLaunch 文案

- Name: `UK SIM Keep-Number Reminder`
- Tagline: `A private fifth-month calendar reminder for infrequently used UK SIMs.`
- Category: `Personal life products`
- Tags: `Travel`, `Productivity`, `Privacy`, `Utilities`
- Description: `Enter the date of your last qualifying giffgaff activity and export an early fifth-month reminder as a standard .ics calendar file. The calculation runs locally in your browser, requires no account and stores no phone number or account details. It is a reminder tool, not proof that a number is active.`
- Disclosure: `Independent utility for giffgaff users. Not affiliated with or endorsed by giffgaff.`
- OG image: `https://getgiffgaff.com/growth-assets/keep-number-reminder-og.png`

## 产品 2：Uneed / TinyLaunch 文案

- Name: `China PAYG Roaming Cost Calculator`
- Tagline: `Estimate China roaming Credit for data, SMS and calls using dated public rates.`
- Category: `Personal life products`
- Tags: `Travel`, `Calculator`, `Mobile`, `Utilities`
- Description: `Estimate how much giffgaff PAYG Credit data, sent SMS and single outgoing or incoming calls may consume in China. Each component is explained, the Travel Data Add-on is excluded, and numeric output stops after the dated evidence window expires.`
- Disclosure: `Independent utility for giffgaff users. Not affiliated with or endorsed by giffgaff.`
- OG image: `https://getgiffgaff.com/growth-assets/china-roaming-cost-og.png`
- Screenshot: `https://getgiffgaff.com/growth-assets/china-roaming-cost-screenshot.png`
- Evidence reviewed: `2026-07-24`
- Evidence expires: `2026-08-22`

## 统计和判断

运行 `npm run analytics:distribution`，固定输出按完整 UTC 日、工具 canonical path、来源和事件聚合：

`page_view → tool_result → commerce_click → contact_click`

匿名事件只包含 canonical path、白名单来源和事件。不得记录日期输入、用量、号码、账户、Cookie 或完整 URL。人工咨询单独只记录 `received`、`qualified`、`paid`，不声称跨设备归因。

### D7

- 强信号：单个平台至少 20 次访问、5 次有效工具结果、使用率至少 20%，并有至少 1 次商业或联系点击。
- 少于 10 次访问：`INSUFFICIENT_TRAFFIC`，不评价产品、不付费加速。
- 有访问但 0 工具结果：`OPTIMIZE_ONCE`，只允许优化一次英文首屏、演示图或输入说明。

### D28

- 成功：至少 1 条明确提及工具或平台的合格咨询；或至少 2 次来源可识别的联系点击且工具使用率至少 20%。
- 未达到：保留免费产品页和自然外链，停止主动推广，不购买曝光。

## 发布日操作

1. 打开生产 canonical、UTM 落地 URL、OG 图和截图，确认全部返回 200。
2. 用桌面和手机完成一次有效输入；确认结果后 CTA 才出现。
3. 确认未知 `utm_source` 不被接受，`dist_uneed` / `dist_tinylaunch` 能保留到匿名回执。
4. 以 owner 的真实身份登录平台并提交；遇到验证码或身份确认时由 owner 操作。
5. 记录平台公开产品 URL 和 UTC 上线时间。
6. 7 个完整 UTC 日内不改 title，不启动第二个平台。

## 禁止项

- 不安装 Uneed 或 TinyLaunch badge。
- 不承诺 dofollow，不做互链交换。
- 不购买 Uneed 插队、TinyLaunch Premium 或 100/110 目录批量提交。
- 不把 giffgaff 名称、费率或产品描述写成官方合作或背书。
- 漫游费率失效、来源不可访问或文字歧义时，停止数值输出和发布。
