import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WIDGET = path.join(ROOT, "site", "growth", "commerce-widget.js");
const CLIENT = path.join(ROOT, "site", "growth", "assets", "commerce-ui.js");
const STYLES = path.join(ROOT, "site", "growth", "assets", "growth.css");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("commerce widget is one additive, accessible British SIM consultation guide", async () => {
  const { renderCommerceWidget } = await import(
    `${pathToFileURL(WIDGET).href}?test=${Date.now()}`
  );
  const html = renderCommerceWidget();

  assert.equal(
    (html.match(/data-growth-slot=["']wechat-buying-guide-v1["']/g) || []).length,
    1,
  );
  assert.match(html, /class="commerce-wechat-fab"/);
  assert.match(html, /href="#wechat-buying-guide-dialog"/);
  assert.match(html, /aria-haspopup="dialog"/);
  assert.match(
    html,
    /<dialog\b[^>]*id="wechat-buying-guide-dialog"[^>]*aria-labelledby="wechat-buying-guide-title"[^>]*aria-describedby="wechat-buying-guide-description"/,
  );
  assert.doesNotMatch(html, /<dialog\b[^>]*aria-modal=/i);
  assert.match(html, /<h2 id="wechat-buying-guide-title">\s*英国卡咨询指南\s*<\/h2>/);
  const description = html.match(/<p id="wechat-buying-guide-description">([\s\S]*?)<\/p>/i);
  assert.ok(description, "visible commerce boundary disclosure");
  assert.match(description[1], /独立第三方/);
  assert.match(description[1], /不代表 giffgaff 官方/);
  assert.match(description[1], /G0 \/ G2 是本站库存分类/);
  assert.match(description[1], /不保证实时库存/);
  assert.match(description[1], /支付成功/);
  assert.match(description[1], /OTP 验证码送达/);
  assert.match(description[1], /付款前请联系客服核对当前库存、价格、卡片来源与激活状态/);
  assert.match(description[1], /无法核对关键事项时不要付款/);
  assert.match(html, /微信客服（显示名[“"]胡小胡[”"]）/);
  assert.doesNotMatch(html, /客服小玉|微信小玉|联系小玉/);
  assert.match(html, /Telegram @xiaoyuhuai/);
  assert.doesNotMatch(
    html,
    /资料未补齐前请勿付款|未齐时请勿付款|不得仅凭二维码或口头说明判断可购买/,
  );
  assert.match(html, /自定义漏斗数据集不记录 Cookie/);
  assert.doesNotMatch(html, /不会要求或接收[^。]*Cookie/);
  assert.match(html, /data-commerce-close/);
  assert.match(html, /aria-label="关闭英国卡咨询指南"/);
  assert.doesNotMatch(html, /<dialog\b[^>]*aria-hidden=/i);
  assert.doesNotMatch(html, /<form\b|<input\b|<textarea\b|<select\b/i);
});

test("commerce widget connects G0, G2, WeChat, Telegram, tutorial and KTT QR paths", async () => {
  const { renderCommerceWidget } = await import(
    `${pathToFileURL(WIDGET).href}?links=${Date.now()}`
  );
  const html = renderCommerceWidget();

  for (const href of [
    "/shop/giffgaff-g0/",
    "/shop/giffgaff-g2/",
    "/guides/1-order/",
    "/contact/#ktt-giga-card",
    "https://u.wechat.com/MOlSxFZ7nu5enWrw4HtvKC4",
    "https://t.me/xiaoyuhuai",
  ]) {
    assert.ok(html.includes(`href="${href}"`), `missing ${href}`);
  }
  assert.match(html, />G0 新卡</);
  assert.match(html, />G2 有余额卡</);
  assert.match(html, /快团团小程序码/);
  assert.match(html, /本站没有可核验的商品直达链接/);
  assert.doesNotMatch(html, /托管支付入口|href="https:\/\/getgiffgaff\.com\/pay\/"/);
  assert.doesNotMatch(html, /https:\/\/u\.wechat\.com\/EDGrPuicwOsumDF_m3vVpEI\?s=3/);
  assert.match(
    html,
    /<img\b[^>]*src="\/contact\/wechat-qr\.jpg"[^>]*alt="微信显示名胡小胡的客服二维码"/,
  );
  assert.match(
    html,
    /<img\b[^>]*src="\/contact\/telegram-qr\.jpg"[^>]*alt="Telegram 客服 xiaoyuhuai 二维码"/,
  );
  assert.match(
    html,
    /<img\b[^>]*src="\/contact\/ktt-giga-card\.png"[^>]*alt="快团团 giffgaff 手机卡小程序码"[^>]*width="720"[^>]*height="540"/,
  );
  assert.match(
    html,
    /<script type="module" src="\/growth-assets\/commerce-ui\.js"><\/script>\s*<script type="module" src="\/growth-assets\/analytics\.js"><\/script>\s*<\/aside>\s*$/,
  );
  const analyticsEvents = [
    ...html.matchAll(/data-analytics-event="([^"]+)"/g),
  ].map((match) => match[1]);
  assert.ok(analyticsEvents.length >= 6);
  assert.deepEqual(
    [...new Set(analyticsEvents)].sort(),
    ["commerce_click", "contact_click", "shop_click"],
  );

  for (const [channel, href] of [
    ["wechat", "https://u.wechat.com/MOlSxFZ7nu5enWrw4HtvKC4"],
    ["telegram", "https://t.me/xiaoyuhuai"],
  ]) {
    assert.match(
      html,
      new RegExp(
        `<a\\b(?=[^>]*\\bhref="${escapeRegExp(href)}")(?=[^>]*\\bdata-analytics-event="contact_click")(?=[^>]*\\bdata-analytics-channel="${channel}")[^>]*>`,
      ),
      `${channel} contact button must expose an anonymous channel dimension`,
    );
  }
  assert.doesNotMatch(
    html,
    /<a\b(?=[^>]*\bdata-commerce-open)(?=[^>]*\bdata-analytics-event="contact_click")[^>]*>/,
    "opening the guide is not yet a contact-channel click",
  );
  assert.match(html, /若未唤起或跳到微信官网，请使用微信[“"]扫一扫[”"]扫描二维码/);
  assert.match(html, /手机可直接打开，电脑可扫码/);
});

test("commerce UI cycles focus and implements modal open, close and hash fallback safely", async () => {
  const source = await readFile(CLIENT, "utf8");
  const { nextFocusableIndex } = await import(
    `${pathToFileURL(CLIENT).href}?test=${Date.now()}`
  );

  assert.equal(nextFocusableIndex(-1, 3, false), 0);
  assert.equal(nextFocusableIndex(-1, 3, true), 2);
  assert.equal(nextFocusableIndex(2, 3, false), 0);
  assert.equal(nextFocusableIndex(0, 3, true), 2);
  assert.equal(nextFocusableIndex(0, 0, false), -1);

  assert.match(source, /showModal\s*\(/);
  assert.match(source, /\.close\s*\(/);
  assert.match(source, /key\s*===\s*["']Escape["']/);
  assert.match(source, /key\s*!==\s*["']Tab["']/);
  assert.match(source, /addEventListener\(["']cancel["']/);
  assert.match(source, /addEventListener\(["']hashchange["']/);
  assert.match(source, /previousFocus/);
  assert.match(source, /\.focus\s*\(/);
  assert.doesNotMatch(
    source,
    /\bfetch\s*\(|sendBeacon|document\.cookie|localStorage|sessionStorage|FormData|URLSearchParams/i,
  );
});

test("commerce UI opens, traps focus, closes on Escape/cancel and restores the opener", async () => {
  const { initCommerceWidget } = await import(
    `${pathToFileURL(CLIENT).href}?behavior=${Date.now()}`
  );

  class FakeElement {
    constructor() {
      this.attributes = new Map();
      this.dataset = {};
      this.listeners = new Map();
      this.tabIndex = 0;
      this.isConnected = true;
      this.open = false;
    }

    addEventListener(type, callback) {
      const callbacks = this.listeners.get(type) || [];
      callbacks.push(callback);
      this.listeners.set(type, callbacks);
    }

    dispatch(type, event = {}) {
      const value = {
        target: this,
        preventDefault() {
          this.defaultPrevented = true;
        },
        ...event,
      };
      for (const callback of this.listeners.get(type) || []) callback(value);
      return value;
    }

    setAttribute(name, value) {
      this.attributes.set(name, String(value));
      if (name === "open") this.open = true;
    }

    removeAttribute(name) {
      this.attributes.delete(name);
      if (name === "open") this.open = false;
    }

    hasAttribute(name) {
      return this.attributes.has(name);
    }

    getAttribute(name) {
      return this.attributes.get(name) ?? null;
    }

    focus() {
      globalThis.document.activeElement = this;
    }
  }

  const opener = new FakeElement();
  const closer = new FakeElement();
  const choice = new FakeElement();
  const dialog = new FakeElement();
  dialog.id = "wechat-buying-guide-dialog";
  dialog.showModal = () => {
    dialog.open = true;
  };
  dialog.close = () => {
    dialog.open = false;
  };
  dialog.querySelectorAll = () => [closer, choice];

  const slot = new FakeElement();
  slot.querySelector = (selector) =>
    selector === ".commerce-guide-dialog" ? dialog : null;
  slot.querySelectorAll = (selector) =>
    selector === "[data-commerce-open]" ? [opener] : [closer];

  const windowListeners = new Map();
  const originalGlobals = {
    document: globalThis.document,
    window: globalThis.window,
    location: globalThis.location,
    history: globalThis.history,
  };
  globalThis.document = { activeElement: opener };
  globalThis.location = { hash: "", pathname: "/guides/", search: "" };
  globalThis.history = {
    replaceState() {
      globalThis.location.hash = "";
    },
  };
  globalThis.window = {
    addEventListener(type, callback) {
      windowListeners.set(type, callback);
    },
  };

  try {
    const controller = initCommerceWidget(slot);
    assert.ok(controller);
    assert.equal(dialog.getAttribute("aria-hidden"), "true");

    const openEvent = opener.dispatch("click");
    assert.equal(openEvent.defaultPrevented, true);
    assert.equal(dialog.open, true);
    assert.equal(dialog.hasAttribute("aria-hidden"), false);
    assert.equal(dialog.getAttribute("aria-modal"), "true");
    assert.equal(globalThis.document.activeElement, closer);

    dialog.dispatch("keydown", { key: "Tab", shiftKey: false });
    assert.equal(globalThis.document.activeElement, choice);
    dialog.dispatch("keydown", { key: "Tab", shiftKey: false });
    assert.equal(globalThis.document.activeElement, closer);
    dialog.dispatch("keydown", { key: "Tab", shiftKey: true });
    assert.equal(globalThis.document.activeElement, choice);

    const escapeEvent = dialog.dispatch("keydown", { key: "Escape" });
    assert.equal(escapeEvent.defaultPrevented, true);
    assert.equal(dialog.open, false);
    assert.equal(dialog.getAttribute("aria-hidden"), "true");
    assert.equal(dialog.getAttribute("aria-modal"), null);
    assert.equal(globalThis.document.activeElement, opener);

    opener.dispatch("click");
    const cancelEvent = dialog.dispatch("cancel");
    assert.equal(cancelEvent.defaultPrevented, true);
    assert.equal(dialog.open, false);
    assert.equal(globalThis.document.activeElement, opener);

    globalThis.location.hash = "#wechat-buying-guide-dialog";
    windowListeners.get("hashchange")();
    assert.equal(dialog.open, true);
    globalThis.location.hash = "#another-section";
    windowListeners.get("hashchange")();
    assert.equal(dialog.open, false);
  } finally {
    for (const [name, value] of Object.entries(originalGlobals)) {
      if (value === undefined) delete globalThis[name];
      else globalThis[name] = value;
    }
  }
});

test("commerce styles support no-JavaScript :target and visible focus without altering legacy selectors", async () => {
  const css = await readFile(STYLES, "utf8");

  assert.match(css, /\.commerce-guide-dialog:target\s*\{/);
  assert.match(css, /\.commerce-wechat-fab:focus-visible/);
  assert.match(css, /\.commerce-action--telegram\s*\{/);
  assert.match(css, /\.commerce-guide-dialog::backdrop/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(css, /(?:^|\n)\s*(?:body|html|\.site-header|\.brand|\.shop-floating-contact)\s*\{/);
});
