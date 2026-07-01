export const HOTFIX_ORIGIN = "https://3c237a37.getgiffgaff.pages.dev";

const CONTACT_PATHS = new Set(["/contact", "/contact/"]);
const KTT_MODAL_ID = "ktt-giga-card";
const KTT_IMAGE_PATH = "/contact/ktt-giga-card.png";
const BUTTON_TARGET = `#${KTT_MODAL_ID}`;
const PITFALLS_PATH = "/guides/6-pitfalls/";
const PITFALLS_ASSET_PATH = "/guides/6-pitfalls-page.txt";
const PITFALLS_NAV_ITEM =
  '<li><a href="/guides/6-pitfalls/">giffgaff 使用教程和避坑清单</a></li>';
const PITFALLS_DOC_LIST_ITEM = `<a class="doc-list-item" href="/guides/6-pitfalls/"><span>giffgaff 使用教程和避坑清单</span><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right" aria-hidden="true"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg></a>`;

function upstreamRequestFor(request) {
  const requestUrl = new URL(request.url);
  const upstreamUrl = new URL(requestUrl.pathname + requestUrl.search, HOTFIX_ORIGIN);
  return new Request(upstreamUrl.toString(), request);
}

function assetRequestFor(request, pathname) {
  const assetUrl = new URL(request.url);
  assetUrl.pathname = pathname;
  assetUrl.search = "";
  return new Request(assetUrl.toString(), request);
}

function htmlResponse(html, upstreamResponse, extraHeaders = {}) {
  const headers = new Headers(upstreamResponse.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "public, max-age=0, must-revalidate");

  for (const [key, value] of Object.entries(extraHeaders)) {
    headers.set(key, value);
  }

  return new Response(html, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers,
  });
}

function replaceAnchorHrefNearLabel(html, label, target) {
  const labelIndex = html.indexOf(label);
  if (labelIndex === -1) return html;

  const anchorStart = html.lastIndexOf("<a ", labelIndex);
  const anchorEnd = html.indexOf("</a>", labelIndex);
  if (anchorStart === -1 || anchorEnd === -1 || anchorEnd < labelIndex) return html;

  const before = html.slice(0, anchorStart);
  const anchor = html.slice(anchorStart, anchorEnd + 4);
  const after = html.slice(anchorEnd + 4);
  const updatedAnchor = anchor
    .replace(/\saria-haspopup="[^"]*"/, "")
    .replace(/\shref="[^"]*"/, ` href="${target}" aria-haspopup="dialog"`);

  return `${before}${updatedAnchor}${after}`;
}

function normalizeXiaoyuLabel(html) {
  return html.replace(/>小玉</g, ">客服小玉<").replace(/小玉客服/g, "客服小玉");
}

function kttModalMarkup() {
  return `
<style id="${KTT_MODAL_ID}-style">
  #${KTT_MODAL_ID} {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(17, 24, 39, 0.54);
  }
  #${KTT_MODAL_ID}:target {
    display: flex;
  }
  .ktt-modal-backdrop {
    position: absolute;
    inset: 0;
  }
  .ktt-modal-panel {
    position: relative;
    width: min(440px, 100%);
    max-height: min(720px, calc(100vh - 40px));
    overflow: auto;
    border: 1px solid rgba(47, 94, 65, 0.2);
    border-radius: 18px;
    background: #fff;
    box-shadow: 0 28px 70px rgba(12, 31, 23, 0.24);
    padding: 24px;
    color: #1f2933;
  }
  .ktt-modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    padding: 0 12px;
    border: 1px solid rgba(47, 94, 65, 0.18);
    border-radius: 999px;
    color: #2f5e41;
    background: #f4f8f4;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
  }
  .ktt-modal-eyebrow {
    margin: 0 0 8px;
    color: #2f5e41;
    font-size: 14px;
    font-weight: 800;
  }
  .ktt-modal-title {
    margin: 0 56px 10px 0;
    color: #111827;
    font-size: 28px;
    line-height: 1.22;
    letter-spacing: 0;
  }
  .ktt-modal-copy {
    margin: 0 0 18px;
    color: #5f6b63;
    font-size: 16px;
    line-height: 1.75;
  }
  .ktt-modal-qr {
    display: block;
    width: min(320px, 100%);
    height: auto;
    margin: 0 auto;
    border: 1px solid #e7eee8;
    border-radius: 14px;
    background: #fff;
  }
  .ktt-modal-note {
    margin: 14px 0 0;
    border-radius: 12px;
    background: #eef7ef;
    padding: 12px 14px;
    color: #2f5e41;
    font-size: 15px;
    font-weight: 800;
    text-align: center;
  }
  @media (max-width: 640px) {
    #${KTT_MODAL_ID} {
      align-items: flex-end;
      padding: 14px;
    }
    .ktt-modal-panel {
      border-radius: 18px 18px 14px 14px;
      padding: 22px 18px 18px;
    }
    .ktt-modal-title {
      font-size: 24px;
    }
  }
</style>
<section id="${KTT_MODAL_ID}" role="dialog" aria-modal="true" aria-labelledby="${KTT_MODAL_ID}-title">
  <a class="ktt-modal-backdrop" href="#" aria-label="关闭快团团入口"></a>
  <div class="ktt-modal-panel">
    <a class="ktt-modal-close" href="#" aria-label="关闭快团团入口">关闭</a>
    <p class="ktt-modal-eyebrow">快团团下单</p>
    <h2 class="ktt-modal-title" id="${KTT_MODAL_ID}-title">进入 Giga卡快团团店铺</h2>
    <p class="ktt-modal-copy">点 G0/G2 后，先在快团团确认库存、余额范围和发货方式；付款或售后问题找客服小玉。</p>
    <img class="ktt-modal-qr" src="${KTT_IMAGE_PATH}" alt="Giga卡快团团小程序码" loading="lazy" decoding="async">
    <p class="ktt-modal-note">长按识别小程序码，立即进店确认库存</p>
  </div>
</section>`;
}

export function rewriteContactHtml(html) {
  let rewritten = normalizeXiaoyuLabel(html);

  for (const label of ["确认 G0 库存", "确认 G2 库存"]) {
    rewritten = replaceAnchorHrefNearLabel(rewritten, label, BUTTON_TARGET);
  }

  if (rewritten.includes(`id="${KTT_MODAL_ID}"`)) {
    return rewritten;
  }

  const modal = kttModalMarkup();
  if (rewritten.includes("</body>")) {
    return rewritten.replace("</body>", `${modal}</body>`);
  }

  return `${rewritten}${modal}`;
}

function injectPitfallsGuideLinks(html) {
  if (html.includes('href="/guides/6-pitfalls/"')) return html;

  let rewritten = html.replace(
    /(<li><a(?: aria-current="page")? href="\/guides\/5-travel-data\/">giffgaff 旅行流量包使用指南<\/a><\/li>)/g,
    `$1${PITFALLS_NAV_ITEM}`,
  );

  rewritten = rewritten.replace(
    /(<a class="doc-list-item" href="\/guides\/5-travel-data\/">[\s\S]*?<\/a>)/g,
    `$1${PITFALLS_DOC_LIST_ITEM}`,
  );

  rewritten = rewritten
    .replace(/>9 篇教程</g, ">10 篇教程<")
    .replace(/\[9," 篇教程"\]/g, '[10," 篇教程"]');

  return rewritten;
}

function injectPitfallsIntoSitemap(xml) {
  if (xml.includes(`https://getgiffgaff.com${PITFALLS_PATH}`)) return xml;

  const entry = `<url>
<loc>https://getgiffgaff.com${PITFALLS_PATH}</loc>
<lastmod>2026-07-01T00:00:00.000Z</lastmod>
<changefreq>monthly</changefreq>
<priority>0.78</priority>
</url>
`;

  return xml.replace("</urlset>", `${entry}</urlset>`);
}

function shouldRewriteHtmlPath(pathname) {
  return (
    pathname === "/" ||
    pathname.startsWith("/guides") ||
    pathname.startsWith("/more") ||
    pathname.startsWith("/qa") ||
    CONTACT_PATHS.has(pathname)
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === KTT_IMAGE_PATH && env?.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    if (url.pathname === "/guides/6-pitfalls") {
      url.pathname = PITFALLS_PATH;
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === PITFALLS_PATH && env?.ASSETS) {
      const response = await env.ASSETS.fetch(assetRequestFor(request, PITFALLS_ASSET_PATH));
      const headers = new Headers(response.headers);
      headers.set("content-type", "text/html; charset=utf-8");
      headers.set("cache-control", "public, max-age=0, must-revalidate");
      headers.set("x-getgiffgaff-hotfix", "pitfalls-guide");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    const upstreamResponse = await fetch(upstreamRequestFor(request));
    const isContactPage = CONTACT_PATHS.has(url.pathname);
    const contentType = upstreamResponse.headers.get("content-type") || "";

    if (url.pathname === "/sitemap.xml" && contentType.includes("xml")) {
      const xml = injectPitfallsIntoSitemap(await upstreamResponse.text());
      const headers = new Headers(upstreamResponse.headers);
      headers.delete("content-length");
      headers.delete("content-encoding");
      headers.set("content-type", "application/xml; charset=utf-8");
      headers.set("cache-control", "public, max-age=0, must-revalidate");
      headers.set("x-getgiffgaff-hotfix", "sitemap-pitfalls-guide");

      return new Response(xml, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers,
      });
    }

    if (!contentType.includes("text/html") || !shouldRewriteHtmlPath(url.pathname)) {
      return upstreamResponse;
    }

    let html = injectPitfallsGuideLinks(await upstreamResponse.text());
    if (isContactPage) {
      html = rewriteContactHtml(html);
    }

    return htmlResponse(html, upstreamResponse, {
      "x-getgiffgaff-hotfix": isContactPage ? "contact-ktt-modal" : "guide-pitfalls-link",
    });
  },
};
