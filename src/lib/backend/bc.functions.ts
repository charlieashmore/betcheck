import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PERSONAS } from "./personas";

const FNS = ["check-stake", "classify-transactions", "coach", "feedback", "forecast", "limits"] as const;
export type BcFn = (typeof FNS)[number];
const persona = z.enum(["priya", "marcus"]).default("priya");

/** Calls one of the backend team's handlers in-process with their original JSON contract, as the chosen demo persona. */
export const callBc = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ fn: z.enum(FNS), method: z.enum(["GET", "POST"]).default("POST"), body: z.record(z.string(), z.unknown()).optional(), persona }).parse(d),
  )
  .handler(async ({ data }) => {
    const mods = {
      "check-stake": () => import("./handlers/check-stake"),
      "classify-transactions": () => import("./handlers/classify-transactions"),
      coach: () => import("./handlers/coach"),
      feedback: () => import("./handlers/feedback"),
      forecast: () => import("./handlers/forecast"),
      limits: () => import("./handlers/limits"),
    } as const;
    const handler = (await mods[data.fn]()).default as (r: Request) => Promise<Response>;
    const req = new Request(`http://internal/${data.fn}`, {
      method: data.method,
      headers: { "content-type": "application/json", "x-demo-user": PERSONAS[data.persona].id },
      body: data.method === "POST" ? JSON.stringify(data.body ?? {}) : null,
    });
    const res = await handler(req);
    const text = await res.text();
    if (!res.ok) throw new Error(`Backend ${data.fn} failed [${res.status}]: ${text}`);
    return text; // JSON string; parsed on the caller side
  });

async function lastReset(db: any, userId: string) {
  const { data } = await db.from("bc_demo_resets").select("reset_at").eq("user_id", userId).order("reset_at", { ascending: false }).limit(1);
  return (data?.[0]?.reset_at as string | undefined) ?? "1970-01-01T00:00:00Z";
}

/** Recent stake checks from the append-only audit log (hidden from view after a demo reset, never deleted). */
export const listChecks = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ persona }).parse(d ?? {}))
  .handler(async ({ data: input }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = PERSONAS[input.persona].id;
    const since = await lastReset(supabaseAdmin, userId);
    const { data, error } = await supabaseAdmin
      .from("bc_checks")
      .select("id, platform, market_title, inputs, result, created_at")
      .eq("user_id", userId)
      .gt("created_at", since)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []).map((c) => {
      const r = c.result as { status?: string; hidden_cost?: { hidden_cost_gbp?: number } };
      const i = c.inputs as { stake_gbp?: number };
      return {
        id: c.id,
        platform: c.platform ?? "",
        market: c.market_title ?? "Unknown market",
        stake: Number(i.stake_gbp ?? 0),
        status: (r.status ?? "pass") as "pass" | "warn" | "block",
        hiddenCost: Number(r.hidden_cost?.hidden_cost_gbp ?? 0),
        at: c.created_at,
      };
    });
  });

/** Resets both demo accounts: clears limits/breaks, feedback and AI notes, and hides past checks. */
export const resetDemo = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const ids = Object.values(PERSONAS).map((p) => p.id);
  const now = new Date().toISOString();
  await db.from("bc_limits").update({ weekly_gambling_limit: null, per_bet_max: null, self_exclusion_until: null, pending_increase: null, pending_effective_at: null, updated_at: now }).in("user_id", ids);
  await db.from("bc_merchant_feedback").delete().in("user_id", ids);
  await db.from("bc_classifications").delete().in("user_id", ids);
  await db.from("bc_coach_messages").delete().in("user_id", ids);
  const { error } = await db.from("bc_demo_resets").insert(ids.map((user_id) => ({ user_id })));
  if (error) throw new Error(error.message);
  return { ok: true };
});
