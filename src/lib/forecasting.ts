// Pure "financial time travel" projection. No I/O. Unit-tested in forecasting.test.ts.

export interface ForecastInput {
  stake: number;
  tradesPerWeek: number;
  /** Expected return per $1 staked, e.g. -0.05 = lose 5p per $1 on average. */
  expectedReturnPerDollar: number;
  savingsApy: number;
  months: number;
}

export interface ForecastPoint {
  month: number;
  staked: number;
  tradingExpected: number; // expected net P/L (negative = cost)
  savingsValue: number; // same money set aside with interest
}

const WEEKS_PER_MONTH = 52 / 12;

/** Expected return per $ from fair probability and effective cost per contract (payout $1). */
export function expectedReturnPerDollar(fair: number | undefined, effectiveCost: number | undefined, fallbackFeeDrag = 0.07): number {
  if (fair && effectiveCost && effectiveCost > 0) return fair / effectiveCost - 1;
  return -fallbackFeeDrag;
}

export function projectForecast(i: ForecastInput): ForecastPoint[] {
  const monthlyStake = i.stake * i.tradesPerWeek * WEEKS_PER_MONTH;
  const r = i.savingsApy / 12;
  const out: ForecastPoint[] = [];
  let savings = 0;
  for (let m = 0; m <= i.months; m++) {
    if (m > 0) savings = savings * (1 + r) + monthlyStake;
    const staked = monthlyStake * m;
    out.push({
      month: m,
      staked: round(staked),
      tradingExpected: round(staked * i.expectedReturnPerDollar),
      savingsValue: round(savings),
    });
  }
  return out;
}

const round = (n: number) => Math.round(n * 100) / 100;
