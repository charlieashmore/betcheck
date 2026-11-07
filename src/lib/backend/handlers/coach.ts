// @ts-nocheck -- ported verbatim from the backend team (kalshi-safe-betting, backend branch); written for Deno strictness.
// POST /coach  { "language": "English", "plain_language": true }
// Runs detect -> forecast -> suggested limit, then asks the LLM to explain it.
// Returns the message plus both forecasts so the UI can show the evidence ("why am I seeing this?").
import { admin, corsHeaders, json, loadContext, resolveUserId, today } from "../db";
import { forecast } from "../forecast";
import { buildFacts, coach } from "../coach";
import { flaggedList, gamblingChangePct, suggestWeeklyLimit } from "../insights";

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const db = await admin();
    const userId = await resolveUserId(req, db);
    if (!userId) return json({ error: "Not signed in" }, 401);
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const ctx = await loadContext(db, userId);
    const asOf = today();

    const input = { transactions: ctx.transactions, classifications: ctx.classifications, startingBalance: ctx.balance, asOf };
    const baseline = forecast(input);
    const { limit, result: withLimit } = suggestWeeklyLimit(input, baseline.gambling_weekly_pace);
    const flagged = flaggedList(ctx.transactions, ctx.classifications);
    const change = gamblingChangePct(ctx.transactions, ctx.classifications, asOf);

    const facts = buildFacts(
      ctx.firstName, baseline, withLimit, limit,
      flagged.map((f) => ({ description: f.description, amount: Math.abs(f.amount), reason: f.reason })),
      change,
    );
    const message = await coach(facts, {
      language: body.language ?? ctx.language,
      plainLanguage: body.plain_language ?? ctx.plainLanguage,
    });

    await db.from("bc_coach_messages").insert({ user_id: userId, facts, message });

    return json({
      message,
      evidence: { facts, flagged, gambling_change_pct: change },
      forecast: { baseline, with_suggested_limit: withLimit, suggested_weekly_limit: limit },
    });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
}
