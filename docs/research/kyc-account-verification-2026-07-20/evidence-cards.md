# 已验收证据卡

访问日期统一为 2026-07-20。所有卡均由本研究主笔回读官方正文后标记 `reviewer_status=accepted`；BING 卡例外，明确为对主线 Agent 研究记录的二手转引。摘录控制为审计所需的短句，长内容使用忠实转述。

## EV-01 — giffgaff 只提供通信链路，不提供平台通过承诺

- `claim_group_id`: GG-SMS-BOUNDARY
- `claim`: giffgaff SIM 在中国等 rest-of-world 地区可通过当地网络漫游使用短信服务；网络/漫游排查可以恢复基础 SMS 能力，但不能证明任一平台会接受号码、发送 OTP 或放行账号。
- `claim_value`: carrier-capability-not-platform-approval
- `entity`: giffgaff
- `timeframe`: current as accessed
- `source_id`: GGL-01, GGL-02, GGL-03
- `source_url`: https://help.giffgaff.com/en/articles/229548-using-your-mobile-phone-in-the-rest-of-the-world ; https://help.giffgaff.com/en/articles/229483-i-m-having-problems-roaming-abroad ; https://help.giffgaff.com/en/articles/258873-how-to-perform-a-manual-roam
- `source_title`: Using your mobile phone in the 'Rest of the world'; I’m having problems roaming abroad; How to perform a Manual Roam
- `access_date`: 2026-07-20
- `source_type`: official
- `excerpt_or_observation`: 官方称在海外手机可连接当地网络继续使用 calls, texts and data；manual roam 可解决 “inability to send or receive SMS messages”。这是运营商能力与故障排查，不包含任何第三方平台送达/通过保证。
- `evidence_grade`: strong
- `supports`: fact
- `counter_evidence`: 未找到 giffgaff 对 Claude、ChatGPT 或其他平台 OTP 的官方送达承诺。
- `verification_status`: corroborated
- `confidence`: high
- `independent_source_count`: 3
- `source_independence`: duplicate（同一运营商不同帮助页）
- `reviewer_status`: accepted
- `review_notes`: 商业文案必须使用“可能接收/可排查”，禁止“必收/包过”。

## EV-02 — giffgaff 号码需主动维护，失效会影响已绑定账号

- `claim_group_id`: GG-NUMBER-LIFECYCLE
- `claim`: giffgaff SIM 连续6个月无合格使用可被停用；号码回收后无法恢复，因此把它绑定为长期 MFA/恢复号码需要持续维护。
- `claim_value`: maintain-or-risk-loss
- `entity`: giffgaff
- `timeframe`: current as accessed
- `source_id`: GGL-04, GGL-05
- `source_url`: https://help.giffgaff.com/en/articles/242797-understanding-why-your-number-has-been-deactivated ; https://help.giffgaff.com/en/articles/240710-what-to-do-if-you-ve-lost-your-sim-or-phone
- `source_title`: Understanding why your number has been deactivated; What to do if you've lost your SIM or phone
- `access_date`: 2026-07-20
- `source_type`: official
- `excerpt_or_observation`: “A SIM is considered inactive and deactivated when it has not been used in the last 6 months”；停用30天后号码不可取回并回到号码池。丢卡换卡则依赖既有账号/注册邮箱验证与号码转移流程。
- `evidence_grade`: strong
- `supports`: fact
- `counter_evidence`: 无证据表明“只接收验证码”本身属于防停用的合格使用。
- `verification_status`: corroborated
- `confidence`: high
- `independent_source_count`: 2
- `source_independence`: duplicate
- `reviewer_status`: accepted
- `review_notes`: 与 Claude/OpenAI 的“号码不可改/需长期控制”一起构成真实售后价值点。

## EV-03 — Claude 注册电话验证是 SMS OTP，不是 KYC

- `claim_group_id`: CLAUDE-PHONE-OTP
- `claim`: Claude 新账号要求支持地点的可收短信号码完成六位 SMS 验证；这一步用来确认号码控制权和防滥用，不是政府身份 KYC。
- `claim_value`: sms-possession-check
- `entity`: Anthropic Claude
- `timeframe`: current as accessed
- `source_id`: ANT-01
- `source_url`: https://support.claude.com/en/articles/8287232-verify-your-phone-number
- `source_title`: Verify your phone number
- `access_date`: 2026-07-20
- `source_type`: official
- `excerpt_or_observation`: “We’ll send a six-digit verification code to your phone number via text message”；官方说号码 “only used for account verification”，并明确新用户不能跳过。
- `evidence_grade`: strong
- `supports`: fact
- `counter_evidence`: ANT-02 另有政府证件身份核验，证明不能把两者合并为同一个 “Claude KYC”。
- `verification_status`: single_source
- `confidence`: high
- `independent_source_count`: 1
- `source_independence`: independent
- `reviewer_status`: accepted
- `review_notes`: 单一官方产品规则足以描述该流程，但平台随时可能调整。

## EV-04 — Claude 对号码类型、地点与生命周期有额外限制

- `claim_group_id`: CLAUDE-PHONE-ELIGIBILITY
- `claim`: Claude 当前只接受支持地点的电话号码，不接受 VoIP、Google Voice、app 生成号码、座机或不能收短信的号码；号码验证后不能更换，因此英国实体移动号码仅是满足部分条件，不保证批准。
- `claim_value`: constrained-not-guaranteed
- `entity`: Anthropic Claude
- `timeframe`: current as accessed
- `source_id`: ANT-01, ANT-06
- `source_url`: https://support.claude.com/en/articles/8287232-verify-your-phone-number ; https://support.claude.com/en/articles/8461763-where-can-i-access-claude
- `source_title`: Verify your phone number; Where can I access Claude?
- `access_date`: 2026-07-20
- `source_type`: official
- `excerpt_or_observation`: 官方限制段逐项排除 VoIP/Google Voice/app号码/座机；FAQ 还要求用户 “physically located in one of our supported locations”，并提示验证后不能改号码。
- `evidence_grade`: strong
- `supports`: fact
- `counter_evidence`: 英国位于支持清单中，但“+44号码”本身不能证明用户物理所在地或绕过其他风控。
- `verification_status`: corroborated
- `confidence`: high
- `independent_source_count`: 2
- `source_independence`: duplicate
- `reviewer_status`: accepted
- `review_notes`: 这是与 giffgaff 购买咨询最直接的交集，也是最需要免责声明的页面。

## EV-05 — Claude 身份验证是真正的证件/自拍核验

- `claim_group_id`: CLAUDE-IDENTITY-KYC
- `claim`: Claude 对部分能力、平台完整性、安全或合规场景逐步推出真实身份核验，需要有效政府签发实体照片证件，并可能要求活体自拍；手机号不能替代。
- `claim_value`: government-id-and-liveness
- `entity`: Anthropic Claude
- `timeframe`: rolling out as accessed
- `source_id`: ANT-02
- `source_url`: https://support.claude.com/en/articles/14328960-identity-verification-on-claude
- `source_title`: Identity verification on Claude
- `access_date`: 2026-07-20
- `source_type`: official
- `excerpt_or_observation`: “A valid government-issued photo ID: the physical document, in hand”；另称可能要求用手机或 webcam “take a live selfie”。
- `evidence_grade`: strong
- `supports`: fact
- `counter_evidence`: 不是每次注册都必然触发；官方说是 “rolling out … for a few use cases”。
- `verification_status`: single_source
- `confidence`: high
- `independent_source_count`: 1
- `source_independence`: independent
- `reviewer_status`: accepted
- `review_notes`: 中文页可解释为“真正身份核验/广义KYC”，但不可宣称英国号码能完成。

## EV-06 — Claude 年龄核验与身份核验、手机号 OTP 分离

- `claim_group_id`: CLAUDE-AGE
- `claim`: Claude 消费产品限18岁以上；被系统判断可能未满18时，可通过 Yoti 的面部年龄估计、身份证件或 Digital ID 证明年龄，手机号不是年龄证据。
- `claim_value`: age-assurance-not-phone
- `entity`: Anthropic Claude
- `timeframe`: current as accessed
- `source_id`: ANT-03, ANT-05
- `source_url`: https://support.claude.com/en/articles/15171100-age-assurance-on-claude ; https://support.claude.com/en/articles/8114491-get-started-with-claude
- `source_title`: Age assurance on Claude; Get started with Claude
- `access_date`: 2026-07-20
- `source_type`: official
- `excerpt_or_observation`: “Claude … is only available to people over 18 years”；Yoti 方法包括 facial age estimation、ID verification 与 Digital ID。
- `evidence_grade`: strong
- `supports`: fact
- `counter_evidence`: 年龄核验可能不要求证件（面部估龄路径），因此不能一概叫“证件 KYC”。
- `verification_status`: corroborated
- `confidence`: high
- `independent_source_count`: 2
- `source_independence`: duplicate
- `reviewer_status`: accepted
- `review_notes`: 适合在 Claude KYC 解释页单独一节，不与 SMS 故障页抢意图。

## EV-07 — Claude 登录与账号申诉的主要路径不是新手机号

- `claim_group_id`: CLAUDE-LOGIN-RECOVERY
- `claim`: Claude 日常登录通过 Google 或邮件安全链接；跨设备产生的是邮件流程中的验证码。因身份核验被限制的账号可走官方帮助/申诉，但新买手机号不能替代原邮箱、账号或申诉事实。
- `claim_value`: email-google-appeal-not-new-sim
- `entity`: Anthropic Claude
- `timeframe`: current as accessed
- `source_id`: ANT-04, ANT-02
- `source_url`: https://support.claude.com/en/articles/13189465-log-in-to-your-claude-account ; https://support.claude.com/en/articles/14328960-identity-verification-on-claude
- `source_title`: Log in to your Claude account; Identity verification on Claude
- `access_date`: 2026-07-20
- `source_type`: official
- `excerpt_or_observation`: 登录页提供 “Continue with Google” 或 “Continue with email”；身份页对错误暂停/终止给出登录后申诉表，并说明可能原因包括 unsupported location、under-18 usage、政策/条款违规。
- `evidence_grade`: strong
- `supports`: fact
- `counter_evidence`: ANT-01 的注册手机号可能仍与账户绑定，但官方未把它列为普通登录恢复方式。
- `verification_status`: corroborated
- `confidence`: high
- `independent_source_count`: 2
- `source_independence`: duplicate
- `reviewer_status`: accepted
- `review_notes`: “Claude封号”页只做官方申诉与资料准备，不做风控规避。

## EV-08 — OpenAI 的短信是可选 MFA 通道，不等同 ChatGPT KYC

- `claim_group_id`: OPENAI-MFA
- `claim`: OpenAI MFA 的可用方式可包括验证器、推送、SMS/WhatsApp、Passkey；可尝试其他已启用方式，故英国手机号仅与选用 SMS/WhatsApp 的用户存在交集。
- `claim_value`: optional-mfa-channel
- `entity`: OpenAI / ChatGPT
- `timeframe`: current as accessed
- `source_id`: OAI-01
- `source_url`: https://help.openai.com/en/articles/7967234-enabling-or-disabling-multi-factor-authentication-mfa
- `source_title`: Enabling or disabling multi-factor authentication (MFA)
- `access_date`: 2026-07-20
- `source_type`: official
- `excerpt_or_observation`: 官方列出 “Text message: Receive a 6-digit code by SMS or WhatsApp”，也列出 authenticator app、push notifications、passkey；登录时可选 “Try another method”。
- `evidence_grade`: strong
- `supports`: fact
- `counter_evidence`: 可用方式取决于设备、国家、账号层级和创建方式；不能保证某账号出现 SMS 选项。
- `verification_status`: single_source
- `confidence`: high
- `independent_source_count`: 1
- `source_independence`: independent
- `reviewer_status`: accepted
- `review_notes`: 不建议把“ChatGPT KYC”作为主标题，应做账号认证/MFA故障综合页。

## EV-09 — OpenAI 号码和登录方法有长期锁定风险

- `claim_group_id`: OPENAI-ACCOUNT-RECOVERY
- `claim`: OpenAI 不提供更改账户关联电话号码的选项；原先使用社交登录或 SSO 的账户通常不能改成邮箱密码，密码重置也不会生效，因此新买 giffgaff 号码不是通用账号恢复工具。
- `claim_value`: original-method-required
- `entity`: OpenAI / ChatGPT
- `timeframe`: current as accessed
- `source_id`: OAI-02, OAI-03
- `source_url`: https://help.openai.com/en/articles/9135134-how-to-change-the-phone-number-associated-with-your-account ; https://help.openai.com/en/articles/4936824-can-i-change-my-authentication-method
- `source_title`: How to change the phone number associated with your account; Can I Change How I Log Into My Account (Authentication Method)?
- `access_date`: 2026-07-20
- `source_type`: official
- `excerpt_or_observation`: OAI-02：“OpenAI does not offer the option to change or update the phone number associated with your account”；OAI-03 要求继续使用最初 SSO/social login，且此类账号不会发送密码重置邮件。
- `evidence_grade`: strong
- `supports`: fact
- `counter_evidence`: 美国和印度正在渐进推出纯手机号注册，其他国家可能有限实验；这不等于全球注册都需手机号。
- `verification_status`: corroborated
- `confidence`: high
- `independent_source_count`: 2
- `source_independence`: duplicate
- `reviewer_status`: accepted
- `review_notes`: 购买建议应强调长期控制与保号，而不是一次性接码。

## EV-10 — ChatGPT 年龄资格不是手机号或身份证 KYC 的证据

- `claim_group_id`: OPENAI-AGE
- `claim`: ChatGPT 不适用于13岁以下儿童，13–18岁需家长同意；该官方页面没有把手机号作为年龄证明，也不足以证明普遍政府证件 KYC。
- `claim_value`: age-policy-only
- `entity`: OpenAI / ChatGPT
- `timeframe`: current as accessed
- `source_id`: OAI-04, OAI-05
- `source_url`: https://help.openai.com/en/articles/8313401-is-chatgpt-safe-for-all-ages ; blocked standalone identity/age verification page
- `source_title`: Is ChatGPT safe for all ages?; standalone identity/age verification page not located
- `access_date`: 2026-07-20
- `source_type`: official
- `excerpt_or_observation`: “ChatGPT is not meant for children under 13” 且13–18需 parental consent；本轮未找到稳定官方页支持“所有用户要提交政府证件”。
- `evidence_grade`: medium
- `supports`: fact
- `counter_evidence`: 平台可能在部分司法辖区/风险场景启用单独年龄核验，但本轮证据不足，列 gap。
- `verification_status`: single_source
- `confidence`: medium
- `independent_source_count`: 1
- `source_independence`: independent
- `reviewer_status`: accepted
- `review_notes`: 只对已证年龄政策下结论，不扩张到普遍 KYC。

## EV-11 — Google 说明“能收短信”仍不等于号码必被接受

- `claim_group_id`: GOOGLE-PHONE-OTP
- `claim`: Google 有时在创建账号或登录前要求电话验证，但对号码使用次数有限制，运营商链路可延迟，号码也可能直接被拒；这支持“不保证某实体号码通过”的通用判断。
- `claim_value`: otp-risk-controls
- `entity`: Google Account
- `timeframe`: current as accessed
- `source_id`: GOO-01
- `source_url`: https://support.google.com/accounts/answer/114129?hl=en
- `source_title`: Verify your account
- `access_date`: 2026-07-20
- `source_type`: official
- `excerpt_or_observation`: “sometimes phone verification is required”；错误可能为 “This phone number cannot be used for verification” 或 “used too many times”。
- `evidence_grade`: strong
- `supports`: fact
- `counter_evidence`: Google 官方允许部分情况下使用家人/朋友号码，但本站不应据此推广借号或一次性号码。
- `verification_status`: single_source
- `confidence`: high
- `independent_source_count`: 1
- `source_independence`: independent
- `reviewer_status`: accepted
- `review_notes`: 可做跨平台 OTP 排查中的官方例子，不做“Google账号代注册”。

## EV-12 — Google 账号安全更偏向非短信 MFA 与原账号恢复

- `claim_group_id`: GOOGLE-RECOVERY
- `claim`: Google 提供 Prompt、Passkey、验证器和备份码等方式，并提示短信/语音代码易受号码攻击；账号恢复依赖原账号问题及既有恢复信息，不能由新号码代替。
- `claim_value`: existing-signals-not-new-number
- `entity`: Google Account
- `timeframe`: current as accessed
- `source_id`: GOO-02, GOO-03
- `source_url`: https://support.google.com/accounts/answer/185839?hl=en ; https://support.google.com/accounts/answer/7682439?hl=en
- `source_title`: Turn on 2-Step Verification; How to recover your Google Account or Gmail
- `access_date`: 2026-07-20
- `source_type`: official
- `excerpt_or_observation`: Google 推荐 prompts，并称短信/电话 codes “can be vulnerable to phone number-based hacks”；恢复流程要求回答确认账号的问题，官方不与“account or password support”代办服务合作。
- `evidence_grade`: strong
- `supports`: fact
- `counter_evidence`: 若号码早已作为恢复号码绑定，它仍可能是恢复信号之一。
- `verification_status`: corroborated
- `confidence`: high
- `independent_source_count`: 2
- `source_independence`: duplicate
- `reviewer_status`: accepted
- `review_notes`: 内容重点应是提前绑定多种恢复方式，而非囤号。

## EV-13 — Apple 与 Microsoft 的恢复依赖既有信任关系

- `claim_group_id`: MAINSTREAM-RECOVERY
- `claim`: Apple 的账号恢复可能等待数日且客服不能缩短；Microsoft 在用户启用二步验证却失去所有替代方式时也明确不能由支持人员绕过。号码只有事先建立为可信/验证渠道才有价值。
- `claim_value`: no-support-bypass
- `entity`: Apple Account; Microsoft account
- `timeframe`: current as accessed
- `source_id`: APL-01, APL-02, MS-01
- `source_url`: https://support.apple.com/en-us/102660 ; https://support.apple.com/en-us/118574 ; https://support.microsoft.com/en-us/account-billing/help-with-the-microsoft-account-recovery-form-b19c02d1-a782-dee6-93c3-dc8113b20c42
- `source_title`: Two-factor authentication for Apple Account; How to use account recovery when you can’t reset your Apple Account password; Help with the Microsoft account recovery form
- `access_date`: 2026-07-20
- `source_type`: official
- `excerpt_or_observation`: Apple：“it might take several days or longer” 且联系支持不能缩短；Microsoft：“support agents are not allowed to send password reset links, or access and change account details”。
- `evidence_grade`: strong
- `supports`: fact
- `counter_evidence`: 两平台流程不同，不能把某一方具体等待期或表单规则外推给另一方。
- `verification_status`: corroborated
- `confidence`: high
- `independent_source_count`: 3
- `source_independence`: independent
- `reviewer_status`: accepted
- `review_notes`: 支持“账号恢复不是买张新卡”的跨平台教育内容。

## EV-14 — Wise 代表的金融 KYC 与手机短信是两套要求

- `claim_group_id`: FINANCIAL-KYC
- `claim`: Wise 作为金融机构依法核验身份，通常需要政府证件，可能还核验地址、自拍/持证照或银行账户信息；英国手机号不能替代真正 KYC、支付或地址核验。
- `claim_value`: regulated-identity-not-phone
- `entity`: Wise
- `timeframe`: current as accessed
- `source_id`: WIS-01, WIS-02
- `source_url`: https://wise.com/help/articles/2949801/how-does-wise-verify-my-identity ; https://wise.com/help/articles/2949782/guide-to-getting-verified
- `source_title`: How does Wise verify my identity?; Guide to getting verified
- `access_date`: 2026-07-20
- `source_type`: official
- `excerpt_or_observation`: “Like all financial institutions, we verify your identity. This is a legal requirement”；流程可能要 photo ID、proof of address、持证照片/自拍视频或特定银行转账。
- `evidence_grade`: strong
- `supports`: fact
- `counter_evidence`: 不同用户、金额、地区会触发不同文件；不能声称固定材料清单覆盖所有人。
- `verification_status`: corroborated
- `confidence`: high
- `independent_source_count`: 2
- `source_independence`: duplicate
- `reviewer_status`: accepted
- `review_notes`: “Wise KYC/海外银行开户”搜索意图与本站商品交集过弱且监管敏感，应舍弃交易型承接。

## EV-15 — Bing 机会信号把 Claude 排在 ChatGPT KYC 前

- `claim_group_id`: SEO-OPPORTUNITY
- `claim`: 主线 Agent 的 Bing Keyword Research 记录显示 Claude KYC 与 Claude 封号有明确需求信号和官方 SERP owner，而 ChatGPT KYC 规模很小且意图混杂。
- `claim_value`: prioritize-claude
- `entity`: Bing keyword research / getgiffgaff content planning
- `timeframe`: 2026-04-20 to 2026-07-19（UI窗口，部分词页面显示至07-17）
- `source_id`: BING-01
- `source_url`: `docs/research/bing-webmaster-live-2026-07-20.md`
- `source_title`: Bing Webmaster Tools 与咨询事件实测（2026-07-20）
- `access_date`: 2026-07-20
- `source_type`: other
- `excerpt_or_observation`: 转引：Claude KYC 667 impressions；Claude 封号 922；ChatGPT KYC 可见国家合计17且 SERP 混杂；ChatGPT身份/手机号无足够趋势。
- `evidence_grade`: medium
- `supports`: fact（对主线记录内容）
- `counter_evidence`: 本 worktree 未登录 Bing 后台独立 UI 复核；impressions 不是点击、咨询、订单或页面可获流量预测。
- `verification_status`: single_source
- `confidence`: medium
- `independent_source_count`: 1
- `source_independence`: independent
- `reviewer_status`: accepted
- `review_notes`: 只用于机会排序，不能用于产品/平台规则。
