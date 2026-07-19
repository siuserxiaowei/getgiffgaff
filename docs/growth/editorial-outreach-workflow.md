# 相关编辑型外链：3–5 条人工核验工作流

> `DO NOT SEND — internal research workflow`。getgiffgaff 是独立第三方中文教程和 SIM 卡销售站，不是 giffgaff Limited、官方支持或授权代表。本文件不是联系、接受、发布、流量、排名或背书证据；本轮没有发送任何消息。

## 为什么不是追求“更多链接”

Bing Webmaster Tools 在 2026-07-19 的现场快照只看到 2 referring domains / 201 referring pages / 4 anchors，其中 `nano-banana.lol` 占 196 页、`stackmemoai.com` 占 5 页。抽样显示大量页面主题不相关且锚文本重复。这个分布高度集中，说明 page 数不能代表健康；当前优先目标是新增不同域名上的相关、编辑独立、真实有用引用，而不是复制站群模式。

## 第一批 5 个研究候选

以下全部复用 [`../outreach/backlink-prospects.csv`](../outreach/backlink-prospects.csv) 的 2026-07-17 本地台账。当时均为 `status=research`，没有 first contact 或 live link。候选 URL 和页面状态可能变化，研究日必须重新打开；公众联系页不是接受投稿的证据。

| 优先 | 候选 | 对应资产 | 当前 blocker | 下一步（只研究） |
| ---: | --- | --- | --- | --- |
| 1 | University of Bristol “Before you arrive” | `/guides/7-arrival-checklist/` | commercial resource policy 未核验 | 找到该页维护团队及明确的外部商业资源政策 |
| 2 | UCL International Support | `/guides/8-uk-sim-choice/` | commercial resource policy 未核验 | 确认负责团队、外部资源范围与是否允许商业来源 |
| 3 | University of Bath international-student topic | `/guides/8-uk-sim-choice/` | 具体维护页与政策未核验 | 先找准确 arrival 页面和内容 owner |
| 4 | Too Many Adapters UK SIM article | `/guides/7-arrival-checklist/` | 接受资源建议的政策未核验 | 核对文章仍维护、编辑身份和 factual/resource suggestion 范围 |
| 5 | SimOnlyFinder giffgaff roaming guide | `/tools/china-roaming-cost/` | 编辑政策与联系人未核验 | 只在工具的官方来源、费率时效门禁通过后研究 methodology suggestion |

不把 GitHub Issue、评论区、批量目录、直接竞品、买链/互链列入首批。`awesome-esim-resources` 虽有一般贡献说明，但本站工具仍 noindex 且商业资源未获单独许可，因此继续 blocked。

## 每个候选的人工核验顺序

1. **页面仍有效**：保存目标 URL、标题、最后更新信号、核验日和与目标用户的具体相关段落。
2. **编辑归属明确**：确定具体内容团队/编辑职责，不采集或提交私人联系方式。
3. **接受政策明确**：只把真实 editorial/contribution/resource policy 或直接书面许可写入 `policy_url/acceptance_evidence`。一般 contact form、邮箱、作者资料页不算。
4. **关系与利益披露**：说明本站有 SIM 卡销售关系；对方若禁止商业来源，立即 reject。
5. **资产门禁**：目标页必须 index-ready，事实使用官方一手来源并带核验/到期日期，不包含未核实库存、价格、验证码成功率、排名或“最佳”结论。
6. **个性化预询**：先询问是否接受此类资源/事实修正，不索要 `dofollow`、指定锚文本、互链、背书或排名。
7. **人工批准和单次发送**：只有业务负责人审核目标、政策、事实和完整文案后才可手工发送。无回复视为无许可，不跟踪骚扰。
8. **独立验证结果**：只有公开页面真的出现链接，且保存 `live_url` 与独立证据，才可标 `live`。nofollow 也可以是正常编辑选择。

每次改台账后运行：

```bash
npm run validate:outreach
```

校验器是本地只读，不会打开网站或发送消息。

## 个性化预询草稿骨架（不要发送）

```text
Subject: Pre-inquiry: do you review neutral arrival / UK SIM resources?

Hello [verified team/editor role],

I was reviewing [exact live page] on [checked date]. The section about [specific reader task]
appears relevant to international students/readers who need [specific need]. Before sending any
resource, may I ask whether your policy allows an independent commercial organisation to suggest
a neutral, source-dated checklist or methodology note for editorial review?

getgiffgaff is an independent Chinese-language tutorial and SIM-card sales site. It is not
giffgaff Limited, official support or an authorised representative. No payment, reciprocal link,
endorsement, specified anchor or link treatment is requested. You may use no link, cite the
official source instead, or decline. No response will be treated as no permission.

[Only after permission: one sentence describing the exact asset and primary-source dates.]
```

已有逐候选草稿和事实门禁在 [`../outreach/drafts/university-resource-pitch.md`](../outreach/drafts/university-resource-pitch.md) 与 [`../outreach/pitch-templates.md`](../outreach/pitch-templates.md)。发送前必须重新核验，而不是直接复制。

## 成效口径

按 28 天记录：人工研究数、明确允许预询数、已授权发送数、回复数、独立验证 live referring domains、referral page views、合格咨询、贡献毛利。不能用“外联数量”“backlink pages”或 anchor 精准度替代业务结果，也不能把 BWT/GSC 暂未发现写成链接不存在。
