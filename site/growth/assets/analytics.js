const AI_HOSTS = /(?:^|\.)(?:chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|poe\.com)$/i;
const AI_SUBDOMAINS = /^(?:gemini\.google\.com|copilot\.microsoft\.com)$/i;
const SEARCH_HOSTS = /(?:^|\.)(?:bing\.com|baidu\.com|duckduckgo\.com|yahoo\.[a-z.]+)$/i;
const SOCIAL_HOSTS = /(?:^|\.)(?:bilibili\.com|youtube\.com|youtu\.be|zhihu\.com|v2ex\.com|weibo\.com|x\.com|twitter\.com|facebook\.com)$/i;
const PRODUCTION_ORIGIN = "https://getgiffgaff.com";
const ANALYTICS_EVENTS = new Set([
  "commerce_click",
  "contact_click",
  "growth_related_click",
  "page_view",
  "shop_click",
  "tool_result",
]);
const CONTACT_CHANNELS = new Set(["telegram", "wechat"]);

export function sourceCategory(referrer, currentOrigin) {
  if (!referrer) return "direct";
  try {
    const source = new URL(referrer);
    if (source.origin === currentOrigin) return "internal";
    const host = source.hostname.toLowerCase();
    if (AI_HOSTS.test(host) || AI_SUBDOMAINS.test(host)) return "ai";
    if (SEARCH_HOSTS.test(host) || /(?:^|\.)google\./i.test(host)) return "search";
    if (SOCIAL_HOSTS.test(host)) return "social";
    return "referral";
  } catch {
    return "unknown";
  }
}

export function analyticsPayload(path, source, event, channel) {
  const payload = {
    version: "analytics_event_v1",
    path,
    source,
    event,
  };
  if (event === "contact_click" && CONTACT_CHANNELS.has(channel)) {
    payload.channel = channel;
  }
  return payload;
}

function canonicalPath() {
  const canonical = document.querySelector('link[rel="canonical"]')?.href;
  try {
    return new URL(canonical || location.href).pathname;
  } catch {
    return location.pathname;
  }
}

function emit(event, channel) {
  if (!ANALYTICS_EVENTS.has(event)) return;
  if (event === "contact_click" && !CONTACT_CHANNELS.has(channel)) return;
  const payload = analyticsPayload(
    canonicalPath(),
    sourceCategory(document.referrer, location.origin),
    event,
    channel,
  );
  const body = JSON.stringify(payload);
  let queued = false;
  if (typeof navigator.sendBeacon === "function") {
    try {
      queued = navigator.sendBeacon(
        "/analytics-event-v1",
        new Blob([body], { type: "application/json" }),
      );
    } catch {
      queued = false;
    }
  }
  if (!queued && typeof fetch === "function") {
    void fetch("/analytics-event-v1", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
      credentials: "omit",
      cache: "no-store",
    }).catch(() => {});
  }
}

function recordPageViewWhenVisible() {
  if (document.visibilityState === "prerender") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") emit("page_view");
    }, { once: true });
    return;
  }
  emit("page_view");
}

if (
  typeof document !== "undefined"
  && typeof location !== "undefined"
  && location.origin === PRODUCTION_ORIGIN
) {
  document.addEventListener("click", (event) => {
    const target = event.target.closest?.("[data-analytics-event]");
    const name = target?.dataset.analyticsEvent;
    if (name) emit(name, target.dataset.analyticsChannel);
  });
  document.addEventListener("analytics_event_v1", (event) => {
    const name = event.detail?.event;
    if (name === "tool_result") emit(name);
  });
  recordPageViewWhenVisible();
}
