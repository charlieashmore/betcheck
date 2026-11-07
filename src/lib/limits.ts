// Pure limit-change planning: decreases apply now, increases wait LIMIT_RAISE_DELAY_HOURS.
import { LIMIT_RAISE_DELAY_HOURS } from "./config";

export const LIMIT_FIELDS = ["monthly_income_after_essentials", "monthly_stake_limit", "per_bet_max", "monthly_loss_limit"] as const;
export type LimitField = (typeof LIMIT_FIELDS)[number];
export type LimitValues = Record<LimitField, number>;

export interface LimitState extends LimitValues {
  pending_increase: Partial<LimitValues> | null;
  effective_at: string | null;
}

/** Applies a pending increase once its time has come. */
export function applyDuePending(state: LimitState, now: Date): { state: LimitState; changed: boolean } {
  if (!state.pending_increase || !state.effective_at || new Date(state.effective_at) > now) return { state, changed: false };
  return { state: { ...state, ...state.pending_increase, pending_increase: null, effective_at: null }, changed: true };
}

export function planLimitChange(current: LimitState, next: LimitValues, now: Date): LimitState {
  // Income is informational, not a protective limit, so it updates immediately.
  const out: LimitState = { ...current, monthly_income_after_essentials: next.monthly_income_after_essentials };
  const pending: Partial<LimitValues> = { ...(current.pending_increase ?? {}) };
  let raised = false;
  for (const f of LIMIT_FIELDS) {
    if (f === "monthly_income_after_essentials") continue;
    if (next[f] < current[f]) {
      out[f] = next[f];
      delete pending[f];
    } else if (next[f] > current[f]) {
      pending[f] = next[f];
      raised = true;
    } else {
      delete pending[f];
    }
  }
  const hasPending = Object.keys(pending).length > 0;
  out.pending_increase = hasPending ? pending : null;
  out.effective_at = !hasPending
    ? null
    : raised
      ? new Date(now.getTime() + LIMIT_RAISE_DELAY_HOURS * 3_600_000).toISOString()
      : current.effective_at;
  return out;
}
