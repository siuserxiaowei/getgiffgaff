# getgiffgaff 设计系统 v2（2026-07-17）

本文档对应 `site/legacy/assets/site.css` 中的 v2 视觉实现，用于把 legacy 站点统一为“英伦邮政编码 + 中文手册”风格。所有 token 与组件规范均已在 CSS 中落地，本文件仅作为人可读的参考与后续维护契约。

## 设计概念

- **视觉隐喻**：英国皇家邮政信封的纸张色与深蓝，搭配中文手册的清晰版式。
- **气质关键词**：可信、克制、温暖、可读。
- **核心约束**：
  - 颜色少而固定，避免营销感渐变。
  - 中文正文优先保证 1.7 行高与舒适字重。
  - 卡片与按钮使用一致的圆角和阴影层级。
  - 商城场景使用深色独立主题，与内容页形成清晰分界。

## 设计令牌

### 色彩

| Token | 色值 | 用途 |
|-------|------|------|
| `--gg-paper` | `#FAF8F3` | 页面主背景 |
| `--gg-paper-warm` | `#F5F1E8` | 暖色辅助背景、提示区 |
| `--gg-ink` | `#1A1816` | 主正文色 |
| `--gg-ink-soft` | `#3D3A35` | 次级正文 |
| `--gg-muted` | `#6B655D` | 说明文字、元信息 |
| `--gg-line` | `#E7E2DA` | 边框、分割线 |
| `--gg-line-strong` | `#D4CFC6` | 强调边框 |
| `--gg-navy` | `#0A1F44` | 主品牌色、标题、主按钮 |
| `--gg-navy-soft` | `#142A52` | 主按钮悬停 |
| `--gg-gold` | `#C9A227` | 强调色、价格、徽章 |
| `--gg-gold-soft` | `#F3E9C8` | 金色浅色背景 |
| `--gg-gold-pale` | `#FDF8E8` | 最浅金色背景 |
| `--gg-forest` | `#1D5A42` | 成功、正向标签 |
| `--gg-forest-soft` | `#E8F3EE` | 正向标签背景 |
| `--gg-risk` | `#A53E3E` | 风险、警告 |
| `--gg-risk-soft` | `#FDF2F2` | 风险提示背景 |
| `--gg-white` | `#FFFFFF` | 卡片表面、按钮 |

### 字体

- **标题**：`Noto Serif SC`, `Source Han Serif SC`, `STSong`, serif
  - 用于 H1、H2、产品卡片标题、文档标题、商城标题。
- **正文**：`Noto Sans SC`, `PingFang SC`, `Microsoft YaHei`, `Hiragino Sans GB`, sans-serif
  - 用于 body、段落、按钮、标签。

### 尺寸与间距

| Token | 值 | 说明 |
|-------|-----|------|
| `--gg-radius` | `14px` | 卡片、大面板圆角 |
| `--gg-radius-sm` | `10px` | 按钮、小卡片、提示条圆角 |
| `--gg-radius-pill` | `999px` | 标签、 pill 形元素 |
| `--gg-max-width` | `1140px` | 内容最大宽度 |
| `--gg-header-height` | `68px` | 固定/粘性页头高度 |
| `--gg-shadow` | `0 4px 24px rgba(10, 31, 68, 0.08)` | 默认阴影 |
| `--gg-shadow-hover` | `0 12px 40px rgba(10, 31, 68, 0.14)` | 悬停阴影 |

### 按钮规范

基类 `.btn`：

- `display: inline-flex`，居中对齐，图标与文字间距 `8px`。
- 最小高度 `44px`，水平内边距 `20px`。
- 圆角 `--gg-radius-sm`，字号 `14px`，字重 `700`。
- 过渡：`transform 0.16s, box-shadow 0.16s, background 0.16s, border-color 0.16s`。
- 悬停时 `translateY(-2px)`。

变体：

- `.btn-primary`：白字、海军蓝底、默认阴影。
- `.btn-secondary`：海军蓝字、白底、灰边框。
- `.btn-gold`：海军蓝字、金色软背景、金色边框。
- `.btn-compact`：最小高度 `38px`，水平内边距 `14px`。

### 页头（Header）

`.site-header`：

- `position: sticky; top: 0`，z-index `50`。
- 高度 `--gg-header-height`，水平内边距随最大宽度居中。
- 背景为半透明纸张色（`rgba(250, 248, 243, 0.92)`），带 `12px` 毛玻璃 backdrop-filter。
- 底部 `1px` 细边框。
- 品牌区 `.brand` 使用 `.brand-mark` 金色字母 + 深蓝方块，右侧为站点名称与副标题。
- 导航链接悬停/聚焦时显示下划线。

### Hero

`.hero`：

- 最小高度 `520px`。
- 背景为从白到暖纸色再到淡金色的 `135deg` 渐变。
- 标题使用衬线体，响应式字号 `clamp(38px, 5vw, 58px)`，颜色 `--gg-navy`。
- `.hero-kicker` / `.eyebrow` / `.doc-kicker`：海军蓝、13px、大写、字间距 `0.06em`。
- `.hero-facts` 使用森林绿 pill 标签。

### 卡片（Cards）

共享基类包括 `.product-card`、`.guide-card`、`.process-card`、`.decision-table`、`.contact-section`、`.article-cta`、`.shortcut-card`、`.docs-home-card`、`.doc-list-item`、`.doc-cta`、`.doc-answer`、`.doc-toc`、`.contact-panel`、`.doc-pager a`。

- 背景 `--gg-white`。
- 边框 `1px solid var(--gg-line)`。
- 圆角 `--gg-radius`。
- 阴影 `0 1px 2px rgba(10, 31, 68, 0.04)`。

产品卡片 `.product-card`：

- 最小高度 `520px`，内边距 `24px`。
- 标题使用衬线体，26px。
- 价格块 `.price-block` 使用风险红强调价格。
- 特性列表 `.feature-list` 使用海军蓝图标。
- 底部备注 `.note-stack` 使用暖纸色背景。

### 提示条（Notice strip）

`.notice-strip`：

- 宽度受限居中，最小高度 `56px`。
- 风险红文字 + 风险软背景 + 细边框。
- 圆角 `--gg-radius-sm`。
- 字号 `14px`。

### 商城主题（Shop shell）

`.shop-shell` 是一个独立的深色主题容器，覆盖默认 token：

| Token | 色值 | 用途 |
|-------|------|------|
| `--shop-bg` | `#0A1F44` | 商城页背景 |
| `--shop-panel` | `#11254D` | 面板 |
| `--shop-panel-strong` | `#1A305C` | 强调面板 |
| `--shop-line` | `rgba(231, 226, 218, 0.16)` | 商城分隔线 |
| `--shop-muted` | `#B8B4AB` | 辅助文字 |
| `--shop-text` | `#FFFDF9` | 主文字 |
| `--shop-primary` | `#C9A227` | 商城主强调色 |
| `--shop-primary-hover` | `#D4B03D` | 悬停 |

- `.shop-hero` 使用双栏网格，标题字号 `52px`。
- `.shop-button` 与默认按钮尺寸一致，但变体为 `--primary`（金色填充）与 `--ghost`（透明边框）。
- `.shop-promise-bar` 使用细边框与金色图标。

## 向后兼容的旧变量映射

为避免 `growth.css` 等依赖断裂，`site/legacy/assets/site.css` 在 `:root` 中保留以下旧变量名，并映射到新 token：

| 旧变量 | 映射到新 token |
|--------|----------------|
| `--bg` | `--gg-paper` |
| `--surface` | `--gg-white` |
| `--surface-soft` | `--gg-paper-warm` |
| `--ink` | `--gg-ink` |
| `--muted` | `--gg-muted` |
| `--line` | `--gg-line` |
| `--primary` | `--gg-navy` |
| `--primary-hover` | `--gg-navy-soft` |
| `--accent` | `--gg-gold` |
| `--gold` | `--gg-gold` |
| `--risk` | `--gg-risk` |
| `--shadow` | `--gg-shadow` |
| `--moss` | `--gg-forest` |
| `--leaf` | `--gg-forest` |
| `--pollen` | `--gg-gold` |
| `--clay` | `--gg-risk` |

## 使用原则

1. **不要新增未记录的语义颜色**。如需新色，先判断能否用现有 navy/gold/forest/risk 的软/淡变体表达。
2. **优先使用 token，不要硬编码色值**。例外：商城主题的局部 `--shop-*` 变量允许在该作用域内硬编码，以保证主题封闭。
3. **中文正文保持 16px / 1.7 行高**，标题使用衬线体建立层级。
4. **按钮与卡片保持统一圆角**：大面板用 `--gg-radius`，按钮与提示条用 `--gg-radius-sm`。
5. **不要删除旧变量映射**，除非已确认 `growth.css` 与所有 growth 页面不再引用它们。

## 变更记录

- **2026-07-17**：v2 设计系统随 `site/legacy/assets/site.css` 大规模重写落地；新增纸张色、海军蓝、金色、森林绿、风险红 token；新增 sticky 毛玻璃页头、统一按钮、卡片、提示条与深色商城主题；保留旧变量映射以兼容 `growth.css`。
