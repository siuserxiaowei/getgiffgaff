# 生产域发布与验证记录（2026-07-15）

状态：`PASS — v2 information-only release is live; commerce remains closed`。

## 发布证据

- Git 提交：`989c9a1 feat: enforce SEO GEO release gates`
- Cloudflare Pages 生产部署：`c7ac75a5-90b9-4e26-a1d0-2ac502de9762`
- 生产域：`https://getgiffgaff.com`
- sitemap 可索引 URL：28（由 route manifest 派生，不再写死 34）

执行命令：

```bash
npm run verify:production
```

本地 `npm run verify` 通过 112/112 项测试。最终生产验证器返回零错误：28 个唯一 sitemap URL 均为 200、无 `noindex`、自指 canonical，且 `og:url` 与 canonical 一致；HTTP、www、尾斜杠、双斜杠、`index.html` 与查询参数变体按策略规范化。敏感查询和授权探针 fail closed，404、隐私路由与退役的 `/llms-full.txt` 保持各自的非索引策略。

Cloudflare 动态重定向规则已修复。缓存清除后的首次复验发现 `/editorial-policy` 与 `/disclaimer` 的 6 个 HTTP/www 无尾斜杠变体仍为两跳；规则 `23a9c07759414918816c2e768101d6f0` 补齐两条 manifest 路径后，最终生产 verifier 确认所有 canonical 变体通过。控制台执行“清除所有内容”并明确返回“已成功收到清除请求，并将在 5 秒内生效”。连续两次 GET `/about/` 时外层 `CF-Cache-Status` 为 `DYNAMIC`，但第二次响应包含 `x-getgiffgaff-cache: HIT` 与 `age: 3`，证明 Worker Cache API 实际命中；不把 `DYNAMIC` 误记为 CDN Cache Rules 命中。管理型 robots 与 AI Crawl Control 已核验：搜索型 Google、Bing、百度及 OpenAI 爬虫允许访问公开路由，训练型爬虫继续阻止；这不绕过核心 WAF。

## 搜索平台提交

- Google Search Console：域名资源 `sc-domain:getgiffgaff.com` 可访问，已提交 `https://getgiffgaff.com/sitemap.xml`；控制台返回“已成功提交站点地图”。首页历史检查仍显示 2026-07-12 的旧 `X-Robots-Tag: noindex` 抓取记录，但 2026-07-15 的“测试实际网址”明确返回“网址可编入 Google 索引”。`/`、`/guides/2-activate/`、`/guides/3-usage/`、`/about/` 与 `/contact/` 五个代表性模板已加入优先抓取队列；Google 后续处理、重新抓取和发现数量属于异步状态。
- Bing Webmaster Tools：通过 DNS-only CNAME `2fef98f77f7bd1081804d6d54aaa86f4 → verify.bing.com` 完成所有权验证。sitemap 状态为 `Success`，错误 0、警告 0、发现 URL 28。
- 百度搜索资源平台：已登录，但添加站点前强制补全真实姓名、职位、中国大陆手机号及短信/邮箱验证码等账户资料。未取得这些资料，不代填、不记录，故尚未验证或提交。

## 历史部署前失败

同日部署前，旧生产快照曾报告 317 个问题，包括 34/28 sitemap 差异、旧交易 CTA/Schema、敏感参数未 fail closed、信任页缺失及错误 canonical。该数字只用于说明部署前后差异，不是当前生产状态或长期 KPI。

G0 因当前生产零错误验证而通过。G1、G2、G4 仍取决于品牌许可、真实经营资料和原创证据；G3 只完成平台接入/提交，必须再观察连续 7 天的数据质量，不能提前标记为通过。以上结果不恢复交易，也不构成排名或收录承诺。
