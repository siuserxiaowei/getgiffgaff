import { execFileSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import worker, {
  CANONICAL_ORIGIN,
  PUBLIC_INDEXABLE_PATHS,
} from "../public/worker-logic.js";
import { ogImagePathFor } from "../public/og-images.js";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = resolve(projectRoot, "public");
const pitfallsHtml = await readFile(
  resolve(publicRoot, "guides/6-pitfalls-page.txt"),
  "utf8",
);

const assetEnv = {
  ASSETS: {
    async fetch(request) {
      if (new URL(request.url).pathname === "/guides/6-pitfalls-page.txt") {
        return new Response(pitfallsHtml, {
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }
      return new Response("not found", { status: 404 });
    },
  },
};

const palettes = [
  ["#173c2a", "#315f43", "#dff0df"],
  ["#243c5a", "#46698c", "#e4edf7"],
  ["#563b24", "#8a6542", "#f7ead9"],
  ["#422d52", "#75528a", "#eee4f5"],
];

function xml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function plainText(value) {
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function titleFrom(html) {
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  if (h1) return plainText(h1);
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return plainText(title || "getgiffgaff 独立第三方信息");
}

function wrapTitle(title, limit = 15) {
  const lines = [];
  let line = "";
  let width = 0;
  const characterWidth = (character) =>
    /[\u0000-\u00ff]/.test(character) ? 0.55 : 1;

  for (const character of [...title]) {
    const weight = /[\u0000-\u00ff]/.test(character) ? 0.55 : 1;
    if (width + weight > limit && line) {
      const buffered = [...line];
      let breakAt = -1;
      for (let index = buffered.length - 1; index >= 0; index -= 1) {
        if (/[\s：｜？；。！”]/u.test(buffered[index])) {
          breakAt = index + 1;
          break;
        }
      }
      if (breakAt > 0) {
        lines.push(buffered.slice(0, breakAt).join("").trim());
        line = buffered.slice(breakAt).join("").trimStart();
        width = [...line].reduce(
          (total, entry) => total + characterWidth(entry),
          0,
        );
      } else {
        lines.push(line.trim());
        line = "";
        width = 0;
      }
    }
    line += character;
    width += weight;
  }
  if (line.trim()) lines.push(line.trim());
  return lines.slice(0, 3);
}

function paletteFor(pathname) {
  let hash = 0;
  for (const character of pathname) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return palettes[hash % palettes.length];
}

function svgFor(pathname, title) {
  const [ink, accent, soft] = paletteFor(pathname);
  const lines = wrapTitle(title);
  const fontSize = lines.length === 1 ? 72 : lines.length === 2 ? 66 : 56;
  const lineHeight = fontSize * 1.22;
  const startY = 262 - ((lines.length - 1) * lineHeight) / 2;
  const titleLines = lines
    .map(
      (line, index) =>
        `<tspan x="88" y="${Math.round(startY + index * lineHeight)}">${xml(line)}</tspan>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff"/><stop offset="0.62" stop-color="${soft}"/><stop offset="1" stop-color="#fff3d4"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="22" height="630" fill="${accent}"/>
  <circle cx="1072" cy="104" r="116" fill="${accent}" opacity="0.10"/>
  <circle cx="1125" cy="555" r="190" fill="${ink}" opacity="0.06"/>
  <text x="88" y="104" fill="${accent}" font-family="Inter,Noto Sans SC,PingFang SC,Arial,sans-serif" font-size="28" font-weight="800" letter-spacing="2">GETGIFFGAFF · 独立第三方信息</text>
  <text fill="${ink}" font-family="Inter,Noto Sans SC,PingFang SC,Arial,sans-serif" font-size="${fontSize}" font-weight="800">${titleLines}</text>
  <line x1="88" y1="476" x2="1112" y2="476" stroke="${accent}" stroke-opacity="0.28" stroke-width="2"/>
  <text x="88" y="530" fill="${ink}" opacity="0.74" font-family="Inter,Noto Sans SC,PingFang SC,Arial,sans-serif" font-size="25">规则可能变化 · 操作当日复核直接来源</text>
  <text x="88" y="579" fill="${accent}" font-family="Inter,Noto Sans SC,PingFang SC,Arial,sans-serif" font-size="22" font-weight="700">${xml(pathname)}</text>
  <text x="1112" y="579" text-anchor="end" fill="${accent}" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="700">getgiffgaff.com</text>
</svg>`;
}

await mkdir(resolve(publicRoot, "og"), { recursive: true });

for (const pathname of PUBLIC_INDEXABLE_PATHS) {
  const response = await worker.fetch(
    new Request(`${CANONICAL_ORIGIN}${pathname}`),
    assetEnv,
  );
  if (response.status !== 200) {
    throw new Error(`Cannot render ${pathname}: HTTP ${response.status}`);
  }
  const title = titleFrom(await response.text());
  const target = resolve(publicRoot, ogImagePathFor(pathname).slice(1));
  const temporary = resolve(
    tmpdir(),
    `getgiffgaff-${basename(target, ".png")}-${process.pid}.svg`,
  );
  await writeFile(temporary, svgFor(pathname, title), "utf8");
  try {
    execFileSync("rsvg-convert", [
      "--width",
      "1200",
      "--height",
      "630",
      "--output",
      target,
      temporary,
    ]);
  } finally {
    await rm(temporary, { force: true });
  }
}

console.log(`Generated ${PUBLIC_INDEXABLE_PATHS.length} page-specific OG images.`);
