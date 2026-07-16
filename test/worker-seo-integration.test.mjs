import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildReleaseArtifact } from "../scripts/build-release-artifact.mjs";
import { ROUTE_MANIFEST, routeFor } from "../public/route-manifest.js";

function routeFile(root, route) {
  return route === "/"
    ? path.join(root, "index.html")
    : path.join(root, route.slice(1), "index.html");
}

function attribute(tag, name) {
  const match = String(tag).match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"),
  );
  return match ? match[1] ?? match[2] ?? match[3] ?? "" : "";
}

function hrefs(html) {
  return [...html.matchAll(/<a\b[^>]*\bhref=(?:"([^"]*)"|'([^']*)')[^>]*>/gi)]
    .map((match) => match[1] ?? match[2])
    .filter(Boolean);
}

function ids(html) {
  return new Set(
    [...html.matchAll(/\bid=(?:"([^"]+)"|'([^']+)')/gi)].map(
      (match) => match[1] ?? match[2],
    ),
  );
}

function assetReferences(html) {
  const result = [];
  for (const tag of html.match(/<(?:img|script|link)\b[^>]*>/gi) || []) {
    for (const name of ["src", "href"]) {
      const value = attribute(tag, name);
      if (value.startsWith("/") && !value.startsWith("//")) result.push(value);
    }
  }
  return result.filter((value) => /\.(?:css|js|png|jpe?g|svg|webp|ico)$/i.test(value));
}

function jsonLdDocuments(html) {
  return [...html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )].map((match) => JSON.parse(match[1]));
}

async function build(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "getgiffgaff-link-audit-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await buildReleaseArtifact({ outputRoot: root });
  return root;
}

test("all final pages have valid internal route, fragment and static asset targets", async (t) => {
  const root = await build(t);
  for (const route of Object.keys(ROUTE_MANIFEST)) {
    const html = await readFile(routeFile(root, route), "utf8");
    const pageIds = ids(html);

    for (const href of hrefs(html)) {
      if (href === "#") continue;
      if (href.startsWith("#")) {
        assert.ok(pageIds.has(decodeURIComponent(href.slice(1))), `${route} missing ${href}`);
        continue;
      }
      if (!href.startsWith("/") || href.startsWith("//")) continue;
      const target = new URL(href, "https://getgiffgaff.com");
      if (/\.[a-z0-9]+$/i.test(target.pathname)) continue;
      assert.ok(routeFor(target.pathname), `${route} has broken route ${href}`);
    }

    for (const asset of assetReferences(html)) {
      const pathname = new URL(asset, "https://getgiffgaff.com").pathname;
      const filename = path.join(root, pathname.slice(1));
      assert.ok((await readFile(filename)).length > 0, `${route} missing asset ${pathname}`);
    }
  }
});

test("all JSON-LD parses without preview origins or false official ownership", async (t) => {
  const root = await build(t);
  for (const route of Object.keys(ROUTE_MANIFEST)) {
    const html = await readFile(routeFile(root, route), "utf8");
    const documents = jsonLdDocuments(html);
    const serialized = JSON.stringify(documents);
    assert.doesNotMatch(serialized, /pages\.dev/i, route);
    assert.doesNotMatch(serialized, /"parentOrganization"\s*:/i, route);
    assert.doesNotMatch(serialized, /"sameAs"\s*:\s*"?https?:\/\/(?:www\.)?giffgaff\.com/i, route);

    const nodes = documents.flatMap((document) =>
      Array.isArray(document)
        ? document
        : Array.isArray(document?.["@graph"])
          ? document["@graph"]
          : [document],
    );
    for (const node of nodes) {
      if (String(node?.name || "").trim().toLowerCase() === "giffgaff") {
        const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
        assert.deepEqual(types, ["Brand"], `${route} giffgaff entity`);
      }
    }
  }
});

test("additive links create the intended tutorial-to-product-to-contact loop", async (t) => {
  const root = await build(t);
  for (const sourceRoute of ["/answers/", "/guides/1-order/"]) {
    const html = await readFile(routeFile(root, sourceRoute), "utf8");
    assert.match(html, /href=["']\/shop\/giffgaff-g0\/["']/i, sourceRoute);
    assert.match(html, /href=["']\/shop\/giffgaff-g2\/["']/i, sourceRoute);
  }
  for (const productRoute of ["/shop/giffgaff-g0/", "/shop/giffgaff-g2/"]) {
    const html = await readFile(routeFile(root, productRoute), "utf8");
    assert.match(html, /href=["']\/contact\/["']/i, productRoute);
  }
  for (const growthRoute of [
    "/guides/7-arrival-checklist/",
    "/guides/8-uk-sim-choice/",
    "/tools/keep-number-reminder/",
    "/tools/china-roaming-cost/",
    "/tools/g0-g2-total-cost/",
  ]) {
    const html = await readFile(routeFile(root, growthRoute), "utf8");
    assert.match(html, /href=["']\/(?:shop|answers)\//i, growthRoute);
    assert.match(html, /href=["']\/contact\/["']/i, growthRoute);
  }
});
