import assert from "node:assert/strict";
import test from "node:test";

import { finalizeResponse, policyFor } from "../public/worker-logic.js";

const INDEXABLE_DIRECTIVES =
  "index, follow, max-snippet:-1, max-image-preview:large";
const SUPPORTING_DIRECTIVES = "noindex, follow, noarchive";
const PRIVATE_DIRECTIVES = "noindex, nofollow, noarchive";

function inheritedNoindexResponse({
  body = "upstream body",
  status = 200,
  contentType = "text/html; charset=utf-8",
} = {}) {
  return new Response(body, {
    status,
    headers: {
      "content-type": contentType,
      "x-robots-tag": "noindex",
      "x-upstream-marker": "preserved",
    },
  });
}

test("policyFor classifies public HTML, supporting files, private routes, and non-HTML assets", () => {
  assert.equal(policyFor("/contact/", 200, "text/html; charset=utf-8"), "indexable");
  assert.equal(policyFor("/llms.txt", 200, "text/plain; charset=utf-8"), "supporting-noindex");
  assert.equal(
    policyFor("/llms-full.txt", 200, "text/plain; charset=utf-8"),
    "private-noindex",
  );
  assert.equal(
    policyFor("/privacy/", 200, "text/html; charset=utf-8"),
    "supporting-noindex",
  );
  assert.equal(
    policyFor("/terms/", 200, "text/html; charset=utf-8"),
    "supporting-noindex",
  );
  assert.equal(policyFor("/admin/", 200, "text/html; charset=utf-8"), "private-noindex");
  assert.equal(
    policyFor("/unlisted-preview/", 200, "text/html; charset=utf-8"),
    "private-noindex",
  );
  assert.equal(policyFor("/contact/", 404, "text/html; charset=utf-8"), "private-noindex");
  assert.equal(policyFor("/robots.txt", 200, "text/plain; charset=utf-8"), "none");
  assert.equal(policyFor("/sitemap.xml", 200, "application/xml; charset=utf-8"), "none");
  assert.equal(policyFor("/assets/site.css", 200, "text/css; charset=utf-8"), "none");
});

test("finalizeResponse replaces an inherited noindex header on public HTML", async () => {
  const request = new Request("https://getgiffgaff.com/contact/");
  const upstream = inheritedNoindexResponse();
  const response = await finalizeResponse(
    request,
    upstream,
    policyFor("/contact/", upstream.status, upstream.headers.get("content-type")),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-robots-tag"), INDEXABLE_DIRECTIVES);
  assert.equal(response.headers.get("x-upstream-marker"), "preserved");
  assert.equal(await response.text(), "upstream body");
});

test("finalizeResponse keeps short llms supporting and retired llms-full private", async () => {
  const shortRequest = new Request("https://getgiffgaff.com/llms.txt");
  const shortUpstream = inheritedNoindexResponse({ contentType: "text/plain; charset=utf-8" });
  const shortResponse = await finalizeResponse(
    shortRequest,
    shortUpstream,
    policyFor("/llms.txt", shortUpstream.status, shortUpstream.headers.get("content-type")),
  );
  assert.equal(shortResponse.headers.get("x-robots-tag"), SUPPORTING_DIRECTIVES);

  const fullRequest = new Request("https://getgiffgaff.com/llms-full.txt");
  const fullUpstream = inheritedNoindexResponse({
    status: 410,
    contentType: "text/plain; charset=utf-8",
  });
  const fullResponse = await finalizeResponse(
    fullRequest,
    fullUpstream,
    policyFor("/llms-full.txt", fullUpstream.status, fullUpstream.headers.get("content-type")),
  );
  assert.equal(fullResponse.headers.get("x-robots-tag"), PRIVATE_DIRECTIVES);
});

test("finalizeResponse keeps 404 and private or sensitive routes out of the index", async () => {
  const cases = [
    { pathname: "/missing/", status: 404 },
    { pathname: "/admin/", status: 200 },
    { pathname: "/api/orders/123", status: 200 },
  ];

  for (const { pathname, status } of cases) {
    const request = new Request(`https://getgiffgaff.com${pathname}`);
    const upstream = inheritedNoindexResponse({ status });
    const response = await finalizeResponse(
      request,
      upstream,
      policyFor(pathname, upstream.status, upstream.headers.get("content-type")),
    );

    assert.equal(response.headers.get("x-robots-tag"), PRIVATE_DIRECTIVES, pathname);
  }
});

test("finalizeResponse keeps public privacy and terms pages crawlable but out of the index", async () => {
  for (const pathname of ["/privacy/", "/terms/"]) {
    const request = new Request(`https://getgiffgaff.com${pathname}`);
    const upstream = inheritedNoindexResponse();
    const response = await finalizeResponse(
      request,
      upstream,
      policyFor(pathname, upstream.status, upstream.headers.get("content-type")),
    );

    assert.equal(response.headers.get("x-robots-tag"), SUPPORTING_DIRECTIVES, pathname);
  }
});

test("finalizeResponse removes inherited robots directives from robots, sitemap, and static assets", async () => {
  const cases = [
    ["/robots.txt", "text/plain; charset=utf-8"],
    ["/sitemap.xml", "application/xml; charset=utf-8"],
    ["/assets/site.css", "text/css; charset=utf-8"],
  ];

  for (const [pathname, contentType] of cases) {
    const request = new Request(`https://getgiffgaff.com${pathname}`);
    const upstream = inheritedNoindexResponse({ contentType });
    const response = await finalizeResponse(
      request,
      upstream,
      policyFor(pathname, upstream.status, upstream.headers.get("content-type")),
    );

    assert.equal(response.headers.has("x-robots-tag"), false, pathname);
    assert.equal(response.headers.get("x-upstream-marker"), "preserved", pathname);
  }
});

test("finalizeResponse applies the same policy to HEAD without returning a body", async () => {
  const request = new Request("https://getgiffgaff.com/contact/", { method: "HEAD" });
  const upstream = inheritedNoindexResponse();
  const response = await finalizeResponse(
    request,
    upstream,
    policyFor("/contact/", upstream.status, upstream.headers.get("content-type")),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-robots-tag"), INDEXABLE_DIRECTIVES);
  assert.equal(await response.text(), "");
});

test("finalizeResponse keeps sensitive query parameters and personalized responses private", async () => {
  const sensitiveRequest = new Request(
    "https://getgiffgaff.com/contact/?order_id=private-order",
  );
  const sensitiveUpstream = inheritedNoindexResponse();
  const sensitiveResponse = await finalizeResponse(
    sensitiveRequest,
    sensitiveUpstream,
    "indexable",
  );

  assert.equal(sensitiveResponse.headers.get("x-robots-tag"), PRIVATE_DIRECTIVES);
  assert.equal(sensitiveResponse.headers.get("cache-control"), "private, no-store");

  const personalizedRequest = new Request("https://getgiffgaff.com/contact/");
  const personalizedUpstream = new Response("personalized", {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "set-cookie": "session=private; Secure; HttpOnly",
      "x-robots-tag": "noindex",
    },
  });
  const personalizedResponse = await finalizeResponse(
    personalizedRequest,
    personalizedUpstream,
    "indexable",
  );

  assert.equal(personalizedResponse.headers.get("cache-control"), "private, no-store");
});
