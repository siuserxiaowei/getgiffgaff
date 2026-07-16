# getgiffgaff SEO / GEO 发布运维清单

> 状态（2026-07-16）：追加式增长层已发布到生产，34 个旧页面保持冻结，当前 manifest 为 42 个页面、sitemap 为 39 个可索引 URL。生产功能与缓存门禁已通过；Cloudflare 第一条规范化规则仍需补入 5 个新增无尾斜杠路径，因此完整生产 SEO 门禁尚有 15 个一跳变体失败。Google/Bing 所有权验证仍有效，IndexNow 已接收本批 39 URL；百度验证与搜索平台后台回执仍待账号所有者完成。本文同时保留为后续发布 SOP。命令不包含任何密钥；凡标注“需权限”的步骤，必须由对应账号所有者执行并保留结果。

## 1. 发布门槛与责任人

发布前先指定一名发布负责人，并确认以下权限或资料是否到位：

- [ ] Cloudflare Pages 项目与 DNS 管理权限（需 Cloudflare 账号）。
- [ ] Google Search Console 已验证所有者、Bing Webmaster Tools 与百度搜索资源平台权限（需各平台账号）。
- [ ] 可查看 Cloudflare 请求日志、Verified Bot 字段及缓存状态的权限。
- [ ] 业务负责人已确认经营主体、客服渠道、服务时间、响应 SLA、发货、退换/退款、作者与审核人信息。缺失时不得自行补写或猜测。
- [ ] 业务负责人已提供 giffgaff 书面品牌许可，或法务已确认可接受的域名与表述边界。没有许可时，当前域只按过渡资产处理。

技术性 `noindex` 修复可以独立发布；依赖真实业务资料的 Contact、Schema 与政策内容，资料未确认时不得用占位信息冒充正式内容。

## 2. T-72 小时：冻结与留档

- [ ] 冻结新增内容、URL、导航和模板改版，只允许本次索引修复及其测试变更。
- [ ] 记录待发布 Git commit、当前生产部署 ID、上一个可恢复部署 ID、执行人和时间。
- [ ] 保存发布前 `/sitemap.xml`、`/robots.txt`、核心页面响应头及验证脚本输出；日志中不得保存 Cookie、订单参数或个人信息。
- [ ] 确认 sitemap 预期为 **39 个唯一 URL**；如业务已批准变更数量，先同步更新测试和发布记录，不能临时跳过计数检查。

生产发布前的基线命令：

```bash
npm run verify:seo -- --base-url https://getgiffgaff.com --expected-url-count 39
```

该命令调用 [`scripts/verify-seo-release.mjs`](../scripts/verify-seo-release.mjs)。如果当前线上正是待修复的 `noindex` 事故版本，预发布基线可以失败，但只允许记录已经确认的事故项；出现新的 5xx、跨域 canonical、重定向环或 sitemap 数量变化时停止发布。发布后必须全部通过，不得继续豁免。

## 3. 本地测试门禁

在仓库根目录执行：

```bash
npm install --ignore-scripts --no-package-lock
npm test
npm run test:coverage
npm run verify
git diff --check
```

当前仓库没有 tracked `package-lock.json`。在依赖锁定方案完成单独审查前，安装命令必须显式使用 `--no-package-lock`，否则会生成未跟踪 lockfile，并被 clean-worktree 门禁拒绝。

视觉与交互门禁需先安装 Chromium，并在另一个终端用当前 `.release` 启动只读本地服务器：

```bash
npx playwright install chromium
python3 -m http.server 4173 --bind 127.0.0.1 --directory .release
npm run verify:browser -- http://127.0.0.1:4173 /tmp/getgiffgaff-visual-release
```

- [ ] `npm test` 全绿；重点覆盖 [`test/seo-response-policy.test.mjs`](../test/seo-response-policy.test.mjs)、[`test/contact-seo.test.mjs`](../test/contact-seo.test.mjs)、[`test/worker-seo-integration.test.mjs`](../test/worker-seo-integration.test.mjs) 和 [`test/verify-seo-release.test.mjs`](../test/verify-seo-release.test.mjs)。
- [ ] `npm run verify` 通过；该命令依次运行测试、构建 `.release`，再由 [`scripts/verify-release-artifact.mjs`](../scripts/verify-release-artifact.mjs) 验证发布产物。
- [ ] 覆盖率下降有明确解释；新增响应策略、重定向或验证逻辑必须有回归测试。
- [ ] `verify:browser` 生成 `report.json`，14 组旧页面截图均达到 SSIM ≥ 0.995、变化像素比例 ≤ 0.1%，10 张新增页截图和 34 项交互完成，且无浏览器错误。
- [ ] diff 中没有密钥、令牌、真实订单数据、个人联系方式草稿或无关改动。

任一项失败即停止，不执行部署。

## 4. 本地与 Pages Preview 检查

本地启动 Pages：

```bash
npx wrangler pages dev .release
```

另开终端做基础检查（端口以 Wrangler 实际输出为准）：

```bash
curl -sS -D - -o /dev/null http://127.0.0.1:8788/contact/
curl -sS http://127.0.0.1:8788/contact/ | rg -n 'canonical|og:url|application/ld\+json|独立第三方'
curl -sS http://127.0.0.1:8788/robots.txt
curl -sS http://127.0.0.1:8788/sitemap.xml | rg -o '<loc>' | wc -l
```

需要 Cloudflare Pages 权限时，可建立非生产分支 Preview：

```bash
npx wrangler pages deploy .release --project-name getgiffgaff --branch seo-release-check --commit-dirty=true
npm run verify:preview -- --base-url https://<deployment-id>.getgiffgaff.pages.dev
```

- [ ] Preview 页面、二维码、弹窗键盘操作和核心链接均可用。
- [ ] `.pages.dev` Preview 按设计应返回 `noindex, nofollow, noarchive`，防止预览环境被收录。
- [ ] 不把 Pages Preview 上的 `noindex` 当作生产公开页策略，也不把 Preview URL 提交给搜索引擎。

注意：[`scripts/verify-seo-release.mjs`](../scripts/verify-seo-release.mjs) 要求 sitemap、canonical 与被测 origin 完全一致，因此 `.pages.dev` Preview 不应被强行跑成“绿色”。候选版本的预发布门禁由本地测试、Preview 人工检查和生产发布前基线共同组成；生产域发布后再执行完整 39 URL 验证。

## 5. 发布、缓存与域名

确认测试结果和回滚目标后，由有 Cloudflare 权限的发布负责人执行：

```bash
npm run deploy
```

`npm run deploy` 会先执行仓库的 `predeploy` 门禁。部署完成后：

2026-07-15 生产实施记录：

- Git commit：`4b8ef1b`；Cloudflare Pages deployment：`0c6b1933-7bc1-4be5-a574-4603c394c186`。
- Zone Redirect Rule `23a9c07759414918816c2e768101d6f0` 排在第一位：只匹配 `PUBLIC_INDEXABLE_PATHS` 中除 `/` 外的 33 个无尾斜杠 GET/HEAD 路径，目标为 `concat("https://getgiffgaff.com", http.request.uri.path, "/")`，保留 query。
- Zone Redirect Rule `ea4cb9d838184b509aae1fd95f78c729` 排在第二位：匹配 `(http.host eq "www.getgiffgaff.com")`，目标为 `concat("https://getgiffgaff.com", http.request.uri.path)`，保留 query。
- 最终执行 `npm run verify:seo -- --base-url https://getgiffgaff.com --expected-url-count 34`，结果为 34 个唯一 sitemap URL、34 个页面及全部 canonical 组合变体通过。
- Cloudflare AI Crawl Control 会在生产 `/robots.txt` 前附加 Managed Content/Content-Signal，因此验收应检查最终指令语义，不能要求与仓库文件逐字节相同。`robots.txt` 不是 HTML canonical 目标，不用它代替本节的 34 个公开 HTML 变体验收。

2026-07-15 证据型内容系统发布记录：

- Git commit：`f864e35`；Cloudflare Pages deployment：`552d38ec`（`https://552d38ec.getgiffgaff.pages.dev`）。
- 6 个既有 canonical URL 在不增加 sitemap URL 的前提下完成全面重写：`/guides/2-activate/`、`/guides/3-usage/`、`/more/03-esim/`、`/more/04-esim-qrcode/`、`/guides/4-signal/`、`/answers/`。
- 本地 `npm run verify` 为 52/52 测试通过；6 个来源、40 个竞品、5 个集群/20 个 spoke/6 份 brief/90 条内链计划的结构校验全部通过。
- 自动 `postdeploy` 再次执行生产门禁：34 个唯一 sitemap URL、34 个页面及全部 canonical 组合变体通过。
- 生产抽查确认 6 页均为 200、自指 canonical、显式 index 指令和 `x-getgiffgaff-render-mode: edge-static-tutorial`；首页、Contact 与 QA 不再被注入教程目录，只有 `/guides/` 包含该目录。
- Preview 上同一教程返回 `noindex, nofollow, noarchive`，生产页返回 `index, follow, max-snippet:-1, max-image-preview:large`。

2026-07-16「保留旧站、追加增长层」发布记录：

- 基线为 `7cac06f`；追加式增长提交依次为 `e15f6dc`、`50f252a`、`2e1f076`、`1269ff5`、`77dc29d`、`6075cef`。当前生产 deployment 为 `639a0f0a-4be2-4634-9eb1-96971ad307e6`，source 为 `6075cef`。
- 34 个旧页面的可见正文、Title、Description、H1、导航、紫色视觉、卖卡入口、G0/G2、微信“小玉”和快团团保持冻结；新增 5 个可索引教程/工具、3 个 `noindex` 证据预览页面。manifest 共 42 个页面，sitemap 共 39 个可索引 URL。
- 本地自动测试为 80/80；Preview `abf2abb6-90ba-4377-9724-90355c107e63` 的发布门禁结果为 42 个路由、14 个资产、39 个 sitemap URL、0 个失败。
- 最新生产浏览器 QA：42 路由乘桌面/手机共 84/84；业务与工具链 35/35；首页购买指南入口 9/9。微信与快团团二维码、键盘焦点、Esc 关闭、焦点归还、G0/G2、Contact、总成本、保号日历及漫游工具均通过，浏览器错误为 0。该检查只能证明快团团二维码入口和站内链路，不能替代微信内真实扫码付款、SKU、金额及退款链路验收。
- 正式视觉报告见 [`docs/qa/browser-visual-report-2026-07-16.json`](qa/browser-visual-report-2026-07-16.json)：14/14 旧页双视口比较、10/10 新增页截图、34/34 交互，错误 0、阈值失败 0；13 组无像素变化，手机商城 6 个像素变化（0.001823%），SSIM 全部为 1。
- 公开 canonical HTML 已启用版本化 Cache API：同一路由生产实测 `MISS → HIT → HIT`；Cookie 请求绕过公共缓存并返回 `private, no-store`。
- IndexNow key 已部署到 `/indexnow-key.txt`；2026-07-16 向 `api.indexnow.org` 提交 39 个可索引 canonical URL，回执为 HTTP 202。该状态只表示批次已接收、key 校验待完成，不表示已经抓取或收录。
- 当前唯一技术发布阻断是 Zone Redirect Rule `23a9c07759414918816c2e768101d6f0` 仍只有 2026-07-15 的 33 个旧路径。需在其 `http.request.uri.path in {...}` 集合中追加 `/guides/7-arrival-checklist`、`/guides/8-uk-sim-choice`、`/tools/keep-number-reminder`、`/tools/china-roaming-cost`、`/tools/g0-g2-total-cost`，保持规则第一优先级、动态目标与 301 设置不变。未补齐前，生产 `postdeploy` 会对这 5 个路由的 `www`、HTTP apex、HTTP www 无尾斜杠组合报告 15 个两跳失败，不能宣称完整 SEO 门禁全绿。
- GSC apex TXT 和 Bing CNAME 所有权验证仍在公网解析；同一个 sitemap URL 曾在两平台提交。当前 39 URL 是否已被平台后台重新读取仍需登录后台确认。百度尚无可核验证明，仍需账号所有者完成实名、手机号和验证码流程。

- [x] 生产别名传播完成后，34 URL 门禁已成功退出；若自动 `postdeploy` 恰逢别名传播而命中旧边缘版本，等待传播完成后必须重跑，仍失败则按第 9 节回滚或向前修复。

- [x] 在 Cloudflare Pages 中确认生产分支和部署 commit 正确。
- [ ] 清理受影响的 HTML、`/sitemap.xml`、`/robots.txt`、`/llms.txt` 与 `/llms-full.txt` 缓存。本次响应头策略全站变化时优先执行一次受控的全站清缓存，并记录时间（需 Cloudflare 缓存权限）。
- [ ] 确认公开 HTML 使用预期边缘缓存；API、订单、带敏感参数的请求和含 `Set-Cookie` 的响应不得进入公共缓存。
- [ ] 在 Cloudflare Custom Domains 中确认 apex 与 `www` 均绑定正确证书；在 DNS 中确认没有绕过 Worker 的旧记录（需 DNS 权限）。

DNS 与一跳规范化检查：

```bash
dig +short getgiffgaff.com A
dig +short getgiffgaff.com AAAA
dig +short getgiffgaff.com CNAME
dig +short www.getgiffgaff.com A
dig +short www.getgiffgaff.com AAAA
dig +short www.getgiffgaff.com CNAME

curl -sS -o /dev/null -D - --max-redirs 0 http://getgiffgaff.com/contact/
curl -sS -o /dev/null -D - --max-redirs 0 https://www.getgiffgaff.com/contact/
curl -sS -o /dev/null -D - --max-redirs 0 https://getgiffgaff.com/contact
curl -sS -o /dev/null -D - --max-redirs 0 http://www.getgiffgaff.com/contact/
curl -sS -o /dev/null -D - --max-redirs 0 http://www.getgiffgaff.com/contact
```

五个变体都必须以一个 `301` 或 `308` 直接到：

```text
https://getgiffgaff.com/contact/
```

不得出现 `www` 200、临时重定向、两跳链、跨域跳转或循环。

如果 Cloudflare 在 Pages Worker 之前先把 HTTP 跳到 HTTPS，单靠 Worker 无法消除 `HTTP → HTTPS www → HTTPS apex` 链。此时需在 Cloudflare Redirect Rules / Bulk Redirects 中配置优先级更高的规范化规则（需 Zone Rules 权限）：`www.getgiffgaff.com` 指向 `https://getgiffgaff.com`，保留 query、子路径和 path suffix；对 39 个可索引 HTML 路由中除 `/` 外的 38 个无尾斜杠路径，规则目标必须直接是最终带 `/` URL。以生产 `verify:seo` 的组合变体结果为准，不能只验证 HTTPS www。

## 6. 发布后 39 URL 强制验收

缓存清理后立即执行：

```bash
npm run verify:seo -- --base-url https://getgiffgaff.com --expected-url-count 39
```

该门禁必须确认：

- [x] sitemap 有 39 个唯一 URL，且都属于 canonical origin。
- [x] 39/39 均直接返回 200、HTML、无 HTTP 或 meta `noindex`。
- [x] 每页只有一个自指 canonical，且 `og:url` 与 canonical 一致。
- [ ] HTTP、`www`、无尾斜杠变体均一跳永久重定向。当前 5 个新增路径的 15 个组合变体仍需更新 Zone Redirect Rule 后重跑。
- [x] JSON-LD 可解析，不引用 `pages.dev`，不把本站声明为 giffgaff 官方实体、母公司或官方 seller。
- [x] `/llms.txt`、`/llms-full.txt` 保持 supporting `noindex, follow, noarchive`；404、API 和敏感路由保持 `noindex, nofollow, noarchive`；`robots.txt` 不带继承的 X-Robots-Tag。这些固定探针由 `verify:seo` 自动检查。
- [x] Product JSON-LD 不包含未经发布证据支持的 `offers`、价格、库存、评价或聚合评分。

再用真实 Googlebot Smartphone 抓取结果确认核心页面。仅用伪造 UA 的 `curl` 不足以证明真实 Googlebot 可访问；最终以 GSC URL Inspection 的“测试实际网址”和 Cloudflare Verified Bot 日志为准。

## 7. Verified Bots、AI 爬虫与日志

以下操作需 Cloudflare 安全策略和日志权限：

- [ ] 对 Googlebot、Bingbot、OAI-SearchBot、Claude-SearchBot、PerplexityBot 使用 Cloudflare Verified Bot 信号或官方公布的 IP/反向与正向 DNS 验证；不能只按 User-Agent 放行。
- [ ] 检查 WAF、Bot Fight Mode、速率限制、地区规则和 AI Crawl Control，确保搜索型爬虫不会被 403/挑战页拦截。
- [ ] 保持 [`public/robots.txt`](../public/robots.txt) 的意图：允许搜索型 OAI-SearchBot、Claude-SearchBot、PerplexityBot；阻止训练型 GPTBot、ClaudeBot。每次修改都要复核官方爬虫名称和用途。
- [ ] 在发布后 24–72 小时抽查日志：请求路径、状态码、缓存状态、Verified Bot 分类和 IP 验证结果；不得仅以 UA 字符串统计。
- [ ] 发现真实搜索机器人持续 403、429 或 5xx 时，先定位具体 WAF 规则并最小范围修正，不能无条件放开所有“bot”流量。

## 8. 搜索引擎重新提交

只有对应账号的已验证站点所有者可以执行，完成后在发布记录中保存提交时间和平台回执，不记录登录凭证。

- [ ] Google Search Console：重新提交 `https://getgiffgaff.com/sitemap.xml`；用 URL Inspection 对首页、`/shop/`、`/answers/`、`/guides/1-order/`、`/contact/` 及每类核心模板各一页执行“测试实际网址”，确认可编入索引后请求抓取。
- [ ] Bing Webmaster Tools：重新提交同一 sitemap，并检查 URL Inspection / Site Scan 的抓取状态。
- [ ] 百度搜索资源平台：提交 sitemap，检查抓取诊断与索引反馈；如平台不支持当前提交方式，记录实际可用入口，不虚构已成功。
- [ ] 各平台发现的 canonical、robots、软 404 或抓取异常应回到代码修复，不能只重复点击“请求收录”。

## 9. 回滚与止损

任一条件触发立即停止后续提交，并进入回滚或紧急向前修复：

- 公开 sitemap URL 出现 `noindex`、非 200、跨域 canonical、重定向循环或两跳以上规范化。
- sitemap 不再是批准的 39 个唯一 URL。
- JSON-LD 无法解析、含 `pages.dev`，或出现本站是 giffgaff 官方实体的错误声明。
- 5xx、403/429、缓存错误或核心 CTA 故障明显上升。
- 订单、Cookie、个人信息或敏感参数进入公共缓存/日志。
- Verified Googlebot/Bingbot/搜索型 AI 爬虫被新规则系统性阻断。

处理顺序：

1. 保留失败验证输出、部署 ID、时间点和最小必要日志。
2. 若上一个部署没有本次事故，通过 Cloudflare Pages 回滚到记录的部署并清理相关缓存（需账号权限）。
3. 若上一个部署就是已知的 32/34 `noindex` 事故版本，不回滚到同一故障；保持内容冻结，发布最小向前修复。
4. 重新执行本地门禁与生产 39 URL 验证，全部通过后才恢复搜索引擎提交。

## 10. 首个完整 28 天基线

以“生产门禁首次全绿后的下一个完整自然日”为 D1。D1–D7 每日观察，之后每周汇总；28 天内不把短期波动表述成排名承诺。

| 维度 | 最低记录项 | 数据权限/前提 |
| --- | --- | --- |
| 索引与抓取 | sitemap 发现数、有效索引数、排除原因、核心 URL 最近抓取时间 | GSC、Bing、百度账号 |
| 搜索表现 | 品牌/非品牌查询的展示、点击、CTR、平均位置 | 先由业务确认品牌词规则 |
| 站内结果 | 商品/教程 CTA、人工联系、自助解决、下单转化 | 分析工具权限；事件定义需业务确认 |
| 爬虫健康 | Verified Bot 的请求量、200/3xx/4xx/5xx、缓存命中 | Cloudflare 日志权限 |
| AI referral | 来源、落地页、会话及转化 | 分析工具能识别 referral，排除内部/机器人流量 |
| GEO 固定问题集 | 引擎、问题、日期、是否提及品牌、引用 URL、事实准确率 | 固定问题清单和人工复核标准 |

发布记录中同时注明代码变更、内容变更、渠道活动和异常事件，避免把同期外部变化错误归因于 SEO 修复。经营主体、联系方式、SLA、退款结果或“自助解决”口径没有真实资料时，该指标留空并标注“待业务确认”，不能估算填充。

## 11. 品牌许可与迁域决策门

在购买外链、大规模扩写内容或启动 programmatic SEO 前，必须二选一：

- [ ] 业务负责人提供可核验的 giffgaff 书面品牌许可，法务确认域名、广告、销售与官方关系表述边界；或
- [ ] 业务负责人批准迁往不含他人商标的独立品牌域，并提供目标域名、经营主体和迁移窗口。

未满足任一项时：

- 不购买外链、不造评论、不做国家 × 平台 × 卡种的批量页面；
- giffgaff 只作为外部 `Brand/about`，不得成为本站 `publisher`、`parentOrganization`、`sameAs` 或官方 `seller`；
- 不使用“giffgaff 官方教程”“getgiffgaff 官网”等官方身份暗示；
- 当前域只继续必要的技术维护和真实用户支持。

若批准迁域，另立迁移计划：逐 URL 一对一 301、canonical/内部链接/sitemap 同步、搜索平台换址或重新验证、日志监控，并由域名所有者保证旧域至少保留 24 个月。迁移目标域和法律结论必须由业务所有者提供，工程人员不得代为编造或决定。
