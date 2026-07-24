import assert from "node:assert/strict";
import test from "node:test";

import { GROWTH_PAGES } from "../site/growth/content-registry.js";

const EXPECTED_UPDATED_AT = "2026-07-17";
const HIGH_INTENT_ANSWER_UPDATED_AT = "2026-07-20";
const TOOL_PRODUCT_UPDATED_AT = "2026-07-24";
const LOCAL_SEARCH_UPDATED_AT = "2026-07-24";
const EXPECTED_EXPIRY = "2026-08-22";

function growthPage(path) {
  const page = GROWTH_PAGES.find((entry) => entry.path === path);
  assert.ok(page, `${path} exists`);
  return page;
}

function sectionText(page, id) {
  const section = page.sections.find((entry) => entry.id === id);
  assert.ok(section, `${page.path}#${id} exists`);
  return section.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

test("E05 publishes dated answer-first boundaries on all indexable growth pages", () => {
  const pages = GROWTH_PAGES.filter((page) => page.indexPolicy === "index");
  assert.equal(pages.length, 15);
  for (const page of pages) {
    const expectedUpdatedAt = ["/tools/keep-number-reminder/", "/tools/china-roaming-cost/"].includes(page.path)
      ? TOOL_PRODUCT_UPDATED_AT
      : ["/guides/uk-sim-at-heathrow/", "/guides/manchester-student-sim/", "/guides/london-student-sim/"].includes(page.path)
        ? LOCAL_SEARCH_UPDATED_AT
      : ["/guides/9-number-balance-data-check/", "/guides/apn-settings/", "/more/esim-new-phone/", "/more/esim-deleted/", "/guides/claude-identity-verification/", "/guides/claude-phone-verification/", "/guides/claude-account-disabled-appeal/"].includes(page.path)
        ? HIGH_INTENT_ANSWER_UPDATED_AT
        : EXPECTED_UPDATED_AT;
    const expectedReviewedAt = expectedUpdatedAt;
    assert.equal(page.updatedAt, expectedUpdatedAt, `${page.path} updatedAt`);
    assert.equal(page.reviewedAt, expectedReviewedAt, `${page.path} reviewedAt`);
    assert.ok(page.directAnswer.length >= 70, `${page.path} self-contained direct answer`);
  }

  const expiringTools = pages.filter(({ path }) =>
    ["/tools/keep-number-reminder/", "/tools/china-roaming-cost/"].includes(path));
  for (const page of expiringTools) {
    assert.match(page.sections.map(({ html }) => html).join(" "), new RegExp(EXPECTED_EXPIRY));
  }
});

test("new high-intent pages keep APN, eSIM migration and deletion recovery distinct", () => {
  const account = growthPage("/guides/9-number-balance-data-check/");
  assert.match(account.directAnswer, /43430.*Number/);
  assert.match(account.directAnswer, /85075.*INFO/);
  assert.match(sectionText(account, "check-credit-and-plan"), /Usage statement/);

  const apn = growthPage("/guides/apn-settings/");
  assert.match(apn.directAnswer, /giffgaff\.com/);
  assert.match(apn.directAnswer, /IPv4v6/);
  assert.match(sectionText(apn, "when-apn-applies"), /有信号.*数据失败/);

  const migration = growthPage("/more/esim-new-phone/");
  assert.match(migration.directAnswer, /Replace my SIM/);
  assert.match(migration.directAnswer, /MFA/);
  assert.match(sectionText(migration, "before-moving"), /旧 eSIM|旧线路/);

  const deleted = growthPage("/more/esim-deleted/");
  assert.match(deleted.directAnswer, /至少等待 24 小时/);
  assert.match(sectionText(deleted, "two-swaps"), /实体 SIM.*(?:新|new) eSIM/);
});

test("arrival answer is an evidence-led acceptance check rather than a sales handoff", () => {
  const page = growthPage("/guides/7-arrival-checklist/");
  assert.match(page.directAnswer, /订单.*交付.*一致/);
  assert.match(page.directAnswer, /停止后续|暂停后续/);
  assert.match(page.directAnswer, /脱敏.*证据/);
  assert.match(page.directAnswer, /账号|号码状态|计费/);
  assert.match(page.directAnswer, /giffgaff 官方/);
  assert.doesNotMatch(page.directAnswer, /小玉|微信|购买|下单|推荐/);
});

test("UK SIM choice answer states coverage, eSIM, old-SIM and fit boundaries", () => {
  const page = growthPage("/guides/8-uk-sim-choice/");
  assert.match(page.directAnswer, /O2/);
  assert.match(page.directAnswer, /预测.*不.*保证|不是.*保证/);
  assert.match(page.directAnswer, /兼容.*无锁.*App/);
  assert.match(page.directAnswer, /旧.*SIM.*停止/);
  assert.match(page.directAnswer, /不适合|不要选择/);
  assert.ok(page.sources.some(({ url }) => url === "https://www.giffgaff.com/boiler-plate/terms"));
});

test("local-search pilots own distinct airport, Manchester and London decisions", () => {
  const heathrow = growthPage("/guides/uk-sim-at-heathrow/");
  assert.match(heathrow.directAnswer, /机场 Wi-Fi/);
  assert.match(heathrow.directAnswer, /不等于现场一定有 giffgaff 库存/);
  assert.match(sectionText(heathrow, "choose-branch"), /已有且已激活.*已有但尚未激活.*没有英国卡/);

  const manchester = growthPage("/guides/manchester-student-sim/");
  assert.match(manchester.directAnswer, /宿舍.*校区.*通勤/);
  assert.match(sectionText(manchester, "payg-or-contract"), /PAYG.*合约/);
  assert.match(sectionText(manchester, "first-week"), /高峰/);

  const london = growthPage("/guides/london-student-sim/");
  assert.match(london.directAnswer, /地铁.*分区段|区段.*变化/);
  assert.match(sectionText(london, "tube-check"), /TfL.*Wi-Fi.*隧道/);
  assert.match(sectionText(london, "arrival-versus-daily"), /机场落地.*第一周日常/);

  assert.notEqual(heathrow.title, manchester.title);
  assert.notEqual(manchester.title, london.title);
});

test("keep-number answer exposes the six-month rule, buffer formula and deactivation boundary", () => {
  const page = growthPage("/tools/keep-number-reminder/");
  assert.match(page.directAnswer, /最近一次.*有效动作.*\+.*6\s*个月/);
  assert.match(page.directAnswer, /第\s*5\s*个月.*缓冲/);
  assert.match(page.directAnswer, /不能重新激活/);
  assert.match(page.directAnswer, /30\s*天.*PAC/);
  assert.match(sectionText(page, "expired"), /不能重新激活/);
  assert.match(sectionText(page, "expired"), /30\s*天.*PAC/);
});

test("China roaming answer labels PAYG, publishes billing formulas and separates the data add-on", () => {
  const page = growthPage("/tools/china-roaming-cost/");
  assert.match(page.directAnswer, /PAYG/);
  assert.match(page.directAnswer, /MB\s*[×x]\s*£0\.20/);
  assert.match(page.directAnswer, /短信.*[×x]\s*£0\.30/);
  assert.match(page.directAnswer, /拨出.*30\s*秒.*最低/);
  assert.match(page.directAnswer, /接听.*向上取整/);
  assert.match(page.directAnswer, /Travel Data Add-on/);
  assert.match(sectionText(page, "method"), /逐通/);
  assert.match(sectionText(page, "method"), /Travel Data Add-on/);
  assert.ok(page.sources.some(({ url }) =>
    url === "https://help.giffgaff.com/en/articles/365501-giffgaff-travel-data-add-ons-and-how-they-work"));
});

test("G0/G2 calculator states its public cash formula and one-path-per-run contract", () => {
  const page = growthPage("/tools/g0-g2-total-cost/");
  assert.match(page.directAnswer, /现金支出\s*=\s*卡价\s*\+\s*运费\s*\+\s*首次充值\s*\+\s*预计额外使用支出/);
  assert.match(page.directAnswer, /一次.*一条.*路径|每次.*一条.*路径/);
  assert.match(page.directAnswer, /余额.*单独/);
  assert.match(page.directAnswer, /不.*折算|不.*抵扣/);
  assert.match(page.directAnswer, /G0.*G2.*分别/);
  assert.match(sectionText(page, "interpret"), /一次.*一条.*路径|每次.*一条.*路径/);
});
