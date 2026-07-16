const AI_HOSTS = /(?:^|\.)(?:chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|poe\.com)$/i;
const AI_SUBDOMAINS = /^(?:gemini\.google\.com|copilot\.microsoft\.com)$/i;
const SEARCH_HOSTS = /(?:^|\.)(?:bing\.com|baidu\.com|duckduckgo\.com|yahoo\.[a-z.]+)$/i;
const SOCIAL_HOSTS = /(?:^|\.)(?:bilibili\.com|youtube\.com|youtu\.be|zhihu\.com|v2ex\.com|weibo\.com|x\.com|twitter\.com|facebook\.com)$/i;

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

export function analyticsPayload(path, source, event) {
  return {
    version: "analytics_event_v1",
    path,
    source,
    event,
  };
}

function canonicalPath() {
  const canonical = document.querySelector('link[rel="canonical"]')?.href;
  try {
    return new URL(canonical || location.href).pathname;
  } catch {
    return location.pathname;
  }
}

function emit(event) {
  if (typeof navigator.sendBeacon !== "function") return;
  const payload = analyticsPayload(
    canonicalPath(),
    sourceCategory(document.referrer, location.origin),
    event,
  );
  navigator.sendBeacon(
    "/analytics-event-v1",
    new Blob([JSON.stringify(payload)], { type: "application/json" }),
  );
}

if (typeof document !== "undefined") {
  document.addEventListener("click", (event) => {
    const target = event.target.closest?.("[data-analytics-event]");
    const name = target?.dataset.analyticsEvent;
    if (name) emit(name);
  });
  document.addEventListener("analytics_event_v1", (event) => {
    const name = event.detail?.event;
    if (name === "tool_result") emit(name);
  });
}
