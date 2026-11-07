// @ts-nocheck -- ported verbatim from the backend team (betcheck-overlay package); written for Deno strictness.
// Turns a stake evaluation into exactly what the overlay shows, so every client renders the same words.
import type { Limits } from "./types";
import type { StakeEvaluation } from "./stakecheck";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "OAKWOOD LETTINGS RENT is due on 2026-11-28" -> "rent is due on 28 November". */
export function prettify(text: string): string {
  return text
    .replace(/[A-Z][A-Z&' ]*RENT\b/g, "rent")
    .replace(/(\d{4})-(\d{2})-(\d{2})/g, (_m, _y, m, d) => `${Number(d)} ${MONTHS[Number(m) - 1]}`);
}

const STATUS_LABEL = { block: "Doesn’t fit your budget", warn: "Worth a second look", pass: "Fits your budget" } as const;
const money = (n: number | null) => (n === null ? null : `${n < 0 ? "−" : ""}£${Math.abs(Math.round(n))}`);

export function buildOverlay(p: {
  evaluation: StakeEvaluation;
  marketTitle: string;
  side: "yes" | "no";
  price: number;
  stake: number;
  limits: Limits;
  suggestedWeeklyLimit: number;
}) {
  const e = p.evaluation, f = e.forecast_impact;
  const actions = [
    ...(p.limits.weekly_gambling_limit === null
      ? [{ id: "set_weekly_limit", label: `Set a £${p.suggestedWeeklyLimit} weekly limit`, value: p.suggestedWeeklyLimit, primary: true }]
      : []),
    { id: "pause_48h", label: "Pause betting for 48 hours", value: 48, primary: p.limits.weekly_gambling_limit !== null },
    { id: "change_stake", label: "Change my stake", primary: false },
    { id: "proceed", label: "I understand, place it anyway", primary: false, style: "link" },
  ];
  return {
    status: e.status,
    status_label: STATUS_LABEL[e.status],
    headline: prettify(e.headline),
    context: `${p.marketTitle} · ${p.side.toUpperCase()} at ${Math.round(p.price * 100)}p · £${p.stake} stake`,
    hidden_cost: { label: "Hidden cost", message: e.hidden_cost.message },
    impact: f ? {
      bill: prettify(f.bill), date: prettify(f.date),
      without: { balance: money(f.typical_balance_without), shortfall_pct: Math.round(f.shortfall_chance_without * 100) },
      with: { balance: money(f.typical_balance_with), shortfall_pct: Math.round(f.shortfall_chance_with * 100) },
    } : null,
    why: e.rules.map((r) => ({ status: r.status, text: prettify(r.reason) })),
    actions,
    support: e.status === "block"
      ? { show: true, text: "Worried about money or betting? GamCare: 0808 8020 133 (free, 24/7) · StepChange for debt advice." }
      : { show: false, text: "" },
    disclaimer: e.disclaimer,
  };
}

export type OverlayPayload = ReturnType<typeof buildOverlay>;
