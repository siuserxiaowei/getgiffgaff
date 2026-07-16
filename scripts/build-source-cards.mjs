import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const VERIFIED_AT = "2026-07-16";

const INPUTS = Object.freeze({
  seeds: path.join(ROOT, "docs", "research", "sources", "six-source-teardown.json"),
  competitorsA: path.join(
    ROOT,
    "docs",
    "research",
    "competitors",
    "competitors-01-20.json",
  ),
  competitorsB: path.join(
    ROOT,
    "docs",
    "research",
    "competitors",
    "competitors-21-40.json",
  ),
  output: path.join(ROOT, "docs", "research", "source-cards-v1.json"),
});

function compact(value, fallback = "未观察到") {
  if (value === null || value === undefined || value === "") return fallback;
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "object") return value;
  return String(value);
}

function hostname(url) {
  return new URL(url).hostname.toLowerCase();
}

function topicFor(record) {
  const haystack = JSON.stringify([
    record.name,
    record.title,
    record.url,
    record.searchIntent,
    record.search_intent,
    record.target_query,
    record.sections,
  ]).toLowerCase();
  if (/roam|漫游|travel/.test(haystack)) return "/tools/china-roaming-cost/";
  if (/esim|compatib|兼容/.test(haystack)) return "/tools/esim-compatibility/";
  if (/otp|验证码|短信|接码/.test(haystack)) return "/research/otp-status/";
  if (/保号|deactiv|keep.number|维护/.test(haystack)) return "/tools/keep-number-reminder/";
  if (/选|compar|review|student|留学|旅行/.test(haystack)) return "/guides/8-uk-sim-choice/";
  return "/guides/7-arrival-checklist/";
}

function seedAccessStatus(access) {
  const status = `HTTP ${access.status ?? "未知"}`;
  if (access.publiclyReadable === true) return `公开可读；${status}`;

  const observed = access.publiclyReadable
    ? `源登记为“${access.publiclyReadable}”`
    : "未证实可公开完整读取";
  const limitation = access.accessLimitation
    ? `；${access.accessLimitation}`
    : "";
  return `受限或仅部分可验证；${observed}；${status}${limitation}`;
}

function seedCard(source) {
  const access = source.access || {};
  const sourceLastModified = access.lastModified || access.lastVerifiedUpdate;
  const links = source.linksAndConversion || {};
  const outline =
    source.structure?.mainSections ||
    source.structure?.visibleOutline ||
    source.structure?.representativePage?.sections ||
    source.structure?.contentInventory?.map((item) => item.title) ||
    [];
  return {
    id: `seed-${source.id}`,
    kind: "seed",
    url: source.url,
    site: hostname(source.url),
    author: compact(source.author || source.metadata?.author, "页面未可靠公开或未核验"),
    publishedAt: compact(access.publicationDate, "页面未可靠公开或未核验"),
    verifiedAt: VERIFIED_AT,
    ...(sourceLastModified ? { sourceLastModified } : {}),
    accessStatus: seedAccessStatus(access),
    title: compact(source.metadata?.htmlTitle || source.metadata?.title || source.name),
    h1: compact(source.metadata?.contentH1 || source.metadata?.h1),
    searchIntent: compact(source.searchIntent?.primary || source.searchIntent),
    headingOutline: compact(outline, []),
    internalLinkPattern: compact(links.internalMechanism),
    externalLinkPattern: compact(links.externalMechanism),
    ctaPattern: compact(links.primaryCta),
    schemaPattern: compact(source.technicalSeo?.schemaTypes, []),
    updatePattern: compact(
      access.updateEvidence || access.dateLimitation || access.lastVerifiedUpdate,
    ),
    assetPattern: compact(source.structure?.depthSignals || source.structure?.inventorySummary),
    learnablePattern: compact(source.transferableLessons, []),
    riskNotes: compact(
      source.trustSignals?.factualOrPolicyRisks || source.trustSignals?.gaps,
      [],
    ),
    licenseStatus: compact(source.copyright?.license, "未发现公开再发布许可"),
    accessBoundary: compact(source.copyright?.allowedCapture),
    originalTopic: topicFor(source),
  };
}

function competitorCard(source, group) {
  const date = source.date || {};
  const linkPattern = source.internal_links_schema_distribution;
  const searchIntent = source.search_intent || source.target_query || source.ranking_content_angle;
  const cta = source.cta || source.lead_magnet_or_cta;
  const learned = source.learnable_pattern || source.one_thing_to_learn;
  const checked = date.evidence_checked || date.retrieved || VERIFIED_AT;
  const availability = date.availability || source.availability || "已纳入公开页面研究";
  return {
    id: `competitor-${group}-${String(source.id).replace(/^c/i, "")}`,
    kind: "competitor",
    url: source.url,
    site: hostname(source.url),
    author: compact(source.author, "页面作者信息未在本登记层复核"),
    publishedAt: compact(
      date.page_published_or_updated || date.page_date,
      "页面未可靠公开或未核验",
    ),
    verifiedAt: compact(checked),
    accessStatus: compact(availability),
    title: compact(source.title || source.name),
    h1: compact(source.h1),
    searchIntent: compact(searchIntent),
    headingOutline: compact(source.sections, []),
    internalLinkPattern: compact(
      linkPattern?.internal_links || linkPattern,
      "未在摘要中单独记录",
    ),
    externalLinkPattern: compact(
      source.trust_and_citations?.citation_style || source.trust_and_citations,
      "未在摘要中单独记录",
    ),
    ctaPattern: compact(cta),
    schemaPattern: compact(linkPattern?.schema, []),
    updatePattern: compact(date),
    assetPattern: compact(source.distribution || linkPattern?.distribution),
    learnablePattern: compact(learned),
    riskNotes: compact(source.risk),
    licenseStatus: "未核验再发布许可；仅用于元数据、结构、选题与漏斗研究",
    accessBoundary: "禁止保存或再发布第三方全文、HTML、截图、图片和近似连续步骤",
    originalTopic: topicFor(source),
  };
}

function validate(cards) {
  if (cards.length !== 46) throw new Error(`Expected 46 cards, received ${cards.length}`);
  if (cards.filter((card) => card.kind === "seed").length !== 6) {
    throw new Error("Expected exactly 6 seed cards");
  }
  const competitors = cards.filter((card) => card.kind === "competitor");
  if (competitors.length !== 40) throw new Error("Expected exactly 40 competitor cards");
  if (new Set(cards.map((card) => card.id)).size !== cards.length) {
    throw new Error("Source card IDs must be unique");
  }
  const hosts = competitors.map((card) => hostname(card.url));
  if (new Set(hosts).size !== 40) {
    throw new Error("Competitor cards must use 40 independent hosts");
  }
  for (const card of cards) {
    for (const forbidden of ["fullText", "bodyHtml", "screenshots", "mediaFiles"]) {
      if (Object.hasOwn(card, forbidden)) throw new Error(`${card.id} contains ${forbidden}`);
    }
  }
  const feishu = cards.find((card) => card.id === "seed-feishu-aiyanxishe");
  if (!feishu || /公开可读/.test(feishu.accessStatus)) {
    throw new Error("Feishu seed must remain access-limited or partially verifiable");
  }
}

export async function buildSourceCards() {
  const [seedRegistry, firstRegistry, secondRegistry] = await Promise.all(
    [INPUTS.seeds, INPUTS.competitorsA, INPUTS.competitorsB].map(async (filename) =>
      JSON.parse(await readFile(filename, "utf8")),
    ),
  );
  const cards = [
    ...seedRegistry.sources.map(seedCard),
    ...firstRegistry.competitors.map((source) => competitorCard(source, "a")),
    ...secondRegistry.competitors.map((source) => competitorCard(source, "b")),
  ];
  validate(cards);
  const registry = {
    schemaVersion: "source-card-v1",
    generatedAt: "2026-07-16",
    copyrightBoundary:
      "研究层只保存元数据、原创结构摘要、链接与漏斗模式；不保存第三方全文、HTML、截图、图片或近似连续步骤。",
    cards,
  };
  await writeFile(INPUTS.output, `${JSON.stringify(registry, null, 2)}\n`);
  return registry;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const registry = await buildSourceCards();
  process.stdout.write(`${JSON.stringify({ cards: registry.cards.length })}\n`);
}
