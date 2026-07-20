import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { GROWTH_PAGES } from "../site/growth/content-registry.js";
import { renderGrowthPage } from "../scripts/build-growth-pages.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROUTES = Object.freeze([
  "/guides/claude-identity-verification/",
  "/guides/claude-phone-verification/",
  "/guides/claude-account-disabled-appeal/",
]);

function pageFor(route) {
  const page = GROWTH_PAGES.find(({ path: pathname }) => pathname === route);
  assert.ok(page, `${route} registry entry`);
  return page;
}

function visibleText(page) {
  return [
    page.title,
    page.description,
    page.h1,
    page.deck,
    page.directAnswer,
    ...page.sections.flatMap(({ title, html }) => [title, html]),
  ].join(" ");
}

test("stored Claude HTML is synchronized with the registry renderer", async () => {
  for (const route of ROUTES) {
    const page = pageFor(route);
    const filename = path.join(ROOT, "site", "growth", route.slice(1), "index.html");
    assert.equal(await readFile(filename, "utf8"), renderGrowthPage(page), route);
  }
});

test("Claude pages keep KYC, phone OTP and account appeals under unique URL owners", () => {
  assert.deepEqual(
    GROWTH_PAGES.filter(({ path: pathname }) => pathname.startsWith("/guides/claude-"))
      .map(({ path: pathname }) => pathname),
    ROUTES,
  );
  assert.match(pageFor(ROUTES[0]).directAnswer, /政府签发.*实体证件.*实时自拍/);
  assert.match(pageFor(ROUTES[0]).directAnswer, /不是手机号短信验证/);
  assert.match(pageFor(ROUTES[1]).directAnswer, /六位代码/);
  assert.match(pageFor(ROUTES[1]).directAnswer, /VoIP.*Google Voice.*座机/);
  assert.match(pageFor(ROUTES[1]).directAnswer, /不能更改/);
  assert.match(pageFor(ROUTES[2]).directAnswer, /403.*不.*认定为封号/);
  assert.match(pageFor(ROUTES[2]).directAnswer, /官方申诉/);
});

test("Claude pages reject KYC bypass, temporary numbers and unsupported guarantees", () => {
  const unsafe = /(?:KYC|身份|验证|验证码|申诉)[^。；\n]{0,30}(?:包过|必过|保证通过|百分百|100%成功)|接码平台推荐|借证教程|假证教程|换号即可解封|修改地区即可解封/u;
  for (const route of ROUTES) {
    const text = visibleText(pageFor(route));
    assert.doesNotMatch(text, unsafe, route);
    assert.match(text, /不能|不保证|不要|不提供|不接收/, `${route} visible boundary`);
  }
});

test("Claude identity page records the official provider, controller and exhausted-attempt route", () => {
  const identity = pageFor(ROUTES[0]);
  const text = visibleText(identity);
  assert.match(text, /Persona Identities/);
  assert.match(text, /Anthropic 是数据控制者/);
  assert.match(text, /Persona 按 Anthropic 的指示/);
  assert.match(text, /用尽流程内提供的尝试次数/);
  assert.match(text, /https:\/\/claude\.com\/form\/identity-verification-help/);
});

test("Claude phone page preserves retry, unlink and long-term number rules", () => {
  const phone = pageFor(ROUTES[1]);
  const text = visibleText(phone);
  assert.match(text, /超过五分钟.*Try again/s);
  assert.match(text, /只使用最新一次收到的六位代码/);
  assert.match(text, /原账号联系官方 Support 请求 unlink/);
  assert.match(text, /尚未用于 Claude 验证的本人长期号码/);
  assert.match(text, /只接收验证码不在官方列出的保活动作中/);
});

test("only Claude phone verification has a direct consultation widget", async () => {
  for (const route of ROUTES) {
    const page = pageFor(route);
    const filename = path.join(ROOT, "site", "growth", route.slice(1), "index.html");
    const html = await readFile(filename, "utf8");
    const widgets = (html.match(/data-growth-slot="wechat-buying-guide-v1"/g) || []).length;
    assert.equal(widgets, page.commerceWidget === false ? 0 : 1, route);
    assert.match(html, /英国号码不能替代身份、年龄、地区资格或账号申诉/, route);
  }
  assert.equal(pageFor(ROUTES[0]).commerceWidget, false);
  assert.notEqual(pageFor(ROUTES[1]).commerceWidget, false);
  assert.equal(pageFor(ROUTES[2]).commerceWidget, false);
});

test("Claude account appeals points to the authenticated official route", () => {
  const appeal = pageFor(ROUTES[2]);
  assert.ok(appeal.sources.some(({ url }) => url === "https://claude.ai/restricted"));
  const section = appeal.sections.find(({ id }) => id === "prepare-appeal");
  assert.match(section?.html || "", /必须先登录被限制的原账号/);
  assert.match(section?.html || "", /https:\/\/claude\.ai\/restricted/);
  assert.match(section?.html || "", /匿名访问可能被拒绝/);
});

test("Claude appeal page keeps personal, organization and warning routes separate", () => {
  const appeal = pageFor(ROUTES[2]);
  const diagnose = appeal.sections.find(({ id }) => id === "diagnose")?.html || "";
  const bypass = appeal.sections.find(({ id }) => id === "do-not-bypass")?.html || "";
  assert.match(diagnose, /个人账号明确显示 disabled \/ terminated/);
  assert.match(diagnose, /Request a review/);
  assert.match(diagnose, /mailto:usersafety@anthropic\.com/);
  assert.match(diagnose, /该邮箱不能替代个人账号封禁申诉/);
  assert.match(diagnose, /身份帮助表单不能替代账号申诉/);
  assert.match(diagnose, /手机号验证故障.*不能使用封号申诉入口/s);
  assert.match(bypass, /新号码最多只可能.*证明号码控制权.*不能恢复既有账号/s);
  assert.doesNotMatch(bypass, /新号码[^。]{0,40}恢复作用/);
});

test("Claude identity and appeal pages never render a buying widget", async () => {
  for (const route of [ROUTES[0], ROUTES[2]]) {
    const filename = path.join(ROOT, "site", "growth", route.slice(1), "index.html");
    const html = await readFile(filename, "utf8");
    assert.equal(pageFor(route).commerceWidget, false, route);
    assert.doesNotMatch(html, /data-growth-slot="wechat-buying-guide-v1"/, route);
    assert.doesNotMatch(html, /点此购买/, route);
  }
});
