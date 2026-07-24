# getgiffgaff 搜索增长总任务与执行台账

更新时间：2026-07-24（Asia/Shanghai）

## 结论

当前不缺“再接十个平台”，缺的是把已有搜索入口、三页本地词实验和咨询漏斗连续观测 7/28 天。平台接入只做有独立诊断价值或能扩大抓取覆盖的入口；Yahoo、DuckDuckGo 等不重复造一套无效提交流程。“Direct 搜索”按直接访问渠道统计，不伪装成搜索引擎。

本轮只允许一个页面实验：三张高意图“本地/场景词 + 核心词 + 后缀”页面。页面标题、主体内容、全站导航和搜索结构不再同时改动，避免无法归因。

## 状态定义

- `DONE`：已有可核验代码、线上响应或平台回执。
- `READY`：仓库侧已完成，等待发布或平台复核。
- `OWNER-AUTH`：必须由账号所有者登录、处理验证码/实名。
- `OBSERVE`：实验运行中，到固定日期复盘。
- `HOLD`：当前收益低或证据不足，暂不投入。
- `REJECTED`：结果错误、低相关或存在批量垃圾风险，禁止用于运营。

## 平台接入任务

| ID | 平台/渠道 | 当前操作 | 状态 | 证据与下一步 |
| --- | --- | --- | --- | --- |
| S01 | Google Search Console | 保留已验证 apex property 与 sitemap；按周看 Query/Page/Country | DONE | 已接入；不要因短期波动重复提交 sitemap |
| S02 | Bing Webmaster Tools | 已重新提交 `https://getgiffgaff.com/sitemap.xml` | DONE | 2026-07-24 操作；Bing UI 显示提交日 7/23（账户时区），状态 Processing；90 天首页约 229 clicks / 4.5K impressions |
| S03 | IndexNow | 发布后只提交真实变化 URL | DONE | 站点已部署 key 与增量脚本；本地词三页及保号工具已收到 200/202 接收回执 |
| S04 | Yahoo Search | 不建立重复控制台；通过 Bing 抓取与索引体系覆盖 | DONE | 无独立站长提交动作；后续以 Bing Query/Page 报告判断 |
| S05 | DuckDuckGo | 不重复提交；保持 Bing 可发现性 | DONE | 传统网页结果的重要来源之一是 Bing；继续维护 canonical/sitemap/IndexNow |
| S06 | Yandex Webmaster | 添加 canonical 域、验证所有权、提交 sitemap | DONE | 2026-07-24 所有权验证成功；已提交 canonical sitemap，当前状态 Processing queue，平台提示通常需 1–2 周处理 |
| S07 | Baidu 搜索资源平台 | 保留首页验证标签，完成平台验证并提交 sitemap | DONE | 所有权验证成功；sitemap 页当前显示今日上限/余额均为 0，待平台释放配额后提交 |
| S08 | Naver / Seznam / Yep 等 | 先用 IndexNow 覆盖，不逐个平台做空账号 | HOLD | 只有出现目标国家曝光、品牌查询或实际用户来源后，才评估独立控制台 |
| S09 | Direct | 作为直接访问渠道建立基线 | OBSERVE | 记录 `source=direct` 的 session、咨询、付款；不称为“Direct 搜索” |

## “本地词 + 核心词 + 后缀”任务

已上线三页：

1. `/guides/uk-sim-at-heathrow/`
2. `/guides/manchester-student-sim/`
3. `/guides/london-student-sim/`

执行规则：

- 每页必须解决不同地点/场景下的真实任务，包含适用人群、购买前核对、到货/激活、短信/漫游风险和明确咨询入口。
- 禁止把城市名批量替换成几十张近似页；没有独特需求和证据的地点不建页。
- D7（2026-07-31）只检查抓取、收录、首次曝光、页面点击和咨询事件，不改标题。
- D28（2026-08-21）比较 Search visits → purchase-intent click → WeChat click → message → qualified lead → quote → payment → gross profit。
- 只有至少一页出现真实曝光或合格咨询，才新增下一批最多 1–3 页；否则先修搜索意图或咨询路径。

下一批候选仅进入调研，不立即建页：

- 英国留学生手机卡选择指南
- 英国手机号收验证码与保号工具
- 到英国后 giffgaff 激活/收短信清单
- 中国漫游费用计算器

## 外链与分发任务

| ID | 任务 | 状态 | 质量门槛 |
| --- | --- | --- | --- |
| L01 | 隔离 `new-backlinks-hive` 错误结果 | REJECTED | 其中大量中文历史、维基和无关 GitHub 片段不是可提交网站目录 |
| L02 | 每周发布 1 篇平台原生内容 | READY | 内容本身能解决一个问题；链接只放最相关落地页 |
| L03 | 每周联系 3–5 个高度相关资源页/编辑 | READY | 英国留学、国际学生、英国手机卡、到英清单、保号工具优先 |
| L04 | 竞争对手外链只作线索，不批量复刻 | OBSERVE | 逐条确认页面仍在线、可编辑、主题相关、不是站群/付费垃圾目录 |
| L05 | 建立外链结果台账 | READY | 记录目标 URL、联系人类型、联系日、回复、上线 URL、referral visits、咨询 |

拒绝项：

- 一次提交几十个泛目录。
- 购买站群、批量 guest post 或互换链接包。
- 因为竞品有链接就默认该来源适合本站。
- 将社交主页、不可跟踪页面或无关引用算成有效外链。

## 监测与止损

每日只记录异常；每周固定一次完整读数：

- GSC：clicks、impressions、CTR、position、query、page、country。
- Bing：clicks、impressions、indexed/crawl errors、top query/page。
- 站内：search/referral/direct visits、购买前点击、微信点击、消息、合格咨询、报价、付款、毛利。
- 抓取：sitemap URL 数、canonical、robots、5xx、重定向、验证标签。

止损条件：

- 页面未收录不等于立刻重写；先检查抓取、canonical、重复内容和内部链接。
- 7 天无曝光只做诊断，28 天仍无曝光/咨询才决定合并、重写或停止。
- 平台返回“已接收”不表述为“已收录”。
- 若全站咨询量下降，优先恢复入口，不继续扩大页面数量。

## 本轮实施清单

- [x] 梳理 Google、Bing、Yahoo、DuckDuckGo、Yandex、Baidu、IndexNow 与 Direct 的正确角色。
- [x] Bing 重新提交 canonical sitemap，并保留平台状态记录。
- [x] 保留 IndexNow 增量提交，不重复全量轰炸。
- [x] 上线三张本地/场景词页面并提交真实变化 URL。
- [x] 拒绝错误 `new-backlinks-hive` 结果，改用编辑型相关外链。
- [x] 将 sitemap 活动门禁从历史硬编码 39 更新为当前 manifest 的 49。
- [x] 将百度所有权标签做成可测试、长期保留的发布构建能力。
- [x] 发布百度验证标签，并在生产首页核对。
- [x] 百度点击“完成验证”。
- [ ] 百度释放 sitemap 配额后提交 `https://getgiffgaff.com/sitemap.xml`。
- [x] Yandex 添加站点并取得公开验证标签。
- [x] 发布 Yandex 验证标签，完成平台复核并提交 sitemap。
- [ ] 2026-07-31 完成 D7 复盘。
- [ ] 2026-08-21 完成 D28 去留决策。

## 本轮不做

- 不改首页、核心销售页与全站 Title。
- 不创建几十张地点替换页。
- 不购买或批量提交垃圾外链。
- 不因平台接入完成就承诺排名、收录或收入。
- 不在没有真实库存、价格和交付证据时扩写交易承诺。
