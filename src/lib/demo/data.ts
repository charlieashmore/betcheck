// Frontend-only demo data. Replaced by the real backend later.
export const TODAY = new Date("2026-11-07T16:00:00Z");
export const RENT_DAY = new Date("2026-11-28T00:00:00Z");
export const RENT_DAY_INDEX = 21;
export const HORIZON_DAYS = 35;

export const profile = {
  name: "Priya",
  balance: 320,
  rent: 650,
  payday: "28 Nov",
  weeklySpentOnBetting: 45,
  bank: "Monzo (demo)",
};

export const forecast = {
  current: { rentDay: -148, shortChance: 0.93 },
  limited: { rentDay: 90, shortChance: 0.08 },
  suggestedWeeklyLimit: 30,
};

export type Band = { day: number; p10: number; p50: number; p90: number };

/** Deterministic band so the demo shows the same chart every time. */
export function buildBand(rentDayP50: number): Band[] {
  const out: Band[] = [];
  const slope = (rentDayP50 - profile.balance) / RENT_DAY_INDEX;
  for (let d = 0; d <= HORIZON_DAYS; d++) {
    const p50 =
      d <= RENT_DAY_INDEX
        ? profile.balance + slope * d
        : rentDayP50 + 1450 - profile.rent + slope * 0.6 * (d - RENT_DAY_INDEX);
    const spread = 18 * Math.sqrt(d) + (d > RENT_DAY_INDEX ? 40 : 0);
    out.push({ day: d, p10: Math.round(p50 - spread * 1.4), p50: Math.round(p50), p90: Math.round(p50 + spread) });
  }
  return out;
}

export type FlaggedTx = {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  kind: "betting" | "crypto" | "e-wallet";
  confidence: number;
  reasons: string[];
};

export const flagged: FlaggedTx[] = [
  { id: "t1", date: "6 Nov, 23:41", merchant: "Sky Bet", amount: 20, kind: "betting", confidence: 0.99, reasons: ["Betting merchant code 7995", "Known operator", "After 11pm"] },
  { id: "t2", date: "6 Nov, 23:58", merchant: "Sky Bet", amount: 20, kind: "betting", confidence: 0.99, reasons: ["Repeat top-up within 30 minutes", "Round amount"] },
  { id: "t3", date: "5 Nov, 19:12", merchant: "Coinbase", amount: 50, kind: "crypto", confidence: 0.62, reasons: ["Crypto top-up", "Round amount", "Two days after payday-like income"] },
  { id: "t4", date: "3 Nov, 22:05", merchant: "Skrill", amount: 25, kind: "e-wallet", confidence: 0.55, reasons: ["E-wallet top-up", "Often used to fund betting accounts"] },
  { id: "t5", date: "1 Nov, 14:30", merchant: "Paddy Power", amount: 15, kind: "betting", confidence: 0.98, reasons: ["Betting merchant code 7995", "Known operator"] },
  { id: "t6", date: "30 Oct, 00:22", merchant: "Polymarket via Coinbase", amount: 40, kind: "crypto", confidence: 0.71, reasons: ["Crypto top-up", "After midnight"] },
];

export type Market = {
  id: string;
  platform: "Kalshi" | "Polymarket";
  title: string;
  outcome: string;
  price: number; // pence per share, 0-100
  fair: number; // bookmaker-implied fair price after fees, pence
  odds: [number, number]; // bookmaker decimal odds: this outcome first, then the other
  closes: string;
};

export const markets: Market[] = [
  { id: "ars-che", platform: "Kalshi", title: "Arsenal vs Chelsea — who wins?", outcome: "Arsenal", price: 57, fair: 52.03, odds: [1.8, 2.1], closes: "Sat 8 Nov, 17:30" },
  { id: "liv-mci", platform: "Polymarket", title: "Liverpool vs Man City — who wins?", outcome: "Man City", price: 41, fair: 42.5, odds: [2.3, 1.7], closes: "Sun 9 Nov, 16:30" },
  { id: "tot-new", platform: "Kalshi", title: "Spurs vs Newcastle — over 2.5 goals?", outcome: "Yes", price: 63, fair: 60.1, odds: [1.6, 2.45], closes: "Sun 9 Nov, 14:00" },
];

export const support = [
  { name: "GamCare", detail: "Free, confidential support for anyone affected by gambling.", phone: "0808 8020 133", href: "https://www.gamcare.org.uk" },
  { name: "BeGambleAware", detail: "Advice, tools and a directory of local treatment.", phone: "0808 8020 133", href: "https://www.begambleaware.org" },
  { name: "StepChange", detail: "Free debt advice if bills or rent are hard to cover.", phone: "0800 138 1111", href: "https://www.stepchange.org" },
];

export const gbp = (n: number) =>
  `${n < 0 ? "-" : ""}£${Math.abs(n).toLocaleString("en-GB", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
