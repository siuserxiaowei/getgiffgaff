import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { PNG } = require("pngjs");

const ORIGIN = "https://getgiffgaff.com";
const LEGACY_ROUTES = Object.freeze([
  ["home", "/", "h1"],
  ["guides", "/guides/", "h1"],
  ["order", "/guides/1-order/", "h1"],
  ["shop", "/shop/", 'a[href="/shop/giffgaff-g0/"]'],
  ["g0", "/shop/giffgaff-g0/", 'a[href="/contact/"]'],
  ["g2", "/shop/giffgaff-g2/", 'a[href="/contact/"]'],
  ["contact", "/contact/", "#ktt-giga-card"],
]);
const GROWTH_ROUTES = Object.freeze([
  ["arrival-checklist", "/guides/7-arrival-checklist/"],
  ["uk-sim-choice", "/guides/8-uk-sim-choice/"],
  ["keep-number-reminder", "/tools/keep-number-reminder/"],
  ["china-roaming-cost", "/tools/china-roaming-cost/"],
  ["g0-g2-total-cost", "/tools/g0-g2-total-cost/"],
]);
const VIEWPORTS = Object.freeze({
  desktop: { width: 1440, height: 1200, isMobile: false },
  mobile: { width: 390, height: 844, isMobile: true },
});
const DEFAULT_GLOBAL_TIMEOUT_MS = 30 * 60_000;
const DEFAULT_OPERATION_TIMEOUT_MS = 40_000;
const STABLE_VISUAL_CSS = `
  * { animation: none !important; transition: none !important; caret-color: transparent !important; }
  html { scrollbar-width: none !important; }
  html::-webkit-scrollbar { display: none !important; }
`;
const HIDDEN_LEGACY_GROWTH_CSS = `
  [data-growth-slot="related-tutorials-v1"],
  [data-growth-slot="wechat-buying-guide-v1"] { display: none !important; }
`;

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function progress(message) {
  if (process.env.BROWSER_VERIFY_PROGRESS !== "0") {
    process.stderr.write(`[browser-verify] ${new Date().toISOString()} ${message}\n`);
  }
}

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function createRunClock() {
  const timeoutMs = positiveInteger(
    process.env.BROWSER_VERIFY_TIMEOUT_MS,
    DEFAULT_GLOBAL_TIMEOUT_MS,
  );
  return {
    startedAt: Date.now(),
    deadline: Date.now() + timeoutMs,
    timeoutMs,
    current: "starting",
  };
}

async function bounded(clock, label, operation, timeoutMs = DEFAULT_OPERATION_TIMEOUT_MS) {
  const remaining = clock.deadline - Date.now();
  if (remaining <= 0) {
    throw new Error(`Browser verification exceeded global timeout (${clock.timeoutMs}ms) at ${label}`);
  }
  const effectiveTimeout = Math.min(
    remaining,
    positiveInteger(process.env.BROWSER_VERIFY_OPERATION_TIMEOUT_MS, timeoutMs),
  );
  clock.current = label;
  if (process.env.BROWSER_VERIFY_PROGRESS === "2") progress(`${label} start`);
  let timer;
  try {
    const result = await Promise.race([
      Promise.resolve().then(operation),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${effectiveTimeout}ms`)),
          effectiveTimeout,
        );
      }),
    ]);
    if (process.env.BROWSER_VERIFY_PROGRESS === "2") progress(`${label} done`);
    return result;
  } finally {
    clearTimeout(timer);
  }
}

function selectedEntries(entries, environmentName) {
  const requested = (process.env[environmentName] || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (!requested.length) return entries;
  const selected = entries.filter(([name]) => requested.includes(name));
  const missing = requested.filter((name) => !entries.some(([entry]) => entry === name));
  assert.deepEqual(missing, [], `${environmentName} contains unknown names: ${missing.join(", ")}`);
  return selected;
}

function metric(name, first, second) {
  if (name === "SSIM") {
    let lastResult;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      lastResult = spawnSync(
        "ffmpeg",
        [
          "-hide_banner",
          "-nostdin",
          "-i",
          first,
          "-i",
          second,
          "-lavfi",
          "ssim",
          "-f",
          "null",
          "-",
        ],
        { encoding: "utf8", timeout: 60_000 },
      );
      const raw = `${lastResult.stderr || ""}${lastResult.stdout || ""}`;
      const match = raw.match(/\bAll:([0-9]+(?:\.[0-9]+)?)/);
      if (lastResult.status === 0 && match) {
        return Number(match[1]);
      }
    }

    const details = [
      `status=${lastResult?.status ?? "null"}`,
      `signal=${lastResult?.signal ?? "none"}`,
      `error=${lastResult?.error?.message || "none"}`,
      `stdout=${JSON.stringify(lastResult?.stdout || "")}`,
      `stderr=${JSON.stringify(lastResult?.stderr || "")}`,
    ].join(", ");
    throw new Error(`FFmpeg SSIM produced no parseable All score after 2 attempts (${details})`);
  }

  if (name === "AE") {
    const firstPng = PNG.sync.read(readFileSync(first));
    const secondPng = PNG.sync.read(readFileSync(second));
    assert.equal(secondPng.width, firstPng.width, "visual comparison width mismatch");
    assert.equal(secondPng.height, firstPng.height, "visual comparison height mismatch");
    let changedPixels = 0;
    for (let offset = 0; offset < firstPng.data.length; offset += 4) {
      if (
        firstPng.data[offset] !== secondPng.data[offset]
        || firstPng.data[offset + 1] !== secondPng.data[offset + 1]
        || firstPng.data[offset + 2] !== secondPng.data[offset + 2]
        || firstPng.data[offset + 3] !== secondPng.data[offset + 3]
      ) {
        changedPixels += 1;
      }
    }
    return changedPixels;
  }

  throw new Error(`Unsupported visual metric: ${name}`);
}

function attachDiagnostics(page, label, errors) {
  page.on("pageerror", (error) => errors.push(`${label()}: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`${label()}: ${message.text()}`);
  });
  page.on("requestfailed", (request) => {
    const reason = request.failure()?.errorText || "request failed";
    if (!reason.includes("ERR_ABORTED")) {
      errors.push(`${label()}: ${request.method()} ${request.url()} ${reason}`);
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      errors.push(`${label()}: ${response.status()} ${response.request().method()} ${response.url()}`);
    }
  });
}

async function applyControllerStyle(page, clock, { hideGrowth = false } = {}) {
  // CSS is installed through the DevTools protocol. This works when the page's
  // JavaScript execution is disabled and never waits for an injected script.
  const session = await bounded(
    clock,
    `${page.url()} attach CDP style session`,
    () => page.context().newCDPSession(page),
  );
  try {
    await bounded(clock, `${page.url()} enable CDP CSS`, async () => {
      await session.send("DOM.enable");
      await session.send("CSS.enable");
    });
    const { frameTree } = await bounded(
      clock,
      `${page.url()} get main frame`,
      () => session.send("Page.getFrameTree"),
    );
    const { styleSheetId } = await bounded(
      clock,
      `${page.url()} create inspector stylesheet`,
      () => session.send("CSS.createStyleSheet", { frameId: frameTree.frame.id }),
    );
    await bounded(
      clock,
      `${page.url()} set inspector stylesheet`,
      () => session.send("CSS.setStyleSheetText", {
        styleSheetId,
        text: `${STABLE_VISUAL_CSS}${hideGrowth ? HIDDEN_LEGACY_GROWTH_CSS : ""}`,
      }),
    );
  } finally {
    await session.detach().catch(() => {});
  }
}

async function applyPageStyle(page, clock, { hideGrowth = false } = {}) {
  await bounded(
    clock,
    `${page.url()} add stable page stylesheet`,
    () => page.addStyleTag({
      content: `${STABLE_VISUAL_CSS}${hideGrowth ? HIDDEN_LEGACY_GROWTH_CSS : ""}`,
    }),
  );
}

async function settlePage(page, clock, options = {}) {
  // Legacy screenshots disable document JavaScript, so their stylesheet is
  // installed through CDP. Interactive growth pages can use a normal style tag
  // and avoid exhausting a long-lived sequence of CDP CSS sessions.
  await bounded(clock, `${page.url()} load state`, async () => {
    await page.waitForLoadState("load", { timeout: 5000 }).catch(() => {});
    await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
  }, 10_000);
  if (options.pageJavaScript === false) {
    await applyControllerStyle(page, clock, options);
  } else {
    await applyPageStyle(page, clock, options);
  }
  await delay(200);
}

async function inspectPage(page, selector) {
  const viewport = page.viewportSize();
  const [bodyText, keyElements, overlays, bodyBox] = await Promise.all([
    page.locator("body").innerText(),
    page.locator(selector).count(),
    page.locator(
      "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay",
    ).count(),
    page.locator("body").boundingBox(),
  ]);
  return {
    content: bodyText.trim().length,
    keyElement: keyElements > 0,
    overlay: overlays > 0,
    width: viewport.width,
    height: viewport.height,
    horizontalOverflow: Math.max(0, Math.round((bodyBox?.width || viewport.width) - viewport.width)),
  };
}

function approximateTextLength(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|template|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:#\d+|#x[\da-f]+|[a-z]+);/gi, " ")
    .replace(/\s+/g, " ")
    .trim().length;
}

async function inspectPageWithoutPageJavaScript(
  page,
  selector,
  viewport,
  clock,
  { hideGrowth = false } = {},
) {
  const session = await bounded(
    clock,
    `${page.url()} attach CDP inspection session`,
    () => page.context().newCDPSession(page),
  );
  try {
    await bounded(clock, `${page.url()} enable CDP DOM`, async () => {
      await session.send("DOM.enable");
      if (hideGrowth) await session.send("CSS.enable");
    });
    const { root } = await bounded(
      clock,
      `${page.url()} read DOM document`,
      () => session.send("DOM.getDocument", { depth: -1, pierce: true }),
    );
    const query = async (querySelector) => {
      const { nodeId } = await session.send("DOM.querySelector", {
        nodeId: root.nodeId,
        selector: querySelector,
      });
      return nodeId;
    };
    const queryAll = async (querySelector) => {
      const { nodeIds } = await session.send("DOM.querySelectorAll", {
        nodeId: root.nodeId,
        selector: querySelector,
      });
      return nodeIds;
    };
    const [bodyNodeId, keyNodeId, overlayNodeId, growthNodeIds] = await bounded(
      clock,
      `${page.url()} query DOM`,
      () => Promise.all([
        query("body"),
        query(selector),
        query("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay"),
        hideGrowth
          ? queryAll('[data-growth-slot="related-tutorials-v1"], [data-growth-slot="wechat-buying-guide-v1"]')
          : [],
      ]),
    );
    assert.ok(bodyNodeId, `${page.url()} missing body`);
    const [{ outerHTML }, { model }] = await bounded(
      clock,
      `${page.url()} inspect body DOM`,
      () => Promise.all([
        session.send("DOM.getOuterHTML", { nodeId: bodyNodeId }),
        session.send("DOM.getBoxModel", { nodeId: bodyNodeId }),
      ]),
    );
    if (growthNodeIds.length) {
      const styles = await bounded(
        clock,
        `${page.url()} read hidden growth styles`,
        () => Promise.all(growthNodeIds.map((nodeId) => (
          session.send("CSS.getComputedStyleForNode", { nodeId })
        ))),
      );
      for (const style of styles) {
        const properties = style.computedStyle || style;
        assert.equal(
          properties.find(({ name }) => name === "display")?.value,
          "none",
          `${page.url()} authorized growth slot was not hidden for legacy visual comparison`,
        );
      }
    }
    return {
      content: approximateTextLength(outerHTML),
      keyElement: keyNodeId > 0,
      overlay: overlayNodeId > 0,
      width: viewport.width,
      height: viewport.height,
      horizontalOverflow: Math.max(0, Math.round(model.width - viewport.width)),
    };
  } finally {
    await session.detach().catch(() => {});
  }
}

async function openPage(page, url, selector, viewport, options = {}) {
  const { clock, pageJavaScript = true } = options;
  assert.ok(clock, "openPage requires a run clock");
  await bounded(
    clock,
    `${url} navigation`,
    () => page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 }),
    35_000,
  );
  await settlePage(page, clock, options);
  const state = pageJavaScript
    ? await bounded(clock, `${url} inspect`, () => inspectPage(page, selector))
    : await inspectPageWithoutPageJavaScript(page, selector, viewport, clock, options);
  assert.ok(state.content > 100, `${url} blank page`);
  assert.equal(state.keyElement, true, `${url} missing ${selector}`);
  assert.equal(state.overlay, false, `${url} error overlay`);
  assert.equal(state.width, viewport.width, `${url} width`);
  assert.equal(state.height, viewport.height, `${url} height`);
  assert.ok(state.horizontalOverflow <= 1, `${url} horizontal overflow ${state.horizontalOverflow}`);
  progress(`${url} ready (${pageJavaScript ? "JavaScript" : "no JavaScript"})`);
  return state;
}

async function waitForImageLoad(page, selector, clock, label) {
  await bounded(
    clock,
    `${label} wait for ${selector}`,
    () => page.waitForFunction(
      (imageSelector) => {
        const image = document.querySelector(imageSelector);
        return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0;
      },
      selector,
      { timeout: DEFAULT_OPERATION_TIMEOUT_MS },
    ),
  );
}

async function verifyInteractions(browser, localOrigin, contextOptions, clock) {
  const context = await browser.newContext(contextOptions);
  await context.route("**/analytics-event-v1", (route) =>
    route.fulfill({ status: 204, body: "" }),
  );
  const page = await context.newPage();
  const errors = [];
  let label = "local/interactions";
  attachDiagnostics(page, () => label, errors);
  try {
    const viewport = VIEWPORTS.desktop;
    await openPage(page, `${localOrigin}/contact/`, "#ktt-giga-card", viewport, { clock });
    const trigger = page.locator('a[href="#ktt-giga-card"]').first();
    await trigger.click();
    await page.waitForFunction(() => document.querySelector("#ktt-giga-card")?.getAttribute("aria-hidden") === "false");
    await waitForImageLoad(page, "#ktt-giga-card img", clock, label);
    const opened = await page.evaluate(() => ({
      hash: location.hash,
      focused: document.activeElement?.className || "",
      qrLoaded: document.querySelector("#ktt-giga-card img")?.naturalWidth > 0,
    }));
    assert.equal(opened.hash, "#ktt-giga-card");
    assert.match(opened.focused, /ktt-modal-panel/);
    assert.equal(opened.qrLoaded, true);

    await page.locator(".ktt-modal-close").click();
    await page.waitForFunction(() => {
      const modal = document.querySelector("#ktt-giga-card");
      return location.hash === ""
        && modal?.getAttribute("aria-hidden") === "true"
        && getComputedStyle(modal).display === "none";
    });
    assert.equal(await trigger.evaluate((element) => document.activeElement === element), true);

    await trigger.click();
    await page.waitForFunction(() =>
      document.querySelector("#ktt-giga-card")?.getAttribute("aria-hidden") === "false",
    );
    await page.locator(".ktt-modal-backdrop").click({ position: { x: 8, y: 8 } });
    await page.waitForFunction(() => {
      const modal = document.querySelector("#ktt-giga-card");
      return location.hash === "" && getComputedStyle(modal).display === "none";
    });
    assert.equal(await trigger.evaluate((element) => document.activeElement === element), true);

    await trigger.click();
    await page.waitForFunction(() =>
      document.querySelector("#ktt-giga-card")?.getAttribute("aria-hidden") === "false",
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => {
      const modal = document.querySelector("#ktt-giga-card");
      return location.hash === "" && getComputedStyle(modal).display === "none";
    });
    assert.equal(await trigger.evaluate((element) => document.activeElement === element), true);
    assert.equal(
      await page.locator('img[alt="微信咨询二维码"]').evaluate((image) => image.naturalWidth > 0),
      true,
    );
    const contactText = await page.locator("body").innerText();
    for (const required of ["胡小胡", "微信咨询", "查看 G0 小程序码", "查看 G2 小程序码", "快团团小程序码"]) {
      assert.match(contactText, new RegExp(required));
    }

    label = "local/interactions/sitewide-commerce-guide";
    await openPage(page, `${localOrigin}/`, "h1", viewport, { clock });
    const commerceTrigger = page.locator(".commerce-wechat-fab");
    assert.equal(await commerceTrigger.isVisible(), true);
    await commerceTrigger.click();
    const commerceDialog = page.locator("#wechat-buying-guide-dialog");
    await page.waitForFunction(() => {
      const dialog = document.querySelector("#wechat-buying-guide-dialog");
      return dialog?.open && dialog.getAttribute("aria-hidden") !== "true";
    });
    await Promise.all([
      waitForImageLoad(
        page,
        '#wechat-buying-guide-dialog img[src="/contact/wechat-qr.jpg"]',
        clock,
        label,
      ),
      waitForImageLoad(
        page,
        '#wechat-buying-guide-dialog img[src="/contact/telegram-qr.jpg"]',
        clock,
        label,
      ),
      waitForImageLoad(
        page,
        '#wechat-buying-guide-dialog img[src="/contact/ktt-giga-card.png"]',
        clock,
        label,
      ),
    ]);
    assert.equal(
      await commerceDialog.locator("h2").innerText(),
      "英国卡咨询指南",
    );
    assert.equal(
      await commerceDialog.locator('img[src="/contact/wechat-qr.jpg"]').evaluate(
        (image) => image.naturalWidth > 0,
      ),
      true,
    );
    assert.equal(
      await commerceDialog.locator('img[src="/contact/telegram-qr.jpg"]').evaluate(
        (image) => image.naturalWidth > 0,
      ),
      true,
    );
    assert.equal(
      await commerceDialog.locator('img[src="/contact/ktt-giga-card.png"]').evaluate(
        (image) => image.naturalWidth > 0,
      ),
      true,
    );
    for (const href of [
      "/shop/giffgaff-g0/",
      "/shop/giffgaff-g2/",
      "/guides/1-order/",
      "/contact/#ktt-giga-card",
      "https://u.wechat.com/MOlSxFZ7nu5enWrw4HtvKC4",
      "https://t.me/xiaoyuhuai",
    ]) {
      assert.equal(
        await commerceDialog.locator(`a[href="${href}"]`).count(),
        1,
        `commerce guide missing ${href}`,
      );
    }
    assert.equal(
      await commerceDialog.locator("form, input, textarea, select").count(),
      0,
    );
    assert.equal(
      await commerceDialog.evaluate((dialog) => dialog.contains(document.activeElement)),
      true,
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector("#wechat-buying-guide-dialog")?.open);
    assert.equal(
      await commerceTrigger.evaluate((element) => document.activeElement === element),
      true,
    );
    await commerceTrigger.click();
    const kttPaymentLink = commerceDialog.locator(
      'a[href="/contact/#ktt-giga-card"]',
    );
    await Promise.all([
      page.waitForURL(`${localOrigin}/contact/#ktt-giga-card`),
      kttPaymentLink.click(),
    ]);
    await page.waitForFunction(() =>
      document.querySelector("#ktt-giga-card")?.getAttribute("aria-hidden") === "false",
    );
    assert.equal(page.url(), `${localOrigin}/contact/#ktt-giga-card`);
    await waitForImageLoad(page, "#ktt-giga-card img", clock, label);
    assert.equal(
      await page.locator("#ktt-giga-card img").evaluate((image) => image.naturalWidth > 0),
      true,
    );
    await page.locator(".ktt-modal-close").click();
    await page.waitForFunction(() => {
      const modal = document.querySelector("#ktt-giga-card");
      return location.hash === ""
        && modal?.getAttribute("aria-hidden") === "true"
        && getComputedStyle(modal).display === "none";
    });

    label = "local/interactions/total-cost";
    await openPage(
      page,
      `${localOrigin}/tools/g0-g2-total-cost/`,
      '[data-tool="total-cost"]',
      viewport,
      { clock },
    );
    await page.locator('[name="card"]').fill("20");
    await page.locator('[name="balance"]').fill("10");
    await page.locator('[name="shipping"]').fill("8");
    await page.locator('[name="topup"]').fill("10");
    await page.locator('[name="usage"]').fill("6");
    await page.locator('[data-tool="total-cost"] [data-calculate]').click();
    assert.match(await page.locator('[data-tool="total-cost"] output').innerText(), /44\.00/);
    await page.locator('[name="card"]').fill("");
    await page.locator('[data-tool="total-cost"] [data-calculate]').click();
    assert.match(await page.locator('[data-tool="total-cost"] output').innerText(), /完整填写|输入无效/);

    label = "local/interactions/keep-number";
    await openPage(
      page,
      `${localOrigin}/tools/keep-number-reminder/`,
      '[data-tool="keep-number"]',
      viewport,
      { clock },
    );
    await page.locator('[name="last-action"]').fill("2026-07-16");
    await page.locator('[data-tool="keep-number"] [data-calculate]').click({ force: true });
    assert.match(await page.locator('[data-tool="keep-number"] output').innerText(), /2026-12-16/);
    const downloadPromise = page.waitForEvent("download");
    await page.locator("[data-download-ics]").click();
    const download = await downloadPromise;
    assert.match(download.suggestedFilename(), /\.ics$/);

    label = "local/interactions/roaming-expiry";
    await openPage(
      page,
      `${localOrigin}/tools/china-roaming-cost/`,
      '[data-tool="roaming-cost"]',
      viewport,
      { clock },
    );
    await page.locator('[name="megabytes"]').fill("10");
    await page.locator('[name="sms"]').fill("1");
    await page.locator('[name="outgoing-minutes"]').fill("0.1");
    await page.locator('[name="incoming-minutes"]').fill("1.1");
    await page.locator('[data-tool="roaming-cost"] [data-calculate]').click();
    const roamingOutput = await page.locator('[data-tool="roaming-cost"] output').innerText();
    assert.match(roamingOutput, /£4\.80/);
    assert.match(roamingOutput, /30 秒/);
    assert.match(roamingOutput, /2 个整分钟/);
    assert.match(roamingOutput, /不含 Travel Data Add-on/);
    await page.locator('[data-tool="roaming-cost"]').evaluate((root) => {
      root.dataset.expires = "2000-01-01";
    });
    await page.locator('[data-tool="roaming-cost"] [data-calculate]').click();
    assert.match(await page.locator('[data-tool="roaming-cost"] output').innerText(), /过期|停止/);

    assert.deepEqual(errors, [], `Browser interaction errors:\n${errors.join("\n")}`);
    return { checks: 34, errors: errors.length };
  } finally {
    await context.close();
  }
}

export async function runBrowserVerification({
  localOrigin = "http://127.0.0.1:4173",
  outputRoot = "/tmp/getgiffgaff-visual-20260716",
  proxyServer = process.env.BROWSER_PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY || "",
} = {}) {
  const clock = createRunClock();
  const launchOptions = { headless: true };
  const browserChannel = (process.env.BROWSER_VERIFY_CHANNEL || "").trim();
  const executablePath = (process.env.BROWSER_VERIFY_EXECUTABLE_PATH || "").trim();
  if (browserChannel) launchOptions.channel = browserChannel;
  if (executablePath) launchOptions.executablePath = executablePath;
  if (proxyServer) {
    launchOptions.proxy = { server: proxyServer, bypass: "127.0.0.1,localhost" };
  }
  const browser = await bounded(
    clock,
    "launch Chromium",
    () => chromium.launch({ ...launchOptions, timeout: 45_000 }),
    50_000,
  );
  progress("browser launched");
  const comparisons = [];
  const legacyErrors = [];
  const growthErrors = [];
  await bounded(clock, "create output directory", () => mkdir(outputRoot, { recursive: true }));

  const heartbeat = setInterval(() => {
    const elapsedSeconds = Math.round((Date.now() - clock.startedAt) / 1000);
    progress(`heartbeat ${elapsedSeconds}s; current=${clock.current}`);
  }, 15_000);
  heartbeat.unref();

  const contextBase = {
    ignoreHTTPSErrors: true,
    serviceWorkers: "block",
    extraHTTPHeaders: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  };
  const visualContextBase = { ...contextBase, javaScriptEnabled: false };
  const selectedLegacyRoutes = selectedEntries(LEGACY_ROUTES, "BROWSER_VERIFY_LEGACY_ROUTES");
  const selectedGrowthRoutes = selectedEntries(GROWTH_ROUTES, "BROWSER_VERIFY_GROWTH_ROUTES");
  const selectedViewports = selectedEntries(Object.entries(VIEWPORTS), "BROWSER_VERIFY_VIEWPORTS");
  const skipGrowth = process.env.BROWSER_VERIFY_SKIP_GROWTH === "1";
  const skipInteractions = process.env.BROWSER_VERIFY_SKIP_INTERACTIONS === "1";

  try {
    for (const [viewportName, viewport] of selectedViewports) {
      const contexts = {};
      const pages = {};
      const labels = { production: "", local: "" };
      const sourceErrors = { production: [], local: [] };
      for (const source of ["production", "local"]) {
        contexts[source] = await browser.newContext({
          ...visualContextBase,
          viewport: { width: viewport.width, height: viewport.height },
          screen: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: 1,
          isMobile: viewport.isMobile,
        });
        pages[source] = await contexts[source].newPage();
        attachDiagnostics(pages[source], () => labels[source], sourceErrors[source]);
      }

      try {
        for (const [slug, route, selector] of selectedLegacyRoutes) {
          const screenshots = {};
          for (const [source, base] of [["production", ORIGIN], ["local", localOrigin]]) {
            labels[source] = `${source}/${viewportName}/${slug}`;
            progress(`${labels[source]} open`);
            const start = sourceErrors[source].length;
            await openPage(
              pages[source],
              `${base}${route}`,
              selector,
              viewport,
              { clock, hideGrowth: true, pageJavaScript: false },
            );
            if (source === "local") legacyErrors.push(...sourceErrors[source].slice(start));
            const directory = path.join(outputRoot, source, viewportName);
            await mkdir(directory, { recursive: true });
            const filename = path.join(directory, `${slug}.png`);
            await bounded(
              clock,
              `${labels[source]} screenshot`,
              () => pages[source].screenshot({
                path: filename,
                fullPage: false,
                animations: "disabled",
              }),
            );
            screenshots[source] = filename;
          }

          const ssim = metric("SSIM", screenshots.production, screenshots.local);
          const changedPixels = metric("AE", screenshots.production, screenshots.local);
          const changedRatio = changedPixels / (viewport.width * viewport.height);
          comparisons.push({ viewport: viewportName, route, ssim, changedPixels, changedRatio });
        }
      } finally {
        await Promise.all(Object.values(contexts).map((context) => context.close()));
      }

      if (!skipGrowth) {
        const growthContext = await browser.newContext({
          ...contextBase,
          viewport: { width: viewport.width, height: viewport.height },
          screen: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: 1,
          isMobile: viewport.isMobile,
        });
        const growthPage = await growthContext.newPage();
        let growthLabel = "";
        attachDiagnostics(growthPage, () => growthLabel, growthErrors);
        try {
          for (const [slug, route] of selectedGrowthRoutes) {
            growthLabel = `local/${viewportName}/${slug}`;
            progress(`${growthLabel} open`);
            await openPage(growthPage, `${localOrigin}${route}`, "h1", viewport, { clock });
            const directory = path.join(outputRoot, "local-growth", viewportName);
            await bounded(
              clock,
              `${growthLabel} create screenshot directory`,
              () => mkdir(directory, { recursive: true }),
            );
            await bounded(
              clock,
              `${growthLabel} screenshot`,
              () => growthPage.screenshot({
                path: path.join(directory, `${slug}.png`),
                fullPage: false,
                animations: "disabled",
              }),
            );
          }
        } finally {
          await growthContext.close();
        }
      }
    }

    const interaction = skipInteractions
      ? { checks: 0, errors: 0 }
      : await bounded(
        clock,
        "interaction suite",
        () => verifyInteractions(browser, localOrigin, {
          ...contextBase,
          viewport: { width: VIEWPORTS.desktop.width, height: VIEWPORTS.desktop.height },
          screen: { width: VIEWPORTS.desktop.width, height: VIEWPORTS.desktop.height },
          deviceScaleFactor: 1,
        }, clock),
        180_000,
      );
    progress("interactions complete");
    const thresholdFailures = comparisons.filter(
      ({ ssim, changedRatio }) => ssim < 0.995 || changedRatio > 0.001,
    );
    const report = {
      engine: "playwright-chromium",
      viewports: Object.fromEntries(selectedViewports),
      comparedScreenshots: comparisons.length,
      growthScreenshots: skipGrowth ? 0 : selectedGrowthRoutes.length * selectedViewports.length,
      interactionChecks: interaction.checks,
      localConsoleErrors: legacyErrors.length + growthErrors.length + interaction.errors,
      thresholdFailures,
      comparisons,
    };
    await writeFile(path.join(outputRoot, "report.json"), `${JSON.stringify(report, null, 2)}\n`);

    assert.deepEqual(legacyErrors, [], `Legacy browser errors:\n${legacyErrors.join("\n")}`);
    assert.deepEqual(growthErrors, [], `Growth browser errors:\n${growthErrors.join("\n")}`);
    assert.deepEqual(
      thresholdFailures,
      [],
      `Visual threshold failures:\n${JSON.stringify(thresholdFailures, null, 2)}`,
    );
    return report;
  } finally {
    clearInterval(heartbeat);
    await browser.close().catch(() => {});
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const report = await runBrowserVerification({
    localOrigin: process.argv[2] || "http://127.0.0.1:4173",
    outputRoot: process.argv[3] || "/tmp/getgiffgaff-visual-20260716",
  });
  process.stdout.write(`${JSON.stringify(report)}\n`);
}
