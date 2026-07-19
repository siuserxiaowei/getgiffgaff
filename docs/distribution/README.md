# getgiffgaff 首批站外引流文章包

更新日期：2026-07-19

本目录用于把站内已有的证据型页面，改写成可分别发布到公众号、知乎和小红书的原创内容。每篇只解决一个问题，只设置一个站内主落地页；运营商规则仍链接 giffgaff 官方来源。

这些稿件不是“批量发外链”模板。发布者应按平台重新组织开头、段落和配图，不要把同一全文同时复制到多个平台，也不要在评论区重复刷链接。

## 首批六篇与发布顺序

| 顺序 | 文章包 | 首发平台建议 | 主落地页 | 为什么先发 |
| --- | --- | --- | --- | --- |
| 1 | [保号第 5 个月检查法](01-keep-number-fifth-month.md) | 小红书 → 公众号 | `/tools/keep-number-reminder/` | 清单和日历工具适合收藏，也不依赖库存或价格 |
| 2 | [验证码二分诊断](02-sms-otp-binary-diagnosis.md) | 知乎 → 公众号 | `/guides/4-signal/` | 直接回答“卡坏了还是平台问题”，承接现有故障搜索 |
| 3 | [中国漫游费用怎么算](03-china-roaming-cost.md) | 知乎 → 公众号 | `/tools/china-roaming-cost/` | 计算场景明确，但每次发布前必须复核动态费率 |
| 4 | [收卡 7 步验收](04-arrival-seven-step-checklist.md) | 小红书 → 公众号 | `/guides/7-arrival-checklist/` | 适合做图卡，也自然连接购买后的实际任务 |
| 5 | [G0/G2 六个概念](05-g0-g2-concepts.md) | 知乎 → 公众号 | `/answers/` | 纠正“官方型号”误解，购买意图较强，必须保留商业披露 |
| 6 | [英国手机卡选择六问](06-uk-sim-six-questions.md) | 知乎 → 小红书 | `/guides/8-uk-sim-choice/` | 承接更宽的英国手机卡需求，不写无证据的运营商排名 |

建议每隔 2–3 天发布一篇首发稿。同一选题在第二个平台发布前，至少重写标题、首屏、内容顺序、例子、配图和结尾；不要只换几个同义词。平台间隔不是排名保证，只是为了让编辑和读者拿到真正适配平台的版本。

## 平台去重规则

### 公众号

- 使用完整正文或公众号改写版，适合 1,200–2,000 字。
- 用一张封面、2–4 张证据截图或自制流程图。
- 主链接放在首次形成判断之后，文末可再出现一次同一链接；不要塞多个销售入口。
- 运营商事实旁保留官方来源和核验日期。

### 知乎

- 从具体问题起笔，前 150 字先给答案和适用边界。
- 正文采用“判断标准 → 操作顺序 → 常见误区”的结构，不复制公众号故事开头。
- 主落地页放在清单或计算方法之后；链接前解释读者为什么需要它。
- 不重复发布低质近义回答，不用多个账号铺同一链接。

### 小红书

- 使用 6–9 张原创图卡，正文控制在可扫读的清单结构。
- 首图标题和正文标题可以不同，但不能用“必到”“永久”“零成本”等承诺。
- 如果账号/内容形态不能放可点击链接，只写完整工具名或站点名，不用“私信关键词”批量引导。
- 不把其他平台截图、竞品配图或运营商后台界面当作自己的素材。

## UTM 链接模板

生产站只接受一个固定的 `utm_source`。不要添加 `utm_medium`、`utm_campaign`、`utm_content`、`utm_term`，也不要把文章名、作者名、群名、手机号或合作方名称写进 URL。

| 场景 | 模板 |
| --- | --- |
| 微信公众号 | `https://getgiffgaff.com/{path}/?utm_source=dist_wechat_official` |
| 小红书 | `https://getgiffgaff.com/{path}/?utm_source=dist_xiaohongshu` |
| 微信社群转发 | `https://getgiffgaff.com/{path}/?utm_source=dist_wechat_group` |
| 私聊分享 | `https://getgiffgaff.com/{path}/?utm_source=dist_private_share` |
| 经人工确认的合作发布 | `https://getgiffgaff.com/{path}/?utm_source=dist_partner` |
| 知乎及未配置白名单的平台 | 使用不带 UTM 的 `https://getgiffgaff.com/{path}/` |

例：

```text
公众号：https://getgiffgaff.com/tools/keep-number-reminder/?utm_source=dist_wechat_official
小红书：https://getgiffgaff.com/tools/keep-number-reminder/?utm_source=dist_xiaohongshu
知乎：https://getgiffgaff.com/tools/keep-number-reminder/
```

生成链接也可以使用仓库现有命令：

```bash
node scripts/growth-ops.mjs utm --source wechat_official --path /tools/keep-number-reminder/
node scripts/growth-ops.mjs utm --source xiaohongshu --path /tools/keep-number-reminder/
```

## 每篇发布前的固定检查

1. 重新打开稿件列出的 giffgaff 官方来源，核对规则、路径、费率和日期是否仍一致。
2. 确认主落地页可正常打开，标题和正文没有过期状态。
3. 使用本次平台对应的链接；没有白名单来源就使用干净链接。
4. 补上真实截图或使用自制信息图。不能用提示词生成假的后台、订单、信号、余额或验证码结果。
5. 删除任何无法证明的“亲测”“成功率”“很多用户都这样”“最低价”和合作关系表述。
6. 涉及 getgiffgaff 商品、咨询或销售入口时，保留独立第三方身份和商业披露。
7. 图片不展示手机号、邮箱、订单详情、激活码、SIM 序列号、验证码、支付信息、eSIM 二维码或其他凭证。

## 通用身份与商业披露

涉及 G0/G2、购买、库存或咨询入口的稿件，至少在读者第一次接触站点或销售入口时加入：

> getgiffgaff 是独立第三方中文教程与销售服务站，不是 giffgaff Limited 官方网站、官方客服或授权代表。G0/G2 是本站销售与教程中的库存/状态分类，不是 giffgaff 官方 SKU、套餐或账户等级。

涉及本站自有销售或服务入口时，再加入：

> 商业披露：本文涉及 getgiffgaff 自有服务/销售入口；正文中的运营商事实均链接至 giffgaff 官方来源。

## 结果边界

- 发布文章和添加链接不保证 Google/Bing 收录、排名、点击、咨询或订单。
- 不买链、不换链、不要求发布者使用关键词锚文本或 dofollow。
- 有对价的第三方发布必须显眼披露；链接按平台和 Google 规则使用 `rel="sponsored"`，必要时同时使用 `nofollow`。
- 每个平台版本的真实发布日期、URL、状态和后续修改应单独记录，不预填点击、咨询或成交。
