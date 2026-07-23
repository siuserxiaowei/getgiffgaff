# 本地词搜索试点（2026-07-24）

## 本轮已实现

本轮只新增三个具有不同使用任务的地点页，不批量替换城市名：

| 页面 | 查询所有权 | 独有决策信息 |
| --- | --- | --- |
| `/guides/uk-sim-at-heathrow/` | 希思罗机场手机卡、giffgaff 落地激活与上网 | 已有卡、待激活卡、现场购卡三分支；机场 Wi-Fi；机场与目的地覆盖分离 |
| `/guides/manchester-student-sim/` | 曼彻斯特留学手机卡、曼城 giffgaff | 宿舍、校区、通勤、生活地点四点清单；PAYG/合约；到校第一周复测 |
| `/guides/london-student-sim/` | 伦敦留学手机卡、伦敦 giffgaff | 住宿与校区邮编；TfL 地下覆盖区段；机场与长期通勤分阶段验收 |

全国级查询继续由 `/guides/8-uk-sim-choice/` 负责。三个地点页通过该支柱页获得入口，并分别链接到激活、验收、APN、保号和联系路径。

## 内容与索引门槛

- 页面使用独立 title、description、H1、直接答案、目录和场景决策表。
- 每页均标注 `2026-07-24` 核验日期，并引用可直接复核的官方来源。
- 所有覆盖表述都保留“邮编预测不是室内、线路或设备保证”的边界。
- 三页都是 `Article`，并在 JSON-LD 中使用 `contentLocation` 标记地点；不声明门店、LocalBusiness、库存或本地服务范围。
- 当前没有继续创建伯明翰、爱丁堡等页面。扩量必须由真实查询和咨询数据触发。

## 发布后观察口径

以生产部署后的第一个完整 UTC 日为 D1，固定观察 28 个完整 UTC 日。每页分别记录：

1. Bing 与 Google 的 query、page、impressions、clicks、CTR 和 average position。
2. 是否出现“地点 + 英国手机卡/giffgaff + 任务”的非品牌或半品牌查询。
3. `page_view`、`commerce_click`、`contact_click`；浏览器事件不等于消息已送达。
4. 客服人工记录 received、qualified、quote、paid 和 gross margin；不保存号码、住址或账号凭证。

## D7 / D28 决策

| 观察结果 | 下一步 |
| --- | --- |
| 有曝光、没有点击 | 只检查 title/description 与实际查询是否匹配 |
| 没有曝光 | 暂停扩城市，先复核查询需求与收录状态 |
| 有点击、没有联系 | 检查直接答案、咨询文案与用户任务是否断裂 |
| 有合格咨询 | 在同一任务下扩一个相邻地点，不一次扩几十页 |
| 查询进入全国支柱页 | 优先增加支柱页到地点页的准确分流，不让两个页面争同一意图 |

不得仅以 sitemap、IndexNow 接收、收录或平均排名宣布试点成功。

## 本地验证记录

- `npm test`：293/293 通过。
- `npm run verify`：通过；56 个公开 HTML 路由、49 个可索引 URL、7 个 noindex 页面。
- 浏览器：桌面 1440×1200、手机 390×844 共检查三页 6 张截图；0 console errors。
- 发布产物已包含三页、49 URL sitemap、`llms.txt` 任务索引、canonical、OG、Article/Breadcrumb JSON-LD 和匿名点击埋点。

## 发布记录口径

本文件记录实现范围，不预先声称外部动作已经完成。生产状态以站点的
`release-provenance.json`、发布流程输出、生产 URL 核验和搜索平台回执为准。
