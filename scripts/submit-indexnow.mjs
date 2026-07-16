import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { PUBLIC_INDEXABLE_PATHS } from "../public/route-manifest.js";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const DEFAULT_ORIGIN = "https://getgiffgaff.com";
const DEFAULT_ENDPOINT = "https://api.indexnow.org/indexnow";
const KEY_PATH = "/indexnow-key.txt";

export function createIndexNowPayload(key, origin = DEFAULT_ORIGIN) {
  const normalizedOrigin = String(origin).replace(/\/+$/, "");
  if (normalizedOrigin !== DEFAULT_ORIGIN) {
    throw new Error(`IndexNow submission origin must be ${DEFAULT_ORIGIN}`);
  }
  if (!/^[a-z0-9-]{8,128}$/i.test(key)) {
    throw new Error("IndexNow key must contain 8-128 letters, numbers, or hyphens");
  }

  return Object.freeze({
    host: new URL(normalizedOrigin).hostname,
    key,
    keyLocation: `${normalizedOrigin}${KEY_PATH}`,
    urlList: PUBLIC_INDEXABLE_PATHS.map((pathname) => `${normalizedOrigin}${pathname}`),
  });
}

export async function submitIndexNow({
  key,
  fetchImpl = globalThis.fetch,
  endpoint = DEFAULT_ENDPOINT,
  origin = DEFAULT_ORIGIN,
} = {}) {
  const payload = createIndexNowPayload(String(key || "").trim(), origin);
  const keyResponse = await fetchImpl(payload.keyLocation, {
    headers: { accept: "text/plain" },
    redirect: "error",
  });
  const publishedKey = (await keyResponse.text()).trim();
  if (!keyResponse.ok || publishedKey !== payload.key) {
    throw new Error(`Published IndexNow key verification failed with HTTP ${keyResponse.status}`);
  }

  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      accept: "application/json, text/plain;q=0.9, */*;q=0.1",
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
    redirect: "error",
  });
  if (![200, 202].includes(response.status)) {
    throw new Error(`IndexNow rejected the URL batch with HTTP ${response.status}`);
  }

  return Object.freeze({
    endpoint,
    status: response.status,
    submittedUrls: payload.urlList.length,
    keyLocation: payload.keyLocation,
  });
}

const invokedDirectly =
  process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (invokedDirectly) {
  try {
    const key = await readFile(path.join(ROOT, "public", "indexnow-key.txt"), "utf8");
    const report = await submitIndexNow({ key });
    process.stdout.write(`${JSON.stringify(report)}\n`);
  } catch (error) {
    process.stderr.write(`${error?.message || error}\n`);
    process.exitCode = 1;
  }
}
