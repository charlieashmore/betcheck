import { describe, expect, it } from "vitest";
import { checkStake } from "./checkStake";
import { markets } from "./data";

const ars = markets[0]!;
describe("checkStake", () => {
  it("£40 at 57p has about £3.49 hidden cost", () => {
    expect(checkStake(ars, 40, { weekly: null, perBet: null }, false).hiddenCost).toBeCloseTo(3.49, 1);
  });
  it("a stake that sinks rent day is not affordable", () => {
    expect(checkStake(ars, 40, { weekly: null, perBet: null }, false).verdict).toBe("not-affordable");
  });
  it("an active pause blocks the bet", () => {
    expect(checkStake(ars, 1, { weekly: null, perBet: null }, true).rules[0].ok).toBe(false);
  });
});
