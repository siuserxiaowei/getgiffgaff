# Bing Webmaster Tools 与咨询事件实测（2026-07-20）

> 证据类型：主 Agent 使用用户已登录的 Bing Webmaster Tools 后台进行只读 UI 检查，并使用仓库固定的只读 Cloudflare Analytics Engine 报表命令复核咨询事件。本文不是 Bing CSV 原始导出，也不保存登录凭证、Cookie、用户身份或查询参数。

## 口径

- 检查时间：2026-07-20（Asia/Shanghai）。
- Bing Search Performance 选择 `7 D` 后显示的日期范围：2026-07-13 至 2026-07-19。
- Bing 后台的 `Keywords and Pages` 只覆盖 Web 流量，不包含 Chat 和其他 verticals。
- 表中顺序统一为 `impressions / clicks / CTR / average position`。
- 后台会继续处理数据，整数与 `K` 缩写均按 UI 原样记录；不同日期读取的滚动窗口不能直接当作同一固定样本比较。
- Analytics Engine 事件是采样加权事件，不是独立访客、会话、消息、订单或付款。

## Bing Web 搜索表现

7 天总量：113 clicks、约 1.6K impressions、CTR 6.97%。UI 当前只在图表可访问表格中列出最近三个有数据的日期：

| 日期 | Clicks | Impressions |
| --- | ---: | ---: |
| 2026-07-16 | 30 | 446 |
| 2026-07-17 | 45 | 472 |
| 2026-07-18 | 38 | 703 |

### 主要查询

| Query | Impressions | Clicks | CTR | Avg. position |
| --- | ---: | ---: | ---: | ---: |
| giffgaff | 368 | 6 | 1.63% | 7.52 |
| gg卡 | 72 | 6 | 8.33% | 4.15 |
| giffgaff esim | 22 | 0 | 0.00% | 9.09 |
| giffgaff保号 | 12 | 1 | 8.33% | 8.67 |
| giffgaff app | 11 | 1 | 9.09% | 5.55 |
| gaffgiff | 9 | 0 | 0.00% | 5.78 |
| giffgaff关闭语音信箱 | 8 | 2 | 25.00% | 7.25 |
| 英国gg卡 | 8 | 1 | 12.50% | 6.63 |
| giffgaff购买 | 5 | 2 | 40.00% | 7.00 |
| giffgaff app 怎么看接受的短信呀？ | 4 | 1 | 25.00% | 4.00 |
| 如何查看giffgaff手机号 | 4 | 1 | 25.00% | 5.25 |
| giffgaff手机号平台 | 3 | 1 | 33.33% | 3.00 |
| giffgaff下载 | 3 | 2 | 66.67% | 3.00 |
| gg卡激活 | 3 | 1 | 33.33% | 4.33 |
| 如何查看giffgaff流量查询 | 2 | 0 | 0.00% | 4.50 |
| giffgaff激活时间 | 2 | 0 | 0.00% | 4.50 |
| giffgaff激活码 | 2 | 0 | 0.00% | 7.50 |
| giffgaff 卡查余额 | 2 | 0 | 0.00% | 3.00 |
| 拥有giff卡后能注册什么 | 1 | 1 | 100.00% | 9.00 |

后台共显示 41 个查询；这里只抄录能解释当前主题、CTR 和业务机会的行，不把未抄录行当作零。

### 主要落地页

| Page | Impressions | Clicks | CTR | Avg. position |
| --- | ---: | ---: | ---: | ---: |
| `/guides/6-pitfalls/` | 约 1.3K | 76 | 5.98% | 6.24 |
| `/guides/3-app/` | 112 | 7 | 6.25% | 4.93 |
| `/qa/07-voicemail-switch/` | 36 | 9 | 25.00% | 5.36 |
| `/guides/2-activate/` | 36 | 0 | 0.00% | 6.92 |
| `www` 版本 `/guides/4-signal/` | 21 | 2 | 9.52% | 6.76 |
| `/answers/` | 16 | 0 | 0.00% | 7.13 |
| `/shop/` | 14 | 6 | 42.86% | 7.43 |
| `www` 版本 `/more/04-esim-qrcode/` | 14 | 2 | 14.29% | 4.71 |
| `www` 版本 `/more/03-esim/` | 9 | 0 | 0.00% | 4.22 |
| `www` 版本 `/qa/01-change-number/` | 8 | 1 | 12.50% | 5.50 |
| `www` 版本 `/more/00-wechat/` | 5 | 1 | 20.00% | 4.20 |
| `/qa/06-activation-expiration/` | 3 | 1 | 33.33% | 2.67 |
| `/` | 3 | 0 | 0.00% | 7.33 |

计算值：`/guides/6-pitfalls/` 的 76 clicks 占总 113 clicks 的约 67.3%。`/shop/` 的 CTR 很高但曝光仅 14，说明高交易意图存在，但当前可见规模很小；不能由此推断实际订单。

### 设备和国家

| Device | Impressions | Clicks | CTR | Avg. position |
| --- | ---: | ---: | ---: | ---: |
| Desktop | 约 1.3K | 80 | 5.94% | 6.60 |
| Mobile | 274 | 33 | 12.04% | 5.50 |

| Country | Impressions | Clicks | CTR | Avg. position |
| --- | ---: | ---: | ---: | ---: |
| People's Republic of China | 约 1.3K | 76 | 6.01% | 6.42 |
| United States | 178 | 25 | 14.04% | 5.65 |
| Rest of World | 108 | 5 | 4.63% | 7.41 |
| Japan | 56 | 5 | 8.93% | 7.21 |
| United Kingdom | 7 | 2 | 28.57% | 6.33 |

## Bing AI Performance

`3 M`（2026-04-20 至 2026-07-19）显示：115 total citations、6 average cited pages。后台注明这些是总体活动样本，后续处理可能改变结果。

| 日期 | Citations | Avg. cited pages |
| --- | ---: | ---: |
| 2026-07-17 | 44 | 5 |
| 2026-07-18 | 71 | 7 |

Grounding queries：

| Query | Citations | Citation share |
| --- | ---: | ---: |
| gg卡激活 | 29 | 17.68% |
| gg卡 | 9 | 100.00% |
| giffgaff怎么看余额 | 4 | 25.00% |

Pages：

| Page | Citations |
| --- | ---: |
| `/guides/6-pitfalls/` | 77 |
| `/guides/3-app/` | 15 |
| `www` 版本 `/qa/07-voicemail-switch/` | 8 |
| `/qa/06-activation-expiration/` | 5 |
| `/qa/03-reissue/` | 3 |
| `/guides/2-activate/` | 2 |
| `/more/03-esim/` | 1 |

引用不是搜索点击、咨询或销售，不能相互替代。

## Bing Keyword Research 机会检查

同日使用 Bing Webmaster Tools 的 `Keyword Research` 做了少量定向验证。关键词工具默认显示 3 个月全球 impressions；“没有足够数据展示趋势”不等于精确为零。该工具的相关词可能只因为词面或实体相近而出现，必须结合 SERP 意图判断。

| Keyword | 3-month signal | SERP / intent observation |
| --- | ---: | --- |
| `ChatGPT KYC` | 可见国家合计 17 impressions：中国 12、美国 3、台湾 2；无趋势 | 结果混合账号 KYC 讨论、名为 KYC 的自定义 GPT、金融行业 KYC 自动化，不能作为一个单一页面意图 |
| `ChatGPT 身份验证` | 无足够趋势数据 | 结果混合 MFA、登录认证错误、账号恢复和手机号二次验证，适合按错误类型拆章节，不适合宣称都是 KYC |
| `ChatGPT 手机号验证` | 无足够趋势数据 | 结果以第三方“接码/通过”教程为主，存在高合规风险；可做官方规则和普通短信/OTP 诊断，不做绕过方案 |
| `Claude KYC` | 667 impressions（2026-04-20 至 2026-07-17） | 第一位为 Claude 官方 `Identity verification on Claude`；真实身份核验意图清晰，值得作为高优先级官方规则页 |
| `Claude 手机号验证` | 无足够趋势数据 | SERP 有 Claude 官方中文 `验证您的电话号码`；与英国实体号码和 OTP 排查直接相关，可与 Claude 身份核验页互链但不能混为同一步 |
| `Claude 封号` | 922 impressions（2026-04-20 至 2026-07-17） | 相关词包括 `claude封号` 约 2.1K、`claude被封` 403、`claude被封号` 319、`claude账号被封` 163、`claude code封号` 560；可做官方申诉与资料准备，不做规避地区或风控教程 |

`Claude KYC` 的国家列表当前可见美国 156、英国 5、印度 3、加拿大 3，其余国家需 `Load more`，因此 667 不能由可见四国加总解释；不得把未展开国家自行补齐。`Claude 封号` 当前可见美国 174、英国 7、加拿大 5、澳大利亚 2，同理不代表完整国家分布。

机会判断：Claude 身份核验是当前唯一同时具有明确官方 SERP owner、可见需求量和账号验证意图的扩展主题。ChatGPT 精确 `KYC` 词不应单独建页；可用一篇官方认证故障页承接真实的登录、手机号和 MFA 查询。

## Backlinks 与 Site Scan

Bing Backlinks 当前显示：2 referring domains、201 referring pages、4 anchor texts。两个来源分别为：

| Referring domain | Backlink count |
| --- | ---: |
| `nano-banana.lol` | 196 |
| `stackmemoai.com` | 5 |

201 条链接高度集中在两个与 giffgaff 主题不强相关的域名，不能按“201 个独立站点背书”解释。下一步应获取少量真实相关来源，例如英国留学、海外号码维护、账号安全或开发者工具社区的编辑型引用，不应购买批量站群链接。

Site Scan 最近一项 `getgiffgaff-critical-pages-2026-07-19` 显示：15 小时前完成、扫描 10 页、0 errors、1 warning。主页 Top Recommendations 同时提示多页 meta description 太短。技术错误不是当前咨询断点的主要证据，但后续新页与高曝光低 CTR 页应补完整、意图明确的 description。

IndexNow 当前显示最近 5 小时提交 8 个 URL，来源为 `Self`。可见列表中，`/guides/9-number-balance-data-check/`、`/guides/apn-settings/`、`/more/esim-deleted/` 和 `/more/esim-new-phone/` 于当天 11:35 提交；其他核心 URL 于当天 01:00 提交。IndexNow 的提交记录只证明 Bing 接收到了 URL 通知，不证明抓取、索引、排名或咨询。

## Cloudflare 咨询事件

运行：

```bash
npm run analytics:report
```

报表生成时间为 2026-07-20T05:19:01.584Z。2026-07-19 是上线后第一个完整且有数据的 UTC 日：

| Event | Weighted events |
| --- | ---: |
| page_view | 108 |
| commerce_click | 5 |
| contact_click | 2 |
| growth_related_click | 2 |
| shop_click | 0 |
| tool_result | 0 |

诊断信号：`contact_click / page_view = 2 / 108 ≈ 1.85%`。这不是用户级转化率，因为数据没有会话 ID，同一人可以多次产生事件，也无法证明微信/Telegram 消息已发送或收到。

D7 和 D28 仍是 `HOLD`：其余日期没有返回白名单事件行，不能按零补齐。因此目前只能说明首个完整日的咨询入口点击弱，不能证明长期趋势。

### D1 页面与来源拆分

随后用相同 Cloudflare 账号、数据集和 UTC 日期边界执行一次只读分组查询，按 `canonical path / source / event / channel or intent` 查看 2026-07-19。查询不写数据，也未输出凭证。

与当前决策直接相关的行：

| Path | Source | Event | Channel / intent | Weighted events |
| --- | --- | --- | --- | ---: |
| `/guides/6-pitfalls/` | search | page_view | — | 18 |
| `/guides/6-pitfalls/` | search | commerce_click | before-purchase | 1 |
| `/guides/6-pitfalls/` | search | growth_related_click | — | 1 |
| `/contact/` | internal | page_view | — | 9 |
| `/contact/` | direct | page_view | — | 2 |
| `/contact/` | internal | contact_click | wechat | 1 |
| `/contact/` | direct | contact_click | wechat | 1 |

没有返回 `telegram contact_click`，也没有从 `/guides/6-pitfalls/` 直接产生 `contact_click`。这不代表精确的 18 个独立搜索用户或 11 个独立 Contact 用户，但足以定位一个可测试的摩擦点：搜索用户需先从避坑页进入 Contact，再点外部微信链接。第一轮可以把“未购卡”分支直接打开站内咨询组件，在组件首屏显示微信/Telegram，并继续记录 `commerce_click` 与实际 `contact_click`。

## 当前可证结论与未知项

可证：

1. 当前 Bing Web 点击没有随咨询一起降到“4 天 2–3 个”的量级；7 天 UI 显示 113 clicks。
2. 流量和 Bing AI 引用都高度集中于 `/guides/6-pitfalls/`。
3. `/shop/` 已有高 CTR 的购买意图，但曝光很少。
4. 首个完整可观测日中，页面访问到外部联系渠道点击的事件比值偏低。

仍未知：

1. 历史每天十几个咨询来自哪个渠道、页面或活动；历史事件级数据不存在。
2. 2 次 `contact_click` 是否实际打开 App、加好友、发消息、收到回复或形成订单。
3. Bing query 与 page 的逐行配对关系；当前 UI 的两个列表是独立汇总。
4. 新增 GPT、Claude 或其他平台内容能获得多少搜索量、是否带来合格买卡咨询。

因此本轮应同时做两件事：修复已有 Bing 流量的购买/咨询分流；基于官方规则小批量测试与英国号码、短信验证和账号恢复直接相关的内容。禁止用“保证通过 KYC/验证码”替代证据。
