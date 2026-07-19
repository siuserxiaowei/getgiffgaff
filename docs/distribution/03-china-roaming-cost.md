# 站外文章包 03：中国漫游费用先按计费单位算

更新日期：2026-07-19
主落地页（本文仅设一个）：`https://getgiffgaff.com/tools/china-roaming-cost/`

## 内容简报

- 读者：准备在中国使用 giffgaff 收发短信、接打电话或短时开数据的人。
- 问题：只记住“每分钟/每 MB 多少钱”，却忽略最低计费、进位方式和 PAYG 与 Travel Data Add-on 的区别。
- 角度：先确认使用的是哪种产品，再按短信、单次通话和数据分别计算。
- 目标：让读者在使用前打开费用计算器，输入自己的用量上限；不是鼓励漫游消费。
- 证据：giffgaff 中国漫游页、Travel Data Add-on 官方帮助页。
- 禁止主张：长期固定价格、最低成本、后台不会跑流量、计算器等于账单或某种方案一定更划算。

## 标题备选

1. giffgaff 在中国怎么收费？先分清 PAYG、计费单位和流量包
2. 接 10 秒电话为什么不能只按 10 秒算：giffgaff 中国漫游费用拆解
3. 中国使用 giffgaff 前，先算短信、通话和 1MB 数据各要多少
4. 海外卡漫游最容易漏算的，不是单价，而是最低计费
5. giffgaff 中国漫游费用计算：别把 PAYG 和 Travel Data Add-on 混在一起

## 正文

如果你准备把 giffgaff 放进备用机，只偶尔接一通电话或发一条短信，很容易觉得“这点用量不用专门算”。真正容易造成误判的，往往不是没看到单价，而是忽略了三个条件：你用的是 PAYG Credit 还是 Travel Data Add-on、一次通话怎样取计费单位、手机有没有产生你没计划的数据流量。

这篇只讨论 giffgaff 官方中国页面公开的计费结构，不把某个核验日的费率写成长期承诺。**本文费率核验基准为 2026-07-17；任何发布、转发或实际使用前，都必须重新打开官方页面。**

### 第一步：先分清 PAYG 和 Travel Data Add-on

PAYG 是按实际发生的短信、通话和数据，从 Airtime Credit 中扣费。Travel Data Add-on 是另一条产品路径，官方当前帮助页说明可在 App 中购买中国对应的 1GB、5GB 或 10GB 数据包，有效期为 30 天。它解决的是数据，不应拿来推断短信或通话费用。

因此，问“在中国用 giffgaff 多少钱”之前，要先说清自己准备做什么：只接收短信、主动发一条短信、接打一次短电话，还是需要连续使用移动数据。

[截图建议：giffgaff 中国漫游页与 Travel Data Add-on 帮助页各截取标题、URL、核验日期和相关公开字段，拼成“PAYG / Add-on”两栏；图注“先确认产品路径，再谈费用”。]

官方来源：

- [Roaming in China](https://www.giffgaff.com/roaming/china)
- [giffgaff Travel Data Add-ons and how they work](https://help.giffgaff.com/en/articles/365501-giffgaff-travel-data-add-ons-and-how-they-work)

### 第二步：短信、通话和数据分别算

按 2026-07-17 核验到的 giffgaff 中国 PAYG 页面：数据为 £0.20/MB，发送短信为 £0.30/条，接收短信免费；拨出电话为 £1/分钟，首 30 秒构成最低计费单位，之后按秒；接听电话为 £1/分钟，每通向上取整。

这些数字是动态事实，最迟应在 2026-08-15 前再次复核；如果官方页面已变化，就删除旧数字，按新页面重算。

短信最直观：主动发送几条，就按条数乘以当前每条费率。接收短信在当前官方表中显示免费，但这不等于收到短信能完成保号，也不等于某个平台 OTP 一定送达。

数据要特别谨慎。即使只想打开一个页面，系统同步、云备份、应用刷新也可能增加实际用量。费用估算应该使用你愿意承担的用量上限，而不是只估正文大小。

通话最容易因计费单位算错。拨出电话和接听电话的取整方式不同，不能简单把总秒数除以 60 后线性相乘。例如，在上述核验日的费率下，一次 10 秒的拨出电话仍受首 30 秒最低计费影响；一次 10 秒的接听电话则按当前页面的“每通向上取整”规则处理。这只是计费单位示例，实际账单以运营商记录和使用当天规则为准。

[截图建议：自制三张并列卡片“短信按条 / 拨出首30秒最低单位 / 接听每通向上取整”；不在图片里固化价格，图注“先看计费单位，再代入当天费率”。]

### 第三步：先设上限，再开漫游

使用前可以先写下三个上限：最多主动发几条短信、单次电话最多多久、最多允许多少 MB 数据。这样得到的是预算边界，不是对账单的预测。

getgiffgaff 的中国 PAYG 漫游费用计算器把短信、单次拨出/接听电话和数据分开处理，并公开当前核验日期。**推荐链接位置：放在读者已经分清 PAYG 与 Add-on、理解计费单位之后。** 使用：[giffgaff 中国 PAYG 漫游费用计算器](https://getgiffgaff.com/tools/china-roaming-cost/)。

[截图建议：计算器空白输入状态和一个明确标注“演示输入”的结果页；图注“结果是按输入和核验日费率得出的试算，不是账单”。]

计算器不能读取账号、Credit 余额或运营商账单，也不知道手机后台实际用了多少数据。费率过期或来源无法核对时，不应继续给出旧总价。

### 哪些情况不要只靠计算器

如果需要长时间联网，应该同时查看官方当日的 Travel Data Add-on 说明，而不是用少量 PAYG 试算外推大流量场景。若手机显示的用量和运营商账单不一致，应保存时间、线路和官方记录，向 giffgaff 官方支持核对。

如果只是为了保号而打算开数据，也要先确认官方 inactive 规则和当前漫游费。不要把未知网页或后台应用当作“低成本保号工具”，更不要用计算结果证明号码一定保持活跃。

这套计算的价值很克制：它只让“可能会花多少”变得可见，不能替你控制设备、改变费率或保证通信结果。

## 推荐链接与发布版本

- 主落地页：`https://getgiffgaff.com/tools/china-roaming-cost/`
- 公众号：`https://getgiffgaff.com/tools/china-roaming-cost/?utm_source=dist_wechat_official`
- 小红书：`https://getgiffgaff.com/tools/china-roaming-cost/?utm_source=dist_xiaohongshu`
- 知乎：`https://getgiffgaff.com/tools/china-roaming-cost/`
- 推荐位置：正文“第三步：先设上限”第二段。全文不增加其他站内链接。

## 截图清单

| 位置 | 画面 | 证明什么 | 图注 |
| --- | --- | --- | --- |
| 第一步后 | 官方中国漫游页与 Add-on 帮助页，显示标题、URL、相关字段和当天日期 | PAYG 与 Add-on 是不同路径 | “先确认用的是哪种产品” |
| 第二步后 | 自制三类计费单位卡 | 不能只看每分钟或每 MB 单价 | “计费单位决定怎么算” |
| 第三步后 | 计算器空白页 | 输入由读者自行控制 | “先写用量上限，再试算” |
| 第三步后 | 明确标为演示的输入和结果 | 展示计算步骤而非真实账单 | “演示试算，不是账单” |

截图不得包含真实号码、账号、余额、账单明细、订单、支付信息或设备身份信息。发布前截图中的核验日期必须改成真实日期。

## 视觉资产

### 封面图提示词

```text
Use case: ads-marketing
Asset type: WeChat article cover
Primary request: Create a credible Chinese editorial cover about calculating UK SIM roaming costs in China by billing unit.
Scene/backdrop: A desk with a generic calculator, phone, three paper tags for SMS, call and data, and a small China travel map shape.
Subject: Billing-unit calculation, not shopping or discount.
Style/medium: Refined editorial illustration, precise and calm.
Composition/framing: 16:9, objects on the right, clean title space on the left.
Lighting/mood: Neutral daylight, analytical, not alarming.
Color palette: Off-white, charcoal, muted red and blue accents.
Text (verbatim): "漫游费先看计费单位"
Constraints: no operator logo, no fake bill, no fixed price in image, no “cheapest” badge, no watermark, no QR code.
```

### 文中插图提示词

1. `Use case: productivity-visual; Asset type: article inline illustration; Primary request: Visualize “使用场景 → 选择PAYG或数据包 → 按单位试算”; Composition/framing: three-step horizontal flow; Text (verbatim): "先说用途" "分清产品" "按单位计算"; Style/medium: clean editorial diagram; Constraints: no price, no fake app UI, no savings claim.`
2. `Use case: productivity-visual; Asset type: article inline illustration; Primary request: Compare three billing units for SMS, outgoing call and incoming call; Composition/framing: three equal cards; Text (verbatim): "短信按条" "拨出看最低单位" "接听看每通取整"; Style/medium: high-readability information card; Constraints: no static rate, no tiny footnotes, no fake bill.`

### 小红书长图提示词

```text
Use case: productivity-visual
Asset type: long social summary image
Primary request: Create a vertical Chinese checklist for estimating giffgaff China roaming costs.
Composition/framing: 9:16, title, PAYG/Add-on split, three billing-unit cards, pre-use checklist, limitation.
Text (verbatim):
"中国漫游费怎么估"
"先分PAYG和数据包"
"短信按条"
"通话看取整规则"
"数据按可承受上限"
"发布前重查官方费率"
"试算不是账单"
Style/medium: clean creator-note layout, restrained colors, strong mobile typography.
Constraints: no fixed price, no logo, no fake balance, no guaranteed saving, no excessive stickers.
```

## 分发改写

### 知乎回答版

建议问题：**“giffgaff 在中国漫游，接电话和发短信怎么收费？”**

回答首屏：

> 先分清 PAYG Credit 和 Travel Data Add-on。PAYG 的短信、通话、数据按各自单位扣费；Add-on 是单独的数据产品。通话不能只用秒数线性乘单价，因为拨出和接听的最低计费/取整方式不同。费率会变化，下面只按发布当天的官方中国页面解释，实际使用前必须重查。

正文先解释计费单位，再列发布当天复核的费率和一个演示输入，最后给计算器。知乎使用干净链接；每次更新答案时同步写明核验日，不把旧数字留在开头。

### 公众号版改写

开头从“小用量也可能算错”切入：

> 海外卡只接一通十几秒的电话，很多人会下意识按秒数算。可是漫游账单是否这样计算，要看最低计费和进位方式。单价没看错，结果仍可能算错。

公众号中段用一张三类计费单位图，再展示一个标明“演示”的计算器输入。主链接使用 `dist_wechat_official`。文首和文末都写“发布前重查官方费率”，不以“省钱攻略”为标题。

### 小红书版

标题：**海外卡只用一点点，也要先看这3个计费单位**

正文：

> giffgaff 在中国使用前，先回答两个问题：
>
> 1. 你用 PAYG，还是 App 里的 Travel Data Add-on？
> 2. 你准备发短信、接打电话，还是开移动数据？
>
> PAYG 里：短信看条数；拨出电话看首段最低计费；接听电话看每通取整；数据别只估网页大小，要给后台流量留上限。
>
> 费率是动态的，发布和使用前都要重查官方中国页面。getgiffgaff 的“中国 PAYG 漫游费用计算器”可以按输入试算，但结果不是运营商账单。

图卡不要固化价格，避免内容过期；可点击时使用小红书 UTM 主链接。

## 适合 / 不适合

- 适合：想在使用前估算少量 PAYG 短信、单次通话或数据上限的人。
- 不适合：需要持续大流量、需要核对真实账单，或希望计算器自动控制后台流量的人。
- 不能解决：运营商实际计费争议、设备用量统计差异、信号、OTP、余额和未来费率。

## 证据边界

- 当前费率与计费单位按 2026-07-17 的官方页面记录；动态费率最迟 2026-08-15 复核，实际发布前仍须当日复核。
- Add-on 的档位和有效期也可能变化；不在图片中固化价格。
- 演示结果只说明公式如何处理输入，不代表真实用户账单、节省金额或推荐方案。
- 工具不读取账号、余额、设备流量或账单，不能证明 PAYG 或 Add-on 哪个一定更划算。

## 质量自检

- 预计分数：96/100。
- 读者问题：看到单价却忽略产品路径和计费单位。
- 证据点：两张官方页面、计费单位图、计算器空白页和演示输入。
- 商业硬推风险：低；本文只建议先试算用量上限。
- 视觉缺口：官方页面和计算器必须在实际发布日重新截图。
- 剩余风险：费率、档位、有效期会变化；任何旧数字都必须随官方更新撤下。
