import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runAffordability, type PlacedTradeLite } from "./affordability";
import { runBenchmark, kalshiFeePerContract, type KalshiQuote, type SourceQuote } from "./benchmark";
import { AFFORDABILITY_CONFIG, DATA_MODE, EXCLUSION_PERIODS, INELIGIBLE_COUNTRIES, RULES_VERSION } from "./config";
import { applyDuePending, planLimitChange, type LimitState } from "./limits";

const num = (v: unknown) => Number(v);

// ---------- Limits ----------

export const getLimitsState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("limits").select("*").eq("user_id", context.userId).maybeSingle();
    let limits: LimitState | null = row
      ? {
          monthly_income_after_essentials: num(row.monthly_income_after_essentials),
          monthly_stake_limit: num(row.monthly_stake_limit),
          per_bet_max: num(row.per_bet_max),
          monthly_loss_limit: num(row.monthly_loss_limit),
          pending_increase: (row.pending_increase as LimitState["pending_increase"]) ?? null,
          effective_at: row.effective_at,
        }
      : null;
    if (limits) {
      const due = applyDuePending(limits, new Date());
      if (due.changed) {
        limits = due.state;
        await supabaseAdmin.from("limits").update({ ...limits, updated_at: new Date().toISOString() }).eq("user_id", context.userId);
      }
    }
    const { data: ex } = await supabaseAdmin
      .from("exclusions")
      .select("until")
      .eq("user_id", context.userId)
      .gt("until", new Date().toISOString())
      .order("until", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: profile } = await supabaseAdmin.from("profiles").select("country, dob_confirmed").eq("id", context.userId).maybeSingle();
    return { limits, excludedUntil: ex?.until ?? null, hasProfile: !!profile?.dob_confirmed };
  });

export const completeProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ country: z.string().length(2), adult: z.literal(true) }).parse(d))
  .handler(async ({ data, context }) => {
    const country = data.country.toUpperCase();
    if (INELIGIBLE_COUNTRIES.includes(country)) throw new Error("Stakewise is not available in your country.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("profiles").upsert({ id: context.userId, country, dob_confirmed: true });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const limitValues = z.object({
  monthly_income_after_essentials: z.number().min(0).max(1_000_000),
  monthly_stake_limit: z.number().min(0).max(1_000_000),
  per_bet_max: z.number().min(0).max(1_000_000),
  monthly_loss_limit: z.number().min(0).max(1_000_000),
});

export const saveLimits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => limitValues.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("limits").select("*").eq("user_id", context.userId).maybeSingle();
    const now = new Date();
    if (!row) {
      const { error } = await supabaseAdmin.from("limits").insert({ user_id: context.userId, ...data });
      if (error) throw new Error(error.message);
      return { scheduled: false };
    }
    const current: LimitState = {
      monthly_income_after_essentials: num(row.monthly_income_after_essentials),
      monthly_stake_limit: num(row.monthly_stake_limit),
      per_bet_max: num(row.per_bet_max),
      monthly_loss_limit: num(row.monthly_loss_limit),
      pending_increase: (row.pending_increase as LimitState["pending_increase"]) ?? null,
      effective_at: row.effective_at,
    };
    const next = planLimitChange(applyDuePending(current, now).state, data, now);
    const { error } = await supabaseAdmin
      .from("limits")
      .update({ ...next, updated_at: now.toISOString() })
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { scheduled: !!next.pending_increase };
  });

export const startExclusion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ period: z.enum(["1d", "7d", "30d", "6m"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const p = EXCLUSION_PERIODS.find((x) => x.id === data.period)!;
    const until = new Date(Date.now() + p.ms).toISOString();
    const { error } = await supabaseAdmin.from("exclusions").insert({ user_id: context.userId, until });
    if (error) throw new Error(error.message);
    return { until };
  });

// ---------- run-check ----------

const checkInput = z.object({
  fixtureId: z.string().min(1).max(50),
  side: z.enum(["YES", "NO"]),
  stake: z.number().positive().max(1_000_000).optional(),
  contracts: z.number().int().positive().max(1_000_000).optional(),
  localHour: z.number().int().min(0).max(23),
});

export const runCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => checkInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { supabase, userId } = context;
    const now = new Date();

    const { data: fixture, error: fxErr } = await supabase.from("fixtures").select("*").eq("id", data.fixtureId).single();
    if (fxErr || !fixture) throw new Error("Fixture not found");

    const { data: mappings } = await supabase.from("market_mappings").select("*").eq("fixture_id", fixture.id).eq("verified", true);
    const mapped = mappings ?? [];
    const bookMarketId = mapped[0]?.book_market_id ?? `${fixture.id}-1x2`;

    if (DATA_MODE === "mock") {
      await (await import("./ingest.server")).ingestMock(supabaseAdmin, fixture.id, fixture.kalshi_ticker, bookMarketId);
    } else {
      const ingest = await import("./ingest.server");
      await ingest.ingestKalshi(supabaseAdmin, fixture.kalshi_ticker);
      for (const m of mapped) await ingest.ingestOdds(supabaseAdmin, m.book_market_id);
    }

    // Latest snapshot per (source, market, outcome)
    const { data: snaps } = await supabase
      .from("price_snapshots")
      .select("*")
      .in("market_id", [fixture.kalshi_ticker, bookMarketId])
      .order("fetched_at", { ascending: false })
      .limit(200);
    const latest = new Map<string, { price: number; at: string }>();
    for (const s of snaps ?? []) {
      const k = `${s.source}|${s.market_id}|${s.outcome}`;
      if (!latest.has(k)) latest.set(k, { price: num(s.price_or_odds), at: s.fetched_at });
    }
    const ky = latest.get(`kalshi|${fixture.kalshi_ticker}|YES`);
    const kn = latest.get(`kalshi|${fixture.kalshi_ticker}|NO`);
    const kalshi: KalshiQuote | null = ky && kn ? { yesPrice: ky.price, noPrice: kn.price, fetchedAt: ky.at < kn.at ? ky.at : kn.at } : null;

    const sources: SourceQuote[] = [];
    for (const m of mapped) {
      const outs = ["home", "draw", "away"].map((o) => latest.get(`${m.source}|${m.book_market_id}|${o}`));
      if (outs.some((o) => !o)) continue;
      const oldest = outs.reduce((a, o) => (o!.at < a ? o!.at : a), outs[0]!.at);
      sources.push({ source: m.source, odds: outs.map((o) => o!.price), targetIndex: 0, fetchedAt: oldest });
    }

    // Stake (from USD or contracts)
    let stake = data.stake ?? 0;
    if (data.contracts) {
      if (!kalshi) throw new Error("No Kalshi price available to convert contracts to a stake.");
      const p = data.side === "YES" ? kalshi.yesPrice : kalshi.noPrice;
      stake = Math.round(data.contracts * (p + kalshiFeePerContract(p)) * 100) / 100;
    }
    if (!(stake > 0)) throw new Error("Enter a stake or number of contracts.");

    // Affordability inputs
    const { data: profile } = await supabase.from("profiles").select("dob_confirmed").eq("id", userId).maybeSingle();
    if (!profile?.dob_confirmed) throw new Error("Confirm your age and country first.");
    const { data: limRow } = await supabase.from("limits").select("*").eq("user_id", userId).maybeSingle();
    if (!limRow) throw new Error("Set your limits first.");
    const { data: ex } = await supabase.from("exclusions").select("until").gt("until", now.toISOString()).order("until", { ascending: false }).limit(1).maybeSingle();

    const { data: trades } = await supabase.from("placed_trades").select("check_id, outcome, placed").eq("placed", true).limit(500);
    const tradeIds = (trades ?? []).map((t) => t.check_id);
    const { data: tradeChecks } = tradeIds.length
      ? await supabase.from("checks").select("id, stake, created_at").in("id", tradeIds)
      : { data: [] as { id: string; stake: number; created_at: string }[] };
    const byId = new Map((tradeChecks ?? []).map((c) => [c.id, c]));
    const placed = (trades ?? [])
      .map((t) => ({ ...t, c: byId.get(t.check_id) }))
      .filter((t) => t.c)
      .sort((a, b) => (a.c!.created_at < b.c!.created_at ? 1 : -1));
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const thisMonth = placed.filter((t) => t.c!.created_at >= monthStart);
    const recentPlaced: PlacedTradeLite[] = placed.map((t) => ({ stake: num(t.c!.stake), outcome: (t.outcome as "won" | "lost" | null) ?? null }));

    const windowStart = new Date(now.getTime() - AFFORDABILITY_CONFIG.frequencyWindowMinutes * 60_000).toISOString();
    const { count } = await supabase.from("checks").select("id", { count: "exact", head: true }).gte("created_at", windowStart);

    const affordability = runAffordability({
      stake,
      limits: { monthly_stake_limit: num(limRow.monthly_stake_limit), per_bet_max: num(limRow.per_bet_max), monthly_loss_limit: num(limRow.monthly_loss_limit) },
      selfExcludedUntil: ex?.until ?? null,
      monthStakesTotal: thisMonth.reduce((a, t) => a + num(t.c!.stake), 0),
      monthLossesTotal: thisMonth.filter((t) => t.outcome === "lost").reduce((a, t) => a + num(t.c!.stake), 0),
      recentPlaced,
      checksInWindow: count ?? 0,
      localHour: data.localHour,
      now,
    });
    const benchmark = runBenchmark({ side: data.side, kalshi, sources, hasMapping: mapped.length > 0, now });

    const { data: inserted, error } = await supabase
      .from("checks")
      .insert({
        user_id: userId,
        fixture_id: fixture.id,
        side: data.side,
        stake,
        inputs: { ...data, data_mode: DATA_MODE, kalshi, sources } as never,
        affordability_result: affordability as never,
        benchmark_result: benchmark as never,
        rules_version: RULES_VERSION,
      })
      .select("id, created_at")
      .single();
    if (error) throw new Error(error.message);

    return { id: inserted.id, createdAt: inserted.created_at, fixture, side: data.side, stake, affordability, benchmark };
  });
