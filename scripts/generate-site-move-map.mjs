#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ROUTE_MANIFEST } from "../public/route-manifest.js";

const DEFAULT_SOURCE_ORIGIN = "https://getgiffgaff.com";

function exactOrigin(value, label) {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new TypeError(`${label} must use https`);
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new TypeError(`${label} must be an origin without path, query or fragment`);
  }
  return url.origin;
}

export function buildSiteMoveMap(
  targetOrigin,
  { sourceOrigin = DEFAULT_SOURCE_ORIGIN, requireNeutralTarget = true } = {},
) {
  const source = exactOrigin(sourceOrigin, "source origin");
  const target = exactOrigin(targetOrigin, "target origin");
  if (source === target) throw new TypeError("target origin must differ from source origin");
  if (requireNeutralTarget && /giffgaff/i.test(new URL(target).hostname)) {
    throw new TypeError("target origin must use a neutral brand name");
  }

  const paths = [...new Set(
    Object.values(ROUTE_MANIFEST)
      .filter((route) => route.path.endsWith("/"))
      .filter((route) => ["index", "noindex"].includes(route.indexPolicy))
      .map((route) => route.canonicalPath),
  )];

  return Object.freeze({
    generatedAt: new Date().toISOString(),
    sourceOrigin: source,
    targetOrigin: target,
    redirectStatus: 301,
    preservePath: true,
    routes: paths.map((pathname) => Object.freeze({
      from: `${source}${pathname}`,
      to: `${target}${pathname}`,
    })),
  });
}

function usage() {
  return "Usage: node scripts/generate-site-move-map.mjs https://neutral-brand.example";
}

export function runCli(args = process.argv.slice(2), output = console.log, error = console.error) {
  if (args.length !== 1) {
    error(usage());
    return 2;
  }
  try {
    output(JSON.stringify(buildSiteMoveMap(args[0]), null, 2));
    return 0;
  } catch (caught) {
    error(caught.message);
    error(usage());
    return 2;
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) process.exitCode = runCli();
