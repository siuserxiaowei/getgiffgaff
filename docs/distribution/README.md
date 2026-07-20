# getgiffgaff 首批站外引流文章包

更新日期：2026-07-20

本目录把站内已有的证据型深层页改写为可分别适配公众号、小红书等渠道的原创内容。每篇只解决一个明确问题，并只指向一个对应深层页；运营商规则仍应链接到 giffgaff 官方来源。

开始前请先看：[平台发布操作手册](platform-publishing-playbook.md)。它写明了今天能做什么、平台登录/扫码状态，以及哪些内容必须停住。

首批文章的原创封面与竖版图卡已放在：[配图目录](assets/README.md)。图片只负责解释问题，不能替代当天的官方来源截图、身份披露或平台规则核验。

## 不需要填写“空白台账”

空白台账完全可选。它若被使用，只是帮助运营者记住真实发布日期、文章 URL、所用渠道和后续修改；不填写也不会影响站点、文章或搜索引擎。

它不会带来 Google/Bing 收录、排名、点击、咨询或外链。不要预填浏览量、咨询、成交或“已收录”等未知结果，也不要为了“完成台账”而发布不满足门禁的文章。

## 站外文章怎样连接到咨询

正确的路径不是“发大量链接”，而是让读者先得到一个完整、可核查的答案：

```text
平台上的原创问题解答
  → 一篇文章只放一个相关的站内深层页
  → 深层页继续用现有内链补足相邻问题
  → 读者自愿打开站内咨询入口，选择微信或 Telegram
```

例如，讲“英国手机卡怎么选”的文章应链接到 `/guides/8-uk-sim-choice/`，而不是主页或商品页。深层页解释选择条件、连接相关教程，并在读者确有需要时提供站内咨询入口。文章本身带来的可以是渠道访问；是否继续阅读、是否咨询，都由读者自主决定。

站内统计只能按来源查看聚合的页面访问和联系点击，不能把一次点击认定为一个人、一次咨询或一笔成交，也不能从几天数据推断排名变化。

## 当前真实发布优先级

下表取代按编号机械发布的顺序。`条件发布`表示发布当天的来源、截图、页面、披露和平台门禁必须全部通过；任一项不通过就不发。

| 状态 | 文章包 | 对应深层页 | 当前动作 |
| --- | --- | --- | --- |
| 条件发布，优先 1 | [06 英国手机卡六问](06-uk-sim-six-questions.md) | `/guides/8-uk-sim-choice/` | 优先做公众号版；小红书必须另做图卡和重写版。当前不发知乎。 |
| 条件发布，优先 2 | [01 保号第 5 个月检查法](01-keep-number-fifth-month.md) | `/tools/keep-number-reminder/` | 优先做小红书版，再做公众号重写版；发布稿必须补上独立第三方身份披露。 |
| 条件发布，优先 3 | [02 验证码二分诊断](02-sms-otp-binary-diagnosis.md) | `/guides/4-signal/` | 优先做公众号或小红书重写版；发布稿必须补上独立第三方身份披露，且不得承诺 OTP 送达。 |
| 暂缓 | [04 收卡 7 步验收](04-arrival-seven-step-checklist.md) | `/guides/7-arrival-checklist/` | 保留为后续中立教育素材；涉及到手、销售语境和商业披露，页面、来源、身份及出版方政策门禁未闭环前不发布或外联。 |
| 不首发 | [05 G0/G2 六个概念](05-g0-g2-concepts.md) | `/answers/` | 不作为首批引流稿。G0/G2 是本站库存/状态分类，缺真实 SKU、履约、退款等业务事实；不得以此做购买导向分发或外链。 |
| 禁止发布/转发/外联 | [03 中国漫游费用怎么算](03-china-roaming-cost.md) | `/tools/china-roaming-cost/` | 漫游工具仍是 `release-gated`；费率动态且工具结果不可传播。不得以“重新核验费率”为由绕过该门禁。 |

知乎不是本轮可用渠道。现有知乎草稿明确处于 `BLOCKED`：除了登录/扫码，还缺账号类型、当日适用规则、链接与商业披露方式的独立复核。详情见[平台发布操作手册](platform-publishing-playbook.md#知乎当前阻塞不发布)。

## 三个条件发布稿的准确链接

生产站只接受一个固定的 `utm_source`。不要添加 `utm_medium`、`utm_campaign`、`utm_content`、`utm_term`，也不要把文章名、作者名、群名、手机号或合作方名称写进 URL。

| 文章包 | 公众号 | 小红书 | 知乎（当前禁止发布；仅说明格式） |
| --- | --- | --- | --- |
| 06 英国手机卡六问 | `https://getgiffgaff.com/guides/8-uk-sim-choice/?utm_source=dist_wechat_official` | `https://getgiffgaff.com/guides/8-uk-sim-choice/?utm_source=dist_xiaohongshu` | `https://getgiffgaff.com/guides/8-uk-sim-choice/` |
| 01 保号第 5 个月检查法 | `https://getgiffgaff.com/tools/keep-number-reminder/?utm_source=dist_wechat_official` | `https://getgiffgaff.com/tools/keep-number-reminder/?utm_source=dist_xiaohongshu` | `https://getgiffgaff.com/tools/keep-number-reminder/` |
| 02 验证码二分诊断 | `https://getgiffgaff.com/guides/4-signal/?utm_source=dist_wechat_official` | `https://getgiffgaff.com/guides/4-signal/?utm_source=dist_xiaohongshu` | `https://getgiffgaff.com/guides/4-signal/` |

其他已允许的分发来源只有：微信社群 `dist_wechat_group`、私聊分享 `dist_private_share`、经过人工确认的合作发布 `dist_partner`。未在白名单的平台使用没有 UTM 的干净 canonical URL。

可用仓库命令生成链接：

```bash
node scripts/growth-ops.mjs utm --source wechat_official --path /guides/8-uk-sim-choice/
node scripts/growth-ops.mjs utm --source xiaohongshu --path /tools/keep-number-reminder/
```

## 每篇发布前的固定检查

1. 重新打开稿件列出的官方来源，核对规则、路径、费率和日期是否仍一致；不一致就删改相应说法，不靠旧截图继续发。
2. 用手机和桌面各打开一次主落地页，确认标题、正文、官方来源和咨询入口都正常；只保留一个站内深层页链接。
3. 使用本次平台对应的 URL；没有白名单来源就使用干净 URL。
4. 截取发布当天的公开官方页面，或制作原创信息图。不能用 AI 或修图伪造后台、订单、信号、余额、验证码、账单或用户案例。
5. 删除无法证明的“亲测”“成功率”“很多用户都这样”“最低价”“官方合作”等表述。
6. 在读者第一次接触站点、销售语境或咨询入口前，放入适用的身份与商业披露。
7. 图片、正文和链接中都不得出现手机号、邮箱、订单详情、激活码、SIM 序列号、验证码、支付信息、eSIM 二维码或其他可复用凭证。

## 身份与商业披露

条件发布的 01、02、06 均至少在首次提到站点或链接之前加入：

> getgiffgaff 是独立第三方中文教程与销售服务站，不是 giffgaff Limited 官方网站、官方客服或授权代表。本文提供的是教程或选择方法；运营商规则以发布当天重新核验的官方页面为准。

若文章含本站销售、咨询或其他商业入口，再同时加入：

> 商业披露：本文涉及 getgiffgaff 自有服务/销售入口；正文中的运营商事实均链接至 giffgaff 官方来源。

## 什么才算真实外链

自己在公众号、小红书或社群发布文章，是内容分发与渠道访问，不自动构成可计入 SEO 的“真实外链”。真实的 earned link 只能是独立编辑或维护者在其允许的流程中，自主决定采用、引用或链接某一资源。

- 不买链、不换链、不群发邮件、不刷评论、不用多个账号铺同一链接。
- 不要求关键词锚文本、dofollow、固定位置、保留期限、背书或排名承诺。
- 目标方可以只引用官方来源、使用 nofollow/sponsored、不给链接，或直接拒绝；这都是其编辑决定。
- 任何对外编辑联系前都要先通过目标平台政策、事实、资产、身份和商业披露门禁；候选名单不等于允许联系。

## 结果边界

- 发布文章、获得访问或被编辑引用都不保证 Google/Bing 收录、排名、点击、咨询或订单。
- 不把短期页面访问、联系点击或一两条留言写成“流量恢复”。至少积累 7 个完整 UTC 日的同口径数据后再判断趋势。
- 真实发布日期、文章 URL、内容修改和实际收到的咨询数，如需记录可以自行记录；该记录只用于复盘，不是排名动作。
