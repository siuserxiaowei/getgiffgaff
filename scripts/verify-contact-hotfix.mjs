import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import worker from "../public/worker-logic.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const imagePath = join(projectRoot, "public", "contact", "ktt-giga-card.png");

function anchorForLabel(html, label) {
  const labelIndex = html.indexOf(label);
  assert.notEqual(labelIndex, -1, `Missing label: ${label}`);

  const anchorStart = html.lastIndexOf("<a ", labelIndex);
  const anchorEnd = html.indexOf("</a>", labelIndex);
  assert.notEqual(anchorStart, -1, `Missing anchor start for ${label}`);
  assert.notEqual(anchorEnd, -1, `Missing anchor end for ${label}`);

  return html.slice(anchorStart, anchorEnd + 4);
}

const response = await worker.fetch(new Request("https://getgiffgaff.com/contact/"), {});
const html = await response.text();

assert.equal(response.status, 200);
assert.equal(response.headers.get("x-getgiffgaff-hotfix"), "contact-ktt-modal");
assert.match(html, /id="ktt-giga-card"/);
assert.match(html, /快团团下单/);
assert.match(html, /客服小玉/);
assert.match(html, /\/contact\/ktt-giga-card\.png/);

for (const label of ["确认 G0 库存", "确认 G2 库存"]) {
  const anchor = anchorForLabel(html, label);
  assert.match(anchor, /href="#ktt-giga-card"/, `${label} should open the modal`);
  assert.doesNotMatch(anchor, /href="\/contact\/"/, `${label} must not loop to /contact/`);
  assert.match(anchor, /aria-haspopup="dialog"/, `${label} should announce dialog behavior`);
}

const imageStat = await stat(imagePath);
assert.ok(imageStat.size > 10_000, "Kuaituantuan QR image should be present");

console.log("contact hotfix verified: G0/G2 buttons open #ktt-giga-card, modal exists, QR asset exists");
