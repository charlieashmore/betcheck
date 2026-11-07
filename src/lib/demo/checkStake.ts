import { forecast, profile, type Market } from "./data";

export type Limits = { weekly: number | null; perBet: number | null };

export type StakeResult = {
  verdict: "not-affordable" | "overvalued" | "ok";
  hiddenCost: number;
  rentDayAfter: number;
  rules: { label: string; ok: boolean }[];
};

/** Pure stake check used by the demo UI. */
export function checkStake(market: Market, stake: number, limits: Limits, paused: boolean, hour = 16): StakeResult {
  const shares = stake / (market.price / 100);
  const hiddenCost = Math.max(0, Math.round((stake - shares * (market.fair / 100)) * 100) / 100);
  const remaining = limits.weekly == null ? Infinity : limits.weekly - profile.weeklySpentOnBetting;
  const rentDayAfter = forecast.current.rentDay - stake;
  const rules = [
    { label: "No 48-hour pause active", ok: !paused },
    { label: limits.perBet == null ? "No per-bet maximum set" : `Within your £${limits.perBet} per-bet maximum`, ok: limits.perBet == null || stake <= limits.perBet },
    { label: limits.weekly == null ? "No weekly limit set" : `Within what's left of your weekly limit`, ok: stake <= remaining },
    { label: "Rent day stays above £0", ok: rentDayAfter >= 0 },
    { label: "Not placed late at night", ok: hour >= 6 && hour < 23 },
    { label: "Price is at or below the fair price", ok: hiddenCost < 0.5 },
  ];
  const affordable = rules.slice(0, 5).every((r) => r.ok);
  return { verdict: !affordable ? "not-affordable" : hiddenCost >= 0.5 ? "overvalued" : "ok", hiddenCost, rentDayAfter, rules };
}
