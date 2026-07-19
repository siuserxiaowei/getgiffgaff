# Microsoft Advertising 搜索广告 7 日小额测试手册

更新与核验日期：2026-07-19

适用站点：`https://getgiffgaff.com/`

当前状态：**只允许建立暂停草稿，暂不允许启用或产生花费。**

本文给账户所有者一套可以手动照做的 Microsoft Advertising（原 Bing Ads）搜索广告测试。它不会创建广告、绑定付款方式、启用 campaign 或授权任何花费，也不承诺点击、咨询、订单或利润。

后台菜单会因账户地区、权限、实验版 UI 和语言而变化。本文没有登录用户的 Microsoft Advertising 账户实时核对界面；下文点击路径按常见 Web 控制台写法提供，若名称不同，以同页的 `Campaigns / Tools / Goals / Billing` 等等价入口和 Microsoft 当前官方帮助为准。不要因为界面不同而跳过门禁。

## 1. 为什么先测 Microsoft，而不是同时投 Google

截至 2026-07-19，仓库保存的账号现场快照是：

| 渠道 | 时间窗 | 已观察数据 |
| --- | --- | --- |
| Bing Web + Chat | 2026-07-12 至 2026-07-18 | 75 clicks / 918 impressions / CTR 8.17% / average position 5.9 |
| Google Search Console | 后台所选近 3 个月 | 1 click / 6 impressions / CTR 16.7% / average position 21.8 |

Bing 中 `/guides/6-pitfalls/` 已观察到 50 clicks / 683 impressions，是目前最明确的搜索发现入口。因此，**先在 Microsoft 做一个单渠道、单目标、7 日受控测试**，比同时拆预算到 Google 更容易判断结果。

这只是基于现有短窗口数据的测试优先级，不证明 Microsoft Ads 一定便宜或一定带来咨询；Google 自然搜索数据也不能直接预测 Google Ads。只有 Microsoft 测试达到本文的经济性条件后，才另建完全分离的 Google 实验，使用 `utm_source=paid_google`，不得把两个渠道混在一个结果里。

## 2. 启用前硬门槛

下面任何一项为空或为否，campaign 必须保持 `Paused`，可以继续完善草稿，但不能上线。

| 门槛 | 账户所有者必须填写或保留的证据 | 当前手册结论 |
| --- | --- | --- |
| 明确授权 | 平台、投放地区、开始/结束日期、账户币种、付款方式、日预算、7 日最大总损失、暂停人 | 待填写 |
| 7 个完整 UTC 日 | 站点事件与真实消息、合格咨询、报价、付款的连续 7 日聚合记录 | 2026-07-19 时尚未满足 |
| 合格咨询定义 | 使用本文第 11 节的定义，负责人确认并实际使用 | 待确认 |
| 单笔贡献毛利 | 收入减商品、发货、支付费用、预期退款和售后变动成本；写明币种与取数日 | 待填写 |
| 预算与止损 | `H`、`D`、`CPAq_max`、`CPC_cap` 和最小样本数均已批准 | 待填写 |
| 落地页和政策审核 | 页面内容与广告一致；库存、价格、身份、交易、隐私、商标和广告政策经负责人审核 | 当前不能假定通过 |
| 归因回读 | 生产能回读 `paid_microsoft` 的页面/联系事件，且真机联系链路可用 | 上线前重新实测 |

还必须人工确认以下事项：

- getgiffgaff 是独立第三方服务站，不能在账户、广告或扩展中写成 giffgaff 官方、官方客服、授权代表或运营商。
- 投放前复核 Microsoft Advertising 当前商标、编辑和误导性内容政策，以及使用 `giffgaff` 品牌词和域名的实际许可边界。被拒登时停止并按真实材料申诉，不换拼写、换账户或换域名规避审核。
- 当前站内政策页仍有待经营负责人确认的事实。隐私、交易、退款和物流说明未审核完成前，不勾选“落地页和政策已审核”。
- 不使用客户名单、手机号、聊天内容、相似受众、再营销、Audience Network、Performance Max、动态搜索广告或自动应用建议。

仓库门禁可在填好仓库外 JSON 后只读检查：

```bash
node scripts/growth-ops.mjs ads-gate --input /安全的本地路径/ads-readiness.json
```

只有输出 `GO-FOR-MANUAL-CAMPAIGN-REVIEW` 才能进入最终人工审核；该输出本身仍不是启用授权。

## 3. 测试目标与测量边界

### 业务目标

首要目标不是点击量，而是获得“合格购买前咨询”，并判断每条合格咨询成本是否低于负责人批准的上限。

KPI 顺序固定为：

1. 合格购买前咨询数；
2. 每条合格咨询成本 `CPAq = Microsoft 实际花费 / 合格咨询数`；
3. 报价数与付款数；
4. 已实现贡献毛利；
5. 点击、CTR、平均 CPC 只用于诊断。

### 当前站点能证明什么

生产已经接受固定来源：

```text
paid_microsoft
```

它可以在本站 Analytics Engine 中按来源观察 `page_view`、`commerce_click` 和 `contact_click`。但这些事件没有用户或会话 ID，不能串成用户级漏斗；`contact_click` 只证明有人点击微信或 Telegram 入口，不证明消息送达、合格咨询或付款。

当前站点也没有经本手册核验的 Microsoft UET 转化实现，并会删除 `msclkid` 等非白名单查询参数。因此：

- 首轮不要在 Microsoft 后台把“合格咨询”伪装成已安装的网站转化；
- 不使用 Maximize Conversions、Target CPA 或任何依赖可靠转化回传的自动出价；
- 不根据 Microsoft 后台显示的“0 conversions”断言业务没有咨询；
- 如以后要安装 UET 或离线转化导入，必须另做隐私、同意、政策、数据字段和代码审核，不能在广告后台随手复制脚本上线。

## 4. 账户与追踪的上线前检查

### 4.1 账户检查

常见路径：`Tools` 或齿轮 → `Accounts & billing` → `Accounts` / `Billing & payments`。

- 核对真实广告主/付款主体，不使用 `giffgaff` 冒充本公司的法律名称。
- 在建账户前核对币种和时区。建议账户时区使用 `Asia/Shanghai / China Standard Time`；若现有账户时区不同，后文时段全部换算成账户时区。
- 确认付款方式、税务资料、发票主体和广告主验证由账户所有者填写。
- 不接受平台在未人工复核时自动导入 Google Ads、自动创建 campaign 或自动应用建议。
- 先把实际开始日期设为至少 3 天后的日期，并在建成后再次确认 campaign、ad group、ads、keywords 均为 `Paused`，防止草稿误投。

### 4.2 落地页与 UTM 检查

主落地页：

```text
https://getgiffgaff.com/guides/6-pitfalls/?utm_source=paid_microsoft
```

G0/G2 对比落地页：

```text
https://getgiffgaff.com/answers/?utm_source=paid_microsoft
```

备选英国卡选择页（首轮默认暂停）：

```text
https://getgiffgaff.com/guides/8-uk-sim-choice/?utm_source=paid_microsoft
```

上线前逐个在手机与桌面打开，确认：

- 最终状态为 200，没有 404、循环跳转或证书报错；
- 地址栏只保留固定的 `utm_source=paid_microsoft`；
- 避坑页能看到“未购卡：先咨询选卡与当前信息”和“已购卡：按症状排查信号与短信”；
- 微信、Telegram 和跨设备二维码实际可用，客服接收端能收到脱敏测试消息；
- 页面没有与广告冲突的库存、价格、官方身份或验证码保证。

不要添加 `utm_campaign`、`utm_term`、`utm_content`、群名、人名、手机号或搜索词。Final URL 直接使用上面的完整 URL；`Tracking template` 和 `Final URL suffix` 留空。即使平台自动附加 `msclkid`，也不要依赖它做逐用户归因。

### 4.3 站点归因检查

常见核验方式：按 `docs/operations/analytics-funnel.md` 的 SQL 查询 `source = 'paid_microsoft'`。上线前用一次明确标记为测试的访问检查：

- 出现 `paid_microsoft` 的 `page_view`；
- 点击真实联系入口后出现相同来源的 `contact_click`；
- 查询排除了 `seo_release_canary`；
- 没有写入完整 URL、搜索词或个人信息。

若回读失败、客服链路失效或政策页未通过，立即保持暂停。

## 5. Campaign 结构

只建一个 Search campaign，不建 Audience、Shopping、Performance Max 或动态搜索 campaign。

| 层级 | 建议名称 | 状态 | 落地页 | 用途 |
| --- | --- | --- | --- | --- |
| Campaign | `CN_Search_GG_PrePurchase_7D` | 建成后暂停 | — | 中国大陆中文购买前搜索测试 |
| Ad group 1 | `AG01_Buy_Giffgaff` | 门禁通过后可启用 | `/guides/6-pitfalls/` | 明确购买/实体卡意图 |
| Ad group 2 | `AG02_Compare_G0_G2` | 门禁通过后可启用 | `/answers/` | 已知道 G0/G2、正在比较的人 |
| Ad group 3 | `AG03_UK_SIM_Choice` | 首轮保持暂停 | `/guides/8-uk-sim-choice/` | 更宽的英国卡选择意图，留待第二轮 |

首轮只让 AG01 和 AG02 参与，避免低预算同时测试太多意图。激活、保号、信号、短信和售后虽然有自然搜索价值，但不作为首轮付费购买咨询关键词。

## 6. 关键词与否定词

### 6.1 正向关键词

只使用 Exact 和 Phrase；首轮不使用 Broad。方括号表示精确匹配，引号表示词组匹配。

#### AG01_Buy_Giffgaff

```text
[giffgaff卡购买]
[giffgaff手机卡购买]
[gg卡购买]
[giffgaff实体卡]
[国内购买giffgaff]
[英国giffgaff卡]
[giffgaff sim卡购买]
"giffgaff 卡 购买"
"giffgaff 手机卡"
"gg 卡 购买"
"英国 giffgaff 卡"
```

#### AG02_Compare_G0_G2

```text
[giffgaff g0]
[giffgaff g2]
[giffgaff g0 g2]
[gg卡 g0 g2]
[g0 g2 怎么选]
"giffgaff g0 g2"
"gg卡 g0 g2"
"g0 g2 区别"
```

#### AG03_UK_SIM_Choice（首轮暂停）

```text
[英国手机卡购买]
[英国sim卡购买]
[留学英国手机卡]
"英国 手机卡 怎么选"
"英国 sim 卡 购买"
"英国 留学 手机卡"
```

上线前在 `Tools → Keyword Planner`（或 `Planning → Keyword planner`）按实际地区和语言检查搜索量与建议出价。Keyword Planner 是规划输入，不是流量承诺；不要因为平台建议就自动添加 Broad 或扩大地域。

### 6.2 Campaign 级否定词

Microsoft 的否定词按当前 API 文档支持 Exact 和 Phrase，不要把它误写成 Broad negative。下列默认用 Phrase negative；只有整条查询不相关、其中词根仍可能有用时才改用 Exact negative。

```text
"官方客服"
"giffgaff官网"
"客服电话"
"投诉"
"登录"
"login"
"app下载"
"app download"
"充值"
"top up"
"激活失败"
"activation"
"保号"
"无信号"
"信号故障"
"短信收不到"
"验证码"
"voicemail"
"语音信箱"
"sim swap"
"补卡"
"余额查询"
"漫游资费"
"roaming"
"payback"
"邀请奖励"
"招聘"
"工作"
"股票"
"免费"
"free sim"
"破解"
"接码"
"群发短信"
"批量注册"
"虚拟号码"
```

不要一开始否定 `教程`、`中国`、`留学`、`旅行`、`实体卡` 或品牌根词 `giffgaff`。它们是否无效必须由真实 Search terms 报告判断。

### 6.3 每日搜索词清理

常见路径：`Campaigns → Keywords → Search terms`；部分账户可能在 `Insights & reports → Search terms`。

每天固定一次：

1. 时间范围选测试开始日至当天；
2. 添加列：Campaign、Ad group、Keyword、Match type、Search term、Clicks、Spend、Average CPC；
3. 与购买 G0/G2 或英国实体卡明显无关的词，当天加 campaign 级 Phrase negative；
4. 只有某一完整查询无关、但其中词根仍有购买价值时，使用 Exact negative；
5. 涉及破解、接码、群发、批量注册或欺诈意图的词立即否定，不等待样本；
6. 不把包含个人信息或敏感内容的搜索词复制进 Git、公开文档或聊天；只保留在广告账户或 owner-only 导出。

不要删除历史关键词来“美化”数据；用 `Paused` 保留证据和日期。

## 7. 三组 Responsive Search Ad 文案

下面是待人工审核的中文素材，不是已通过平台审核的现状。每条 RSA 最终仍须在预览中检查字符限制、组合后语义和落地页一致性。不要使用动态关键词插入，不固定 pin，除非人工预览发现任意自动组合会造成错误身份或承诺。

### RSA 1：购买前避坑（AG01）

标题素材：

```text
giffgaff 实体卡购买前先看
G0/G2 怎么选
国内中文选卡说明
先确认库存与发货
激活与收卡检查一页看懂
独立第三方购买说明
不承诺所有验证码送达
购买前可先咨询
```

描述素材：

```text
对比本站 G0/G2 分类、激活前置、库存与发货边界。本站为独立第三方服务站。
先读避坑清单，再按未购卡入口咨询当前信息；价格与库存以确认时为准。
需要英国实体卡？先核对用途、账号控制、激活和收卡验收，再决定是否购买。
```

Final URL：

```text
https://getgiffgaff.com/guides/6-pitfalls/?utm_source=paid_microsoft
```

显示路径建议：`buy` / `guide`

### RSA 2：G0/G2 对比（AG02）

标题素材：

```text
G0 与 G2 怎么选
先看卡状态再比总成本
G0/G2 是本站分类
购买前核对账号与余额
中文对比清单
库存价格以当次确认为准
独立第三方说明
看完再咨询
```

描述素材：

```text
G0/G2 不是运营商官方 SKU。按卡状态、前置操作、账号控制和总成本做选择。
不写死库存与价格；先看风险对比，需要购买时再确认当前库存和发货安排。
第一次购买先判断自己能否激活、充值和验收，无法核对控制权时不要购买。
```

Final URL：

```text
https://getgiffgaff.com/answers/?utm_source=paid_microsoft
```

显示路径建议：`g0-g2` / `compare`

### RSA 3：英国卡选择（AG03，首轮暂停）

标题素材：

```text
英国手机卡怎么选
留学旅行保号先问六个问题
giffgaff 中文避坑清单
国内收卡前先做功课
激活保号短信边界说明
按真实使用场景选择
独立第三方教程
购买前可咨询
```

描述素材：

```text
先回答人在何处、是否长期保号、是否依赖验证码、能否维护账号，再选择英国卡。
面向中文用户的独立第三方选择框架，不做运营商排名，不保证任意平台验证码。
看完六问清单再进入对应教程；需要实体卡时先确认库存、状态与发货安排。
```

Final URL：

```text
https://getgiffgaff.com/guides/8-uk-sim-choice/?utm_source=paid_microsoft
```

显示路径建议：`uk-sim` / `choice`

可以建立以下 Sitelinks，但每个都必须带相同且唯一的来源参数：

| Sitelink | URL |
| --- | --- |
| G0/G2 对比 | `https://getgiffgaff.com/answers/?utm_source=paid_microsoft` |
| 购买前咨询 | `https://getgiffgaff.com/contact/?utm_source=paid_microsoft` |
| 当前购买入口 | `https://getgiffgaff.com/shop/?utm_source=paid_microsoft` |
| 收卡验收清单 | `https://getgiffgaff.com/guides/7-arrival-checklist/?utm_source=paid_microsoft` |

不要添加价格、折扣、库存量、永久保号、必收验证码、官方或最低价等扩展。

## 8. 地域、语言、设备、网络和时段

首轮建议设置如下；它们是受控实验配置，不是对用户分布的事实判断。

| 设置 | 首轮配置 | 原因与边界 |
| --- | --- | --- |
| 地域 | 中国大陆 | 当前页面面向国内中文用户；不自动加入港澳台、英国或全球 |
| 地域选项 | 仅“实际位于目标地区的人”，若 UI 提供 | 排除只对中国表现兴趣但不在当地的人 |
| 语言 | 中文（简体） | 文案和落地页均为中文；首轮不同时加英文 |
| 设备 | Desktop、mobile、tablet 全部保留 | 当前没有足够设备级咨询证据，不先做出价调整 |
| 网络 | Search only；若可选，先仅 Microsoft owned-and-operated search | 排除 Audience Network；搜索合作伙伴留到后续独立测试 |
| 时段 | 09:00–23:00，按账户时区 | 这是草稿默认；改成负责人真实可回复时段，不凭空承诺客服在线 |
| 日期 | 连续 7 个完整账户自然日，并设置明确 End date | 防止忘记手工关闭；跨 UTC 汇总时注明换算 |

若账户时区不是北京时间，先换算时段再保存。7 日内不要根据一两次点击排除设备或城市；只在明显无关地域流量或技术故障时立即处理。

## 9. 预算、出价和用户填写框架

### 9.1 必填变量

账户所有者先在仓库外填写：

```text
M = 单笔已实现贡献毛利：_____ [账户币种]，取数日：_____
R = 付款数 / 合格咨询数：_____，使用时间窗与样本数：_____
S = 安全系数：0.5（若负责人批准更低值，使用更低值）
CPAq_max = M × R × S：_____ [账户币种/合格咨询]
H = 7 日最大可承受总损失：_____ [账户币种]
D = 批准日预算：_____ [账户币种/日]
CPC_cap = 批准最高 CPC：_____ [账户币种/点击]
Nq = 继续判断所需最小合格咨询数：_____（建议至少 3，5 条后判断更稳）
批准人：_____  批准日期：_____
```

如果 `R` 没有真实历史样本，不能假装为行业平均；campaign 保持暂停，或由负责人明确批准一个纯获客研究的最大损失，并承认无法判断盈利。本文默认仍要求门禁通过。

### 9.2 推荐的首轮上限

在所有门槛已通过的前提下，**首轮草稿默认上限为 CNY 50/日、连续 7 日；对应名义预算 CNY 350。** 这不是自动花费授权，也不是平台最低有效预算。

实际输入必须按下面公式向下取值：

```text
D = min(CNY 50 的账户币种等值, H / 7, CPAq_max)
```

若账户不是 CNY，记录换算日和汇率。若公式结果低于平台可接受的最低预算，或不足以按 Keyword Planner 的真实建议出价获得一次点击，不要擅自提高；回到负责人重新决定是否值得测试。

日预算不是可靠的总损失硬闸，报表也可能延迟。另设人工安全线：

```text
H_safe = 0.8 × H
```

累计已报告花费到 `H_safe` 即暂停并等账单数据稳定；任何情况下不得以“再等优化”为由临时提高 `H`。

### 9.3 出价

- 若 UI 仍提供 `Manual CPC`，首轮优先使用，并把默认 bid 不高于 `CPC_cap`。
- 若只有 `Maximize Clicks`，必须启用可用的 maximum CPC limit，并填写 `CPC_cap`。
- `CPC_cap` 取 `账户所有者批准值`、Keyword Planner 目标地区建议区间和 `D / 5` 三者中的最低值；`D / 5` 只是为日预算保留多个点击机会，不保证每天 5 次点击。
- 不用 Maximize Conversions、Target CPA、Target ROAS 或自动应用出价建议，因为首轮没有经核验的 Microsoft 转化回传。

## 10. 后台逐步建立“暂停草稿”

不同 UI 的按钮名称可能变化。每完成一步都检查状态，不要一路点击默认的 `Launch`。

1. 登录 `ads.microsoft.com`，进入正确账户；在 `Accounts & billing` 核对广告主主体、币种、时区、付款权限和税务信息。
2. 进入 `Campaigns → Create` 或 `Create campaign`。
3. 目标选择 `Visits to my website` / `Website traffic` 等流量目标；campaign type 选择 `Search`。
4. 明确不选 Performance Max、Audience、Shopping、Dynamic Search 或 Google import。
5. Campaign name 填 `CN_Search_GG_PrePurchase_7D`。
6. 开始日期先设为至少 3 天后，结束日期设为开始后的第 7 个账户自然日；建成后再暂停。
7. Location 选中国大陆；在高级 location options 中，如有此选项，选择“People in your targeted locations”。
8. Language 选中文（简体）。
9. Network 只保留 Search；如能区分，选择 Microsoft 自有搜索流量，取消 Audience Network 和 search partners。
10. Ad schedule 先填账户时区对应的 09:00–23:00，再由负责人改为真实可响应时段。
11. Budget 只填第 9 节计算并获批的 `D`；不要接受平台一键提高预算。
12. Bidding 选 Manual CPC，或 Maximize Clicks + `CPC_cap`；关闭自动应用建议。
13. 建 AG01、AG02、AG03；AG03 明确设为 Paused。
14. 把第 6 节关键词放入对应 ad group；逐条核对 match type，没有 Broad。
15. 建 campaign 级 negative keyword list，录入第 6.2 节否定词；核对 Exact/Phrase 类型。
16. 在各 ad group 建第 7 节 RSA；预览多个自动组合，删除任何可能暗示官方身份、现货、固定价格或验证码保证的组合。
17. 填对应完整 Final URL；Tracking template 和 Final URL suffix 留空。
18. 如添加 Sitelinks，逐一使用第 7 节的 URL，并预览手机/桌面落地。
19. 进入 `Tools → Conversion tracking → UET tags / Conversion goals`（名称可能不同）只做检查：记录当前是否存在 UET；未完成隐私和代码审核时不要创建或安装。
20. Review 页面逐项截图或导出：地域、语言、网络、时段、预算、出价、日期、关键词类型、否定词、广告文案和 URL。
21. 保存后立即进入 Campaigns 列表，把 campaign、三个 ad groups 和所有 ads/keywords 状态核对为 `Paused`；若 wizard 不支持暂停保存，保留未来 start date，保存后第一时间暂停。
22. 由第二人按第 2 节复核。只有账户所有者书面确认四个核心空白——贡献毛利、预算/硬止损、合格咨询定义、政策页审核——并通过全部门禁后，才把真实开始日改正并手动 Enable AG01/AG02。

启用时也只能由账户所有者操作。本手册作者或自动化不得代点 Enable、Launch、Publish 或添加付款方式。

## 11. 合格咨询定义与最小人工记录

### 11.1 固定定义

一条“合格购买前咨询”必须同时满足：

1. 是新的购买前会话，不是老客户售后、激活、信号或验证码排障；
2. 已说明需求、所在地区或使用场景中的必要信息；
3. 已说明数量/时间要求，或愿意继续补充到可报价程度；
4. 当前业务确实可服务，可以继续提供明确 SKU/方案、价格或下单入口；
5. 同一会话当天重复消息只计一次。

只有打开弹窗、点击微信、发送“在吗”、询问官方客服、明显接码/群发用途，或业务无法服务，都不算合格咨询。

### 11.2 最小记录字段

数据保存在 owner-only 的仓库外表格，不记录姓名、手机号、微信号、Telegram 用户名、聊天原文、验证码、密码、完整订单号或支付信息。

| 字段 | 允许值示例 |
| --- | --- |
| `date_utc` | `2026-07-20` |
| `source_self_reported` | `microsoft_ads` / `other` / `unknown` |
| `stage` | `pre_purchase` / `existing_customer_support` |
| `use_case` | `travel` / `study` / `keep_number` / `sms` / `other` |
| `serviceable` | `yes` / `no` / `unknown` |
| `quantity_band` | `1` / `2-5` / `6+` / `unknown` |
| `qualified` | `yes` / `no` |
| `not_qualified_reason` | 固定原因码，不写聊天原文 |
| `quote_sent` | `yes` / `no` |
| `payment_verified` | `yes` / `no` / `unknown` |
| `revenue` | 当日聚合，不写单个客户明细 |
| `variable_cost` | 当日聚合 |
| `notes` | 只写故障、库存或活动等非个人事件 |

`source_self_reported=microsoft_ads` 只能来自客户自报或当日受控渠道判断，不能用网站事件强行匹配某个人。若无法确认就填 `unknown`，不要为了算 CPA 补造归因。

## 12. 7 日执行节奏

每天在同一时间导出 Microsoft 的 Campaign、Keyword、Search terms、Device、Location 报表，并与本站 `paid_microsoft` 聚合事件、客服实际消息和合格咨询并排查看。

| 日次 | 必做动作 | 当天禁止事项 |
| --- | --- | --- |
| D0 | 门禁全通过；真机测试 URL/微信/Telegram；确认预算、时区、start/end date；由 owner 启用 AG01/AG02 | 不启用 AG03，不临时加词 |
| D1 | 检查审核状态、impressions、clicks、spend、URL 和 `paid_microsoft` page views；清理明显无关 search terms | 不因低展示立刻提价或开 Broad |
| D2 | 再查 search terms；加入否定词；记录真实消息与是否合格 | 不删历史数据，不改落地页 |
| D3 | 真机复测联系链路；核对累计花费与 `H_safe`；按 ad group 看购买与对比意图 | 不把 contact click 当咨询 |
| D4 | 中期检查：相关查询比例、设备、地域、合格咨询和 CPAq；只处理明显浪费或故障 | 样本不足时不做设备/时段大改 |
| D5 | 继续每日否词；核对报价、付款、库存和客服不可用时段 | 不因“快到结束”放宽止损 |
| D6 | 冻结新增关键词和文案；准备完整 7 日导出 | 不开启 AG03 或 Google Ads |
| D7 | 结束时手动 Pause campaign；等待报表稳定后按第 13 节判定 Stop/Hold/Continue/Scale | 不自动续期，不先开下一轮再复盘 |

除修复硬故障、加明显否定词或执行预先写好的止损外，7 日内保持地域、落地页、预算和合格咨询定义不变。否则无法解释结果。

## 13. 立即止损、继续与扩量条件

### 13.1 立即暂停

任意一项出现就暂停整个 campaign：

- 落地页、咨询按钮、微信/Telegram 收件链路或 `paid_microsoft` 归因失效；
- 广告或页面被发现含错误官方身份、无法核验的价格/库存、永久保号或验证码保证；
- 账户、付款、商标、隐私、政策或恶意流量出现风险；
- 累计已报告花费达到 `H_safe`，或账单/报表延迟使剩余预算无法确认；
- 有合格咨询，但 `CPAq > CPAq_max`；
- 累计花费达到 `CPAq_max` 仍为 0 条合格咨询；
- 大量查询为售后、免费、官方客服、接码、群发或其他明确不服务意图，且否定词无法及时控制。

### 13.2 D7 的四种判定

| 判定 | 条件 | 下一步 |
| --- | --- | --- |
| `STOP` | 触发任一立即暂停条件，或 0 合格咨询且花费已到 `CPAq_max` | 保持暂停；先修复意图、页面或经济性 |
| `HOLD` | 没触发止损，但合格咨询少于 `Nq`，无法判断 | 不扩量；若要再跑 7 日，重新批准额外硬总额 |
| `CONTINUE` | 合格咨询不少于 `Nq`，`CPAq <= CPAq_max`，search terms 相关，链路/政策正常 | 同配置再跑一个经批准的 7 日块，不同时开 Google |
| `SCALE` | 满足 Continue，且 `CPAq <= 0.7 × CPAq_max`、至少 1 笔可核验付款、测试期已实现贡献毛利不为负 | 每 3 个完整日最多提高日预算 10%–20%，每次重新审核止损 |

点击、CTR 或 Microsoft 后台的优化分数高，不能单独触发 Continue/Scale。若付款发生在测试结束后，等归因和贡献毛利核验完成再决定，不把未付款报价当收入。

## 14. Google Ads 的后续条件

现在不建议同时投 Google。只有 Microsoft 至少达到 `CONTINUE`，且负责人愿意批准一个独立损失上限时，才复制**实验设计**而不是直接导入 campaign：

- 新建 Google Search campaign，单独预算；
- Final URL 使用 `utm_source=paid_google`；
- 保持相同地区、语言、时段、落地页、合格咨询定义和止损；
- Microsoft 与 Google 不共享 campaign 名称、预算、搜索词结论或转化数；
- 仍先用精确/词组高意图词，不开 Broad、Display、PMax、受众扩展或再营销。

Google 自然搜索目前很小，只说明现有自然发现弱；它既不是“Google Ads 没用”的证据，也不是现在应立刻买 Google 流量的理由。

## 15. Microsoft 官方来源

以下链接于 **2026-07-19** 做了公开可访问性或内容核验。官方页面、产品能力和后台 UI 以后可能变化，实际投放前应重新打开核对。

- [Microsoft Search ads](https://about.ads.microsoft.com/en/solutions/ad-products-formats/search)：Search 产品概览。
- [Keyword Planner](https://about.ads.microsoft.com/en/tools/planning/keyword-planner)：关键词规划与预估工具概览。
- [Conversion tracking](https://about.ads.microsoft.com/en/tools/performance/conversion-tracking)：Microsoft 转化追踪与 UET 产品说明。
- [How to set an advertising budget](https://about.ads.microsoft.com/en/resources/learn/advertising-fundamentals/how-to-set-ad-budget-small-business)：预算规划说明。
- [Microsoft Advertising Learning Lab](https://about.ads.microsoft.com/en/resources/training-certification/learning-lab)：官方培训入口。
- [Microsoft Advertising policies](https://about.ads.microsoft.com/en/resources/policies)：政策中心入口；该页依赖动态界面，投放前须在账户/浏览器中复核最新条款。
- [Keyword data object](https://learn.microsoft.com/en-us/advertising/campaign-management-service/keyword?view=bingads-13) 与 [MatchType values](https://learn.microsoft.com/en-us/advertising/campaign-management-service/matchtype?view=bingads-13)：官方 API 对 Exact、Phrase、Broad 等结构的定义。
- [NegativeKeyword data object](https://learn.microsoft.com/en-us/advertising/campaign-management-service/negativekeyword?view=bingads-13)：截至核验日，否定词支持 Exact 与 Phrase。
- [ResponsiveAd data object](https://learn.microsoft.com/en-us/advertising/campaign-management-service/responsivead?view=bingads-13)：响应式广告资产和 Final URL 的官方结构说明；实际 Search UI 的字符提示以创建页面为准。
- [Universal Event Tracking](https://learn.microsoft.com/en-us/advertising/guides/universal-event-tracking?view=bingads-13)：UET 官方开发文档；本文不据此授权安装追踪代码。

站点现有数据与门禁口径见：

- `docs/operations/growth-operations-runbook-2026-07-19.md`
- `docs/operations/advertising-experiment-gate.md`
- `docs/operations/analytics-funnel.md`
