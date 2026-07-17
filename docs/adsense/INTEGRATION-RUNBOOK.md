# AdSense 安全接入运行手册

当前状态：只完成本地所有权验证能力，未申请、未部署、未加载广告。

## 安全设计

- publisher ID 只从当次构建环境变量 `ADSENSE_PUBLISHER_ID` 读取。
- 仅接受 `pub-` 或 `ca-pub-` 后跟 16 位数字的格式；缺失、占位符和明显假值拒绝。
- ID 缺失时不生成 `ads.txt`、不注入 meta、不加载广告。
- ID 存在时生成 Google seller line，并注入 `google-adsense-account` meta。
- 当前广告 allowlist 是空集，不会加载 `adsbygoogle` 或 `pagead2.googlesyndication.com`。
- 生产、Preview、本地和错误页都不得因测试而发起真实广告请求。

## 真实 ID 可用后

这些命令应由账号所有者在私密终端执行，不要把真实 ID 写进 Git 跟踪文件。

1. 先确认审计阻塞项全部闭环。
2. 当次终端设置环境变量：`ADSENSE_PUBLISHER_ID=ca-pub-后台显示的16位数字`。
3. 运行 `npm run build`。
4. 确认构建报告中 `adsense.enabled` 为 `true`，并确认 `.release/ads.txt` 只有一行。
5. 运行 `node --test test/adsense-verification.test.mjs`和 `npm run verify`。
6. 正式部署前再确认 CMP、隐私页、Cloudflare 与账号门禁。
7. 部署后检查 `/ads.txt` 为 200 `text/plain`，GET/HEAD 一致，无中间跳转。
8. 只有 Google 后台站点状态为 Ready，且内容/CMP/政策门禁通过后，才可另行设计最小广告 allowlist。

## 禁止投放的页面

即使未来账号获批，下列页面也默认禁止广告：

- 首页商业首屏、商城、G0/G2 交易页。
- 联系页、微信/快团团弹窗、支付/订单/私信屏。
- 隐私、条款、退款、物流、状态与错误页。
- noindex 研究预览页和薄内容页。
- 工具输入和结果交互区，除非未来通过独立布局审计。

## 永久禁区

- 不点自己的广告，不让家人朋友点，不鼓励用户点。
- 不购买点击、点击交换、自动刷新、机器人或垃圾推广流量。
- 不把广告伪装成导航、下载、下一步或购买按钮。
- 不把真实 publisher ID、身份、收款、税务或验证码写进公开报告。
