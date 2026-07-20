# Claude 三个最终页面：实现审查与可执行差异清单

审查日期：2026-07-20（Asia/Shanghai）

## 结论

**当前结论：暂缓发布。** 三个 URL 均已正确注册、生成并进入路由清单；首屏独立站声明、流程分流、禁止承诺和 CTA 大方向也正确。但实现仍缺少 `page-fact-check.md` 明定的关键官方处理路径：身份验证尝试用尽后的专用 help form，手机号收不到码的“五分钟后 Try again”及号码已使用的完整处理，申诉页的组织 `Request a review`、warning 邮箱和可能原因。它们不是可选扩展，而是对应页面必须回答的操作信息。

发布前应至少关闭下列 3 个阻塞组：

1. 身份页补齐 Persona 数据处理边界，并把“联系官方支持”改为有明确触发条件和直达链接的 identity verification help form。
2. 手机页补齐五分钟重试和 `used too many times` 的官方分支，并明确只收验证码不属于 giffgaff 官方列出的保活动作。
3. 申诉页补齐个人账号、organization hold、warning、身份失败、登录失败、手机号失败与技术性 403 的完整矩阵；逐一给出互不替代的官方入口。

未发现“英国号包过”“验证码必达”“换号解封”、虚构 SLA/通过率或代收验证码等高风险错误断言。

## 审查对象与方法

事实基准：`docs/research/kyc-account-verification-2026-07-20/page-fact-check.md`（研究分支提交 `86d66013a9510eeb738452ab86b8c51b087df9e3`）。

实现对象是主 worktree `getgiffgaff` 的未提交快照；基础 HEAD 为 `fef39a9d8926b2930c228c941cb37a2bb5c6f295`，取证时间为 `2026-07-20T13:54:33+08:00`。由于实现未提交，使用以下哈希固定本次审查边界：

| 对象 | SHA-256 |
| --- | --- |
| `content-registry.js`、`build-growth-pages.mjs`、`commerce-widget.js` 的 Git diff | `10c8253ef8e552f12ec6811a7276faebc6cbf89f16412fb309c6e389b6fc4212` |
| 身份页最终 HTML | `56aab559ece9de39c8eb4d8312106545e391e9afe2c877b3aa403f2e8122046a` |
| 手机页最终 HTML | `66699aee4fd5c92d67461c0280bdf5aeef9f59fc40736c6f3b6f1600cf43444f` |
| 申诉页最终 HTML | `7965ea8d0baa46c5ceef0dca00357f3f9f3d60bcdc33963d576af554eb827a9d` |

逐页比较了注册内容和落地 HTML；三页均满足 `disk HTML === renderGrowthPage(page)`。因此下面引用 `content-registry.js` 用于指出精确修改位置，同时以生成 HTML 为最终判定对象。

严重度定义：

- **阻塞发布**：缺少事实基准列为“页面必须回答”的关键状态或官方动作，可能把用户送进错误/不完整路径。
- **应修**：必需事实或安全边界表达不完整，但现有文字本身未形成相反承诺。
- **建议**：不影响核心事实正确性，但会改善来源就近性、可维护性或抗误读能力。

## `/guides/claude-identity-verification/`

### 逐项验收

| 核查项 | 结论 | 当前实现证据 | 差异与精确修正方向 |
| --- | --- | --- | --- |
| 只对部分 use cases 渐进推出 | Pass | 最终 HTML 37；`content-registry.js:181-182` 写“在部分场景中” | 没有写成所有用户或每次注册必触发。建议进一步采用官方“正在为少数 use cases 推出”措辞，降低“部分场景”被理解成稳定全量规则的风险。 |
| 政府签发的实体照片证件，可能 live selfie | Pass | 最终 HTML 37、41；`content-registry.js:182,188,193` | 已明确实体、政府签发、带照片、本人持有及可能实时自拍。 |
| 接受和排除的证件边界 | **应修** | 最终 HTML 37、41；`content-registry.js:182,193` | 已排除截图、扫描件、数字证件、学生证，但未覆盖事实基准中的复印件/照片翻拍、非政府证件和临时纸质 ID，也未给出护照、驾照/州省证件、国家身份证等常见合格例子。补成“常见接受 + 明确不接受”两组；避免暗示列举穷尽所有国家证件。 |
| Persona 和数据处理边界 | **阻塞发布** | meta description 提到 Persona；正文最终 HTML 36-43 无 Persona；`content-registry.js:178,184-205` | 页面承诺讲 Persona 流程，正文却没有说明 Anthropic 选择 Persona Identities 为 verification partner、Anthropic 是 data controller、Persona 按其指示处理。新增独立小节，忠实转述当前官方用途/控制者/处理者/存储说明；不要扩张成“永久不保存任何数据”。 |
| 失败可重试、改善拍摄或换本人其他有效证件 | Pass | 最终 HTML 41；`content-registry.js:196-198` | 已给出清晰度、光线、边缘、有效期与另一份本人证件处理。 |
| 次数用尽后走 identity verification help form | **阻塞发布** | 最终 HTML 41；`content-registry.js:198` 仅写“使用 Claude 官方支持渠道” | 这是无法执行的泛化入口，且没有“尝试次数用尽”的触发条件。应从 ANT-ID 当前正文取得 identity verification help form 的直达 URL，新增为 official source，并写成“仅在流程内尝试用尽后使用”；不要与账号 appeal form 混用。 |
| 身份、年龄、手机号 OTP、地区资格和申诉分开 | Pass | 最终 HTML 33、36、37、41；`content-registry.js:180,182,188,198,203` | 五个任务已明确不能互相替代，并有手机页、申诉页分流。年龄核验没有展开 Yoti 细节，但本页已满足“分开”要求。 |
| giffgaff 能力边界 | Pass | 最终 HTML 36、37、41、43；`content-registry.js:182,188,203,213-215` | 已明确号码不能替代证件、自拍、年龄、地区资格或申诉，也未声称 Persona/Anthropic 白名单。 |
| CTA 仅为条件式次级跳转 | Pass | 最终 HTML 43；`content-registry.js:213-215`；`build-growth-pages.mjs:209-213,393` | 页面级按钮只在“实际卡在短信验证”时跳手机规则页；顶部购买按钮和全站咨询 widget 均关闭。普通主导航/页脚中的“手机卡、联系我”是站点级信息架构链接，不是该页主 CTA，本审查不将其判作硬导购。 |
| 不收密码、验证码、证件/人脸资料 | Pass | 最终 HTML 41；`content-registry.js:198,203` | 已覆盖密码、一次性验证码、证件、人脸照片和 Cookie，并禁止借证、代刷脸、伪装或绕过。 |
| 动态事实就近官方链接和复核日期 | Partial | 最终 HTML 34、38、41-42 | 证件事实有就近 ANT-ID 链接；缺失的 Persona 与专用 help form 自然也缺少就近来源。补正文时一并补链接，日期继续标为“核验”。 |

### 身份页可执行修改单

1. 在 `content-registry.js:191-204` 间新增“Persona 与数据处理”段，使用 ANT-ID 的当前表述，不写绝对保留承诺。
2. 扩展 `prepare` 的证件排除项，补复印件/翻拍、临时纸质 ID 和一般性的非政府证件。
3. 在 `failed` 中把泛化的“官方支持渠道”替换为“流程内尝试用尽后”的专用 help form 直达链接；保留账号明确禁用才去 appeal 的分流。
4. 为 Persona 和 help form 加测试：断言最终 HTML 含 partner/controller 边界、专用 URL，且不含“永久不保存/保证通过”等绝对措辞。

## `/guides/claude-phone-verification/`

### 逐项验收

| 核查项 | 结论 | 当前实现证据 | 差异与精确修正方向 |
| --- | --- | --- | --- |
| 新账号、六位 SMS OTP、不能跳过 | Pass | 最终 HTML 32、37、41；`content-registry.js:224-230,236` | 已同时写明新账号、六位代码、短信和不能跳过。 |
| 用户实际位于支持地点，号码也来自支持地点 | Pass | 最终 HTML 37、41；`content-registry.js:230,236` | “用户与号码必须满足支持地区要求”及“英国号不等于用户身处英国”覆盖双重条件，没有把 +44 当地区资格。 |
| 排除 VoIP、Google Voice、app 号码、座机和不能收短信号码 | Pass | 最终 HTML 37、41；`content-registry.js:230,236` | 排除类型完整。 |
| 验证后不能更改号码 | Pass | 最终 HTML 37、41；`content-registry.js:230,244-246` | 已明确当前不能更改，并建议长期控制。 |
| 收不到码：五分钟后 `Try again` | **阻塞发布** | 最终 HTML 41；`content-registry.js:239-241` | 当前完全没有“五分钟”或 `Try again`，只写“不连续高频请求”。补为：先等几分钟；超过五分钟可点 `Try again`，重新输入并核对号码；代码过期只用最新一条。不要另造冷却时间或“安全频率”。 |
| `used too many times` 官方处理 | **阻塞发布** | 最终 HTML 41；`content-registry.js:241` 写“优先登录原账号联系官方处理” | 现文没有说明提示可能代表号码已绑定另一账号，也没有给出“知道邮箱时登录原账号联系支持 unlink；否则使用未用于验证的其他合格号码”。按 ANT-PHONE 补全，并继续禁止把换号写成绕过风控/封禁。 |
| 普通 SMS 正常不等于 Claude OTP 必达 | Pass | 最终 HTML 33、37、41；`content-registry.js:228,230,241,251` | 二层诊断和“不保证接受/发码”清楚。 |
| giffgaff 六个月不活动与保活动作 | **应修** | 最终 HTML 41、42；`content-registry.js:244-246,254` | 只写“六个月 inactive 保号规则”并跳内部页面，没有在本页明确“只接收验证码不属于官方列出的保活动作”。补列主动通话、主动 SMS/MMS、移动数据连接、购买 Airtime Credit 或 plan，并明确接收短信不在清单；就近链 GGL-DEACT。 |
| 基础 SMS / 漫游排查的直接来源 | **应修** | 最终 HTML 41-42；`content-registry.js:241,254` | 文中要求检查漫游开关和手动选网，但 sources 只有通用 network 与 deactivation；事实基准列出的 GGL-ROAM、GGL-TROUBLE、GGL-MANUAL 没有就近链接。把对应官方漫游/Manual Roam 源加到这一步，不只依赖内部 `/guides/4-signal/`。 |
| 验证目的与日常登录边界 | **建议** | 最终 HTML 37-43 未说明 | 可补一句“官方称用于防 spam and abuse 并确认号码控制权”；另说明日常登录走 Google 或邮件安全链接，避免读者把跨设备邮件验证码误当作每次 SMS 登录。两项都应就近链 ANT-PHONE/ANT-LOGIN。 |
| 禁止必收、白名单、包过或绕过断言 | Pass | 最终 HTML 36、37、41、43；`content-registry.js:230,241,251,262-264` | 未作官方合作/白名单、必达、包过或换号绕过承诺，也未写接收短信资费。 |
| 咨询不索取验证码、密码或证件 | Pass | 最终 HTML 41、43 及 widget 安全提示；`content-registry.js:251,263` | 页面级 CTA 同屏含“不保证 Claude 接受/发码/批准”和“不发送密码、证件、验证码”。widget 也重复安全边界。 |
| 只有手机页保留直接购买/咨询 CTA | Pass | 最终 HTML 27、43、47 起；`content-registry.js:262-264` | 手机页保留购买/咨询组件符合门槛；身份页和申诉页已关闭。 |

### 手机页可执行修改单

1. 重写 `no-code` 为按官方次序的明确分支：普通 SMS 测试 → 等几分钟 → 超过五分钟 `Try again` / 重输核号 → 只用最新代码 → 指定发送错误 → `used too many times`。
2. 给“号码已使用”补齐原账号支持 unlink 与未使用号码两个合法出口；不要把“另一号码”写成风控或封禁绕过。
3. 在 `cannot-change` 直接写出六个月不活动和合格动作，明确“只收验证码不保号”，并就近链 GGL-DEACT。
4. 为漫游开关、手动选网和普通 SMS 排查补 GGL-ROAM/GGL-TROUBLE/GGL-MANUAL 直接来源。
5. 新增内容断言测试：包含“五分钟”“Try again”“unlink/解除关联语义”“只接收短信不保号”，且不出现额外冷却时间、成功率或必达措辞。

## `/guides/claude-account-disabled-appeal/`

### 逐项验收

| 核查项 | 结论 | 当前实现证据 | 差异与精确修正方向 |
| --- | --- | --- | --- |
| 个人账号暂停/终止 | Pass | 最终 HTML 37、41；`content-registry.js:279,285,290` | 已要求只有明确 disabled/terminated 才申诉。 |
| 个人账号官方入口与登录要求 | Pass | 最终 HTML 41-42；`content-registry.js:99-102,290,303` | 已直链 `https://claude.ai/restricted`，明确必须先登录被限制的原账号，并说明匿名访问可能被拒绝。没有把匿名 403 写成入口失效。 |
| organization hold 与 `Request a review` | **阻塞发布** | 最终 HTML 41；`content-registry.js:285` 仅写“联系组织管理员确认账单、政策或成员权限” | 该行把 organization hold 和一般成员权限混在一起，漏掉官方动作。拆为：个人账号正常但受影响 organization 因 unusual activity 被 hold 时，在 restricted screen 选择该组织并点击 `Request a review`；一般成员/账单权限另行联系管理员。 |
| Usage Policy warning 与 `usersafety@anthropic.com` | **阻塞发布** | 最终 HTML 31-43 和 `content-registry.js:272-303` 均无 warning/email | 新增独立行：只有对 API/提示 warning 有异议时，按官方当前说明发邮件至 `usersafety@anthropic.com` 并附必要账号上下文；明确该邮箱不能替代个人 disabled/terminated appeal form。 |
| 身份失败、登录故障、手机号故障、技术性 403 分流 | Partial | 最终 HTML 33、37、40-43；`content-registry.js:277-279,283-300` | 已区分身份失败、登录故障和 API/客户端 403；手机号故障只出现在 related link，没有进入状态表。把“手机号发送错误/代码过期/号码已使用”加入诊断矩阵并转手机页；登录故障可补垃圾箱、邮件隔离、服务状态等官方动作。 |
| 可能原因只写“可能” | **阻塞发布** | 最终 HTML 41；`content-registry.js:295` 只笼统写“可能导致账号停用的情况” | 页面没有列出事实基准要求的 repeated Usage Policy violations、unsupported-location account creation、Terms violations，也未把 under-18 明确限定为身份页另列的可能原因。新增“官方列举的可能原因”小节，始终保留“可能/不能判断个案原因”。 |
| 不承诺 SLA、通过率、解封 | Pass | 最终 HTML 37、41、43；`content-registry.js:279,290,300,311-314` | 已明确无官方成功率或固定处理时间，不销售解封服务，新号码不能恢复原账号。 |
| 不设置购买/微信硬 CTA | Pass | 最终 HTML 27、43、46-48；`content-registry.js:310-314`；`build-growth-pages.mjs:209-213,393` | 页面级按钮返回身份验证分流；顶部购买按钮和咨询 widget 均关闭。普通主导航和页脚的站点级“手机卡/联系我”不构成本页硬 CTA。若产品口径要求“申诉页完全零商业链接”，则需另行隐藏普通导航/页脚，但这不是当前事实门槛的必要解释。 |
| 不收密码、验证码、恢复码、证件、付款信息、Cookie | **应修** | 最终 HTML 41；`content-registry.js:290,300` | 已禁止密码、Cookie、一次性代码、证件和完整支持邮件，但未明确“恢复码”和“完整付款信息”。把两项加入 warning；账号邮箱只能由用户在官方表单提交，本站仅接收脱敏错误文案。 |
| 禁止换号、代理、设备指纹等绕过 | **应修** | 最终 HTML 37、41；`content-registry.js:279,298-300` | 已禁止换号、买号、改地区、批量账号、假身份和临时号；未点名代理与设备指纹。补为明确禁止代理/VPN 伪装、换设备/改设备指纹及重新注册绕过限制。 |
| 数据导出/删除边界 | **建议** | 最终 HTML 31-43 无相关说明 | 可新增 Free/Pro/Max 因 Usage Policy 被封后，登录页面可能仍提供导出/删除选项；可导出范围可能受违规类型限制。不要把“可能可用”写成保证。 |
| 动态事实就近来源 | Partial | 最终 HTML 38、41-42 | 个人 appeal URL 和登录要求有就近来源；组织 review、warning 邮箱、原因和手机号分支缺正文，故也缺就近 ANT-APPEAL/ANT-PHONE 来源。新增各分支时同时补源。 |

### 申诉页可执行修改单

1. 把 `diagnose` 表扩为至少七行：个人账号 disabled/terminated、organization hold、warning、身份失败、登录故障、手机号故障、技术性 403。
2. 个人账号保留 `/restricted` + 原账号登录；organization hold 写 `Request a review`；warning 写 `usersafety@anthropic.com`，并明确三者互不替代。
3. 新增“官方列举的可能原因”，只用条件式措辞列三项；under-18 单独注明来自身份核验页，不能外推个案。
4. 安全警告补恢复码、完整付款信息、代理/VPN、换设备/设备指纹和重新注册规避。
5. 为三个互斥入口增加测试，至少断言：restricted URL、`Request a review`、warning 邮箱同时存在；身份 help form 不被当作个人 appeal；申诉页无购买按钮和 commerce widget。

## 三页共同门槛

| 共同门槛 | 结论 | 说明 |
| --- | --- | --- |
| 首屏说明本站非 Anthropic/Claude，且号码不保证身份、地区或申诉 | Pass | 三页最终 HTML 36 均有统一 disclosure；手机页直接答案另有 OTP 不保证。 |
| 动态事实就近链接官方页 | Partial | 基本官方来源组件和多数核心事实已链接；身份 help、Persona、手机五分钟/号码已使用、申诉组织/warning/原因因正文缺失而未达标。 |
| CTA 分级 | Pass | 手机页保留直接咨询；身份页仅条件式去手机页；申诉页无购买/微信硬 CTA。普通站点导航不按页面 CTA 计。 |
| 敏感资料边界 | Partial | 身份页、手机页达标；申诉页需补恢复码和完整付款信息。 |
| 日期标为规则复核日期 | Pass | 三页均同时显示“更新 2026-07-20”和“核验 2026-07-20”，官方链接使用“核验”标签，没有写成平台承诺期。 |
| required 官方源发布前可用性 | Pass（基于事实基准） | `page-fact-check.md` 已记录 2026-07-20 的 10 个官方帮助源 HTTP 200/标题匹配；restricted 匿名 403 已被正确解释为需登录，不是入口失效。新增 help form 后仍须在发布前单独复核其 URL。 |

## 工程验证与测试缺口

已执行：

```text
node --input-type=module -e '<逐页比较磁盘 HTML 与 renderGrowthPage(page)>'
# 三页 generated_matches_registry=true

node --test \
  test/growth-template-evidence.test.mjs \
  test/fullsite-commerce-flow.test.mjs \
  test/static-worker-contract.test.mjs \
  test/additive-growth-contract.test.mjs
# 30 tests, 30 pass, 0 fail
```

现有测试证明路由、静态渲染、来源契约、Worker 服务和 commerce widget 开关正常，但没有断言事实基准中的专用 help form、五分钟、unlink、只收短信不保号、`Request a review`、warning 邮箱、可能原因和完整敏感资料清单。因此“测试通过”不能替代本次事实发布验收。

## 建议修复顺序

1. 先补申诉页状态矩阵和三个互斥官方入口；这是错误分流风险最高的一页。
2. 再补手机页五分钟与号码已使用分支；这是搜索用户最需要的直接操作答案。
3. 补身份页专用 help form、Persona 边界和完整证件排除项。
4. 补 giffgaff 保活动作、漫游直接源及申诉敏感资料/规避清单。
5. 增加逐项内容断言，重新运行 `npm run build:content`、上述定向测试和完整 `npm test`，然后按 `page-fact-check.md` 再做一次人工验收。
