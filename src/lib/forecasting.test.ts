import { describe, expect, it } from "vitest";
import { expectedReturnPerDollar, projectForecast } from "./forecasting";

describe("forecasting", () => {
  it("expected return is fair / cost - 1", () => {
    expect(expectedReturnPerDollar(0.5, 0.55)).toBeCloseTo(-0.0909, 3);
  });
  it("falls back to fee drag when no benchmark", () => {
    expect(expectedReturnPerDollar(undefined, undefined)).toBe(-0.07);
  });
  it("12 months of $10 x 1/week at -10% costs about $52", () => {
    const p = projectForecast({ stake: 10, tradesPerWeek: 1, expectedReturnPerDollar: -0.1, savingsApy: 0, months: 12 });
    expect(p[12]!.staked).toBe(520);
    expect(p[12]!.tradingExpected).toBe(-52);
    expect(p[12]!.savingsValue).toBe(520);
  });
  it("savings compound with interest", () => {
    const p = projectForecast({ stake: 10, tradesPerWeek: 1, expectedReturnPerDollar: 0, savingsApy: 0.04, months: 12 });
    expect(p[12]!.savingsValue).toBeGreaterThan(520);
  });
});
