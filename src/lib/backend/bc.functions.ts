import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const FNS = ["check-stake", "classify-transactions", "coach", "feedback", "forecast", "limits"] as const;
export type BcFn = (typeof FNS)[number];

/** Calls one of the backend team's handlers in-process with their original JSON contract (demo user: Priya). */
export const callBc = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ fn: z.enum(FNS), method: z.enum(["GET", "POST"]).default("POST"), body: z.record(z.string(), z.unknown()).optional() }).parse(d),
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
      headers: { "content-type": "application/json" },
      body: data.method === "POST" ? JSON.stringify(data.body ?? {}) : null,
    });
    const res = await handler(req);
    const text = await res.text();
    if (!res.ok) throw new Error(`Backend ${data.fn} failed [${res.status}]: ${text}`);
    return text; // JSON string; parsed on the caller side
  });

/** Recent stake checks from the append-only audit log. */
export const listChecks = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("bc_checks")
    .select("id, platform, market_title, inputs, result, created_at")
    .eq("user_id", "00000000-0000-0000-0000-000000000001")
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
