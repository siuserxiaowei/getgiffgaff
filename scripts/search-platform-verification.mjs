import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const BAIDU_META_PATTERN =
  /<meta\b(?=[^>]*\bname\s*=\s*["']baidu-site-verification["'])[^>]*>\s*/gi;
const CONTENT_PATTERN = /\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;
const BAIDU_CODE_PATTERN = /^codeva-[A-Za-z0-9_-]{6,80}$/;

// Public ownership token issued by Baidu Search Resource Platform on 2026-07-24.
// Baidu requires this tag to remain on the verified homepage.
export const BAIDU_SITE_VERIFICATION_CODE = "codeva-EHQw5Gn8uH";

function contentValue(tag) {
  const match = String(tag).match(CONTENT_PATTERN);
  return match ? match[1] ?? match[2] ?? match[3] ?? "" : "";
}

export function normalizeBaiduVerificationCode(value) {
  const code = String(value || "").trim();
  if (!BAIDU_CODE_PATTERN.test(code)) {
    throw new Error(
      `Invalid Baidu site verification code ${JSON.stringify(value)}; expected codeva- followed by the issued token`,
    );
  }
  return code;
}

export function injectBaiduVerificationMeta(html, value) {
  const code = normalizeBaiduVerificationCode(value);
  const tags = String(html).match(BAIDU_META_PATTERN) || [];
  if (tags.length > 1) {
    throw new Error("Duplicate baidu-site-verification meta tags are not allowed");
  }
  if (tags.length === 1) {
    if (contentValue(tags[0]) !== code) {
      throw new Error("Conflicting baidu-site-verification meta tag");
    }
    return html;
  }
  if (!/<\/head>/i.test(html)) {
    throw new Error("Cannot inject Baidu verification meta: homepage has no closing head");
  }
  const tag = `<meta name="baidu-site-verification" content="${code}">`;
  return String(html).replace(/<\/head>/i, `  ${tag}\n</head>`);
}

export async function configureSearchPlatformVerification({
  outputRoot,
  baiduVerificationCode = BAIDU_SITE_VERIFICATION_CODE,
}) {
  if (!outputRoot) {
    throw new Error("Search platform verification requires an outputRoot");
  }
  const homepage = path.join(outputRoot, "index.html");
  const html = await readFile(homepage, "utf8");
  const configured = injectBaiduVerificationMeta(html, baiduVerificationCode);
  if (configured !== html) await writeFile(homepage, configured);
  return {
    baidu: {
      enabled: true,
      code: normalizeBaiduVerificationCode(baiduVerificationCode),
      pages: 1,
    },
  };
}
