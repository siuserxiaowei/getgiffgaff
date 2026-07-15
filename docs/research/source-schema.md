# giffgaff / GG 卡资料库字段说明

更新日期：2026-07-01

这个资料库只记录公开链接、主题标签、原创摘要和核查建议，不搬运任何平台全文。

## 字段

- `id`: 稳定短 ID，使用小写字母、数字和连字符。
- `platform`: 来源平台，例如 `official`、`zhihu`、`douyin`、`bilibili`、`x-twitter`、`xiaohongshu`、`kuaishou`、`wechat`、`github`、`v2ex`、`blog`。
- `title`: 链接标题或搜索入口标题。
- `url`: 可公开访问的 URL。
- `topics`: 主题标签数组，例如 `activation`、`roaming`、`credit`、`sms`、`esim`、`deactivation`、`buying`、`risk`。
- `sourceType`: `official-rule`、`community-guide`、`forum-discussion`、`video-search`、`social-post`、`search-entry`、`blog-post` 之一。
- `publicAccess`: `open`、`search-result`、`login-limited`、`unstable` 之一。
- `summary`: 原创摘要，不能复制第三方正文，单条不超过 280 个中文字符。
- `verification`: 这条资料需要用哪些官方页面或实测动作复核。

## 收录原则

1. 官方规则优先，社区内容只作为问题发现和经验补充。
2. 短视频、图文社区和公众号不稳定时，只记录搜索入口或可公开链接。
3. 价格、保号、封号、漫游、eSIM、验证码能否送达这类说法，必须回到官方页面或实测流程核查。

## 深度拆解与竞品证据

基础来源卡继续使用上面的轻量字段。用户指定页面与竞品研究使用两类更严格的证据文件：

- `sources/six-source-teardown.json`：6 个指定来源的访问状态、搜索意图、信息结构、技术 SEO、信任信号、链接与转化路径、版权边界、可迁移机制和证据链接。
- `competitors/competitors-01-20.json` 与 `competitors/competitors-21-40.json`：40 个独立竞品页面/渠道的查询意图、标题与章节、CTA、内链/Schema、信任证据、风险和单条可学机制。

这两类文件只保存结构化观察和独立摘要，不保存第三方全文、连续步骤、截图归档或视觉复刻素材。没有稳定可访问证据的页面必须明确写出访问限制；不把搜索结果顺序当排名，也不猜测流量、权重或转化率。

发布前运行：

```bash
node scripts/validate-source-research.mjs
node scripts/validate-competitor-research.mjs
```
