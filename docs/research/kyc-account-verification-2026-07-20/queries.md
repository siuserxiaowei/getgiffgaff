# 查询清单与覆盖记录

访问日期：2026-07-20。状态使用研究规范的双游标：`[x]` 为主研究者已回读官方正文并纳入；`[_]` 为找到线索但证据尚不足；`[ ]` 为开放缺口。

| 状态 | Query | 语言/市场 | 意图 | 预期来源 | 结果摘要 |
| --- | --- | --- | --- | --- | --- |
| [x] | Claude phone verification supported location SMS VoIP | EN/global | 注册 OTP | Claude 官方帮助 | 找到 ANT-01：六位 SMS、支持地点、拒绝 VoIP/Google Voice/app号码/座机，号码需长期可控且验证后不能改 |
| [x] | Claude identity verification government ID selfie Persona | EN/global | 真身份核验 | Claude 官方帮助 | 找到 ANT-02：政府签发实体照片证件，可能活体自拍，Persona 处理 |
| [x] | Claude age assurance Yoti 18 | EN/global | 年龄核验 | Claude 官方帮助 | 找到 ANT-03：面部估龄、证件或 Yoti Digital ID，和手机号 OTP 不同 |
| [x] | Claude login recovery banned appeal | EN/global | 登录/申诉 | Claude 官方帮助 | ANT-04 说明邮件安全链接登录；ANT-02 给出身份核验失败帮助与账号限制申诉路径 |
| [x] | Claude supported locations | EN/global | 地区资格 | Claude 官方帮助 | ANT-05/06：用户必须在支持地点；号码来自支持地点不等同于用户实际所在地 |
| [x] | OpenAI MFA SMS WhatsApp another method recovery | EN/global | MFA/恢复 | OpenAI 官方帮助 | OAI-01：短信/WhatsApp是多种方法之一，可尝试已启用的其他方式；高级安全可能用 recovery key |
| [x] | OpenAI change phone number account | EN/global | 号码生命周期 | OpenAI 官方帮助 | OAI-02：关联号码不能更改；纯手机号注册只在指定市场渐进推出/实验，不能宣传为全球流程 |
| [x] | OpenAI authentication method social SSO reset | EN/global | 登录恢复 | OpenAI 官方帮助 | OAI-03：原为社交/SSO的账号通常不能改成邮箱密码；重置密码不生效；需沿用原方式 |
| [x] | ChatGPT age requirement children parental consent | EN/global | 年龄资格 | OpenAI 官方帮助 | OAI-04：13岁以下不适用，13–18需家长同意；不是手机号或 KYC 证据 |
| [ ] | OpenAI current standalone age/identity verification flow | EN/global | 身份/年龄核验 | OpenAI 官方帮助 | 未定位到稳定可审计专页；不得据传闻补全，记录到 gaps.md |
| [x] | Google account verify phone too many times SMS delay | EN/global | 注册/登录 OTP | Google 官方帮助 | GOO-01：有时需要；次数限制、运营商延迟，号码可能被拒 |
| [x] | Google 2-step verification SMS SIM swap backup | EN/global | MFA | Google 官方帮助 | GOO-02：Google Prompt/Passkey/验证器/备份码等；短信更易受号码攻击 |
| [x] | Google account recovery phone verification code | EN/global | 恢复 | Google 官方帮助 | GOO-03：回答原账号问题，恢复号码/邮箱只是已有信号之一；不存在官方“代恢复”服务 |
| [x] | Apple trusted phone number account recovery wait | EN/global | MFA/恢复 | Apple 官方支持 | APL-01/02：可信号码建立在原账号上；恢复可能等数日，客服不能缩短 |
| [x] | Microsoft two-step verification no alternate method recovery | EN/global | 恢复 | Microsoft 官方支持 | MS-01：支持人员不能绕过二步验证；恢复表核对原账号信息 |
| [x] | Wise identity verification ID selfie address | EN/global | 真 KYC/支付合规 | Wise 官方帮助 | WIS-01/02：法定身份核验、证件、地址、自拍/银行信息，号码不能完成 |
| [x] | giffgaff China roaming receive SMS manual roam deactivation | EN/UK+China | 基础通信能力 | giffgaff 官方帮助 | GGL-01~05：可漫游使用短信；网络注册/选网可排查；6个月不活动可能停用，不能推导平台 OTP 必达 |
| [x] | ChatGPT KYC / 身份验证 / 手机号验证 | ZH/global | SEO机会 | Bing Webmaster（主线转引） | 精确 KYC 仅17 impressions/3M、意图混杂；身份/手机号无足够趋势。适合官方故障合并页，不适合 KYC 单页 |
| [x] | Claude KYC / 手机号验证 / 封号 | ZH/global | SEO机会 | Bing Webmaster（主线转引） | Claude KYC 667、封号922；官方 SERP owner 清晰。优先身份核验、手机号、申诉三段，不互相混写 |

## 停止条件记录

- 六个平台与 giffgaff 必要官方来源均已处理。
- 没有官方证据的 OpenAI 独立年龄/身份核验流程已明确列为 gap，而不是推断。
- 关键商业结论可由“平台官方要求 + giffgaff 官方能力边界”两类独立来源交叉支持。
