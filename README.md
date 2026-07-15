# getgiffgaff 中文独立信息站

这里整理 giffgaff 英国手机卡（也常被称为 GG 卡）的中文使用资料，覆盖激活、账户、充值、保号、短信、漫游、eSIM 和故障排查。

getgiffgaff 是独立第三方信息与既有订单支持站，不是 giffgaff Limited 官方网站、官方客服或授权代表。运营商规则、号码状态和资费可能变化，实际操作前应回到页面所列的 giffgaff 官方来源复核。

## 当前发布状态

本仓库中的 v2 已于 2026-07-15 提升到生产域（提交 `989c9a1`，Cloudflare Pages 部署 `c7ac75a5-90b9-4e26-a1d0-2ac502de9762`）。生产 release verifier 已验证 28 个 sitemap URL 全部通过，Cloudflare 全量边缘缓存随后完成清除；旧站曾报告的 317 个问题是部署前快照，不再代表当前生产状态。完整结果见 [生产域发布与验证记录](docs/live-verification-2026-07-15.md)。

当前外部平台状态：Google Search Console 已接受 `https://getgiffgaff.com/sitemap.xml`，首页实际网址测试为“可编入索引”，并已将首页、激活教程、保号工具、About 与 Contact 加入优先抓取队列；Bing Webmaster 已完成 CNAME 所有权验证并成功读取 28 个 URL；Cloudflare 管理型 robots、AI crawler 策略及控制台权限已核验。百度搜索资源平台仍因账户实名资料、手机号和验证码未完成而阻塞，仓库不会保存或代填这些敏感资料。

当前分支采用 v2 硬门禁，发布顺序是：

`索引稳定 → 品牌与交易许可 → 真实信任实体 → 声明治理 → 数据基线 → 原创证据 → 白帽传播`

在书面品牌/交易许可、真实供货证据和经营主体资料完成核验前：

- 商城、G0/G2 商品、下单和人工充值服务页默认 `noindex,follow`，不进入 sitemap，也不提供新客交易或库存承诺。
- G2 销售、推荐、价格、余额、验证码可靠性及购买 CTA 全部 fail closed。
- `/answers/` 仅解释 G0/G2 的风险和核验项；G0/G2 是本站或市场分类，不是 giffgaff 官方产品名称。
- Contact 仅处理既有订单和使用问题，并明确不得发送密码、短信验证码、完整支付卡资料、Cookie/Token 或 eSIM QR/LPA 信息。
- 真实经营主体、地址、电话、服务时间、SLA、作者和审核人缺失时显示“待经营主体确认”，不得补写或猜测。

是否恢复交易由业务、授权和法律审核决定，不能用 SEO 分数、内容数量或外链替代。

## 推荐阅读

- [giffgaff 使用教程和避坑清单](https://getgiffgaff.com/guides/6-pitfalls/)
- [国内激活与失败排查](https://getgiffgaff.com/guides/2-activate/)
- [保号规则与本地提醒工具](https://getgiffgaff.com/guides/3-usage/)
- [短信、验证码与信号排查](https://getgiffgaff.com/guides/4-signal/)
- [中国漫游与成本边界](https://getgiffgaff.com/guides/5-travel-data/)
- [eSIM 转换前检查](https://getgiffgaff.com/more/03-esim/)
- [eSIM 二维码与第三方写卡风险](https://getgiffgaff.com/more/04-esim-qrcode/)
- [G0/G2 分类与风险说明](https://getgiffgaff.com/answers/)
- [联系与既有订单支持](https://getgiffgaff.com/contact/)

`docs/articles/` 中的旧长文已经统一标记为 `ARCHIVED / NOT FOR PUBLISHING`。这些文件保留研究历史，可能含暂停的交易链接或已经失效的具体数字，不能作为当前页面素材。所有目录状态与复用规则见 [内容状态与唯一发布源](docs/CONTENT-GOVERNANCE.md)。

## 路由、声明与发布门禁

公开路由数量不再写死为 34。`public/route-manifest.js` 是路由和索引策略的唯一来源：sitemap、canonical、缓存策略、交易开关和生产验证都从 manifest 派生。新增或移除路由时必须先改 manifest，再由测试证明 sitemap 与响应头一致。

`public/claim-registry.js` 管理会变化或有风险的公开声明。只有未过期、来源健康且状态为 `ACTIVE` 的声明可以进入正文、Schema、OG、CTA、工具和 `/llms.txt`。商业、安全和资费声明过期或证据不足时必须隐藏结果或停止转化，不得继续展示旧数字。

当前 AI 辅助文件策略：

- `/llms.txt` 由公开 route manifest 与可发布声明生成，并保持 `noindex,follow,noarchive`。
- `/llms-full.txt` 已退役，固定返回 `410 Gone`；不得手工维护一份可能与页面冲突的长摘要。

完整门禁和状态机见 [SEO / GEO v2 门禁](docs/seo-geo-gates-v2.md)，发布、清缓存、平台提交和回滚见 [SEO / GEO 发布运维清单](docs/seo-release-runbook.md)。

## 本地验证

```bash
npm install --ignore-scripts
npm run verify
npm run test:coverage
git diff --check
```

部署后验证生产域：

```bash
npm run verify:seo -- --base-url https://getgiffgaff.com
```

正常发布不要再传固定 `--expected-url-count 34`；验证脚本默认读取当前 route manifest 的可索引路由数。显式覆盖计数只用于调查 manifest 与候选部署版本不一致的问题，不能作为跳过失败的手段。

## 原创工具与数据门槛

第一阶段只发布低数据风险工具：

- 保号提醒在浏览器本地按日历月计算并导出 `.ics`，不上传号码或账户信息，也不写入 `localStorage`。
- 中国漫游成本工具只有在完整、未过期的 `ACTIVE` 费率声明存在时才启用；缺少证据时显示“暂不计算”，不提供推测价格。

后续数据资产达到以下最低门槛前只保留 `noindex` 方法预览：

| 资产 | 最低发布证据 |
| --- | --- |
| 中国网络/SMS 矩阵 | 30 条复核记录、3 个城市、3 个设备版本、2 个网络环境、最近 90 天 |
| OTP 状态板 | 50 个复核事件、5 个平台、每平台至少 5 条、3 类环境，并有普通短信基线 |
| eSIM 兼容检查器 | 20 条精确到型号、地区版本、OS 与 App 版本的 A/B 记录 |
| G0/G2 总成本工具 | 品牌许可、转售路径、供货证明、账户控制权和实时价格全部通过；此前保持 HOLD |

样本不足时明确写“证据不足”，禁止生成虚构样本、空壳状态板或批量 programmatic SEO 页面。

## 竞品研究与版权边界

用户指定的教程和竞品只进入内部来源登记表，记录公开 URL、作者、发布日期、主题、搜索意图、漏斗、CTA、证据类型、独立摘要和许可状态。

没有明确许可时：

- 不下载或镜像第三方全文、截图、图片、视频和附件。
- 不做逐段近似改写，也不把搜索摘要当作已核实事实。
- 网站内容必须依据官方来源、本站方法和本站真实样本独立创作。
- 竞品研究只能用于发现用户问题、内容结构和证据缺口，不能冒充原创实测。

研究资产入口：

- [用户指定 6 个来源的结构化拆解](docs/research/sources/six-source-teardown.json)
- [40 个竞品研究与内容差距](docs/research/competitor-study-2026-07-15.md)
- [来源字段、版权边界与验证规则](docs/research/source-schema.md)
- [历史内容集群计划](docs/strategy/cluster-plan.md)（`ARCHIVED_NOT_FOR_PUBLISHING`，不得覆盖 route manifest）

## 上线之外的阻断项

以下事项不能由代码仓库自动完成，必须由对应所有者提供：

- 覆盖当前域名、地区、销售/分发及 G2 流程的 giffgaff 书面许可；普通 Participant 身份或客服聊天不能替代。
- 不含第三方商标的中性品牌域名、注册主体与迁移窗口。
- 可公开核验的真实经营主体、卖方身份、联系方式、发货、退款、隐私、作者和审核信息。
- 百度搜索资源平台账户的实名资料、手机号和验证码；GSC、Bing 与 Cloudflare 控制台访问已于 2026-07-15 核验，但 G3 仍需连续 7 天无数据质量问题后才能通过。

第 14 天仍无充分书面许可时，默认进入中性域迁移准备。迁移必须一对一保留 URL，不能同时改域名、重做设计、合并 URL 和更换内容系统；详细顺序见发布手册。

## 历史事故说明

2026-07-15 之前，生产域曾反代带 `X-Robots-Tag: noindex` 的 Pages 预览部署，历史 sitemap 的 34 个 URL 中有 32 个受到影响。该事故随后修复，并曾完成历史 34/34 验证。

“34”只描述当时的事故与发布快照，不是当前架构常量。v2 已改为由 route manifest 计算可索引 URL，商业 HOLD、信任页新增或路由合并都会合法改变 sitemap 数量。

## 官方参考

- [giffgaff Terms and conditions](https://www.giffgaff.com/boiler-plate/terms)
- [Activating your giffgaff SIM](https://help.giffgaff.com/en/articles/240393-activating-your-giffgaff-sim)
- [Understanding why your number has been deactivated](https://help.giffgaff.com/en/articles/242797-understanding-why-your-number-has-been-deactivated)
- [Roaming with giffgaff](https://www.giffgaff.com/roaming)
- [Switching to an eSIM with giffgaff](https://help.giffgaff.com/en/articles/261570-switching-to-an-esim-with-giffgaff)
