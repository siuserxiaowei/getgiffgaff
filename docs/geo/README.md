# GEO 月度复测

`geo-question-set.json` 是固定的 30 题母版，题目顺序和 ID 不随月份变化。`monthly-review-template.json` 是空白月报模板，不包含任何答案引擎观测、排名、引用或流量数据。

每月执行时：

1. 复制月报模板到单独的、带年月的结果文件；不要覆盖母版。
2. 对每个答案引擎逐题原样提问，在对应 `questionId.observations` 中新增一份 `observationTemplate` 结构。
3. `urlCitations` 中每个对象使用 `urlCitationEntryTemplate` 字段，逐条判断链接是否真的支持答案，而不是只记录是否出现 URL。
4. 用测试当日公开页面、route manifest、ACTIVE 声明和当前官方来源复核；不得沿用上月事实判断。
5. 品牌提及、本站引用、引用支持度和 referral 分开记录。答案把本站误认为 giffgaff 官方时，整月门禁直接失败。

汇总只使用已有观测计算：关键事实准确率目标为 100%，边界保留率目标至少 95%，官方身份误认必须为 0。未执行或无法核验的字段保持 `null`，不得用推测值补齐。
