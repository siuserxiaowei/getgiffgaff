# getgiffgaff SEO / GEO 内容集群计划

更新日期：2026-07-15

机读版：[`cluster-plan.json`](cluster-plan.json)

内链矩阵：[`internal-links.json`](internal-links.json)
交互地图：[`cluster-map.html`](cluster-map.html)

> 模板说明：`seo-cluster` 技能所引用的 `templates/cluster-map.html` 在当前安装中缺失。本计划因此使用一个自主编写、无外部依赖、支持键盘与纯 HTML 降级的可访问地图。

## 结论

内容架构固定为 **1 个支柱页 + 5 个任务集群 + 20 个 spoke**。现有 6 个证据型页面继续使用当前 canonical，不再为“激活、保号、eSIM、收不到验证码、G0/G2”创建平行同义 URL；第 6 页专门承接 eSIM 二维码与第三方写卡的安全边界。

- 支柱页：`/guides/6-pitfalls/`，只做全生命周期选路、共性风险和下一步。
- 已确立的意图 owner：`/guides/2-activate/`、`/guides/3-usage/`、`/more/03-esim/`、`/guides/4-signal/`、`/answers/`。
- 新增价值只来自可验证工具和原创数据：总成本计算器、保号提醒、漫游成本工具、中国网络/短信矩阵、OTP 状态板、eSIM 兼容检查器。
- `/more/04-esim-qrcode/` 已在原 URL 完成“官方支持与安全边界”改写，是第六个证据型教程。该页的持续门禁是不得包含修改版 APK、Cookie 导出、LPA/eSIM 凭证提取/上传、第三方写卡或绕过兼容检查的可操作步骤。

本计划不含任何流量、排名或转化率估计。竞品证据中没有完整的逐关键词 Top-10 两两重合矩阵，所以这是一个基于现有 URL、任务意图和 46 个结构化证据卡的保守合并方案，不伪造 SERP overlap 分数。

## 证据范围与可复用机制

证据来自：

- [`six-source-teardown.json`](../research/sources/six-source-teardown.json)：用户指定的 6 个来源。
- [`competitors-01-20.json`](../research/competitors/competitors-01-20.json) 和 [`competitors-21-40.json`](../research/competitors/competitors-21-40.json)：40 个独立竞品页或渠道证据卡。

可迁移的是信息架构和证据纪律，不是第三方文字、截图或版式：

1. 支柱页给出快速选路，一个任务只有一个主 URL。
2. 首屏直接回答，同时写清适用对象、失败边界和下一步。
3. 高变动事实带官方来源、字段级核验日和修订记录。
4. 工具公开公式；实测资产公开方法、设备、地区、时间、样本数和失败记录。
5. CTA 按任务阶段分流：未购卡才去商城，已购卡去操作页，自助失败且证据齐全才去 Contact。

典型证据 ID 包括 `c01-giffgaff-official-getting-started`、`c03-giffgaff-shop-guide-hub`、`c05-larksim-activate-guide`、`c08-ggwiki-topical-cluster`、`21`、`23`、`27`、`37`、`ssnhd-github-readme` 和 `aibook-gg-esim`。详细 URL 和访问日期保留在上述证据文件中。

## 支柱页

| 字段 | 决策 |
|---|---|
| URL | `/guides/6-pitfalls/` |
| 主关键词 | `giffgaff 中文教程` |
| 主导意图 | 中国用户全生命周期导航与风险检查 |
| 页面边界 | 给选路和短答案，不复制任一 spoke 的完整步骤 |
| 当前状态 | 已有内容；需按 5 个集群扩展摘要、正文双向链接和可见 `ItemList` |
| 复审频率 | 至少每季度，或新工具/数据资产上线时 |

## 集群 1：选卡、下单与总成本

| URL | 主关键词 | 唯一任务 | 状态 |
|---|---|---|---|
| `/answers/` | `giffgaff G0 G2 区别` | 用卡状态、账号注册责任、条款与控制权风险、总成本对比 | 证据型 v1 |
| `/shop/` | `giffgaff 手机卡购买` | 交易、库存、交付与售后边界 | 已有，需信任审核 |
| `/guides/1-order/` | `giffgaff 国内下单流程` | 从下单准备到收货验收，不报价 | 已有，需原创验收证据 |
| `/tools/g0-g2-total-cost/` | `giffgaff G0 G2 总成本` | 可调参输入、公开公式与结果 | 计划新资产 |

防蛀规则：`/answers/` 解释怎么选，`/shop/` 负责买，`/guides/1-order/` 负责怎么下单和验收，计算器只做公式和输入输出。

## 集群 2：激活、账号与 App

| URL | 主关键词 | 唯一任务 | 状态 |
|---|---|---|---|
| `/guides/2-activate/` | `giffgaff 国内激活` | 正常激活路径 + 按症状的失败分支 | 证据型 v1 |
| `/guides/3-account/` | `giffgaff 账号安全` | 控制权、恢复与资料安全 | 已有，需证据审核 |
| `/guides/3-app/` | `giffgaff App 使用` | App 安装、登录和入口导航 | 已有，需版本化自制截图 |
| `/qa/06-activation-expiration/` | `giffgaff 激活码有效期` | 激活码/序列号状态的精确问答 | 已有，需与激活主页复核重合 |

防蛀规则：激活失败不另发一篇同义攻略。只有当诊断查询的实际 SERP 与正常流程显著分离，且有新的独立故障数据时，才重新评估是否拆页。

## 集群 3：保号、余额与充值

| URL | 主关键词 | 唯一任务 | 状态 |
|---|---|---|---|
| `/guides/3-usage/` | `giffgaff 保号` | 官方 inactive 规则、有效动作和缓冲清单 | 证据型 v1 |
| `/qa/02-topup/` | `giffgaff 自助充值` | 用户自助 Credit/plan/voucher 路径 | 已有，需当前付款路径审核 |
| `/guides/4-recharge-service/` | `giffgaff 充值服务` | 人工服务适用范围、SLA、交付和升级 | 已有，需隐私/服务审核 |
| `/tools/keep-number-reminder/` | `giffgaff 保号提醒` | 本地计算缓冲日、导出 `.ics` 与维护日志 | 计划新资产 |

防蛀规则：保号页说规则，提醒工具只做日期和记录；自助充值和人工服务必须继续保持两个不同主意图。“第 5 个月”是本站风险缓冲建议，不是 giffgaff 新规则；只收短信不能写成当前官方列明的保活动作。

## 集群 4：中国网络、短信、OTP 与漫游成本

| URL | 主关键词 | 唯一任务 | 状态 |
|---|---|---|---|
| `/guides/4-signal/` | `giffgaff 收不到验证码` | “现在收不到怎么排查”的决策树 | 证据型 v1 |
| `/guides/5-travel-data/` | `giffgaff 中国漫游成本` | 当前费率、用量输入、试算和防误扣费 | 原 URL 计划改写为工具 |
| `/research/china-network-sms-matrix/` | `giffgaff 中国网络短信实测` | 城市×设备×当地网络×SIM 类型的原始数据查询 | 计划，数据门禁 |
| `/research/otp-compatibility-status/` | `giffgaff 验证码兼容性状态` | 平台×环境×时间×样本的状态查询 | 计划，数据门禁 |

防蛀规则：排查页解决问题，漫游页计算价格，网络/短信矩阵展示运营商层原始实测，OTP 板展示平台层状态。不做“国家 × 平台 × 卡种”无数据批量页。

`/more/00-wechat/`、`/more/02-telegram/` 和 `/qa/08-gv/` 是证据门禁页：只有平台特有的实测或当前政策才能支撑独立意图，否则应合并到状态板，且不得复制通用排查步骤。

## 集群 5：eSIM、设备兼容与换卡安全

| URL | 主关键词 | 唯一任务 | 状态 |
|---|---|---|---|
| `/more/03-esim/` | `giffgaff eSIM 转换` | 官方 App 流程、切换前 Go/No-Go 与失败边界 | 证据型 v1 |
| `/more/04-esim-qrcode/` | `giffgaff eSIM 二维码安全` | 二维码/凭证的安全性、官方支持和第三方写卡边界 | 证据型安全边界 v1，已完成 |
| `/tools/esim-compatibility/` | `giffgaff eSIM 设备兼容检查` | 型号、地区版本、OS/App 与证据等级的 Go/No-Go | 计划，数据门禁 |
| `/qa/03-reissue/` | `giffgaff SIM 补卡` | 实体 SIM 丢失、损坏与换卡恢复 | 已有，需官方流程审核 |

安全硬边界：不发布修改版 APK、Cookie 导出、LPA/eSIM 凭证提取/上传、第三方写卡或绕过兼容检查的步骤；不展示这些流程的操作截图或占位信息。

## 内链原则

[`internal-links.json`](internal-links.json) 定义具体邻接表。一个节点不因为出现在主导航或页脚就算完成集群内链。

- 支柱页在正文中链接全部 20 个 spoke；每个 spoke 正文返回支柱页。
- 每个 4 节点集群使用双向环，每页链接 2 个真正相关的同集群页。
- 因此每个 spoke 在不依赖导航/页脚时至少有 3 个正文入链：支柱页 + 2 个同集群页。
- 跨集群链接只用于真实任务接续，例如“选卡 → 激活”、“保号 → 漫游费试算”、“eSIM 切换 → 无信号排查”。
- 锚文本是任务语义或近义词，不用“点击这里”。任一单一锚文本不应占目标页入链的 40% 以上。
- 尚未上线的目标使用占位标记，只在发布当批页面时将链接激活，不把 404 链接放进生产正文。

## 首批 6 个详细 brief

`codex-blog` 未安装，因此不生成占位文章，而是为真正未写的工具和数据资产提供详细 brief：

1. [`g0-g2-total-cost-calculator.md`](cluster-briefs/g0-g2-total-cost-calculator.md)
2. [`keep-number-reminder.md`](cluster-briefs/keep-number-reminder.md)
3. [`china-roaming-cost-tool.md`](cluster-briefs/china-roaming-cost-tool.md)
4. [`china-network-sms-matrix.md`](cluster-briefs/china-network-sms-matrix.md)
5. [`otp-compatibility-status-board.md`](cluster-briefs/otp-compatibility-status-board.md)
6. [`esim-compatibility-checker.md`](cluster-briefs/esim-compatibility-checker.md)

激活、保号、eSIM 切换、OTP 排查和 G0/G2 对比已有主 URL，所以不为它们再生成“未写页” brief。

## 发布门禁

1. 200、自指 canonical、无 `noindex`，`og:url` 等于 canonical。
2. Title、H1、直接答案和主关键词与现有页意图唯一。
3. 支柱页双向链接和每个 spoke 的 3 个正文入链均已落地；无孤儿页。
4. 价格、库存、漫游、eSIM 兼容和 OTP 状态都有核验日和直接来源；无证据则显示“未验证”。
5. 数据资产有真实样本、方法、样本数、失败记录和不保证未来结果声明；不使用占位数据。
6. 完整展示真实作者、审核人、方法、修订记录、独立第三方披露、销售关系与纠错入口。
7. Schema 只描述页面可见事实；实体图中 giffgaff 只是外部 `Brand/about`。
8. 安全检查阻断任何凭证提取/上传、第三方写卡、虚假资料、付款/KYC/平台风控绕过和“必成”承诺。

## 实施顺序

1. **P0 已完成：**`/more/04-esim-qrcode/` 已改为安全边界页；发布后持续用安全回归测试阻断凭证提取和第三方写卡步骤回流。
2. **P1：**扩展支柱页的 5 集群摘要与双向内链；清理现有页之间的锚文本和任务重叠，并审核既有平台页是否有真实数据。
3. **P1：**上线 G0/G2 总成本与保号提醒；它们不需要伪造大样本，但公式、默认值和隐私边界必须可审计。
4. **P1：**采集小规模、可复现的中国网络/短信数据；数据不足时只公开方法和待验证状态。
5. **P2：**数据达标后发布网络矩阵、OTP 状态板和 eSIM 兼容检查器；然后再评估是否有足够独特数据支撑任何新的平台页。
