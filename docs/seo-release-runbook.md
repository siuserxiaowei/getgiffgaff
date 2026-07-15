# getgiffgaff SEO / GEO v2 发布运维清单

> 状态（2026-07-15）：v2 技术实现位于当前候选分支，尚需完成发布、缓存清理和线上复核。品牌书面许可、中性域名、真实经营资料及搜索/Cloudflare 账号权限属于外部阻断项，代码测试不能代替。2026-07-15 的 32/34 `noindex` 事故及后续 34/34 修复记录保留在文末历史附录，不再作为当前固定 URL 数量。

配套规则见 [`seo-geo-gates-v2.md`](seo-geo-gates-v2.md)。

## 1. 先确认本次能做什么

发布负责人必须记录：候选 Git commit、当前生产 deployment ID、可恢复 deployment ID、执行人、时间和业务批准范围。

### 技术发布所需权限

- [ ] Cloudflare Pages 项目与 Custom Domains 权限。
- [ ] DNS、Redirect Rules、WAF、AI Crawl Control、缓存清理和请求日志权限。
- [ ] 可查看 Cloudflare Verified Bot 字段，而不是只能看到 User-Agent。
- [ ] GSC、Bing Webmaster Tools 与百度搜索资源平台的已验证所有者权限。

### 不能由工程补写的业务输入

- [ ] 覆盖当前域名、地区、销售/分发及 G2 流程的 giffgaff 书面许可。
- [ ] 真实经营主体、卖方身份、客服渠道、服务时间、SLA、发货和退款资料。
- [ ] 真实作者、审核人、来源政策和纠错负责人。
- [ ] 中性品牌域名、注册主体和迁移窗口。

资料缺失时必须保留“待经营主体确认”和“交易暂停”，不得用占位公司、地址、电话、作者、审核人或服务时间替代。普通 Participant 身份、口头说明或客服聊天不等于覆盖当前域名和 G2 流程的正式许可。

## 2. 五道发布门禁

| 门禁 | 发布判定 |
| --- | --- |
| G0 技术 | manifest 中全部可索引 URL 200、自指 canonical、无 noindex；所有规范变体一跳 |
| G1 品牌 | 已取得充分书面许可，或业务已批准进入中性域迁移 |
| G2 信任 | 真实经营/卖方、联系方式、发货、退款、隐私和编辑资料可核验 |
| G3 测量 | 搜索平台和 Cloudflare 已接入，最小事件连续 7 天通过数据 QA |
| G4 证据 | 工具/数据页达到来源、样本、复核和失效边界门槛 |

本次代码发布可以完成 G0，并以 fail closed 方式保护未通过的 G1–G4。未通过 G1/G2 时不得恢复商业页、G2 CTA、价格、库存或推荐；未通过 G3/G4 时不得宣称转化、AI referral、实测成功率或排名提升。

## 3. T-72 小时：冻结与留档

- [ ] 冻结新增 URL、导航、广告、外链购买和不相关模板改版。
- [ ] 保存当前生产 `/sitemap.xml`、`/robots.txt`、`/llms.txt`、`/llms-full.txt`、核心页面响应头和验证输出。
- [ ] 日志与工单中不得保存 Cookie、Authorization、原始查询、订单号、手机号或聊天截图。
- [ ] 比较生产 sitemap 与候选 `PUBLIC_INDEXABLE_PATHS`；数量变化必须能由 route manifest 中的 HOLD、信任页新增或批准路由变更解释。
- [ ] 检查现有 Cloudflare Redirect Rules 是否仍写死历史 34/33 路径。候选 manifest 新增或移除路由后，同步更新 Zone 规则或确认 Worker 可在一跳内完成所有组合；不得保留两套冲突清单。

发布前生产基线：

```bash
npm run verify:seo -- --base-url https://getgiffgaff.com
```

候选 manifest 与尚未升级的生产版本不一致时，该命令可能按预期失败。记录具体差异，但不得通过重新写死旧数量、删除测试或手工覆盖 `--expected-url-count` 把红灯改绿。

## 4. 本地门禁

在仓库根目录执行：

```bash
npm install --ignore-scripts
npm test
npm run test:coverage
npm run verify
git diff --check
git status --short
```

必须确认：

- [ ] route manifest 是 sitemap、响应索引策略和默认验证数量的唯一来源。
- [ ] 商城、G0、G2、下单和人工充值服务页为 `noindex,follow`、不在 sitemap、`commerceAllowed=false`。
- [ ] `/research/` 和证据不足的平台页维持 noindex。
- [ ] Contact 与 About、Shipping、Returns、Editorial、Disclaimer 可索引；Privacy、Terms 为 `noindex,follow`。
- [ ] 上游即使返回 `noindex`、旧 Product/FAQ Schema、旧价格或 `Set-Cookie`，生产响应仍按 manifest 清理。
- [ ] `/llms-full.txt` 为 410；短版 `/llms.txt` 不含暂停的 G2、价格、库存或推荐声明。
- [ ] `Authorization`、`api_key`、`auth_token`、`id_token`、`otp` 等在请求上游前被拒绝，公开请求 Cookie 不转发。
- [ ] 404 HTML 不含其他页面 canonical 或 `og:url`。
- [ ] 一个 `<main>`、一个 H1、skip link、表格 caption/焦点和 JSON-LD 解析测试通过。
- [ ] diff 不含密钥、真实个人资料、订单信息、虚构经营资料或未获许可的第三方全文/截图。

任一项失败即停止发布。

## 5. 本地与 Pages Preview

启动本地 Pages：

```bash
npx wrangler pages dev public
```

另开终端抽查，端口以 Wrangler 输出为准：

```bash
curl -sS -D - -o /dev/null http://127.0.0.1:8788/contact/
curl -sS http://127.0.0.1:8788/contact/ | rg -n 'canonical|og:url|独立第三方|交易暂停|不要发送'
curl -sS http://127.0.0.1:8788/sitemap.xml | rg -o '<loc>' | wc -l
curl -sSI http://127.0.0.1:8788/sitemap.xml
curl -sS -D - -o /dev/null 'http://127.0.0.1:8788/guides/?api_key=release-probe'
curl -sS -D - -o /dev/null http://127.0.0.1:8788/llms-full.txt
```

- [ ] sitemap GET 和 HEAD 都为 200，并使用一致的 Content-Type、ETag 和 Content-Length 语义。
- [ ] 敏感探针为 400、`noindex,nofollow,noarchive`、`private,no-store`，且未触发上游请求。
- [ ] Preview 自定义页面可访问，但 `.pages.dev` 环境整体保持 `noindex,nofollow,noarchive`。
- [ ] 不向任何搜索平台提交 Preview URL，也不强行让 Preview canonical 指向自身以“跑绿”生产门禁。

如需非生产分支 Preview：

```bash
npm run deploy
```

## 6. 发布与缓存

`npm run deploy` 只发布到 `seo-geo-candidate` Preview 分支，不会切换生产域。先记录 Preview URL 与部署 ID，并运行同一套验证器。

取得明确生产发布批准、工作树已提交且回滚目标已记录后，才执行：

```bash
CONFIRM_PRODUCTION_DEPLOY=getgiffgaff npm run deploy:production
```

生产脚本会拒绝脏工作树，先运行本地门禁，使用当前 commit 部署，再对生产域运行 release verifier。正常发布命令和 CI 不得写死 `--expected-url-count 34`。验证失败时停止后续提交，并按已记录的部署 ID 在 Cloudflare 执行回滚；仓库脚本不会猜测应回滚到哪个生产版本。

部署完成后：

- [ ] 确认生产别名已指向候选 commit，而不是只看到 Preview 成功。
- [ ] 清理受影响的 HTML、sitemap、robots、llms 和旧 HOLD 页面缓存；全站响应策略变化时执行一次受控全站清缓存并记录时间。
- [ ] 检查公开 HTML 的 `Cache-Control`、`CDN-Cache-Control` 和实际 `CF-Cache-Status`；API、错误、敏感参数、含 Cookie 的响应不得进入共享缓存。
- [ ] 检查 HSTS、`X-Content-Type-Options`、`Referrer-Policy`、`X-Frame-Options` 和 `Permissions-Policy`；本轮不申请 HSTS preload。
- [ ] 同步 Cloudflare Redirect Rules 中的 apex、www、HTTP 和尾斜杠路由清单，确保新增信任页也能一跳到最终 canonical。

## 7. 生产强制验收

别名传播和缓存清理完成后执行：

```bash
npm run verify:seo -- --base-url https://getgiffgaff.com
```

该命令的 URL 数量来自当前 route manifest，必须验证：

- [ ] sitemap 条目与 `PUBLIC_INDEXABLE_PATHS` 完全一致且唯一，不含 HOLD/noindex/private/gone/redirect 路由。
- [ ] sitemap 内页面全部直接 200、HTML、无 HTTP 或 meta noindex。
- [ ] 每页一个自指 canonical；`og:url` 与 canonical 一致。
- [ ] HTTP、www 和无尾斜杠组合一跳 301/308 到最终 URL。
- [ ] JSON-LD 可解析，不含 `pages.dev`，不把本站标为 giffgaff 官方实体、母组织、`sameAs` 或 seller。
- [ ] 无 Product/Offer/FAQPage 及无证据价格、库存、评价或聚合评分。
- [ ] Privacy/Terms 为 supporting noindex；404/API/敏感路由和 `/llms-full.txt` 为 private noindex/no-store。
- [ ] `robots.txt` 和 sitemap 不继承预览部署的 robots 头。

再执行专项探针：

```bash
curl -sS -D /tmp/getgiffgaff-sitemap-get.headers -o /tmp/getgiffgaff-sitemap.xml https://getgiffgaff.com/sitemap.xml
curl -sSI https://getgiffgaff.com/sitemap.xml
curl -sS -D - -o /dev/null 'https://getgiffgaff.com/contact/?utm_source=release-probe'
curl -sS -D - -o /dev/null https://getgiffgaff.com/contact//
curl -sS -D - -o /dev/null https://getgiffgaff.com/contact/index.html
curl -sS -D - -o /dev/null 'https://getgiffgaff.com/guides/?otp=release-probe'
curl -sS -D - -o /dev/null https://getgiffgaff.com/llms-full.txt
```

预期：普通查询、双斜杠和 `index.html` 一跳到无参数 canonical；敏感查询 400 且 no-store；`llms-full` 为 410。不要在探针中使用真实令牌、订单或个人信息。

实际 Googlebot Smartphone 是否可抓取，最终以 GSC URL Inspection 的“测试实际网址”和 Cloudflare Verified Bot 日志为准；伪造 User-Agent 的 `curl` 不构成证据。

## 8. 搜索型 Bot 与 Cloudflare

以下操作必须由有安全策略和日志权限的账号执行：

- [ ] 使用 Cloudflare Verified Bot 或官方 IP/DNS 验证 Googlebot、Bingbot、OAI-SearchBot、Claude-SearchBot 和 PerplexityBot；不能仅凭 UA。
- [ ] 搜索型 Bot 的豁免只适用于 GET/HEAD 和公开路由，只移除误伤的挑战/速率限制，不绕过核心 WAF、API、订单和私有路由。
- [ ] 保持 robots 意图：允许搜索型 OAI-SearchBot、Claude-SearchBot、PerplexityBot；阻止训练型 GPTBot、ClaudeBot。
- [ ] 发布后 24–72 小时记录 Verified Bot 的 canonical 路径、状态、延迟和缓存分类；不记录原始 query、Cookie、Authorization 或个人信息。
- [ ] 真实搜索机器人持续出现 403、429 或 5xx 时，只修正命中的具体规则，不开放所有 bot 流量。

Cloudflare AI Crawl Control 可能在最终 robots 响应中添加 Managed Content/Content-Signal；验收检查最终语义，不要求与仓库 `robots.txt` 字节一致。

## 9. 搜索平台提交

只有已验证站点所有者能执行。提交时间和平台回执应记录在发布工单中，不保存登录凭证。

- [ ] GSC：提交一次 `https://getgiffgaff.com/sitemap.xml`；检查首页、Contact、About、一个核心教程和一个 noindex HOLD 页。只对可索引代表页请求抓取，不提交商城/G2 HOLD 页。
- [ ] Bing Webmaster Tools：提交同一 sitemap，检查 URL Inspection / Site Scan。
- [ ] 百度搜索资源平台：提交 sitemap 并使用实际可用的抓取诊断入口；没有权限或功能不可用时明确记录，不能宣称已提交。
- [ ] Cloudflare 日志：验证真实搜索 Bot 命中的是生产版本、正确状态和正确缓存策略。

不要反复点击“请求编入索引”。平台报告 canonical、robots、软 404 或抓取异常时回到代码修复。

## 10. 工具、数据与 GEO 放量门

### 可以先发布

- 保号提醒：全部计算和 `.ics` 生成在浏览器本地完成，不上传号码/账户，不写 `localStorage`。
- 中国漫游成本：仅在完整、未过期的 ACTIVE 费率声明存在时启用；否则禁用并显示“暂不计算”。

### 达标前保持 noindex

| 资产 | 最低样本 |
| --- | --- |
| 中国网络/SMS 矩阵 | 30 条复核记录、3 城市、3 设备版本、2 网络环境、最近 90 天 |
| OTP 状态板 | 50 个复核事件、5 平台、每平台至少 5 条、3 类环境和普通短信基线 |
| eSIM 兼容检查器 | 20 条精确型号、地区版本、OS 与 App 版本 A/B 记录 |

G0/G2 总成本工具继续 HOLD，直到品牌许可、转售路径、供货证明、账户控制权和实时价格全部通过。样本不足时只能展示 noindex 方法说明和“证据不足”，不得生成假数据。

固定 30 个 GEO 问题每月人工复测：关键事实准确率 100%、边界保留率至少 95%、官方身份混淆为 0。提及、URL 引用、事实支持和 AI referral 必须分开记录。

## 11. 来源登记与版权检查

每次把教程或竞品加入研究库前检查：

- [ ] 只保存公开 URL、标题、作者/发布者、日期、主题、意图、漏斗、CTA、证据类型、独立摘要和许可状态。
- [ ] 没有许可时不保存或发布第三方全文、截图、图片、视频和附件。
- [ ] 不做逐段近似改写，不把搜索摘要或竞品商业话术当事实。
- [ ] 关键规则回到当前官方来源；实测结论必须来自本站公开方法和真实样本。
- [ ] 竞品研究不声称对方排名、流量或转化，除非有合法、可复核的数据来源。

来源登记表是研究索引，不是内容镜像。违反版权边界的材料不得随部署发布。

## 12. 回滚与止损

任一条件触发立即停止平台提交，并回滚或向前修复：

- manifest 中可索引页面出现 noindex、非 200、跨域 canonical、重定向循环或多跳。
- sitemap 与当前 `PUBLIC_INDEXABLE_PATHS` 不一致，或 GET/HEAD 语义分裂。
- 商业 HOLD、G2 CTA、价格、库存、Product/Offer/FAQ Schema 或过期声明重新出现。
- `/llms-full.txt` 不再返回 410，或 `/llms.txt` 出现暂停声明。
- Cookie、Authorization、敏感查询、订单或个人信息进入上游、共享缓存或日志。
- 404 带首页 canonical，或本站被 Schema/正文描述为 giffgaff 官方。
- Verified 搜索 Bot 被新规则系统性 403/429/5xx。

处理顺序：

1. 保存失败输出、deployment ID、时间点和不含敏感值的最小日志。
2. 判断上一部署是否满足 v2 安全和商业门禁；满足才允许回滚。
3. 如果上一部署会恢复历史 noindex 事故、交易 CTA 或敏感信息风险，不回滚到该版本，发布最小向前修复。
4. 清理受影响缓存，重跑全部本地与生产门禁。
5. 只有全绿后才恢复搜索平台提交。

## 13. 首个完整 28 天基线

以 v2 生产门禁首次全绿后的下一个完整自然日为 D1。D1–D7 每日检查数据质量，之后每周汇总；没有历史数据时不得补算或声称增长。

| 维度 | 最低记录项 | 权限/边界 |
| --- | --- | --- |
| 索引与抓取 | sitemap 发现数、有效索引、排除原因、核心 URL 最近抓取 | GSC/Bing/百度账号 |
| 搜索表现 | 各引擎品牌/非品牌展示、点击、CTR、位置 | 不跨引擎混算口径 |
| 站内行为 | page view、工具开始/完成、支持入口点击 | 仅使用 `analytics_event_v1` 批准字段 |
| 订单结果 | 仅服务端或支付数据可验证的订单 | 没有可信数据时填 N/A，不用 CTA 点击代替 |
| Bot 健康 | Verified Bot 的状态、延迟、缓存分类 | Cloudflare 日志；无原始 query/凭据 |
| GEO | 引擎、问题、日期、提及、引用 URL、准确率、边界和官方混淆 | 固定 30 问、人工复核 |

## 14. 中性域迁移顺序

第 14 天仍无充分书面许可时，默认进入迁域准备；目标域名必须由业务所有者提供。

1. 对中性域做历史、商标、安全和可持续性核查，并确认注册主体。
2. 权利允许时，先让当前核心页面保持 2–4 周稳定抓取；若权利方要求立即停用，以其要求为准。
3. 新域必须使用可复现的正式源码，并先完成信任页、manifest、Claim Registry 和发布测试。
4. 建立历史 34 路由以及此后新增有效路由的一对一映射；首发阶段不合并 URL。
5. 切换时只改变域名与 canonical 体系，不同时改版、换 CMS、重写内容或更改 IA。
6. 每个旧 URL 一跳 301 到对应新 URL；同时更新 canonical、OG、Schema、内部链接、sitemap、robots 和 llms。
7. 新站及 301 上线后再使用 GSC Change of Address，并向 Bing/百度提交新 sitemap。
8. 权利允许时保留旧域重定向至少 24 个月；持续检查旧 URL、404、抓取和品牌混淆。
9. 新域稳定满 28 天后，再单独发布微信/Telegram/GV、重复问答等 URL 合并。

不要在同一次发布中同时迁域、重做页面、改变 URL、换内容系统和大规模扩写。

## 15. 历史记录（仅供事故追溯）

以下数字和规则描述 2026-07-15 的旧发布快照，不是 v2 当前常量。

### 历史 noindex 事故与第一次修复

- 生产域曾反代带 `X-Robots-Tag:noindex` 的 Pages Preview，历史 sitemap 34 个 URL 中有 32 个受影响。
- Git commit `4b8ef1b`、Cloudflare deployment `0c6b1933-7bc1-4be5-a574-4603c394c186` 完成当时的响应头修复。
- 当时的 Zone Redirect Rule `23a9c07759414918816c2e768101d6f0` 只覆盖历史 33 个非首页无尾斜杠路径；`ea4cb9d838184b509aae1fd95f78c729` 处理 www。v2 发布前必须重新核对这些规则与当前 manifest，不能照抄旧清单。
- 当时 `npm run verify:seo -- --base-url https://getgiffgaff.com --expected-url-count 34` 曾验证历史 34/34 通过。

### 历史证据型教程发布

- Git commit `f864e35`、Pages deployment `552d38ec` 重写了 6 个既有 canonical 教程页，未改变当时 sitemap 的 34 URL。
- 当时本地 52/52 测试和历史 34 URL 生产门禁通过；Preview 保持 noindex。

v2 之后，商业 HOLD、`/research/` noindex 和新增信任页会改变 sitemap 构成。任何新发布都必须以 route manifest 为准，不得用历史 34 覆盖当前真实数量。
