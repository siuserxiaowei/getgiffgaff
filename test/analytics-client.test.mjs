import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "site", "growth", "assets", "analytics.js");

function replaceGlobal(name, value) {
  const original = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value,
  });
  return () => {
    if (original) Object.defineProperty(globalThis, name, original);
    else delete globalThis[name];
  };
}

function fakeBrowser({
  beaconResult = true,
  canonicalHref = "https://getgiffgaff.com/contact/?phone=13800000000",
  currentHref = "https://getgiffgaff.com/contact/?phone=13800000000",
  includeBeacon = true,
  referrer = "https://www.google.com/search?q=never-store-this",
  storedSource = null,
  visibilityState = "visible",
} = {}) {
  const listeners = new Map();
  const beacons = [];
  const fetches = [];
  const document = {
    referrer,
    visibilityState,
    querySelector(selector) {
      assert.equal(selector, 'link[rel="canonical"]');
      return canonicalHref === null ? null : { href: canonicalHref };
    },
    addEventListener(name, listener) {
      listeners.set(name, listener);
    },
  };
  const navigator = includeBeacon
    ? {
        sendBeacon(url, body) {
          beacons.push({ url, body });
          return beaconResult;
        },
      }
    : {};
  const fetch = (url, options) => {
    fetches.push({ url, options });
    return Promise.resolve(new Response(null, { status: 204 }));
  };
  const storage = new Map();
  if (storedSource !== null) {
    storage.set("getgiffgaff_attribution_source_v1", storedSource);
  }
  const sessionStorage = {
    getItem(key) {
      return storage.get(key) ?? null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    },
  };
  const restores = [
    replaceGlobal("document", document),
    replaceGlobal("navigator", navigator),
    replaceGlobal("location", {
      origin: "https://getgiffgaff.com",
      href: currentHref,
      pathname: "/contact/",
    }),
    replaceGlobal("sessionStorage", sessionStorage),
    replaceGlobal("fetch", fetch),
  ];

  return {
    beacons,
    fetches,
    listeners,
    storage,
    restore() {
      for (const restore of restores.reverse()) restore();
    },
  };
}

test("client analytics reduces referrers to a fixed category and emits an allowlisted payload", async () => {
  const source = await readFile(SCRIPT, "utf8");
  const analytics = await import(`${pathToFileURL(SCRIPT).href}?test=${Date.now()}`);

  assert.equal(analytics.sourceCategory("", "https://getgiffgaff.com"), "direct");
  assert.equal(analytics.sourceCategory("https://getgiffgaff.com/guides/?q=secret", "https://getgiffgaff.com"), "internal");
  assert.equal(analytics.sourceCategory("https://www.google.com/search?q=secret", "https://getgiffgaff.com"), "search");
  assert.equal(analytics.sourceCategory("https://www.baidu.com/s?wd=secret", "https://getgiffgaff.com"), "search");
  assert.equal(analytics.sourceCategory("https://www.perplexity.ai/search?q=secret", "https://getgiffgaff.com"), "ai");
  assert.equal(analytics.sourceCategory("https://gemini.google.com/app/secret", "https://getgiffgaff.com"), "ai");
  assert.equal(analytics.sourceCategory("https://www.bilibili.com/video/1", "https://getgiffgaff.com"), "social");
  assert.equal(analytics.sourceCategory("https://x.com/example/status/1", "https://getgiffgaff.com"), "social");
  assert.equal(analytics.sourceCategory("https://example.org/post?phone=13800000000", "https://getgiffgaff.com"), "referral");
  assert.equal(analytics.sourceCategory("not a url", "https://getgiffgaff.com"), "unknown");

  for (const sourceName of [
    "dist_partner",
    "dist_private_share",
    "dist_tinylaunch",
    "dist_uneed",
    "dist_wechat_group",
    "dist_wechat_official",
    "dist_xiaohongshu",
    "paid_google",
    "paid_microsoft",
  ]) {
    assert.equal(
      analytics.attributionSource(`https://getgiffgaff.com/?utm_source=${sourceName}`),
      sourceName,
    );
  }
  for (const unsafe of [
    "xiaohongshu",
    "DIST_PARTNER",
    "13800000000",
    "partner-name",
  ]) {
    assert.equal(
      analytics.attributionSource(`https://getgiffgaff.com/?utm_source=${unsafe}`),
      null,
    );
  }
  const attributionStorage = new Map();
  const storage = {
    getItem: (key) => attributionStorage.get(key) ?? null,
    setItem: (key, value) => attributionStorage.set(key, value),
  };
  assert.equal(
    analytics.sourceForPage(
      "https://www.google.com/search?q=secret",
      "https://getgiffgaff.com",
      "https://getgiffgaff.com/guides/?utm_source=dist_partner&utm_campaign=do-not-store",
      storage,
    ),
    "dist_partner",
  );
  assert.deepEqual([...attributionStorage.values()], ["dist_partner"]);
  assert.equal(
    analytics.sourceForPage("", "https://getgiffgaff.com", "https://getgiffgaff.com/contact/", storage),
    "dist_partner",
  );

  assert.deepEqual(
    analytics.analyticsPayload("/guides/7-arrival-checklist/", "internal", "commerce_click"),
    {
      version: "analytics_event_v1",
      path: "/guides/7-arrival-checklist/",
      source: "internal",
      event: "commerce_click",
    },
  );
  assert.deepEqual(
    analytics.analyticsPayload("/contact/", "internal", "contact_click", "wechat"),
    {
      version: "analytics_event_v1",
      path: "/contact/",
      source: "internal",
      event: "contact_click",
      channel: "wechat",
    },
  );
  assert.deepEqual(
    analytics.analyticsPayload("/contact/", "internal", "contact_click", "ktt"),
    {
      version: "analytics_event_v1",
      path: "/contact/",
      source: "internal",
      event: "contact_click",
    },
  );
  assert.deepEqual(
    analytics.analyticsPayload("/contact/", "internal", "contact_click", "13800000000"),
    {
      version: "analytics_event_v1",
      path: "/contact/",
      source: "internal",
      event: "contact_click",
    },
  );
  assert.deepEqual(
    analytics.analyticsPayload("/shop/", "internal", "commerce_click", "telegram"),
    {
      version: "analytics_event_v1",
      path: "/shop/",
      source: "internal",
      event: "commerce_click",
    },
  );
  assert.deepEqual(
    analytics.analyticsPayload(
      "/guides/6-pitfalls/",
      "internal",
      "commerce_click",
      undefined,
      "before-purchase",
    ),
    {
      version: "analytics_event_v1",
      path: "/guides/6-pitfalls/",
      source: "internal",
      event: "commerce_click",
      intent: "before-purchase",
    },
  );
  for (const [event, intent] of [
    ["commerce_click", "BEFORE-PURCHASE"],
    ["commerce_click", "private DOM text"],
    ["page_view", "before-purchase"],
    ["contact_click", "after-purchase"],
  ]) {
    assert.deepEqual(
      analytics.analyticsPayload(
        "/guides/6-pitfalls/",
        "internal",
        event,
        event === "contact_click" ? "wechat" : undefined,
        intent,
      ),
      {
        version: "analytics_event_v1",
        path: "/guides/6-pitfalls/",
        source: "internal",
        event,
        ...(event === "contact_click" ? { channel: "wechat" } : {}),
      },
    );
  }
  assert.doesNotMatch(source, /document\.cookie|localStorage|utm_(?:campaign|content|term|medium)/i);
});

test("client keeps only an allowlisted distribution source across the current tab", async () => {
  const browser = fakeBrowser({
    currentHref:
      "https://getgiffgaff.com/contact/?utm_source=dist_xiaohongshu&utm_campaign=private-note",
    referrer: "https://www.xiaohongshu.com/explore/private-note",
  });
  try {
    await import(`${pathToFileURL(SCRIPT).href}?attribution=${Date.now()}`);
    assert.deepEqual(JSON.parse(await browser.beacons[0].body.text()), {
      version: "analytics_event_v1",
      path: "/contact/",
      source: "dist_xiaohongshu",
      event: "page_view",
    });
    assert.equal(
      browser.storage.get("getgiffgaff_attribution_source_v1"),
      "dist_xiaohongshu",
    );
    assert.doesNotMatch(JSON.stringify(JSON.parse(await browser.beacons[0].body.text())), /private-note/);
  } finally {
    browser.restore();
  }

  const followUp = fakeBrowser({
    currentHref: "https://getgiffgaff.com/shop/",
    referrer: "https://getgiffgaff.com/contact/",
    storedSource: "dist_xiaohongshu",
  });
  try {
    await import(`${pathToFileURL(SCRIPT).href}?attribution-follow-up=${Date.now()}`);
    assert.equal(JSON.parse(await followUp.beacons[0].body.text()).source, "dist_xiaohongshu");
  } finally {
    followUp.restore();
  }
});

test("client emits one automatic page view and allowlisted click dimensions through sendBeacon", async () => {
  const browser = fakeBrowser();
  try {
    await import(`${pathToFileURL(SCRIPT).href}?browser=${Date.now()}`);

    assert.equal(browser.beacons.length, 1);
    assert.equal(browser.fetches.length, 0);
    assert.equal(browser.beacons[0].url, "/analytics-event-v1");
    assert.equal(browser.beacons[0].body.type, "application/json");
    assert.deepEqual(JSON.parse(await browser.beacons[0].body.text()), {
      version: "analytics_event_v1",
      path: "/contact/",
      source: "search",
      event: "page_view",
    });

    browser.listeners.get("click")({
      target: {
        closest() {
          return {
            dataset: {
              analyticsEvent: "contact_click",
              analyticsChannel: "telegram",
            },
          };
        },
      },
    });
    browser.listeners.get("click")({
      target: {
        closest() {
          return {
            dataset: {
              analyticsEvent: "commerce_click",
              analyticsChannel: "telegram",
            },
          };
        },
      },
    });
    browser.listeners.get("click")({
      target: {
        closest() {
          return {
            dataset: {
              analyticsEvent: "contact_click",
            },
          };
        },
      },
    });
    browser.listeners.get("analytics_event_v1")({ detail: { event: "tool_result" } });

    assert.equal(browser.beacons.length, 4);
    assert.deepEqual(JSON.parse(await browser.beacons[1].body.text()), {
      version: "analytics_event_v1",
      path: "/contact/",
      source: "search",
      event: "contact_click",
      channel: "telegram",
    });
    assert.deepEqual(JSON.parse(await browser.beacons[2].body.text()), {
      version: "analytics_event_v1",
      path: "/contact/",
      source: "search",
      event: "commerce_click",
    });
    assert.deepEqual(JSON.parse(await browser.beacons[3].body.text()), {
      version: "analytics_event_v1",
      path: "/contact/",
      source: "search",
      event: "tool_result",
    });
  } finally {
    browser.restore();
  }
});

test("client distinguishes only the two fixed pitfalls intent cards", async () => {
  const browser = fakeBrowser({
    canonicalHref: "https://getgiffgaff.com/guides/6-pitfalls/",
    currentHref: "https://getgiffgaff.com/guides/6-pitfalls/",
  });
  try {
    await import(`${pathToFileURL(SCRIPT).href}?pitfalls-intents=${Date.now()}`);
    for (const [analyticsEvent, funnelIntent, analyticsChannel] of [
      ["commerce_click", "before-purchase"],
      ["commerce_click", "after-purchase"],
      ["commerce_click", "secret arbitrary DOM value"],
      ["page_view", "before-purchase"],
      ["contact_click", "after-purchase", "wechat"],
    ]) {
      browser.listeners.get("click")({
        target: {
          closest() {
            return {
              dataset: { analyticsEvent, funnelIntent, analyticsChannel },
              href: "https://private.example/never-read",
              textContent: "never send arbitrary DOM text",
            };
          },
        },
      });
    }

    const payloads = await Promise.all(
      browser.beacons.map(async ({ body }) => JSON.parse(await body.text())),
    );
    assert.deepEqual(payloads, [
      {
        version: "analytics_event_v1",
        path: "/guides/6-pitfalls/",
        source: "search",
        event: "page_view",
      },
      {
        version: "analytics_event_v1",
        path: "/guides/6-pitfalls/",
        source: "search",
        event: "commerce_click",
        intent: "before-purchase",
      },
      {
        version: "analytics_event_v1",
        path: "/guides/6-pitfalls/",
        source: "search",
        event: "commerce_click",
        intent: "after-purchase",
      },
    ]);
    assert.doesNotMatch(
      JSON.stringify(payloads),
      /private\.example|never-read|arbitrary DOM text/,
    );
  } finally {
    browser.restore();
  }
});

test("client defers prerender page views until the document becomes visible", async () => {
  const browser = fakeBrowser({ visibilityState: "prerender" });
  try {
    await import(`${pathToFileURL(SCRIPT).href}?prerender=${Date.now()}`);
    assert.equal(browser.beacons.length, 0);

    globalThis.document.visibilityState = "visible";
    browser.listeners.get("visibilitychange")();
    assert.equal(browser.beacons.length, 1);
    assert.deepEqual(JSON.parse(await browser.beacons[0].body.text()), {
      version: "analytics_event_v1",
      path: "/contact/",
      source: "search",
      event: "page_view",
    });
  } finally {
    browser.restore();
  }
});

test("client falls back to credential-free keepalive fetch when sendBeacon cannot queue", async () => {
  for (const options of [
    { beaconResult: false, includeBeacon: true },
    { includeBeacon: false },
  ]) {
    const browser = fakeBrowser(options);
    try {
      await import(`${pathToFileURL(SCRIPT).href}?fallback=${Date.now()}-${String(options.includeBeacon)}`);

      assert.equal(browser.fetches.length, 1);
      assert.equal(browser.fetches[0].url, "/analytics-event-v1");
      assert.deepEqual(browser.fetches[0].options, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          version: "analytics_event_v1",
          path: "/contact/",
          source: "search",
          event: "page_view",
        }),
        keepalive: true,
        credentials: "omit",
        cache: "no-store",
      });
    } finally {
      browser.restore();
    }
  }
});

test("client fails closed on unknown events and recovers a canonical path without leaking URLs", async () => {
  const browser = fakeBrowser({ canonicalHref: "not a url", referrer: "not a url" });
  try {
    await import(`${pathToFileURL(SCRIPT).href}?closed=${Date.now()}`);

    browser.listeners.get("click")({
      target: {
        closest() {
          return {
            dataset: {
              analyticsEvent: "arbitrary",
              analyticsChannel: "13800000000",
            },
          };
        },
      },
    });
    browser.listeners.get("analytics_event_v1")({ detail: { event: "commerce_click" } });

    assert.equal(browser.beacons.length, 1);
    assert.deepEqual(JSON.parse(await browser.beacons[0].body.text()), {
      version: "analytics_event_v1",
      path: "/contact/",
      source: "unknown",
      event: "page_view",
    });
  } finally {
    browser.restore();
  }
});

test("client ignores transport exceptions and missing event targets", async () => {
  const browser = fakeBrowser();
  browser.restore();

  const listeners = new Map();
  const restores = [
    replaceGlobal("document", {
      referrer: "",
      querySelector() {
        return null;
      },
      addEventListener(name, listener) {
        listeners.set(name, listener);
      },
    }),
    replaceGlobal("navigator", {
      sendBeacon() {
        throw new Error("beacon disabled");
      },
    }),
    replaceGlobal("location", {
      origin: "https://getgiffgaff.com",
      href: "https://getgiffgaff.com/shop/",
      pathname: "/shop/",
    }),
    replaceGlobal("fetch", () => Promise.reject(new Error("offline"))),
  ];
  try {
    await import(`${pathToFileURL(SCRIPT).href}?exceptions=${Date.now()}`);
    listeners.get("click")({ target: {} });
    listeners.get("analytics_event_v1")({ detail: {} });
    await new Promise((resolve) => setTimeout(resolve, 0));
  } finally {
    for (const restore of restores.reverse()) restore();
  }
});

test("client analytics stays disabled on non-production origins", async () => {
  const browser = fakeBrowser();
  const originalLocation = globalThis.location;
  try {
    Object.defineProperty(globalThis, "location", {
      configurable: true,
      writable: true,
      value: {
        origin: "https://preview.getgiffgaff.pages.dev",
        href: "https://preview.getgiffgaff.pages.dev/contact/",
        pathname: "/contact/",
      },
    });
    await import(`${pathToFileURL(SCRIPT).href}?preview=${Date.now()}`);
    assert.equal(browser.beacons.length, 0);
    assert.equal(browser.fetches.length, 0);
    assert.equal(browser.listeners.size, 0);
  } finally {
    if (originalLocation === undefined) delete globalThis.location;
    else Object.defineProperty(globalThis, "location", {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
    browser.restore();
  }
});
