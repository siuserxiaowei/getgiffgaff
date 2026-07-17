import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEGACY_ROUTES } from '../public/route-manifest.js';
import {
  navigationSignature,
  visibleTextSignature,
  legacyDomSignature,
} from './capture-legacy-site.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const LEGACY_DIR = path.join(ROOT, 'site', 'legacy');
const MANIFEST_PATH = path.join(LEGACY_DIR, 'legacy-freeze-manifest.json');

function routeFile(route) {
  return route === '/' ? 'index.html' : `${route.slice(1)}index.html`;
}

function internalHrefs(html) {
  return [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1])
    .filter((href) => href.startsWith('/') && !href.startsWith('//'));
}

function pageTitle(html) {
  return (html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.trim() || '';
}

function metaContent(html, kind, key) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const attrMatch = tag.match(
      new RegExp(`\\b${kind}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'),
    );
    const value = attrMatch ? attrMatch[1] ?? attrMatch[2] ?? attrMatch[3] ?? '' : '';
    if (value.toLowerCase() === key.toLowerCase()) {
      const contentMatch = tag.match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      return contentMatch ? contentMatch[1] ?? contentMatch[2] ?? contentMatch[3] ?? '' : '';
    }
  }
  return '';
}

function firstHeading(html) {
  return (html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]
    ?.replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || '';
}

async function regenerate() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  const pages = [];

  for (const route of LEGACY_ROUTES) {
    const filePath = path.join(LEGACY_DIR, routeFile(route));
    const html = await readFile(filePath, 'utf8');
    pages.push({
      route,
      title: pageTitle(html),
      description: metaContent(html, 'name', 'description'),
      h1: firstHeading(html),
      navigationSha256: navigationSignature(html),
      visibleTextSha256: visibleTextSignature(html),
      domSha256: legacyDomSignature(html),
      legacyInternalHrefs: [...new Set(internalHrefs(html))],
    });
  }

  manifest.pages = pages;
  manifest.capturedAt = new Date().toISOString();
  manifest.schemaVersion = 'legacy-freeze-v2';

  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Regenerated freeze manifest for ${pages.length} legacy pages.`);
}

regenerate().catch((err) => {
  console.error(err);
  process.exit(1);
});
