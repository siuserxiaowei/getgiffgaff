# Cloudflare 与交易证据本地操作包

> 状态：本地、只读验证工具。本操作包不会调用 Cloudflare API，也不会登录、下单、支付、退款、联系客服或修改生产。

## 1. Cloudflare 无尾斜杠规则

生成待人工审阅的第一条规则片段：

```bash
npm run cloudflare:rules:generate
```

如果要将纯 JSON 保存为本地审阅文件，必须使用 npm 的 silent 选项，避免脚本标题混入 JSON：

```bash
npm run --silent cloudflare:rules:generate > /tmp/getgiffgaff-canonical-rule.json
npm run cloudflare:rules:validate -- --file /tmp/getgiffgaff-canonical-rule.json
```

生成器直接读取 `public/route-manifest.js` 的全部公开 HTML 路由，当前必须精确产生 **52** 个非根、无尾斜杠路径。除 45 个可索引非根路径外，还包括 7 个 `noindex` 支持/状态页，其中包含：

- `/guides/claude-identity-verification`
- `/guides/claude-phone-verification`
- `/guides/claude-account-disabled-appeal`
- `/guides/7-arrival-checklist`
- `/guides/8-uk-sim-choice`
- `/guides/9-number-balance-data-check`
- `/guides/apn-settings`
- `/more/esim-new-phone`
- `/more/esim-deleted`
- `/tools/keep-number-reminder`
- `/tools/china-roaming-cost`
- `/tools/g0-g2-total-cost`
- `/privacy`
- `/terms`
- `/refund`
- `/shipping`

输出只是本地 review fragment，**不能直接将它作为完整 ruleset 覆盖上传**。有 Zone Rules 权限的负责人应在 Cloudflare 界面中更新已有规则 `23a9c07759414918816c2e768101d6f0`，保留第一顺位及其他规则。

从 Cloudflare 导出更新后的完整 JSON，然后离线验证：

```bash
npm run cloudflare:rules:validate -- \
  --file /absolute/path/to/cloudflare-ruleset-export.json \
  --rule-id 23a9c07759414918816c2e768101d6f0
```

校验项包括：规则为第一顺位且已启用，仅匹配 GET/HEAD，路径集与 manifest 完全相等，301 直达 `https://getgiffgaff.com<path>/`，并保留 query。缺失、额外路径、复制路径、错误目标、302、未保留 query 或顺序错误都会非零退出。

> 离线 JSON 通过不等于生产已生效。最后仍必须运行 `npm run verify:seo -- --base-url https://getgiffgaff.com --expected-url-count 46`，并保留 46 URL / 全部变体零错误证据。生产发布脚本会内置执行同一检查。

## 2. G0/G2 真实交易证据

模板在 `docs/operations/commerce-evidence.template.json`。先将它复制到不进入 Git 和公共同步的私密工作目录，再由获授权的业务负责人填写。仓库不应保留原始订单、姓名、电话、地址、邮箱、密码、OTP、完整订单号或完整交易号。

每个 G0/G2 记录都必须保留六组相互独立的脱敏证据：

1. 当前可直达的 SKU URL 及 200 检查。
2. 订单商品、金额、时间和尾号脱敏的订单参考号。
3. 支付成功状态、收款方展示名、金额和时间。
4. 履约完成状态及实物/交付内容与订单一致性。
5. 退款已完成状态、金额、申请和完成时间。
6. 售后工单已解决状态、渠道、时间及脱敏结论。

每个 `evidence` 对象要指向记录 JSON 相对路径下的真实脱敏文件，并填写：

- 文件的 SHA-256，例如 macOS 上用 `shasum -a 256 <file>` 本地计算。
- 正确 `media_type`。
- 带时区的 ISO 8601 `captured_at`。
- `redacted: true` 和 `redaction_review: "passed"`。

验证命令：

```bash
npm run validate:commerce-evidence -- \
  --file /absolute/private/path/commerce-evidence.json \
  --max-age-days 30
```

校验器会读取文件本体、复算 SHA-256、检查时序与时效，并对可读文本做常见邮箱、手机号、OTP/密码和卡号样式的二次拦截。它不能替代人工脱敏审查，因此六项 privacy check 和审查人角色也必须完整填写。

以下任一情况都会 fail closed：

- G0 或 G2 缺失，或任一六阶段缺失。
- 空值、占位值、非 HTTPS 或商店首页型 SKU URL。
- 支付未成功、履约未完成或不匹配、退款未完成、售后未解决。
- 金额不一致、时序错误、未来时间或超过设定时效。
- 证据文件缺失、路径越界、哈希不符、文本仅占位符。
- 脱敏和隐私复核未全部通过，或可读文本中命中常见敏感样式。

校验器不会联网打开 SKU，也不会登录订单、支付、履约、退款或售后源系统。校验通过仅表示这一份本地证据包满足结构、文件、哈希、时序与安全门禁；有权限的独立 reviewer 仍须回到对应源系统核对记录状态和证据来源。通过结果不等于法务审核、广告背书、库存承诺、未来价格承诺或所有用户的支付/收码成功保证。
