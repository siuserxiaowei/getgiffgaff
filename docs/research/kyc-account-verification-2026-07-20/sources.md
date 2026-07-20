# 来源清单

所有页面访问日期均为 2026-07-20。`verified` 表示本轮已直接读取正文并核对标题/支持范围；`blocked` 表示无法取得可审计正文，不用于肯定性结论。

## Required：官方平台与 giffgaff

| ID | Tier | 状态 | 官方页面标题 | URL | 用途与验收备注 |
| --- | --- | --- | --- | --- | --- |
| OAI-01 | required | verified | Enabling or disabling multi-factor authentication (MFA) | https://help.openai.com/en/articles/7967234-enabling-or-disabling-multi-factor-authentication-mfa | OpenAI MFA 可用验证方式、短信/WhatsApp只是选项之一、替代方式 |
| OAI-02 | required | verified | How to change the phone number associated with your account | https://help.openai.com/en/articles/9135134-how-to-change-the-phone-number-associated-with-your-account | 号码关联与不可修改边界；页面指出美国和印度的新用户纯手机号注册在渐进推出，其他国家可能有限实验 |
| OAI-03 | required | verified | Can I Change How I Log Into My Account (Authentication Method)? | https://help.openai.com/en/articles/4936824-can-i-change-my-authentication-method | 登录方式、MFA与原登录方式绑定、社交/SSO账号恢复边界 |
| OAI-04 | required | verified | Is ChatGPT safe for all ages? | https://help.openai.com/en/articles/8313401-is-chatgpt-safe-for-all-ages | 年龄要求；不把年龄要求误写成 SMS OTP |
| OAI-05 | required | blocked | OpenAI Help Center 年龄/身份核验专页 | 未定位到稳定且可审计的独立官方 URL | 本轮不声称所有 ChatGPT 用户都需政府证件或身份 KYC；仅保留为缺口 |
| ANT-01 | required | verified | Verify your phone number | https://support.claude.com/en/articles/8287232-verify-your-phone-number | Claude 新账号 SMS OTP、受支持地点、号码类型限制、长期控制、号码不可更改 |
| ANT-02 | required | verified | Identity verification on Claude | https://support.claude.com/en/articles/14328960-identity-verification-on-claude | 政府证件+可能自拍的真实身份核验、Persona、失败与申诉 |
| ANT-03 | required | verified | Age assurance on Claude | https://support.claude.com/en/articles/15171100-age-assurance-on-claude | 18+与 Yoti 面部估龄/证件/Digital ID；号码不能替代 |
| ANT-04 | required | verified | Log in to your Claude account | https://support.claude.com/en/articles/13189465-log-in-to-your-claude-account | Google或邮件安全链接登录；跨设备代码是邮件流程，不是 SMS；登录故障 |
| ANT-05 | required | verified | Get started with Claude | https://support.claude.com/en/articles/8114491-get-started-with-claude | 必须在受支持地点、18+ |
| ANT-06 | required | verified | Where can I access Claude? | https://support.claude.com/en/articles/8461763-where-can-i-access-claude | 地区资格清单；与英国号码不是同一事实 |
| GGL-01 | required | verified | Using your mobile phone in the 'Rest of the world' | https://help.giffgaff.com/en/articles/229548-using-your-mobile-phone-in-the-rest-of-the-world | 中国属于 rest-of-world；SIM 可连接当地网络使用短信等漫游服务；套餐不适用、主动业务/数据看 credit 与资费 |
| GGL-02 | required | verified | I’m having problems roaming abroad | https://help.giffgaff.com/en/articles/229483-i-m-having-problems-roaming-abroad | 漫游排查：账户漫游开关、重启、自动/手动选网等 |
| GGL-03 | required | verified | How to perform a Manual Roam | https://help.giffgaff.com/en/articles/258873-how-to-perform-a-manual-roam | manual roam 可处理无法收发 SMS 等网络问题；不证明特定平台会发送 OTP |
| GGL-04 | required | verified | Understanding why your number has been deactivated | https://help.giffgaff.com/en/articles/242797-understanding-why-your-number-has-been-deactivated | 6个月不活动可停用；停用后号码恢复窗口与不可找回风险 |
| GGL-05 | required | verified | What to do if you've lost your SIM or phone | https://help.giffgaff.com/en/articles/240710-what-to-do-if-you-ve-lost-your-sim-or-phone | 丢卡/换卡、注册邮箱验证、号码保留与恢复边界 |

## 补充主流平台：官方来源

| ID | Tier | 状态 | 官方页面标题 | URL | 用途与验收备注 |
| --- | --- | --- | --- | --- | --- |
| GOO-01 | required | verified | Verify your account | https://support.google.com/accounts/answer/114129?hl=en | Google 有时在创建/登录前要求电话验证；号码次数受限、送达可能延迟，号码被拒需其他号码 |
| GOO-02 | required | verified | Turn on 2-Step Verification | https://support.google.com/accounts/answer/185839?hl=en | Google 更推荐 Prompt/Passkey；SMS/voice 为可选二步验证且有 SIM-swap 风险 |
| GOO-03 | required | verified | How to recover your Google Account or Gmail | https://support.google.com/accounts/answer/7682439?hl=en | 恢复依赖回答原账号问题、恢复邮箱/号码等；官方警告不要使用代恢复服务或分享代码 |
| APL-01 | required | verified | Two-factor authentication for Apple Account | https://support.apple.com/en-us/102660 | 可信设备/可信号码与验证码概念；号码是账户安全渠道而非身份 KYC |
| APL-02 | required | verified | How to use account recovery when you can’t reset your Apple Account password | https://support.apple.com/en-us/118574 | 恢复可能等待数日，Apple Support 不能缩短；不能用新号码瞬时替代原信任关系 |
| MS-01 | required | verified | Help with the Microsoft account recovery form | https://support.microsoft.com/en-us/account-billing/help-with-the-microsoft-account-recovery-form-b19c02d1-a782-dee6-93c3-dc8113b20c42 | 若开启二步验证却无任何替代验证方式，Microsoft 表示支持人员不能绕过；恢复表依赖原账号信息 |
| WIS-01 | required | verified | How does Wise verify my identity? | https://wise.com/help/articles/2949801-how-does-wise-verify-my-identity | 金融机构法定身份核验、原始证件与反金融犯罪目的，证明真正 KYC 不等于手机号 OTP |
| WIS-02 | required | verified | Guide to getting verified | https://wise.com/help/articles/2949782/guide-to-getting-verified | 身份/地址/自拍/银行转账等分层验证，进一步界定号码无法替代 |

## Important：机会排序（非平台规则证据）

| ID | Tier | 状态 | 页面标题 | URL/路径 | 限制 |
| --- | --- | --- | --- | --- | --- |
| BING-01 | important | verified-as-secondary | Bing Webmaster Tools 与咨询事件实测（2026-07-20） | `docs/research/bing-webmaster-live-2026-07-20.md`（主线文件，本分支不复制） | 来自主线 Agent 的登录后台只读 UI 记录；本 worktree 未独立 UI 复核。只用于机会排序，不能证明平台规则、订单或转化 |

## 明确拒绝的来源类别

- “Claude/ChatGPT 必过”“英国号码包过”“KYC代过”“解封技术”“接码平台实测”页面：与官方规则冲突或不可审计，并产生欺诈/绕过风险。
- Reddit、论坛和个人博客：可发现问题，但本轮不作为动态事实主要证据。
- 搜索结果摘要：只作找 URL 线索；未读正文不纳入证据卡。
