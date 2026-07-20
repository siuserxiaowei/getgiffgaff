const DIALOG_ID = "wechat-buying-guide-dialog";
const TITLE_ID = "wechat-buying-guide-title";
const DESCRIPTION_ID = "wechat-buying-guide-description";
const CLOSE_TARGET_ID = "wechat-buying-guide-close";

/**
 * Render the additive, site-wide commerce guide.
 *
 * The markup is intentionally static: it contains no form controls and collects
 * no account, order or payment data. JavaScript upgrades the native dialog, while
 * the fragment links and :target CSS keep the same guide usable without it.
 */
export function renderCommerceWidget() {
  return `<aside class="commerce-widget" data-growth-slot="wechat-buying-guide-v1" aria-label="微信、Telegram 咨询与英国卡信息">
  <a class="commerce-wechat-fab" href="#${DIALOG_ID}" aria-controls="${DIALOG_ID}" aria-haspopup="dialog" data-commerce-open data-consultation-entry="floating-launcher" data-analytics-event="commerce_click">
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M9.7 4C5.45 4 2 6.83 2 10.31c0 1.91 1.06 3.63 2.71 4.79l-.68 2.39 2.83-1.31c.89.29 1.85.44 2.84.44.25 0 .5-.01.74-.03a5.42 5.42 0 0 1-.3-1.76c0-3.33 3.07-6.03 6.86-6.03.1 0 .2 0 .3.01C16.48 6.05 13.44 4 9.7 4Zm-2.6 4.62a.85.85 0 1 1 0-1.7.85.85 0 0 1 0 1.7Zm5.2 0a.85.85 0 1 1 0-1.7.85.85 0 0 1 0 1.7Z"/><path d="M22 14.83c0-2.82-2.8-5.1-6.25-5.1s-6.25 2.28-6.25 5.1 2.8 5.1 6.25 5.1c.8 0 1.57-.13 2.27-.36l2.29 1.06-.55-1.94c1.38-.94 2.24-2.31 2.24-3.86Zm-8.37-.91a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4Zm4.23 0a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4Z"/></svg>
    <span>微信 / Telegram 咨询</span>
  </a>
  <span id="${CLOSE_TARGET_ID}" class="commerce-fragment-close-target" aria-hidden="true"></span>
  <dialog class="commerce-guide-dialog" id="${DIALOG_ID}" aria-labelledby="${TITLE_ID}" aria-describedby="${DESCRIPTION_ID}">
    <div class="commerce-guide-panel">
      <header class="commerce-guide-header">
        <div>
          <p class="commerce-guide-eyebrow">买卡 · 平台验证场景 · 已有卡故障</p>
          <h2 id="${TITLE_ID}">先选你的问题，再联系咨询</h2>
          <nav class="commerce-reason-nav" aria-label="咨询问题分类">
            <a href="#commerce-choice-title" data-consultation-entry="reason-buy" data-analytics-event="commerce_click"><strong>想买英国卡</strong><span>比较 G0/G2、库存与订单</span></a>
            <a href="#commerce-platform-title" data-consultation-entry="reason-platform" data-analytics-event="commerce_click"><strong>平台手机号与账号问题</strong><span>先区分短信 OTP、身份核验与官方申诉</span></a>
            <a href="/guides/4-signal/" data-consultation-entry="reason-troubleshoot" data-analytics-event="commerce_click"><strong>已有卡收不到短信</strong><span>按普通短信、网络与平台 OTP 分层排查</span></a>
          </nav>
          <p class="commerce-boundary-first"><strong>英国号码只可能涉及短信手机号验证，不能替代证件 KYC，也不能恢复被禁用账号。</strong> 本站不提供接码、借证、假身份、代验证或绕过限制服务。</p>
          <section class="commerce-quick-channels" aria-label="快速选择咨询方式">
            <h3>先选最方便的咨询方式</h3>
            <div class="commerce-quick-channel-grid">
              <a class="commerce-quick-action commerce-quick-action--wechat" href="https://u.wechat.com/MOlSxFZ7nu5enWrw4HtvKC4" target="_blank" rel="noopener noreferrer" data-link-role="contact-channel" data-consultation-entry="quick-wechat" data-channel-fallback="telegram" data-analytics-event="contact_click" data-analytics-channel="wechat">微信咨询“胡小胡”</a>
              <a class="commerce-quick-action commerce-quick-action--telegram" href="https://t.me/xiaoyuhuai" target="_blank" rel="noopener noreferrer" data-link-role="contact-channel" data-consultation-entry="quick-telegram" data-channel-fallback="wechat-qr" data-analytics-event="contact_click" data-analytics-channel="telegram">Telegram 备用</a>
              <a class="commerce-quick-action commerce-quick-action--ktt" href="/contact/#ktt-giga-card" data-consultation-entry="quick-ktt" data-channel-fallback="telegram" data-analytics-event="commerce_click">核对后查看快团团码</a>
            </div>
            <p>微信链接打不开时，可直接改用 Telegram；需要扫码时，请在另一台设备打开本页显示二维码。</p>
          </section>
          <p id="${DESCRIPTION_ID}"><strong>本站是独立第三方，不代表 giffgaff 官方。</strong> G0 / G2 是本站库存分类；本站不保证实时库存、支付成功或任何平台的 OTP 验证码送达。如需购买，付款前请联系客服核对当前库存、价格、卡片来源与激活状态、账号登记和控制权、余额、交付内容、售后边界及发货安排；无法核对关键事项时不要付款。</p>
        </div>
        <a class="commerce-guide-close" href="#${CLOSE_TARGET_ID}" data-commerce-close aria-label="关闭英国卡咨询指南">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </a>
      </header>

      <section class="commerce-choice-section" aria-labelledby="commerce-choice-title">
        <h3 id="commerce-choice-title">选卡参考：G0 还是 G2</h3>
        <div class="commerce-choice-grid">
          <a class="commerce-choice-card" href="/shop/giffgaff-g0/" data-analytics-event="shop_click">
            <strong>G0 新卡</strong>
            <span>适合愿意自行激活、首次充值的用户；付款前确认库存和当前说明。</span>
          </a>
          <a class="commerce-choice-card" href="/shop/giffgaff-g2/" data-analytics-event="shop_click">
            <strong>G2 有余额卡</strong>
            <span>本站内部库存分类，不是 giffgaff 官方 SKU；下单前请联系客服确认批次、余额说明与当前可用情况。</span>
          </a>
        </div>
        <a class="commerce-text-link" href="/guides/1-order/" data-analytics-event="commerce_click">查看完整购买教程</a>
      </section>

      <section class="commerce-platform-section" aria-labelledby="commerce-platform-title">
        <h3 id="commerce-platform-title">平台验证先确认：英国号码不等于通过 KYC</h3>
        <p>手机号验证、短信 OTP、MFA、证件身份核验和账号申诉是不同步骤。giffgaff 只能提供号码与运营商短信能力，不保证 ChatGPT、Claude 或其他平台接受该号码、发送验证码或通过身份审核。咨询时只说明平台名称、页面提示和“普通短信是否正常”；不要发送证件、密码、Cookie 或验证码。</p>
        <div class="commerce-platform-links">
          <a href="/guides/4-signal/" data-analytics-event="commerce_click">验证码收不到：先做短信分层排查</a>
          <a href="/shop/" data-analytics-event="shop_click">需要长期英国实体号码：查看卡片分类</a>
        </div>
      </section>

      <div class="commerce-channel-grid">
        <section class="commerce-channel-card" aria-labelledby="commerce-wechat-title">
          <div class="commerce-qr-frame commerce-qr-frame--portrait">
            <img src="/contact/wechat-qr.jpg" alt="微信显示名胡小胡的客服二维码" width="888" height="1135" loading="lazy" decoding="async">
          </div>
          <div>
            <h3 id="commerce-wechat-title">微信客服（显示名“胡小胡”）</h3>
            <p>微信添加后请核对显示名为“胡小胡”。若链接未唤起或跳到微信官网，同一手机可改用 Telegram；也可在另一台设备打开本页，再用当前手机的微信“扫一扫”扫描二维码。请勿发送密码、短信验证码或完整支付卡信息。</p>
            <a class="commerce-action commerce-action--wechat" href="https://u.wechat.com/MOlSxFZ7nu5enWrw4HtvKC4" target="_blank" rel="noopener noreferrer" data-link-role="contact-channel" data-consultation-entry="detail-wechat" data-channel-fallback="telegram" data-analytics-event="contact_click" data-analytics-channel="wechat">尝试打开微信添加“胡小胡”</a>
          </div>
        </section>

        <section class="commerce-channel-card" aria-labelledby="commerce-telegram-title">
          <div class="commerce-qr-frame commerce-qr-frame--portrait">
            <img src="/contact/telegram-qr.jpg" alt="Telegram 客服 xiaoyuhuai 二维码" width="1000" height="1920" loading="lazy" decoding="async">
          </div>
          <div>
            <h3 id="commerce-telegram-title">Telegram @xiaoyuhuai</h3>
            <p>手机可直接打开，电脑可扫码。若链接未打开，可在 Telegram 内搜索 @xiaoyuhuai；也可改用微信二维码。咨询时请说明要了解 G0 或 G2；请勿发送密码、短信验证码或完整支付卡信息。</p>
            <a class="commerce-action commerce-action--telegram" href="https://t.me/xiaoyuhuai" target="_blank" rel="noopener noreferrer" data-link-role="contact-channel" data-consultation-entry="detail-telegram" data-channel-fallback="wechat-qr" data-analytics-event="contact_click" data-analytics-channel="telegram">打开 Telegram 联系 @xiaoyuhuai</a>
          </div>
        </section>

        <section class="commerce-channel-card" aria-labelledby="commerce-ktt-title">
          <div class="commerce-qr-frame">
            <img src="/contact/ktt-giga-card.png" alt="快团团 giffgaff 手机卡小程序码" width="720" height="540" loading="lazy" decoding="async">
          </div>
          <div>
            <h3 id="commerce-ktt-title">快团团小程序码</h3>
            <p>本站没有可核验的商品直达链接，快团团小程序码需要微信扫描。当前设备没有微信时，可先通过 Telegram 核对对应商品与订单信息；需要继续时，在另一台设备打开本页显示小程序码，再用装有微信的设备扫码。进入快团团后仍需核对收款方、商品、金额与发货说明。</p>
            <a class="commerce-action" href="/contact/#ktt-giga-card" data-consultation-entry="detail-ktt" data-channel-fallback="telegram" data-analytics-event="commerce_click">前往联系页查看小程序码</a>
          </div>
        </section>
      </div>

      <p class="commerce-privacy-note">本弹窗不收集手机号、账户、订单号或支付信息。本站不会要求密码、短信验证码或完整支付卡信息；自定义漏斗数据集不记录 Cookie。<a href="/privacy/">隐私说明状态</a> · <a href="/terms/">交易条款状态</a> · <a href="/refund/">退款说明状态</a> · <a href="/shipping/">物流说明状态</a></p>
    </div>
  </dialog>
  <script type="module" src="/growth-assets/commerce-ui.js"></script>
  <script type="module" src="/growth-assets/analytics.js"></script>
</aside>`;
}
