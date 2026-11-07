// MOCK data mode fixtures. Prices are re-stamped relative to "now" on every check
// so freshness rules behave realistically. Odds are [home, draw, away].
export interface MockMarket {
  kalshiYes: number;
  kalshiNo: number;
  kalshiAgeSeconds: number;
  books: { source: string; odds: [number, number, number]; ageSeconds: number }[];
}

export const MOCK_MARKETS: Record<string, MockMarket> = {
  fx01: { kalshiYes: 0.48, kalshiNo: 0.54, kalshiAgeSeconds: 6, books: [
    { source: "pinnacle", odds: [2.1, 3.5, 3.6], ageSeconds: 8 },
    { source: "betfair_exchange", odds: [2.14, 3.55, 3.7], ageSeconds: 4 },
    { source: "smarkets", odds: [2.12, 3.5, 3.65], ageSeconds: 12 } ] },
  fx02: { kalshiYes: 0.35, kalshiNo: 0.67, kalshiAgeSeconds: 5, books: [
    { source: "pinnacle", odds: [2.6, 3.7, 2.65], ageSeconds: 9 },
    { source: "betfair_exchange", odds: [2.64, 3.75, 2.7], ageSeconds: 3 } ] },
  fx03: { kalshiYes: 0.36, kalshiNo: 0.66, kalshiAgeSeconds: 7, books: [
    { source: "pinnacle", odds: [2.3, 3.6, 3.1], ageSeconds: 10 },
    { source: "betfair_exchange", odds: [2.32, 3.65, 3.15], ageSeconds: 6 },
    { source: "smarkets", odds: [2.3, 3.6, 3.1], ageSeconds: 15 } ] },
  fx04: { kalshiYes: 0.6, kalshiNo: 0.42, kalshiAgeSeconds: 4, books: [
    { source: "pinnacle", odds: [1.55, 4.6, 5.5], ageSeconds: 5 },
    { source: "betfair_exchange", odds: [1.56, 4.7, 5.6], ageSeconds: 7 } ] },
  // Sharp sources disagree by ~8 points -> "Market uncertain"
  fx05: { kalshiYes: 0.47, kalshiNo: 0.55, kalshiAgeSeconds: 6, books: [
    { source: "pinnacle", odds: [1.9, 3.6, 4.2], ageSeconds: 6 },
    { source: "betfair_exchange", odds: [2.25, 3.4, 3.3], ageSeconds: 5 },
    { source: "smarkets", odds: [2.0, 3.5, 3.9], ageSeconds: 11 } ] },
  fx06: { kalshiYes: 0.71, kalshiNo: 0.31, kalshiAgeSeconds: 5, books: [
    { source: "pinnacle", odds: [1.4, 5.0, 7.5], ageSeconds: 4 },
    { source: "betfair_exchange", odds: [1.41, 5.1, 7.8], ageSeconds: 9 } ] },
  // One source is 4 minutes old -> refused as stale
  fx07: { kalshiYes: 0.44, kalshiNo: 0.58, kalshiAgeSeconds: 8, books: [
    { source: "pinnacle", odds: [2.2, 3.5, 3.3], ageSeconds: 240 },
    { source: "betfair_exchange", odds: [2.22, 3.55, 3.35], ageSeconds: 6 },
    { source: "smarkets", odds: [2.2, 3.5, 3.3], ageSeconds: 10 } ] },
  fx08: { kalshiYes: 0.47, kalshiNo: 0.55, kalshiAgeSeconds: 3, books: [
    { source: "pinnacle", odds: [2.0, 3.4, 4.0], ageSeconds: 7 },
    { source: "betfair_exchange", odds: [2.02, 3.45, 4.1], ageSeconds: 5 } ] },
  // No bookmaker mapping exists for fx09
  fx09: { kalshiYes: 0.52, kalshiNo: 0.5, kalshiAgeSeconds: 5, books: [] },
  fx10: { kalshiYes: 0.45, kalshiNo: 0.57, kalshiAgeSeconds: 4, books: [
    { source: "pinnacle", odds: [1.85, 3.8, 4.1], ageSeconds: 6 },
    { source: "betfair_exchange", odds: [1.86, 3.85, 4.2], ageSeconds: 8 },
    { source: "smarkets", odds: [1.85, 3.8, 4.1], ageSeconds: 13 } ] },
};

export const BOOK_OUTCOMES = ["home", "draw", "away"] as const;
