export const ANALYTICS_EVENT_VERSION = "analytics_event_v1";

const ALLOWED_FIELDS = new Set([
  "timestamp",
  "canonicalPath",
  "sourceClass",
  "eventName",
  "anonymousSession",
]);

const SOURCE_CLASSES = new Set([
  "direct",
  "organic-search",
  "ai-referral",
  "social",
  "referral",
  "unknown",
]);

const EVENT_NAMES = new Set([
  "page_view",
  "official_source_click",
  "tool_start",
  "tool_complete",
  "correction_open",
  "contact_open",
]);

function validIsoTimestamp(value) {
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

export function normalizeAnalyticsEvent(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("analytics event must be an object");
  }

  const forbidden = Object.keys(input).find((key) => !ALLOWED_FIELDS.has(key));
  if (forbidden) throw new TypeError(`forbidden field: ${forbidden}`);
  if (!validIsoTimestamp(input.timestamp)) {
    throw new TypeError("timestamp must be an exact ISO-8601 UTC value");
  }
  if (
    typeof input.canonicalPath !== "string" ||
    !input.canonicalPath.startsWith("/") ||
    input.canonicalPath.startsWith("//") ||
    /[?#]/.test(input.canonicalPath)
  ) {
    throw new TypeError("canonical path must be a local path without query or fragment");
  }
  if (!SOURCE_CLASSES.has(input.sourceClass)) {
    throw new TypeError("source class is not approved");
  }
  if (!EVENT_NAMES.has(input.eventName)) {
    throw new TypeError("event name is not approved");
  }
  if (!/^[a-z0-9_-]{6,64}$/i.test(input.anonymousSession || "")) {
    throw new TypeError("anonymous session must be a short opaque identifier");
  }

  return Object.freeze({
    version: ANALYTICS_EVENT_VERSION,
    timestamp: input.timestamp,
    canonicalPath: input.canonicalPath,
    sourceClass: input.sourceClass,
    eventName: input.eventName,
    anonymousSession: input.anonymousSession,
  });
}
