import assert from "node:assert/strict";
import test from "node:test";

import worker, {
  canonicalRedirectFor,
  paymentHandoffResponse,
} from "../public/worker-logic.js";

const ORIGIN = "https://getgiffgaff.com";

test("legacy payment handoff redirects to the verified Kuaituantuan contact QR", async () => {
  const request = new Request(`${ORIGIN}/pay/`);
  const response = paymentHandoffResponse(request);

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), `${ORIGIN}/contact/#ktt-giga-card`);
  assert.equal(response.headers.get("x-getgiffgaff-payment-provider"), "kuaituantuan");
  assert.equal(
    response.headers.get("x-getgiffgaff-payment-mode"),
    "contact-qr-handoff",
  );
  assert.match(response.headers.get("x-robots-tag") || "", /noindex/i);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});

test("payment handoff canonicalizes the missing slash before redirecting", () => {
  const response = canonicalRedirectFor(new Request(`${ORIGIN}/pay`));
  assert.ok(response);
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), `${ORIGIN}/pay/`);
});

test("payment handoff accepts only safe read methods", async () => {
  const getResponse = await worker.fetch(new Request(`${ORIGIN}/pay/`), {});
  assert.equal(getResponse.status, 303);

  const headResponse = await worker.fetch(
    new Request(`${ORIGIN}/pay/`, { method: "HEAD" }),
    {},
  );
  assert.equal(headResponse.status, 303);
  assert.equal(await headResponse.text(), "");

  const postResponse = await worker.fetch(
    new Request(`${ORIGIN}/pay/`, { method: "POST" }),
    {},
  );
  assert.equal(postResponse.status, 405);
  assert.match(postResponse.headers.get("x-robots-tag") || "", /noindex/i);
  assert.equal(postResponse.headers.get("cache-control"), "private, no-store");
});

test("payment handoff never forwards incoming query data", async () => {
  const response = await worker.fetch(
    new Request(`${ORIGIN}/pay/?utm_source=shop&amount=9999`),
    {},
  );
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), `${ORIGIN}/contact/#ktt-giga-card`);
});
