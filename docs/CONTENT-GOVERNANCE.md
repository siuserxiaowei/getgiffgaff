# 内容状态与唯一发布源

本文件防止历史草稿、竞品研究和未来功能 brief 被误当作当前网站内容。任何自动化、编辑者或代理在复用仓库材料前必须先判断状态。

| 状态 | 目录 / 文件 | 可否进入公开页面 |
| --- | --- | --- |
| `ACTIVE_RUNTIME_SOURCE` | `public/route-manifest.js`、`public/claim-registry.js`、`public/core-pages.js`、`public/tutorial-pages.js`、`public/trust-pages.js`、`public/guides/6-pitfalls-page.txt` | 只有通过测试与 Claim Registry 的内容可发布 |
| `RESEARCH_ONLY` | `docs/research/`、`docs/platforms/`、`docs/geo/` | 不可直接发布；只可提取问题、结构和证据缺口 |
| `ARCHIVED_NOT_FOR_PUBLISHING` | `docs/articles/`、`docs/giffgaff-usage-pitfalls.md`、`docs/strategy/cluster-plan.*`、`docs/strategy/internal-links.json`、`docs/strategy/cluster-map.html` | 不可发布；其中可能含旧交易链接、旧周期和失效声明 |
| `HOLD_SPEC` | `docs/strategy/cluster-briefs/` | 仅作未来规格；满足门禁并重新审查后才能实现 |

## 强制规则

1. sitemap、索引状态、canonical、缓存和交易开关只从 `public/route-manifest.js` 派生。
2. 会变化、涉及交易、安全、资费或结果承诺的公开声明，只能来自未过期的 `ACTIVE` Claim Registry 记录。
3. 竞品与用户提供教程不得镜像、连续改写、搬运截图或重新发布；只保留 URL、结构化观察、独立摘要和许可状态。
4. 历史文章中的 `/shop/`、价格、库存、G2 推荐、固定时间窗和验证码结论全部视为无效，除非重新建立证据并通过门禁。
5. 从 HOLD 或 ARCHIVED 材料重启工作时，必须建立新 brief、指定真实作者和审核人、逐条登记声明，并重新运行发布验证器。

此状态表本身不授予品牌、版权、转售、隐私或消费者权益方面的许可。
