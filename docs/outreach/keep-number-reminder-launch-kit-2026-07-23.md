# UK SIM Keep-Number Reminder：发布包

状态：DRAFT NOT PUBLISHED；页面和素材准备中，未提交任何外部平台。  
主落地页：<https://getgiffgaff.com/tools/keep-number-reminder/>  
产品定位：免费、本地运行、无需注册的 UK SIM 第 5 个月日历提醒工具。

## 发布顺序

1. 先在生产站核验英文产品区、日期计算、`.ics` 下载、移动端和社交分享图。
2. 保持当前中文 canonical，不新增重复英文 URL。
3. 当前站内 CTA 观察期结束后，再启动一个外部发布实验，避免混淆流量来源。
4. 第一站只选 Product Hunt 或 MicroLaunch；观察 7 天后再决定是否提交第二站。
5. 目录发布后只跟踪真实来源域、引荐访问、工具结果和后续站内点击，不用“收录数量”代替有效流量。

## Product Hunt 素材

### Name

UK SIM Keep-Number Reminder

### Tagline

Create a private fifth-month calendar reminder for your UK SIM.

### Short description

Enter the date of your last qualifying giffgaff activity and export an early fifth-month reminder as a standard .ics calendar file. The calculation runs locally in your browser, requires no account, and stores no phone number or account details. It is a reminder tool, not proof that a number is active.

### Topics

- Productivity
- Travel
- Privacy
- Utilities

### Maker comment

I built this after seeing a simple but recurring problem: people remember that an infrequently used UK SIM needs activity, but they do not remember the date of the last qualifying action. The tool turns that date into an early calendar reminder and keeps the input in the browser. I deliberately made the limit visible: a reminder is not proof of number status, and users should re-check the current operator rule before acting.

### Gallery captions

1. `Enter one date; nothing is uploaded.`
2. `Get an early fifth-month reminder.`
3. `Export a standard .ics calendar file.`
4. `The tool explains its limits and links to the official rule.`

## MicroLaunch 素材

### One-line pitch

A local-only calendar reminder for people who keep an infrequently used UK SIM.

### Problem

Users often know that an inactive SIM may be deactivated but cannot remember when they last completed a qualifying action.

### Solution

The tool converts the user-entered date into an early fifth-month reminder and exports it to a calendar without collecting the date, phone number, or account details.

### Boundary

The fifth month is an early buffer chosen by getgiffgaff, not an operator guarantee or a replacement for checking the current official rule.

## 编辑型资源页联系模板

Subject: Optional local-only reminder for your UK SIM guide

Hello {{name}},

I noticed that your guide helps {{audience}} manage or choose a UK SIM. We made a small browser tool that turns the date of a user’s last qualifying giffgaff activity into an early fifth-month calendar reminder:

https://getgiffgaff.com/tools/keep-number-reminder/

It requires no account, keeps the date in the browser, and exports a standard .ics file. The page clearly states that the reminder is not proof that a number remains active and links to the current official inactivity rule.

If that would genuinely help readers of {{specific_section}}, feel free to review it as an optional resource. No reciprocal link or paid placement is requested. For transparency, getgiffgaff is an independent Chinese-language tutorial and sales service site and is not affiliated with giffgaff.

Best,  
{{real_name}}

## 发布检查清单

- [ ] 重新核验 giffgaff inactive 官方页面和页面核验日期
- [ ] 生产页英文产品区可见
- [ ] 日期计算覆盖月末和闰年
- [ ] `.ics` 可被 Apple Calendar / Google Calendar / Outlook 导入
- [ ] OG 图返回 200，尺寸 1200×630
- [ ] Product Hunt 个人 maker 账号和真实姓名准备好
- [ ] 截图不包含真实号码、账号、余额或设备通知
- [ ] UTM 参数按平台区分
- [ ] 发布当天登记来源域和时间
- [ ] 七天后记录引荐访问、工具结果和站内后续点击
