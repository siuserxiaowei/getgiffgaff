# getgiffgaff SEO / GEO v2 门禁

> 版本：2026-07-15。本文定义当前分支的发布不变量和业务依赖。技术测试通过不等于品牌许可、交易授权或搜索平台操作已经完成。

## 1. 五道门禁

| 门禁 | 通过条件 | 未通过时的默认行为 |
| --- | --- | --- |
| G0 技术 | manifest 内全部可索引 URL 为 200、自指 canonical、无 `noindex`；规范变体一跳到最终 URL | 阻止发布或回滚；不得用手动提交搜索引擎绕过 |
| G1 品牌 | 有覆盖域名、地区、销售/分发和 G2 流程的书面许可，或业务已批准中性域迁移 | 商业页 noindex、交易与 G2 CTA 关闭、不做付费外链和扩量 |
| G2 信任 | 真实卖方、联系方式、发货、退款、隐私、编辑与纠错资料可公开核验 | 显示“待经营主体确认”，不得虚构字段；保持交易暂停 |
| G3 测量 | GSC、Bing、百度和 Cloudflare 已接入；最小事件连续 7 天无数据质量故障 | 不声称索引恢复、AI referral 或转化增长，只保留技术日志 |
| G4 证据 | 工具/数据页达到来源、方法、样本量、复核人和失效边界门槛 | 页面 noindex 或工具禁用，显示“证据不足” |

门禁只能从 G0 向 G4 顺序通过。下游指标、内容数量或站外提及不能抵消上游失败。

## 2. Route manifest

`public/route-manifest.js` 是 sitemap 与响应索引策略的唯一来源。每条路由至少要表达：

- canonical 路径与索引状态：`index`、`noindex`、`private`、`gone` 或 `redirect`。
- 内容负责人和真实 `lastModified`。
- 缓存策略、允许的 Schema 类型与 `commerceAllowed`。
- 重定向路由的最终目标；不得创建两跳、循环或跨域意外 canonical。

约束：

- `PUBLIC_INDEXABLE_PATHS` 只能由 manifest 中 `index` 路由派生。
- sitemap 必须本地生成，GET 与 HEAD 的状态、Content-Type、ETag 和 Content-Length 语义一致。
- `noindex`、`private`、`gone` 和 `redirect` 路由不得进入 sitemap。
- 发布验证默认读取 manifest 数量，不再依赖固定 34。
- 商业 HOLD 路由即使上游仍有旧页面，也必须返回本地非交易占位页，避免旧 CTA、价格或 Schema 重新出现。

当前默认 HOLD：

- `/shop/`
- `/shop/giffgaff-g0/`
- `/shop/giffgaff-g2/`
- `/guides/1-order/`
- `/guides/4-recharge-service/`

`/research/` 在原创数据发布前保持 `noindex,follow`。微信、Telegram、Google Voice 等缺少本站样本的页面也保持 noindex；后续 301 合并必须等迁移或 28 天基线稳定后单独发布。

## 3. Claim Registry

`public/claim-registry.js` 控制会变化或可能影响交易、安全和资费决策的公开声明。

主流程：

`DRAFT → PENDING_EVIDENCE → IN_REVIEW → ACTIVE`

非公开或终止状态：

`SUSPENDED`、`EXPIRED`、`SUPERSEDED`、`RETIRED`

声明至少记录：

- `claimId`、版本、主题、公开措辞、类别、风险级别和适用范围。
- 官方来源与本站证据、核验日、下次复核日、失效日和修订记录。
- 内容负责人、真实作者和审核人；缺失时不得生成占位身份。
- 受影响的正文、Schema、OG、CTA、工具和 llms 路由。
- `staleBehavior`：过期时隐藏、暂停计算、停止交易或替换为边界提示。

只有来源健康、未过期且状态为 `ACTIVE` 的声明可以公开渲染。商业、安全和资费声明必须 fail closed：过期、缺字段、来源不可访问或证据被撤回时，工具禁用且旧数字不得继续出现在 HTML、JSON-LD、缓存、RSC、OG 或 `/llms.txt`。

以下声明默认 `SUSPENDED`，不得自动恢复：

- G2 价格、余额、库存、推荐购买、验证码可靠性和“更适合首次使用”等结论。
- G0 批量、5 张起购、备卡库存和代激活相关表述。
- 未经复核的发货地区、配送时效、快递费用、邀请返现和积分金额。
- 没有当前官方来源或本站样本的具体平台 OTP 成功率。

## 4. 安全与隐私不变量

- 请求带 `Authorization` 或敏感查询键时，在任何代理、日志和缓存动作之前返回 `400`、`noindex,nofollow,noarchive`、`private,no-store`。
- 敏感键至少包括 `access_token`、`api_key`、`auth_token`、`id_token`、`otp`、密码、订单、邮箱和手机号类字段。
- 公开页面请求转发上游前删除 Cookie 和 Authorization；含 `Set-Cookie` 的上游响应不得进入共享缓存，也不得把 Cookie 返回给公开页面。
- 普通非功能查询参数移除并一跳到无参数 canonical；编码斜杠、反斜杠、NUL 等歧义路径直接拒绝。
- 分析事件只允许时间、canonical path、来源类别、批准的事件名和匿名会话 ID；禁止原始查询、Cookie、Authorization、订单号、手机号和截图。
- Contact 不收集密码、OTP、完整支付卡、Cookie/Token、eSIM QR/LPA、完整 IMSI 或身份证件。聊天渠道仅要求最小化信息和打码截图。

## 5. 内容、Schema 与 AI 文件

- 所有证据页先给 40–80 字直接答案，再标注“官方规则 / 本站风险建议 / 本站实测”。关键声明旁展示适用条件、核验日期、直接来源和失败边界。
- 可见 FAQ 可以保留，但不输出 `FAQPage` Schema。
- 缺少可核验 seller、价格、库存和政策时不输出 `Product`、`Offer`、评价或聚合评分。
- 本站独立 `Organization` 是 `WebSite` 的 publisher；giffgaff 只能作为外部 `Brand/about`，不能成为本站的 `sameAs`、`parentOrganization` 或 seller。
- `/llms.txt` 从 route manifest 与 ACTIVE 声明生成，保持 `noindex,follow,noarchive`。
- `/llms-full.txt` 固定 410、`noindex,nofollow,noarchive`、`private,no-store`。

## 6. 原创工具与样本门槛

| 资产 | 当前策略 | 进入索引的最低条件 |
| --- | --- | --- |
| 保号提醒 | 当前禁用；只有周期声明通过真实作者/复核人和日期门禁后才启用 | 不收集标识符；声明失效时立即停止计算与 `.ics` 导出 |
| 中国漫游成本工具 | 无完整 ACTIVE 费率时禁用 | 官方来源、完整计费单位、核验日和失效日全部存在 |
| 中国网络/SMS 矩阵 | 方法页 noindex | 30 条复核记录、3 城市、3 设备版本、2 网络环境、最近 90 天 |
| OTP 状态板 | 方法页 noindex | 50 个复核事件、5 平台、每平台至少 5 条、3 类环境及普通短信基线 |
| eSIM 兼容检查器 | 方法页 noindex | 20 条精确型号、地区版本、OS 与 App 版本的 A/B 记录 |
| G0/G2 总成本工具 | HOLD | 品牌许可、转售路径、供货证明、账户控制权和实时价格全部通过 |

样本数据必须公开方法、时间范围、复核状态和“不保证未来结果”的边界。不得用虚构样本、空白模板或未经许可的第三方内容补齐门槛。

## 7. 来源登记与版权

第三方教程和竞品只登记以下信息：

- 公开 URL、标题、作者/发布者、发布日期和访问日期。
- 主题、搜索意图、漏斗、CTA、证据类型和独立摘要。
- 许可状态、可引用范围、需要回查的官方事实和本站可验证假设。

没有明确许可时禁止保存或发布第三方全文、截图、图片、视频、附件和逐段近似改写。来源登记表不是内容镜像，也不是证明流量或排名的数据。网站内容必须从官方来源、本站方法和真实样本独立创作。

## 8. GEO 验收

固定 30 个问题覆盖站点身份、选卡、激活、保号、OTP、eSIM、漫游、售后和安全，每月人工复测：

- 固定问题源：`docs/geo/geo-question-set.json`。
- 空白月报与字段定义：`docs/geo/monthly-review-template.json`；未执行的观测保持空数组或 `null`，不得预填结果。

- 关键事实准确率 100%。
- 适用条件和失败边界保留率至少 95%。
- “getgiffgaff 被描述为 giffgaff 官方”必须为 0 次。
- 品牌提及、本站 URL 引用、事实支持和 AI referral 分开统计；提及不能替代准确引用。

GEO 门禁不承诺排名或引用。任一官方身份混淆都是红线，不能被其他分数抵消。

## 9. 外部阻断项与迁移

以下内容必须由业务或平台账号所有者提供，仓库不能自行完成：

机器可读的当前阻断状态见 `docs/external-gate-state.json`；未取得外部证据前不得把其中状态手工改成 PASS。

- giffgaff 书面授权，以及对域名、地区、销售/分发和 G2 流程的明确覆盖。
- 中性品牌域名、注册主体、DNS 权限和迁移窗口。
- 经营主体、真实卖方、联系方式、发货、退款、隐私、作者和审核资料。
- GSC、Bing、百度、Cloudflare DNS/WAF/Verified Bot/日志权限。

第 14 天仍无充分书面许可时进入迁域准备，顺序固定为：

1. 业务所有者注册并完成中性域历史、商标和安全核查。
2. 先让当前核心页面连续 2–4 周保持抓取稳定，同时准备新域；权利方要求立即停用时以其要求为准。
3. 新域使用可复现的正式源码，完成信任页、manifest、声明治理和 34 个历史路由的一对一映射。
4. 切换时只改域名和 canonical 体系，不同时改版、换 CMS、合并 URL 或重写内容。
5. 每个旧 URL 一跳 301 到对应的新 URL；新域同步更新 canonical、OG、Schema、内部链接、sitemap 和 robots。
6. 新站和 301 上线后再提交 GSC Change of Address、Bing/百度新 sitemap，并监控 Cloudflare 日志。
7. 在权利允许时保留旧域和重定向至少 24 个月。
8. 新域稳定满 28 天后，才单独执行旧内容合并和 URL 收缩。

没有目标域名或平台权限时，工程只能准备映射、测试和运行手册，不能虚构域名、宣称换址已完成或自动代表业务提交平台。
