// @ts-nocheck -- ported verbatim from the backend team (betcheck-overlay package); written for Deno strictness.
// The three Pundit Markets (mock) markets. The server owns prices and bookmaker odds,
// so the overlay never trusts a price sent from the browser.

export interface MockMarket {
  id: string;
  title: string;
  yes: number; // price of YES, 0..1
  no: number; // price of NO, 0..1
  // Sharp bookmaker decimal odds for [this outcome happens, it doesn't]; null = no benchmark
  odds: [number, number] | null;
  oddsNote: string;
}

export const MOCK_MARKETS: Record<string, MockMarket> = {
  city: {
    id: "city", title: "Will Man City beat Arsenal?", yes: 0.57, no: 0.45, odds: [1.8, 2.1],
    oddsNote: "City win 1.80, draw or Arsenal 2.10",
  },
  liv: {
    id: "liv", title: "Will Liverpool beat Chelsea?", yes: 0.48, no: 0.54, odds: [2.05, 1.85],
    oddsNote: "Liverpool win 2.05, draw or Chelsea 1.85",
  },
  boe: {
    id: "boe", title: "Will the Bank of England cut rates in December?", yes: 0.62, no: 0.4, odds: null,
    oddsNote: "No bookmaker market to compare with",
  },
};

/** Price and the bookmaker odds oriented to the side being bought. */
export function quote(market: MockMarket, side: "yes" | "no") {
  return {
    price: side === "yes" ? market.yes : market.no,
    bookmakerOdds: market.odds ? (side === "yes" ? market.odds : [market.odds[1], market.odds[0]]) : null,
  };
}
