# Brief：giffgaff eSIM 设备兼容检查器

- 建议 URL：`/tools/esim-compatibility/`
- 主关键词：`giffgaff eSIM 设备兼容检查`
- 意图：在开始官方切换前做 Go/No-Go；操作流程仍归 `/more/03-esim/`。
- 安全边界页：二维码、凭证与第三方写卡问题统一去 `/more/04-esim-qrcode/`。

## 决策输入

- 品牌、精确型号、地区版本和硬件标识。
- OS 版本、是否能安装当前 giffgaff App。
- 设备是否显示原生“添加 eSIM”能力。
- 是否有运营商锁。
- 账号邮箱/密码/必要验证是否可恢复。
- 是否接受新 eSIM 生效后旧 SIM 停止工作。

不收集 IMEI、EID、完整序列号、账号、Cookie、二维码、LPA 字符串或验证码。

## 证据等级

1. A：giffgaff 或设备制造商对精确型号/地区版本的当前一方资料。
2. B：本站对精确型号、地区版本、OS 和日期的可复现实测。
3. C：可信第三方线索，必须标为未复核，不能触发“兼容”结论。
4. Unknown：没有足够证据。

同系列其他地区版本不能自动继承兼容结论。

## 输出

- Go：所有硬件、App、锁定、账号恢复与后果条件均通过，附证据和核验日。
- Pause：部分条件未知，列出要去哪里核对。
- No-Go：设备不原生支持、账号不可恢复或用户不接受旧 SIM 失效。
- 输出不包含第三方写卡替代方案；No-Go 的低风险选项是继续用实体 SIM 或换兼容设备。

## 页面结构

1. 直接答案与官方路径声明。
2. 设备/账号检查器。
3. 结果和证据等级。
4. 官方切换前清单。
5. 旧 SIM、换机和恢复边界。
6. 数据来源、纠错、FAQ 与修订。

## 数据、Schema 与测试

- 设备记录字段：exactModel、regionVariant、OSRange、sourceUrl、checkedAt、evidenceLevel、result、notes。
- 过期或冲突证据返回 Pause，不静默选择有利结论。
- 使用 `WebApplication`/`WebPage`；不输出产品评分或兼容保证。
- 测试地区版本冲突、无证据、App 不可用、锁机、账号不可恢复和旧 SIM 风险确认。
- 禁止修改版 APK、Cookie 导出、LPA/eSIM 凭证提取/上传、第三方写卡和绕过官方检测步骤。

## 内链

- 入链：pillar、官方切换页、安全边界页、补卡页。
- Go 结果链接官方切换指南；Pause 链接证据来源；No-Go 返回实体 SIM 决策，不强推商品。
