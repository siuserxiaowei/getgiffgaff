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
