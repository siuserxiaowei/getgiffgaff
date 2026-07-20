# Claude 三个最终页面：发布前事实验收

复核日期：2026-07-20（Asia/Shanghai）

用途：本文件是三个最终页面的事实 source of truth。开发和编辑不得把同属“验证”的不同流程合并，不得把 giffgaff 的基础通信能力写成 Claude 的审批承诺。

## 实时源复核结果

本轮对下列官方帮助页请求其公开 Markdown 正文，逐一核对 HTTP 状态和首个 `#` 标题。结果均为 `200` 且标题匹配。这里的 `200` 只证明复核当时页面可访问，不代表未来不会改版。

| ID | HTTP | 正文标题匹配 | 官方页面 | URL |
| --- | ---: | --- | --- | --- |
| ANT-APPEAL | 200 | 是 | Safeguards warnings and appeals | https://support.claude.com/en/articles/8241253-safeguards-warnings-and-appeals |
| ANT-ID | 200 | 是 | Identity verification on Claude | https://support.claude.com/en/articles/14328960-identity-verification-on-claude |
| ANT-PHONE | 200 | 是 | Verify your phone number | https://support.claude.com/en/articles/8287232-verify-your-phone-number |
| ANT-LOC | 200 | 是 | Where can I access Claude? | https://support.claude.com/en/articles/8461763-where-can-i-access-claude |
| ANT-AGE | 200 | 是 | Age assurance on Claude | https://support.claude.com/en/articles/15171100-age-assurance-on-claude |
| ANT-LOGIN | 200 | 是 | Log in to your Claude account | https://support.claude.com/en/articles/13189465-log-in-to-your-claude-account |
| GGL-ROAM | 200 | 是 | Using your mobile phone in the 'Rest of the world' | https://help.giffgaff.com/en/articles/229548-using-your-mobile-phone-in-the-rest-of-the-world |
| GGL-TROUBLE | 200 | 是 | I’m having problems roaming abroad | https://help.giffgaff.com/en/articles/229483-i-m-having-problems-roaming-abroad |
| GGL-MANUAL | 200 | 是 | How to perform a Manual Roam | https://help.giffgaff.com/en/articles/258873-how-to-perform-a-manual-roam |
| GGL-DEACT | 200 | 是 | Understanding why your number has been deactivated | https://help.giffgaff.com/en/articles/242797-understanding-why-your-number-has-been-deactivated |

官方申诉目标 `https://claude.ai/restricted` 本轮匿名请求返回 Cloudflare `403 / Just a moment...`。这不否定申诉路径：ANT-APPEAL 和 ANT-ID 均明确链接该地址，并说明必须登录被限制的原账号才能访问。开发应链接它，但不能用匿名抓取结果声称表单公开可见或可代提交。

## `/guides/claude-identity-verification/`

### 页面必须回答什么

- Claude 的身份核验是真实身份核验：政府签发的实体照片证件，并可能要求活体自拍。
- 这与注册手机号 SMS OTP、年龄核验和地区资格是不同流程。
- Anthropic 表述为正在为部分 use cases 推出；不得写成所有账号、每次注册或所有用户必然触发。
- 验证由 Persona Identities 提供技术处理；数据用途和保留边界只能忠实转述官方当前说明。
- 验证失败可先重试、改善拍摄质量或更换本人有效政府证件；次数用尽后走官方 identity verification help form。
- 若账号在验证后被暂停/终止，必须转入官方申诉流程；号码、SIM 或换号不能替代身份核验与申诉。

### 必需事实与可用原文摘要

| 必需事实 | 可用原文摘要/忠实转述 | 主要官方源 |
| --- | --- | --- |
| 不是全量固定流程 | “We are rolling out identity verification for a few use cases”；可能在访问某些能力、平台完整性检查或安全/合规措施中出现 | ANT-ID |
| 所需证件 | “A valid government-issued photo ID: the physical document, in hand” | ANT-ID |
| 可能要求自拍 | 需要带摄像头的手机或电脑，用户可能被要求拍 live selfie | ANT-ID |
| 可接受证件边界 | 接受多数国家的原始、实体政府照片证件；常见为护照、驾照/州省证件、国家身份证 | ANT-ID |
| 明确不接受 | 复印件、截图、扫描件、照片翻拍、数字/移动 ID、非政府证件和临时纸质 ID | ANT-ID |
| 服务提供者 | Anthropic 选择 Persona Identities 作为 verification partner；Anthropic 是 data controller，Persona 按其指示处理 | ANT-ID |
| 失败处理 | 可在流程内多次尝试，改善光线/清晰度或改用另一份本人有效政府照片证件；用尽尝试后联系官方表单 | ANT-ID |
| 与年龄核验不同 | Claude 消费产品限18+；疑似未满18时，Yoti 可通过面部估龄、证件或 Digital ID 做 age assurance | ANT-AGE |
| 与手机号不同 | 电话验证是向号码发送六位短信以确认号码控制权；它不提交政府证件或证明身份属性 | ANT-PHONE |
| 与地区资格不同 | Claude 只允许在支持地点使用；拥有英国号码本身不能证明用户的实际物理所在地 | ANT-PHONE、ANT-LOC |

### giffgaff 可承接边界

- 只有页面同时解释“另一个独立的手机号 OTP 流程”时，才可链接 `/guides/claude-phone-verification/` 或购买前咨询。
- giffgaff 不能提供证件、自拍、年龄结果、Persona 审核、地区资格或申诉结果。
- 页面主 CTA 应是核对官方要求/失败帮助；商品 CTA 只能是次级、条件式跳转。

### 禁止断言

- “Claude KYC 只要英国手机号就能过。”
- “所有 Claude 新用户都必须提交身份证/护照。”
- “giffgaff 是 Persona/Anthropic 认可或白名单号码。”
- “借证、翻拍、截图、数字 ID、学生证或银行卡可以替代政府证件。”
- “验证失败换一个号码即可解决。”
- “提交本人证件就保证通过/保证不封号。”
- “Anthropic 永久不保存任何验证数据。”只能转述当前官方的控制者、处理者和存储说明，不扩张成绝对永久承诺。

### 动态事实复核频率

- 每月：ANT-ID、ANT-AGE 的触发口径、接受证件、Persona/Yoti、隐私与失败帮助入口。
- 发布前每次：页面标题、HTTP 200、identity help form 与 appeal link 是否仍在正文。
- 出现用户截图与页面不符时立即：不要用个案覆盖官方事实，先复核 ANT-ID/ANT-AGE 是否改版。

## `/guides/claude-phone-verification/`

### 页面必须回答什么

- Claude 当前官方称，新建账号会要求支持地点的电话号码接收六位短信验证码，不能跳过。
- 用户本人必须实际位于支持地点，同时号码也必须来自支持地点；“+44”不等于用户已满足地区资格。
- 官方排除 VoIP、Google Voice、app 生成号码、座机或其他不能接收短信的号码。
- Claude 号码验证后当前不能更改；应使用自己能长期控制的号码。
- 收不到码时要拆为两层：giffgaff 普通短信/漫游链路，和 Claude 是否接受号码/发送 OTP。前者正常不等于后者必达。
- 官方对错误发送、临时代码、号码已使用等情况有自己的处理路径；页面不得发明重试频率、冷却时长或通过率。

### 必需事实与可用原文摘要

| 必需事实 | 可用原文摘要/忠实转述 | 主要官方源 |
| --- | --- | --- |
| 注册 SMS OTP | 创建 Claude 账号时输入支持地点号码，通过短信接收 verification code | ANT-PHONE |
| 验证目的 | 官方称电话验证用于防止 spam and abuse，并确认用户能控制该号码 | ANT-PHONE |
| 代码形态 | “We’ll send a six-digit verification code … via text message” | ANT-PHONE |
| 地区双重条件 | 只有实际位于支持地点的用户可创建/使用账号，同时需要支持地点的电话号码 | ANT-PHONE、ANT-LOC |
| 不接受的号码 | VoIP、Google Voice、app 生成号码、座机及不能收短信的号码 | ANT-PHONE |
| 收不到码 | 先等几分钟；超过五分钟可 `Try again`、重新输入并检查号码；仍失败或出现指定发送错误时，官方建议尝试不同号码 | ANT-PHONE |
| 临时代码 | 短信代码会过期，应使用最近收到的代码；可重新开始获取新代码 | ANT-PHONE |
| 号码已使用 | 若提示已经使用，可能有另一个 Claude 账号绑定；知道对应邮箱时登录原账号联系支持 unlink，或使用未用于验证的其他号码 | ANT-PHONE |
| 号码不可更改 | “There isn’t a way to change your phone number … once it has been verified”；需使用长期可控号码 | ANT-PHONE |
| Claude 日常登录 | 登录是 Google 或邮件安全链接；跨设备产生的是邮件登录流程的验证码，不应误写为每次 SMS 登录 | ANT-LOGIN |
| giffgaff 海外短信能力 | 在 rest-of-world，SIM 可连接当地网络使用 calls/texts/data；漫游故障可检查账户开关、重启和选网 | GGL-ROAM、GGL-TROUBLE |
| 基础 SMS 排查 | manual roam 官方说明可用于无法收发 SMS 的网络问题 | GGL-MANUAL |
| 长期保号风险 | giffgaff SIM 连续6个月无合格使用可能停用；只接收验证码不在官方列出的保活行为清单中 | GGL-DEACT |

### 建议排查顺序

1. 确认 giffgaff SIM 已激活、号码仍有效、手机解锁且已注册当地网络。
2. 用普通点对点短信测试基础 SMS；普通短信失败时只做 giffgaff 网络/漫游排查。
3. 普通短信正常后再测 Claude；若只有 Claude 失败，按 Claude 官方错误文案处理，不能继续归因于 SIM。
4. 不连续高频请求；官方只明确“超过五分钟可 Try again”，没有给出无限重试或“安全频率”。
5. 购买前询问用户所在地、设备与长期保号需求，但不询问验证码、密码或证件。

### 禁止断言

- “giffgaff/英国实体号必定收到 Claude 验证码。”
- “有英国号就可以在不支持地点创建 Claude 账号。”
- “所有 +44 号码都符合 Claude 要求。”
- “giffgaff 是 Claude 官方推荐、合作或白名单号码。”
- “普通短信能收到就证明 Claude 一定会发码。”
- “换号一定能绕过 used too many times、风控或封禁。”
- “接码、VoIP、Google Voice、app号码可作为备用方案。”
- “接收短信当前一定免费。”本轮没有保存 China 行级接收 SMS 资费证据；写金额前必须重新核对 giffgaff roaming charges。

### 动态事实复核频率

- 每月：ANT-PHONE 的新用户要求、号码排除类型、五分钟重试提示、used-too-many-times 与号码不可更改规则。
- 每月：ANT-LOC 支持地点清单；页面若点名中国/英国资格，必须当日复核具体国家是否仍列出。
- 每季度：GGL-ROAM、GGL-TROUBLE、GGL-MANUAL、GGL-DEACT 的漫游与停用规则。
- 每次写资费：单独打开 giffgaff roaming charges，选择用户所在国家，不能沿用旧金额。
- 发布前每次：以上官方页 HTTP 200、标题和关键正文仍匹配。

## `/guides/claude-account-disabled-appeal/`

### 页面必须回答什么

- 先区分账号被暂停/终止、组织被 hold、Usage Policy warning、身份验证失败、登录邮件故障和手机号注册故障；它们不是同一问题。
- Anthropic 官方列举的可能封禁原因包括反复违反 Usage Policy、在不支持地点创建账号、违反 Terms；身份核验页另列 under-18 usage。只能写“可能原因”，不能推断个案结论。
- 若用户认为个人账号被错误暂停/终止，须登录被限制的原账号，从官方 restricted 页面提交 appeal。
- 若个人账号正常但所属 organization 被暂停，在 restricted screen 对受影响组织点击 `Request a review`。
- API/提示 warning 认为有误时，官方当前提供 usersafety@anthropic.com；不要把该邮箱替代个人封号申诉表。
- 申诉处理时长、通过率、补件要求与结果无公开保证；giffgaff 号码不能解封。

### 必需事实与可用原文摘要

| 必需事实 | 可用原文摘要/忠实转述 | 主要官方源 |
| --- | --- | --- |
| 可能原因 | repeated Usage Policy violations、account creation from an unsupported location、Terms of Service violations | ANT-APPEAL |
| 身份核验后的其他可能原因 | 身份页另列 under-18 usage；不能外推为所有封号原因 | ANT-ID |
| 个人账号申诉 | 到 claude.ai 登录被封账号，使用 `https://claude.ai/restricted` 页面里的 appeal form | ANT-APPEAL、ANT-ID |
| 必须登录 | “You must be logged in to access the appeal form” | ANT-APPEAL、ANT-ID |
| 组织被 hold | 若个人账号正常而组织因 unusual activity 被暂停，restricted screen 会列出组织，点击 `Request a review` | ANT-APPEAL |
| 警告申诉 | 对 warning 有异议时，官方当前要求邮件联系 usersafety@anthropic.com 并附情况与账号信息 | ANT-APPEAL |
| 数据导出/删除 | Free/Pro/Max 因 Usage Policy 被封仍可登录并查看页面可用的导出或删除选项；可导出数据范围可能受违规类型限制 | ANT-APPEAL |
| 登录故障不是封号 | Claude 正常登录方式为 Google 或邮件安全链接；没收到登录邮件应先查垃圾箱、邮件隔离与服务状态 | ANT-LOGIN |
| 身份核验失败不是自动等于封号 | 验证失败可重试或联系 identity verification help；账号被暂停/终止才走 appeal | ANT-ID |
| 手机号故障不是封号 | 新账号电话发送错误、代码过期、号码已使用均有独立 phone verification 处理路径 | ANT-PHONE |

### 页面可要求用户准备的信息

- 原 Claude 账号邮箱和准确错误文案。
- 问题发生时间、使用的 Claude 产品表面、个人账号还是组织。
- 已完成的官方步骤和可复现的非敏感说明。
- 本人对可能误判的事实陈述及必要上下文。

本站不得索取或代收：密码、验证码、恢复码、政府证件照片、完整付款资料或浏览器 Cookie。申诉由用户在 Claude 官方页面自行提交。

### 禁止断言

- “换英国号/giffgaff 就能解封 Claude。”
- “封号一定因为地区、手机号、KYC 或 IP。”
- “我们能代申诉、内部解封、加速审核或保证通过。”
- “重新注册、换设备、换代理、改指纹可以绕过限制。”
- “所有 warning 都会封号”或“收到 warning 不影响账号”。
- “申诉固定多少小时/天答复”。官方当前只称响应时间比正常更长并会尽快回复，没有 SLA。
- “匿名打开 restricted 页面就能看到/提交表单。”官方明确必须登录原账号。
- 把组织 `Request a review`、身份核验 help form、warning 邮箱和个人账号 appeal form 混成一个入口。

### 动态事实复核频率

- 每周：ANT-APPEAL 的申诉入口、登录要求、组织 review、warning 邮箱和响应时间提示；这是三个页面中变化风险最高的一页。
- 每月：ANT-ID 对封禁可能原因、identity help 与 appeal 的交叉描述。
- 发布前每次：ANT-APPEAL/ANT-ID/ANT-LOGIN/ANT-PHONE HTTP 200 与正文标题；确认 restricted URL 仍由官方帮助页链接。
- 用户报告申诉入口不可用时立即：先确认是否已登录原账号，再复核官方帮助页；不得提供绕过登录的方法。

## 三页共同发布门槛

1. 首屏或首个注意框明确：本站不是 Anthropic/Claude，giffgaff 不能保证验证码、身份审核、地区资格或申诉结果。
2. 每个动态事实就近链接对应官方页，不能只在文末堆来源。
3. 电话页可有直接购买/咨询 CTA；身份页仅有条件式次级 CTA；申诉页不应以卖卡为主要 CTA。
4. 不收集验证码、密码、恢复码、证件或 Cookie；客服只接收非敏感错误文案和通信排查信息。
5. 日期显示为“官方规则复核日期”，不能暗示页面发布时间或平台承诺期。
6. 若任一 required 官方源非200、标题变更或关键句消失，暂停发布相关断言，先更新本文件与证据卡。
