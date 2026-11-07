// @ts-nocheck -- ported verbatim from the backend team (betcheck-overlay package); written for Deno strictness.
// One stake evaluation used by check-stake, overlay-check and the mock page's built-in engine.
import { forecast } from "./forecast";
import { affordability, deMargin, hiddenCost, overall } from "./stake";
import type { Classification, Limits, Transaction } from "./types";

export interface StakeInput {
  transactions: Transaction[];
  classifications: Classification[];
  balance: number;
  asOf: string;
  now: Date;
  limits: Limits;
  stake: number;
  price: number;
  platform?: string;
  bookmakerOdds?: number[] | null;
  fairProbability?: number | null;
}

export function evaluateStake(i: StakeInput) {
  const input = { transactions: i.transactions, classifications: i.classifications, startingBalance: i.balance, asOf: i.asOf };
  const without = forecast(input);
  const withStake = forecast({ ...input, extraOutflowToday: i.stake });
  const rules = affordability({
    stake: i.stake, limits: i.limits, transactions: i.transactions, classifications: i.classifications,
    now: i.now, forecastWithStake: withStake, forecastWithout: without,
  });

  let fair: number | null = null;
  if (i.bookmakerOdds && i.bookmakerOdds.length >= 2) fair = deMargin(i.bookmakerOdds)[0];
  else if (typeof i.fairProbability === "number") fair = i.fairProbability;
  const cost = fair !== null ? hiddenCost({ platform: i.platform ?? "other", price: i.price, fairProbability: fair, stake: i.stake }) : null;

  const status = overall(rules);
  // Lead with the forecast when it blocks: "short on rent day" means more than a limit number
  const blockRule = rules.find((r) => r.status === "block" && r.rule === "forecast") ?? rules.find((r) => r.status === "block");
  const headline = status === "block"
    ? (blockRule?.reason ?? "This one doesn't fit your budget.")
    : status === "warn"
    ? (rules.find((r) => r.status === "warn")?.reason ?? "Worth a second look.")
    : "This fits within your budget.";

  const bill = withStake.next_big_bill;
  return {
    status, headline, rules,
    hidden_cost: cost
      ? { ...cost, message: cost.verdict === "above_market"
          ? `You're paying about ${cost.overpay_pct}% over the fair price, roughly £${cost.hidden_cost_gbp} of this stake.`
          : cost.verdict === "below_market"
          ? `This price is about ${Math.abs(cost.overpay_pct)}% below the fair price from the betting market.`
          : "This price is in line with the betting-market consensus." }
      : { message: "No benchmark available for this market." },
    forecast_impact: bill ? {
      bill: bill.description, date: bill.date,
      typical_balance_without: without.balance_at_next_big_bill?.p50 ?? null,
      typical_balance_with: withStake.balance_at_next_big_bill?.p50 ?? null,
      shortfall_chance_without: without.shortfall_probability,
      shortfall_chance_with: withStake.shortfall_probability,
    } : null,
    disclaimer: "Information only, not financial or betting advice.",
  };
}

export type StakeEvaluation = ReturnType<typeof evaluateStake>;
