import { queryOptions } from "@tanstack/react-query";
import { callBc, listChecks, type BcFn } from "./bc.functions";
import type { PersonaKey } from "./personas";

/** Active demo persona; set by the demo store. Query cache is cleared on switch. */
let persona: PersonaKey = "priya";
export const setActivePersona = (p: PersonaKey) => { persona = p; };
export const getActivePersona = () => persona;

// Shapes returned by the backend team's API (see their README).
export type Band = { date: string; p10: number; p50: number; p90: number };
export type Forecast = {
  days: Band[];
  shortfall_probability: number;
  next_big_bill: { date: string; amount: number; description: string } | null;
  balance_at_next_big_bill: { p10: number; p50: number; p90: number } | null;
  gambling_weekly_pace: number;
  starting_balance: number;
};
export type CoachRes = {
  message: { headline: string; body: string; action: { label: string; type: string; value?: number } | null; support_link: boolean; source: string };
  evidence: {
    facts: { first_name: string; balance_now: number; next_big_bill: { description: string; date: string; amount: number } | null };
    flagged: { transaction_id: string; posted_at: string; description: string; amount: number; reason: string }[];
    gambling_change_pct: number | null;
  };
  forecast: { baseline: Forecast; with_suggested_limit: Forecast; suggested_weekly_limit: number };
};
export type Tx = { id: string; posted_at: string; amount: number; description: string };
export type Classified = { transaction_id: string; label: string; category: string; confidence: number; reasons: string[]; source: string; transaction: Tx };
export type ClassifyRes = { ai_used: boolean; summary: { gambling: number; ask_user: number; total: number }; questions: Classified[]; flagged: Classified[] };
export type LimitsRow = {
  weekly_gambling_limit: number | null; per_bet_max: number | null; self_exclusion_until: string | null;
  pending_increase: Record<string, number> | null; pending_effective_at: string | null;
};
export type StakeRes = {
  status: "pass" | "warn" | "block";
  headline: string;
  rules: { rule: string; status: string; reason: string }[];
  hidden_cost: { message: string; hidden_cost_gbp?: number; fair_probability?: number; effective_price?: number; verdict?: string };
  forecast_impact: { bill: string; date: string; typical_balance_without: number | null; typical_balance_with: number | null; shortfall_chance_without: number; shortfall_chance_with: number } | null;
  disclaimer: string;
};

export type OverlayAction = { id: string; label: string; value?: number; primary: boolean; style?: string };
export type OverlayRes = {
  check_id?: string | null;
  status: "pass" | "warn" | "block" | "paused";
  status_label: string;
  headline: string;
  paused_until?: string;
  context?: string;
  hidden_cost?: { label: string; message: string };
  impact?: { bill: string; date: string; without: { balance: string | null; shortfall_pct: number }; with: { balance: string | null; shortfall_pct: number } } | null;
  why?: { status: string; text: string }[];
  actions: OverlayAction[];
  support?: { show: boolean; text: string };
  disclaimer: string;
};

const bc = async <T,>(fn: BcFn, body?: Record<string, unknown>, method: "GET" | "POST" = "POST"): Promise<T> =>
  JSON.parse(await callBc({ data: body ? { fn, body, method, persona } : { fn, method, persona } })) as T;

export const api = {
  coach: (plain: boolean) => bc<CoachRes>("coach", { plain_language: plain }),
  classify: () => bc<ClassifyRes>("classify-transactions"),
  feedback: (transaction_id: string, is_gambling: boolean) => bc<{ ok: boolean }>("feedback", { transaction_id, is_gambling }),
  limits: () => bc<{ limits: LimitsRow | null }>("limits", undefined, "GET"),
  setLimits: (body: Record<string, unknown>) => bc<{ limits: LimitsRow; cooling_off: { hours: number } | null }>("limits", body),
  forecast: (weekly_cap?: number) => bc<{ baseline: Forecast; scenario: Forecast | null }>("forecast", weekly_cap != null ? { weekly_cap } : {}),
  overlayCheck: (body: { market_id: string; side: "yes" | "no"; stake_gbp: number }) => bc<OverlayRes>("overlay-check", body),
  checkStake: (body: Record<string, unknown>) => bc<StakeRes>("check-stake", body),
};

export const q = {
  coach: (plain: boolean) => queryOptions({ queryKey: ["bc", "coach", plain], queryFn: () => api.coach(plain), staleTime: 60_000 }),
  classify: () => queryOptions({ queryKey: ["bc", "classify"], queryFn: api.classify, staleTime: 60_000 }),
  limits: () => queryOptions({ queryKey: ["bc", "limits"], queryFn: api.limits }),
  checks: () => queryOptions({ queryKey: ["bc", "checks"], queryFn: () => listChecks({ data: { persona } }) }),
};

export const pauseHoursLeft = (l: LimitsRow | null | undefined, now = Date.now()) => {
  const t = Date.parse(l?.self_exclusion_until ?? "");
  return Number.isFinite(t) && t > now ? Math.ceil((t - now) / 3_600_000) : 0;
};
