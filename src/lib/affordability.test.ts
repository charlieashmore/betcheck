import { describe, expect, it } from "vitest";
import { runAffordability, type AffordabilityInput } from "./affordability";
import { planLimitChange, applyDuePending, type LimitState } from "./limits";

const now = new Date("2026-11-07T12:00:00Z");
const base: AffordabilityInput = {
  stake: 20,
  limits: { monthly_stake_limit: 200, per_bet_max: 50, monthly_loss_limit: 100 },
  selfExcludedUntil: null,
  monthStakesTotal: 0,
  monthLossesTotal: 0,
  recentPlaced: [],
  checksInWindow: 0,
  localHour: 14,
  now,
};
const rule = (i: Partial<AffordabilityInput>, id: string) => runAffordability({ ...base, ...i }).rules.find((r) => r.id === id)!.status;

describe("affordability", () => {
  it("passes a normal stake", () => expect(runAffordability(base).overall).toBe("pass"));
  it("blocks stake above per-bet max", () => expect(rule({ stake: 50.01 }, "per_bet_max")).toBe("block"));
  it("allows stake equal to per-bet max", () => expect(rule({ stake: 50 }, "per_bet_max")).toBe("pass"));
  it("blocks when month stakes + stake exceed monthly limit", () => expect(rule({ monthStakesTotal: 181 }, "monthly_stake")).toBe("block"));
  it("allows reaching exactly the monthly limit", () => expect(rule({ monthStakesTotal: 180 }, "monthly_stake")).toBe("pass"));
  it("blocks when losses have reached the loss limit", () => expect(rule({ monthLossesTotal: 100 }, "monthly_loss")).toBe("block"));
  it("blocks when self-excluded", () => {
    const r = runAffordability({ ...base, selfExcludedUntil: "2026-11-08T00:00:00Z" });
    expect(r.overall).toBe("block");
  });
  it("ignores expired self-exclusion", () => expect(rule({ selfExcludedUntil: "2026-11-01T00:00:00Z" }, "self_exclusion")).toBe("pass"));

  const twoLosses = [
    { stake: 10, outcome: "lost" as const },
    { stake: 10, outcome: "lost" as const },
    { stake: 10, outcome: "won" as const },
  ];
  it("warns on loss chasing: >1.5x avg after 2 losses", () => expect(rule({ stake: 15.01, recentPlaced: twoLosses }, "loss_chasing")).toBe("warn"));
  it("no warning at exactly 1.5x", () => expect(rule({ stake: 15, recentPlaced: twoLosses }, "loss_chasing")).toBe("pass"));
  it("no warning after only 1 loss", () => expect(rule({ stake: 40, recentPlaced: twoLosses.slice(1) }, "loss_chasing")).toBe("pass"));
  it("warns at 4 checks in 30 minutes", () => expect(rule({ checksInWindow: 4 }, "frequency")).toBe("warn"));
  it("no warning at 3 checks", () => expect(rule({ checksInWindow: 3 }, "frequency")).toBe("pass"));
  it("warns between 00:00 and 05:00", () => {
    expect(rule({ localHour: 0 }, "late_night")).toBe("warn");
    expect(rule({ localHour: 4 }, "late_night")).toBe("warn");
    expect(rule({ localHour: 5 }, "late_night")).toBe("pass");
  });
  it("overall is the worst rule", () => expect(runAffordability({ ...base, localHour: 2, stake: 60 }).overall).toBe("block"));
});

describe("limit changes", () => {
  const cur: LimitState = { monthly_income_after_essentials: 1000, monthly_stake_limit: 200, per_bet_max: 50, monthly_loss_limit: 100, pending_increase: null, effective_at: null };
  it("lowering applies instantly", () => {
    const n = planLimitChange(cur, { ...cur, per_bet_max: 30 }, now);
    expect(n.per_bet_max).toBe(30);
    expect(n.pending_increase).toBeNull();
  });
  it("raising is scheduled 48 hours ahead", () => {
    const n = planLimitChange(cur, { ...cur, per_bet_max: 80 }, now);
    expect(n.per_bet_max).toBe(50);
    expect(n.pending_increase).toEqual({ per_bet_max: 80 });
    expect(new Date(n.effective_at!).getTime() - now.getTime()).toBe(48 * 3_600_000);
  });
  it("pending raise applies once due", () => {
    const n = planLimitChange(cur, { ...cur, per_bet_max: 80 }, now);
    expect(applyDuePending(n, new Date(now.getTime() + 47 * 3_600_000)).state.per_bet_max).toBe(50);
    expect(applyDuePending(n, new Date(now.getTime() + 48 * 3_600_000)).state.per_bet_max).toBe(80);
  });
});
