// @ts-nocheck -- mirrors the backend team's Deno test file
import { describe, expect, it } from "vitest";
import fx from "./fixtures.json";
import { classifyWithRules } from "../detect";
import { MOCK_MARKETS, quote } from "../mockMarkets";
import { evaluateStake } from "../stakecheck";
import { buildOverlay, prettify } from "../overlay";

const txs = fx.transactions as any[];
const cs = classifyWithRules(txs);
const noLimits = { weekly_gambling_limit: null, per_bet_max: null, self_exclusion_until: null };
const overlayFor = (id: string, side: "yes" | "no", stake: number, limits: any = noLimits) => {
  const m = MOCK_MARKETS[id], q = quote(m, side);
  const evaluation = evaluateStake({ transactions: txs, classifications: cs, balance: fx.balance, asOf: fx.today, now: new Date("2026-11-07T16:00:00Z"), limits, stake, price: q.price, platform: "other", bookmakerOdds: q.bookmakerOdds });
  return buildOverlay({ evaluation, marketTitle: m.title, side, price: q.price, stake, limits, suggestedWeeklyLimit: 30 });
};

describe("overlay-check", () => {
  it("£40 on City YES blocks with rent-day wording and £3.49 hidden cost", () => {
    const o = overlayFor("city", "yes", 40);
    expect(o.status).toBe("block");
    expect(o.headline).toMatch(/short when rent is due on 28 November/);
    expect(o.hidden_cost.message).toContain("about 10% over the fair price, roughly £3.49");
  });
  it("rent-day message still leads after a limit is set", () => {
    const o = overlayFor("city", "yes", 40, { ...noLimits, weekly_gambling_limit: 30 });
    expect(o.headline).toMatch(/rent/);
    expect(o.actions.find((a) => a.id === "set_weekly_limit")).toBeUndefined();
  });
  it("NO side flips odds; BoE has no benchmark", () => {
    expect(quote(MOCK_MARKETS.city, "no").bookmakerOdds).toEqual([2.1, 1.8]);
    expect(overlayFor("boe", "yes", 10).hidden_cost.message).toBe("No benchmark available for this market.");
  });
  it("prettifies dates and rent", () => {
    expect(prettify("OAKWOOD LETTINGS RENT is due on 2026-11-28")).toBe("rent is due on 28 November");
  });
});
