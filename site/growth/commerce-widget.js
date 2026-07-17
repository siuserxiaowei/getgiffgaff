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
  return `<aside class="commerce-widget" data-growth-slot="wechat-buying-guide-v1" aria-label="微信咨询与英国卡购买">
  <a class="commerce-wechat-fab" href="#${DIALOG_ID}" aria-controls="${DIALOG_ID}" aria-haspopup="dialog" data-commerce-open data-analytics-event="contact_click">
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M9.7 4C5.45 4 2 6.83 2 10.31c0 1.91 1.06 3.63 2.71 4.79l-.68 2.39 2.83-1.31c.89.29 1.85.44 2.84.44.25 0 .5-.01.74-.03a5.42 5.42 0 0 1-.3-1.76c0-3.33 3.07-6.03 6.86-6.03.1 0 .2 0 .3.01C16.48 6.05 13.44 4 9.7 4Zm-2.6 4.62a.85.85 0 1 1 0-1.7.85.85 0 0 1 0 1.7Zm5.2 0a.85.85 0 1 1 0-1.7.85.85 0 0 1 0 1.7Z"/><path d="M22 14.83c0-2.82-2.8-5.1-6.25-5.1s-6.25 2.28-6.25 5.1 2.8 5.1 6.25 5.1c.8 0 1.57-.13 2.27-.36l2.29 1.06-.55-1.94c1.38-.94 2.24-2.31 2.24-3.86Zm-8.37-.91a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4Zm4.23 0a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4Z"/></svg>
    <span>微信购买指南</span>
  </a>
  <span id="${CLOSE_TARGET_ID}" class="commerce-fragment-close-target" aria-hidden="true"></span>
  <dialog class="commerce-guide-dialog" id="${DIALOG_ID}" aria-labelledby="${TITLE_ID}" aria-describedby="${DESCRIPTION_ID}">
    <div class="commerce-guide-panel">
      <header class="commerce-guide-header">
        <div>
          <p class="commerce-guide-eyebrow">微信咨询 · 选卡 · 下单</p>
          <h2 id="${TITLE_ID}">英国卡购买指南</h2>
          <p id="${DESCRIPTION_ID}"><strong>本站是独立第三方，不代表 giffgaff 官方。</strong> G0 / G2 是本站库存分类；本站不保证实时库存、支付成功或任何平台的 OTP 验证码送达。当前没有已核验的 G0/G2 直达 SKU、真实交易及完整隐私、条款、退款、物流政策证据；资料未补齐前请勿付款。</p>
        </div>
        <a class="commerce-guide-close" href="#${CLOSE_TARGET_ID}" data-commerce-close aria-label="关闭英国卡购买指南">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </a>
      </header>

      <section class="commerce-choice-section" aria-labelledby="commerce-choice-title">
        <h3 id="commerce-choice-title">第一步：选 G0 还是 G2</h3>
        <div class="commerce-choice-grid">
          <a class="commerce-choice-card" href="/shop/giffgaff-g0/" data-analytics-event="shop_click">
            <strong>G0 新卡</strong>
            <span>适合愿意自行激活、首次充值的用户；付款前确认库存和当前说明。</span>
          </a>
          <a class="commerce-choice-card" href="/shop/giffgaff-g2/" data-analytics-event="shop_click">
            <strong>G2 有余额卡</strong>
            <span>本站内部库存分类，不是 giffgaff 官方 SKU；批次、余额和账户控制证据未齐时请勿付款。</span>
          </a>
        </div>
        <a class="commerce-text-link" href="/guides/1-order/" data-analytics-event="commerce_click">查看完整购买教程</a>
      </section>

      <div class="commerce-channel-grid">
        <section class="commerce-channel-card" aria-labelledby="commerce-wechat-title">
          <div class="commerce-qr-frame commerce-qr-frame--portrait">
            <img src="/contact/wechat-qr.png" alt="微信客服小玉二维码" width="820" height="1229" loading="lazy" decoding="async">
          </div>
          <div>
            <h3 id="commerce-wechat-title">微信客服“客服小玉”</h3>
            <p>购买前可确认库存、发货和 G0 / G2 选择；请勿发送密码、短信验证码或完整支付卡信息。</p>
            <a class="commerce-action commerce-action--wechat" href="https://u.wechat.com/EDGrPuicwOsumDF_m3vVpEI?s=3" target="_blank" rel="noopener noreferrer" data-link-role="contact-channel" data-analytics-event="contact_click">打开微信联系小玉</a>
          </div>
        </section>

        <section class="commerce-channel-card" aria-labelledby="commerce-ktt-title">
          <div class="commerce-qr-frame">
            <img src="/contact/ktt-giga-card.png" alt="快团团 giffgaff 手机卡下单与支付二维码" width="720" height="540" loading="lazy" decoding="async">
          </div>
          <div>
            <h3 id="commerce-ktt-title">快团团下单与支付</h3>
            <p>前往联系页查看快团团入口。当前未提供可核验的 G0/G2 直达 SKU 和真实交易证据；不得仅凭二维码或口头说明判断可购买。</p>
            <a class="commerce-action" href="/contact/#ktt-giga-card" data-analytics-event="commerce_click">查看快团团小程序码</a>
          </div>
        </section>
      </div>

      <p class="commerce-privacy-note">本弹窗不收集手机号、账户、订单号或支付信息。本站不会要求或接收密码、短信验证码、Cookie 或完整支付卡信息。<a href="/privacy/">隐私说明状态</a> · <a href="/terms/">交易条款状态</a> · <a href="/refund/">退款说明状态</a> · <a href="/shipping/">物流说明状态</a></p>
    </div>
  </dialog>
  <script type="module" src="/growth-assets/commerce-ui.js"></script>
  <script type="module" src="/growth-assets/analytics.js"></script>
</aside>`;
}
