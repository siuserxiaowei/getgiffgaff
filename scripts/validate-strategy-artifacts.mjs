import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STRATEGY_DIR = "docs/strategy";
const REQUIRED_TUTORIAL_URLS = new Set([
  "/answers/",
  "/guides/2-activate/",
  "/guides/3-usage/",
  "/guides/4-signal/",
  "/more/03-esim/",
  "/more/04-esim-qrcode/",
]);

export async function validateStrategyArtifacts({ rootDir = DEFAULT_ROOT } = {}) {
  const errors = [];
  const readJson = async (relativePath) => {
    try {
      return JSON.parse(await readFile(join(rootDir, relativePath), "utf8"));
    } catch (error) {
      errors.push(`${relativePath}: ${error.message}`);
      return null;
    }
  };

  const plan = await readJson(`${STRATEGY_DIR}/cluster-plan.json`);
  const matrix = await readJson(`${STRATEGY_DIR}/internal-links.json`);
  if (!plan || !matrix) return { errors };

  if (plan.pillar?.url !== "/guides/6-pitfalls/") {
    errors.push("cluster-plan.json: canonical pillar must be /guides/6-pitfalls/");
  }
  if (plan.clusters?.length !== 5) {
    errors.push(`cluster-plan.json: expected 5 clusters, got ${plan.clusters?.length}`);
  }

  const posts = (plan.clusters || []).flatMap((cluster) => cluster.posts || []);
  if (posts.length !== 20) {
    errors.push(`cluster-plan.json: expected 20 spokes, got ${posts.length}`);
  }

  for (const field of ["id", "url", "primaryKeyword"]) {
    const values = posts.map((post) => post[field]);
    if (values.some((value) => !value)) errors.push(`cluster-plan.json: empty post ${field}`);
    if (new Set(values).size !== values.length) {
      errors.push(`cluster-plan.json: duplicate post ${field}`);
    }
  }

  const postUrls = new Set(posts.map(({ url }) => url));
  for (const url of REQUIRED_TUTORIAL_URLS) {
    if (!postUrls.has(url)) errors.push(`cluster-plan.json: missing implemented tutorial ${url}`);
  }

  const qrPage = posts.find(({ url }) => url === "/more/04-esim-qrcode/");
  if (qrPage?.status !== "written" || qrPage?.brief) {
    errors.push("cluster-plan.json: eSIM QR boundary must be written and must not have a future brief");
  }

  const briefs = posts.filter(({ brief }) => brief);
  if (briefs.length !== 6 || plan.plannedAssetBriefs?.length !== 6) {
    errors.push("cluster-plan.json: expected exactly six genuinely future briefs");
  }
  for (const post of briefs) {
    try {
      const content = await readFile(join(rootDir, STRATEGY_DIR, post.brief), "utf8");
      if (content.length < 800) errors.push(`${post.brief}: brief is not detailed enough`);
      if (!content.includes(post.url)) errors.push(`${post.brief}: target URL is missing`);
    } catch (error) {
      errors.push(`${post.brief}: ${error.message}`);
    }
  }

  const nodes = matrix.nodes || [];
  const links = matrix.links || [];
  const nodeIds = new Set(nodes.map(({ id }) => id));
  if (nodes.length !== 21 || nodeIds.size !== 21) {
    errors.push("internal-links.json: expected 21 unique nodes");
  }
  if (links.length !== 90) errors.push(`internal-links.json: expected 90 links, got ${links.length}`);

  const linkPairs = new Set();
  const incoming = new Map(nodes.map(({ id }) => [id, 0]));
  for (const [index, link] of links.entries()) {
    if (!nodeIds.has(link.from) || !nodeIds.has(link.to)) {
      errors.push(`internal-links.json:links[${index}] references an unknown node`);
    }
    if (!link.anchor || /^(?:点击这里|了解更多)$/u.test(link.anchor)) {
      errors.push(`internal-links.json:links[${index}] has a generic or empty anchor`);
    }
    const pair = `${link.from}->${link.to}`;
    if (linkPairs.has(pair)) errors.push(`internal-links.json: duplicate link ${pair}`);
    linkPairs.add(pair);
    incoming.set(link.to, (incoming.get(link.to) || 0) + 1);
  }
  for (const node of nodes.filter(({ id }) => id !== "pillar")) {
    if ((incoming.get(node.id) || 0) < 3) {
      errors.push(`internal-links.json: ${node.id} has fewer than 3 planned body inlinks`);
    }
  }

  try {
    const map = await readFile(join(rootDir, STRATEGY_DIR, "cluster-map.html"), "utf8");
    if (!map.includes("templates/cluster-map.html")) {
      errors.push("cluster-map.html: missing fallback-template disclosure");
    }
    for (const { url } of nodes) {
      if (!map.includes(url)) errors.push(`cluster-map.html: missing node ${url}`);
    }
  } catch (error) {
    errors.push(`cluster-map.html: ${error.message}`);
  }

  try {
    const markdown = await readFile(join(rootDir, STRATEGY_DIR, "cluster-plan.md"), "utf8");
    if (/现有五个证据型|账号交接|P0 安全改写/.test(markdown)) {
      errors.push("cluster-plan.md: contains a stale implementation-state phrase");
    }
  } catch (error) {
    errors.push(`cluster-plan.md: ${error.message}`);
  }

  return {
    errors,
    clusterCount: plan.clusters.length,
    spokeCount: posts.length,
    briefCount: briefs.length,
    nodeCount: nodes.length,
    linkCount: links.length,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await validateStrategyArtifacts();
  if (result.errors.length) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(
      `strategy artifacts ok: ${result.clusterCount} clusters, ${result.spokeCount} spokes, ${result.briefCount} briefs, ${result.linkCount} links`,
    );
  }
}
