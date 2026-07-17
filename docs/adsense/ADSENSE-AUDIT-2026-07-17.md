# getgiffgaff AdSense 准入审计

- 审计日期：2026-07-17（Asia/Shanghai）
- 审计对象：`https://getgiffgaff.com` 与当前本地候选版
- 参考清单：`adsense-site-auditor` 73 个唯一要求 ID
- 审计方式：公网请求、仓库代码/构建产物、测试与 Google 官方资料交叉核对

Decision: **Not ready**

当前不应提交 AdSense 网站审核，也不应加载广告脚本。本报告覆盖 **73/73** 项：21 Pass、16 Fail、10 Unknown、26 N/A。Google 会独立决定最终审核结果。

## 当前结论

1. 生产发布门禁仍有 21 项：15 个 canonical 两跳、4 个政策页 404、2 个 Cloudflare robots 来源冲突。
2. 生产 `/ads.txt` 为 404，账号、站点列表和真实 publisher ID 均未核对。
3. 隐私、条款、退款、物流四页的本地版只是缺口状态页，不是可发布的正式政策。
4. 34 个旧页中有 24 页的筛查正文少于 900 字符；这是站内筛查线，不是 Google 官方字数门槛。
5. 生产购买 CTA 与“缺真实 SKU、支付、履约和售后证据”仍有冲突。
6. 本地已实现所有权验证与广告加载分离：只有显式提供合法格式的真实 ID 时才生成 `ads.txt` 和 meta；默认零产物、零广告脚本、零广告可投页。此修复未部署。

## 必须先闭环的事项

- 由经营负责人确认真实主体、公开联系方式、数据流、交易责任和各项政策，然后由合格人员审核。
- 修复 Cloudflare 一跳重定向和 robots 单一来源，再跑生产 `postdeploy`。
- 对 WeChat、Telegram、Google Voice 三个缺少平台实测的可索引页合并/301，或暂时 noindex。
- 建立真实 SKU、支付、履约、退款、售后证据链；证据未齐前不将咨询入口写成可付款商品。
- 申请人已确认年满 18 岁、当前无 AdSense 账号，准备走个人账号路径；在其他门禁闭环后再注册、添加站点并获取 publisher ID。不在公开仓库记录身份或收款资料。
- 公开隐私联系邮箱已确认为 `siuserxy@gmail.com`；这只关闭联系方式缺口，不代表隐私政策已完整。
- 根据真实地区和广告模式选择 Google CMP/认证 TCF CMP，完成同意、拒绝和撤回测试。

## 73 项完整检查表

| ID | Status | Evidence | Next action |
| --- | --- | --- | --- |
| ADS-ELIG-01 | Pass | 申请人已确认年满 18 岁；未收集生日或身份证信息。 | 注册时仅在 Google 账号流程中填写真实资料。 |
| ADS-ELIG-02 | Pass | 申请人已确认当前没有 AdSense 账号，暂无重复账号冲突。 | 走个人账号路径创建唯一账号，以后不要重复注册。 |
| ADS-ELIG-03 | Fail | 内容、隐私、出版者身份和技术门禁均有失败项。 | 闭环本表 Fail 后重审。 |
| ADS-ELIG-04 | N/A | 这是自托管 Cloudflare 网站，非 Blogger/YouTube 托管流程。 | 使用普通网站流程。 |
| ADS-OWN-01 | Pass | 仓库可构建 46 个 HTML，且已有统一、幂等的 head 验证注入路径。 | 只使用账号后台给出的真实代码/ID。 |
| ADS-OWN-02 | Unknown | 仓库权限不能代替域名、Cloudflare 与申请人权属证明。 | 由申请人私下留存 registrar、DNS、Pages 权限证据。 |
| ADS-OWN-03 | Pass | 公开页面 JS 可正常渲染，构建产物 head/body 结构完整。 | 未来加 CMP/广告代码后重跑浏览器测试。 |
| ADS-SITE-01 | N/A | 当前没有 AdSense 账号，因此不存在可检查的网站列表、验证、审核或 Ready 状态。 | 先闭环网站门禁，再注册唯一个人账号并添加精确 apex 域名。 |
| ADS-SITE-02 | Pass | 本地支持 `ads.txt` 和 `google-adsense-account` meta 两种所有权验证能力。 | 只启用 AdSense 当次流程给出的方式。 |
| ADS-TXT-01 | N/A | 生产尚未使用 ads.txt，也没有可核对的真实 publisher ID。 | 获得 ID 后核对唯一 Google seller line。 |
| ADS-TXT-02 | N/A | 生产 `/ads.txt` 为 404，但申请人尚无 AdSense 账号和 publisher ID；当前无法发布真实 seller line。 | 获得真实 ID 后立即转为适用，通过私密环境变量构建并公网复核 200 `text/plain`。 |
| ADS-CONTENT-01 | Fail | 34 个旧页中 24 页筛查正文少于 900 字符，且部分页缺独特证据。 | 合并/301 或补真实原创测试数据。 |
| ADS-CONTENT-02 | Pass | 未发现把复制文章、视频或联盟 feed 当主体内容。 | 继续保留来源与独立表达边界。 |
| ADS-CONTENT-03 | Fail | 多个目录、窄 FAQ 和商品页主体过薄。 | 低价值页不投广告，并合并或增加可核验的解决路径。 |
| ADS-CONTENT-04 | Pass | 核心页不是 lorem ipsum 或为广告搭的空页，且当前无广告代码。 | 申请前再做 46 路由全量检查。 |
| ADS-CONTENT-05 | Fail | 全站商业弹窗在多个薄内容页上可能超过主体价值。 | 商业意图弱的页只保留相关文字入口，低价值页无广告。 |
| ADS-CONTENT-06 | Pass | 主语言为 `zh-CN`，属 AdSense 支持语言。 | 保持单页主体语言一致。 |
| ADS-CONTENT-07 | N/A | 未发现评论、公开发帖或用户上传。 | 引入 UGC 前先做审核、举报与脱敏。 |
| ADS-CONTENT-08 | Fail | WeChat、Telegram、Google Voice 三页缺平台特有实测但仍可索引。 | 合并到真正 owner 并 301，或先 noindex。 |
| ADS-UX-01 | Pass | 公网核心导航可用，移动弹窗可关闭并归还焦点。 | 广告上线后重测遮挡与键盘操作。 |
| ADS-UX-02 | Pass | 首页到教程、FAQ、联系的信息架构清晰。 | 补 About/政策 footer 入口并做读屏走查。 |
| ADS-UX-03 | Fail | 生产“购买/查看并购买” CTA 没有已核验直达 SKU 和交易证据。 | 证据未齐前降级为证据状态/咨询动作。 |
| ADS-UX-04 | Pass | 弹窗不自动开启，无自动下载/外跳，Esc 可关闭。 | 广告不进入 dialog，保持用户主动操作。 |
| ADS-UX-05 | Fail | 生产 privacy/terms/refund/shipping 全部 404，且无独立 About。 | 基于真实经营/数据事实发布实质页并全站链接。 |
| ADS-UX-06 | Pass | 当前无广告占位或仿广告导航。 | 未来使用中性“广告”标签和清晰间距。 |
| ADS-CRAWL-01 | Fail | 39 个索引页 200，但四个关键政策 URL 为 404。 | 发布实质政策并对拟投页验证 200。 |
| ADS-CRAWL-02 | Unknown | robots 和伪 UA 探针允许抓取，但无 Cloudflare Verified Bot/WAF 真实日志。 | 用 AdSense diagnostics 和 Cloudflare 真实日志闭环。 |
| ADS-CRAWL-03 | Pass | 内容为公开静态 GET HTML，无必须 POST 才可读的拟投页。 | 不在分析、支付、订单或私信端点投放。 |
| ADS-CRAWL-04 | Fail | 5 个增长 URL 的 3 种变体共 15 个两跳。 | 更新 Cloudflare 第一优先级 canonical 301 规则。 |
| ADS-CRAWL-05 | Pass | URL 稳定且无 session/user ID，带 self canonical。 | 持续拦截 email/phone/order/token 等敏感 query。 |
| ADS-CRAWL-06 | Pass | DNS/TLS 可用，首页连续探针 200，核心页无 5xx。 | 监控 Google crawler 的 403/429/5xx。 |
| ADS-CRAWL-07 | Pass | sitemap 为 39 个唯一 URL，7 个 noindex 路由不在其中。 | 生产门禁清零后再提交索引/审核。 |
| ADS-PROG-01 | Unknown | 当前无广告，也无账号/无效流量后台可审计。 | 明确禁止自点、亲友点击和自动测试广告。 |
| ADS-PROG-02 | N/A | 当前无广告位或鼓励点击文案。 | 禁用“点广告支持我们”、箭头和奖励。 |
| ADS-PROG-03 | N/A | 当前无广告，无法检查区分与标签。 | 实现后重新专项审计。 |
| ADS-PROG-04 | Unknown | 无流量来源后台，不能排除购买流量/点击交换。 | 审核 GSC/Analytics/Cloudflare 来源与所有推广。 |
| ADS-PROG-05 | N/A | 当前无 Google 广告代码或 wrapper。 | 只用 Google 原始 async 代码，不代理/改点击区/自动刷新。 |
| ADS-PROG-06 | N/A | 当前无广告；弹窗、联系、政策、预览页均未投放。 | 以显式 allowlist 控制，默认全站禁用。 |
| ADS-PROG-07 | N/A | 是普通网站，无 App/WebView 证据。 | 未来 WebView 单独审计。 |
| ADS-PUB-01 | Unknown | 未发现明显违法内容，但 SIM 转售、G2 来源/控制权缺法律结论。 | 请合格专业人员审查并留存书面结论。 |
| ADS-PUB-02 | Unknown | 域名含 giffgaff，品牌/域名许可和部分媒体权利台账未闭环。 | 取得许可或迁独立域；无法证明的素材替换。 |
| ADS-PUB-03 | Pass | 未发现仇恨、歧视、骚扰、威胁或恐怖主义内容。 | 保持发布前扫描。 |
| ADS-PUB-04 | N/A | 不涉及动物虐待或濒危物种交易。 | 业务不变时无动作。 |
| ADS-PUB-05 | Fail | 独立第三方披露存在，但真实经营主体/作者未公开，品牌域名许可未闭环。 | 发布真实 About/责任人并处理品牌权利。 |
| ADS-PUB-06 | Fail | 生产库存、余额、适用人群和发货断言缺真实交易证据。 | 证据闭环前撤下相关承诺和付款 CTA。 |
| ADS-PUB-07 | Pass | 未发现伪造证件、作弊、破解或未授权跟踪教程。 | 保持不接收密码、OTP、Cookie 和完整卡资料的边界。 |
| ADS-PUB-08 | N/A | 无付费性服务、婚介、成人家庭内容或儿童性剥削内容。 | 未来 UGC 必须增加硬拦截。 |
| ADS-PUB-09 | Fail | 经营主体、publisher/payee、账号-站点映射与 ads.txt 均未核对。 | 对齐真实账号和公开网站信息，不编造 legalName/地址。 |
| ADS-PUB-10 | N/A | 当前无广告，不存在广告遮挡内容/导航的实现。 | 实现后做桌面、移动、读屏专项测试。 |
| ADS-PUB-11 | Fail | 可索引集合含薄目录、窄 QA、无独特数据平台页和交易页。 | 低价值/交易/联系/状态/预览页永久排除广告。 |
| ADS-PUB-12 | N/A | 当前无背景、离屏或失去用户注意力的广告请求。 | 实现后检查 responsive/lazy-load/可见性。 |
| ADS-PUB-13 | Pass | 未发现选举虚假信息、有害健康或气候反科学共识主张。 | 新增新闻/健康主题时逐篇核查。 |
| ADS-PUB-14 | N/A | 未发现针对政治、社会或公共事件的欺骗性操纵媒体。 | 未来相关 AI 媒体保留来源并披露修改。 |
| ADS-PUB-15 | Pass | 未发现儿童诱骗、性化、勒索、贩运或 CSAM 信号。 | 任何信号立即下线并按法律/平台流程处理。 |
| ADS-PUB-16 | N/A | 站点不是危机新闻站，未发现消费突发敏感事件。 | 若新增危机内容，相关页停广告并人工审核。 |
| ADS-REST-01 | N/A | 无性内容、性娱乐、性商品或性建议。 | 业务不变时无动作。 |
| ADS-REST-02 | N/A | 无血腥、暴力、恶心或显著粗口内容。 | 未来图片/UGC 上线前审核。 |
| ADS-REST-03 | N/A | 无爆炸物、枪械、零件或武器说明。 | 无。 |
| ADS-REST-04 | N/A | 无烟草、娱乐药物、用具或制作/使用说明。 | 无。 |
| ADS-REST-05 | N/A | 无在线售酒或不负责饮酒推广。 | 无。 |
| ADS-REST-06 | N/A | 无在线赌博、彩票或付费机会游戏。 | 无。 |
| ADS-REST-07 | N/A | 无处方药、网上药房、未批准药品/补充剂销售。 | 无。 |
| ADS-REST-08 | N/A | 当前无 Google/视频广告，无广告遮挡实现。 | 上线后重新分类并专项测试。 |
| ADS-PRIV-01 | Fail | 生产隐私页 404，本地状态页也缺 Google 产品数据披露。 | 基于真实数据流发布完整隐私政策。 |
| ADS-PRIV-02 | Fail | 无在线政策披露第三方广告 Cookie、web beacon、IP 或标识符。 | 补真实 Google/vendor 披露和用户控制。 |
| ADS-PRIV-03 | Unknown | 当前一方分析很克制，但无真实广告请求可检查 PII 传输。 | 对最终网络请求做 PII 和 query/data-layer 审计。 |
| ADS-PRIV-04 | Fail | 未发现 CMP、TCF、同意/拒绝/撤回界面或区域广告模式。 | 按实际受众实现 Google CMP/认证 TCF CMP 并测试。 |
| ADS-PRIV-05 | N/A | 无精确定位代码，且 `Permissions-Policy` 禁用 geolocation。 | 未来采集定位时重开审计。 |
| ADS-PRIV-06 | Unknown | 儿童导向/COPPA 受众判定和账号设置未提供。 | 负责人书面记录判定并配置相应广告模式。 |
| ADS-PRIV-07 | Pass | 无 Google 域 Cookie 修改或自建广告代理代码。 | 加广告后重新审计。 |
| ADS-PRIV-08 | Unknown | 无广告个性化、remarketing、audience list 或账号设置可检查。 | 检查真实设置并排除敏感/儿童数据源。 |
| ADS-PRIV-09 | N/A | 站点不在美国/加拿大推广住房、就业或信贷产品。 | 业务变化时重开。 |
| ADS-PRIV-10 | Unknown | 无个性化广告模式、受众数据权利记录或用户控制。 | 个性化广告前完成数据权利、披露和同意映射。 |

## 完整性检查

- 参考要求 ID：73
- 报告唯一检查行：73
- 缺失 ID：none
- 重复 ID：none
- 状态：21 Pass + 16 Fail + 10 Unknown + 26 N/A = 73

## 主要来源

Google 官方资料优先于经验文：

- https://support.google.com/adsense/answer/7299563?hl=zh-Hans
- https://support.google.com/adsense/answer/9724?hl=zh-Hans
- https://support.google.com/adsense/answer/12131223?hl=zh-Hans
- https://support.google.com/adsense/answer/12169212?hl=zh-Hans
- https://support.google.com/adsense/answer/12171612?hl=zh-Hans
- https://support.google.com/adsense/answer/48182?hl=zh-Hans
- https://support.google.com/adsense/answer/10437795?hl=zh-Hans
- https://support.google.com/adsense/answer/1348695?hl=zh-Hans
- https://support.google.com/adsense/answer/7670013?hl=zh-Hans

用户提供的 5 篇微信文章只作经验参考。其中“域名满三个月”、“有流量会优先”、PIN 固定次数/时间等不作 2026 年 Google 官方规则。
