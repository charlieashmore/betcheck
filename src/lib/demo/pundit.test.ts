import { describe, expect, it } from "vitest";
import { PUNDIT_MARKETS, ticketCheckBody } from "./pundit";

const city = PUNDIT_MARKETS.find((market) => market.id === "city")!;
const boe = PUNDIT_MARKETS.find((market) => market.id === "boe")!;

describe("Pundit overlay check requests", () => {
  it("checks a YES order at 57p against the bookmaker odds in their original order", () => {
    expect(ticketCheckBody({ market: city, side: "yes", stake: 40 })).toMatchObject({
      platform: "other",
      price: 0.57,
      stake_gbp: 40,
      bookmaker_odds: [1.8, 2.1],
    });
  });

  it("uses the NO price and puts the NO bookmaker outcome first", () => {
    expect(ticketCheckBody({ market: city, side: "no", stake: 40 })).toMatchObject({
      price: 0.45,
      bookmaker_odds: [2.1, 1.8],
    });
  });

  it("omits bookmaker odds for the Bank of England market so no benchmark is shown", () => {
    expect(ticketCheckBody({ market: boe, side: "yes", stake: 10 }).bookmaker_odds).toBeUndefined();
  });
});
