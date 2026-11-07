// @ts-nocheck -- ported from the backend team (betcheck-overlay package); Deno env swapped for the shared clock and bc_ tables.
// POST /overlay-check  { "market_id": "city" | "liv" | "boe", "side": "yes" | "no", "stake_gbp": 40 }
// The server owns prices and odds, evaluates the stake, logs it to the audit table, and returns the overlay ready to render.
import { admin, corsHeaders, json, loadContext, resolveUserId } from "../db";
import { nowUtc, today } from "../clock";
import { MOCK_MARKETS, quote } from "../mockMarkets";
import { evaluateStake } from "../stakecheck";
import { buildOverlay } from "../overlay";
import { forecast } from "../forecast";
import { suggestWeeklyLimit } from "../insights";

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const db = await admin();
    const userId = await resolveUserId(req, db);
    if (!userId) return json({ error: "Not signed in" }, 401);

    const body = await req.json().catch(() => ({}));
    const market = MOCK_MARKETS[String(body.market_id)];
    const side = body.side === "no" ? "no" : body.side === "yes" ? "yes" : null;
    const stake = Math.round(Number(body.stake_gbp) * 100) / 100;
    if (!market) return json({ error: `Unknown market_id. Use one of: ${Object.keys(MOCK_MARKETS).join(", ")}` }, 400);
    if (!side) return json({ error: "side must be \"yes\" or \"no\"" }, 400);
    if (!(stake > 0) || stake > 10000) return json({ error: "stake_gbp must be between 0 and 10,000" }, 400);

    const ctx = await loadContext(db, userId);
    const asOf = today();
    const now = nowUtc();
    const { price, bookmakerOdds } = quote(market, side);

    if (ctx.limits.self_exclusion_until && new Date(ctx.limits.self_exclusion_until) > now) {
      return json({ status: "paused", status_label: "Paused", headline: `Betting paused until ${ctx.limits.self_exclusion_until}`, paused_until: ctx.limits.self_exclusion_until,
        actions: [{ id: "close", label: "Close", primary: true }], disclaimer: "Information only, not financial or betting advice." });
    }

    const evaluation = evaluateStake({
      transactions: ctx.transactions, classifications: ctx.classifications, balance: ctx.balance, asOf, now,
      limits: ctx.limits, stake, price, platform: "other", bookmakerOdds,
    });
    const base = forecast({ transactions: ctx.transactions, classifications: ctx.classifications, startingBalance: ctx.balance, asOf });
    const { limit } = suggestWeeklyLimit(
      { transactions: ctx.transactions, classifications: ctx.classifications, startingBalance: ctx.balance, asOf },
      base.gambling_weekly_pace,
    );
    const overlay = buildOverlay({ evaluation, marketTitle: market.title, side, price, stake, limits: ctx.limits, suggestedWeeklyLimit: limit });

    const { data: logged } = await db.from("bc_checks").insert({
      user_id: userId, platform: "pundit-mock", market_title: market.title,
      inputs: { market_id: market.id, side, stake_gbp: stake, price, bookmaker_odds: bookmakerOdds },
      result: { ...overlay, hidden_cost: { ...overlay.hidden_cost, hidden_cost_gbp: evaluation.hidden_cost.hidden_cost_gbp ?? 0 } },
      rules_version: "2026-11-07.2",
    }).select("id").single();

    return json({ check_id: logged?.id ?? null, ...overlay });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
}
