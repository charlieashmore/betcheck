// Price ingestion. Server-only. Mock mode writes seeded prices; live mode is stubbed.
import { BOOK_OUTCOMES, MOCK_MARKETS } from "./mock-data";

type Admin = (typeof import("@/integrations/supabase/client.server"))["supabaseAdmin"];

export async function ingestMock(admin: Admin, fixtureId: string, kalshiTicker: string, bookMarketId: string) {
  const m = MOCK_MARKETS[fixtureId];
  if (!m) return;
  const now = Date.now();
  const at = (s: number) => new Date(now - s * 1000).toISOString();
  const rows = [
    { source: "kalshi", market_id: kalshiTicker, outcome: "YES", price_or_odds: m.kalshiYes, fetched_at: at(m.kalshiAgeSeconds) },
    { source: "kalshi", market_id: kalshiTicker, outcome: "NO", price_or_odds: m.kalshiNo, fetched_at: at(m.kalshiAgeSeconds) },
    ...m.books.flatMap((b) =>
      b.odds.map((o, i) => ({ source: b.source, market_id: bookMarketId, outcome: BOOK_OUTCOMES[i] ?? "home", price_or_odds: o, fetched_at: at(b.ageSeconds) })),
    ),
  ];
  const { error } = await admin.from("price_snapshots").insert(rows);
  if (error) throw new Error(error.message);
}

/**
 * ingest-kalshi (live mode).
 * TODO: add KALSHI_API_KEY (and private key for request signing) as a project secret,
 * then fetch GET /trade-api/v2/markets/{ticker} and write YES/NO ask prices (in dollars)
 * into price_snapshots with source = "kalshi".
 */
export async function ingestKalshi(_admin: Admin, _ticker: string): Promise<void> {
  throw new Error("Live Kalshi ingestion is not configured yet (missing KALSHI_API_KEY).");
}

/**
 * ingest-odds (live mode).
 * TODO: add ODDS_API_KEY for an aggregator with Pinnacle / Betfair Exchange coverage,
 * fetch decimal odds for each mapped book_market_id and write one row per outcome
 * (home/draw/away) into price_snapshots with source = bookmaker name.
 */
export async function ingestOdds(_admin: Admin, _bookMarketId: string): Promise<void> {
  throw new Error("Live odds ingestion is not configured yet (missing ODDS_API_KEY).");
}
