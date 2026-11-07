// Pure affordability rules. No I/O. Unit-tested in affordability.test.ts.
import { AFFORDABILITY_CONFIG, type AffordabilityConfig } from "./config";

export type RuleStatus = "pass" | "warn" | "block";

export interface RuleResult {
  id: string;
  label: string;
  status: RuleStatus;
  reason: string;
}

export interface UserLimits {
  monthly_stake_limit: number;
  per_bet_max: number;
  monthly_loss_limit: number;
}

export interface PlacedTradeLite {
  stake: number;
  outcome: "won" | "lost" | null;
}

export interface AffordabilityInput {
  stake: number;
  limits: UserLimits;
  selfExcludedUntil: string | null;
  monthStakesTotal: number;
  monthLossesTotal: number;
  /** Placed trades, newest first. */
  recentPlaced: PlacedTradeLite[];
  checksInWindow: number;
  localHour: number;
  now: Date;
}

export interface AffordabilityResult {
  overall: RuleStatus;
  rules: RuleResult[];
}

const usd = (n: number) => `$${n.toFixed(2)}`;
const rank: Record<RuleStatus, number> = { pass: 0, warn: 1, block: 2 };

export function consecutiveLosses(recent: PlacedTradeLite[]): number {
  let n = 0;
  for (const t of recent) {
    if (t.outcome === null) continue;
    if (t.outcome === "lost") n++;
    else break;
  }
  return n;
}

export function runAffordability(i: AffordabilityInput, cfg: AffordabilityConfig = AFFORDABILITY_CONFIG): AffordabilityResult {
  const rules: RuleResult[] = [];
  const excluded = i.selfExcludedUntil && new Date(i.selfExcludedUntil) > i.now;

  rules.push({
    id: "self_exclusion",
    label: "Self-exclusion",
    status: excluded ? "block" : "pass",
    reason: excluded
      ? `Self-exclusion is active until ${new Date(i.selfExcludedUntil!).toLocaleString()}.`
      : "No self-exclusion is active.",
  });

  rules.push({
    id: "per_bet_max",
    label: "Per-trade maximum",
    status: i.stake > i.limits.per_bet_max ? "block" : "pass",
    reason:
      i.stake > i.limits.per_bet_max
        ? `Stake ${usd(i.stake)} is above your per-trade maximum of ${usd(i.limits.per_bet_max)}.`
        : `Stake ${usd(i.stake)} is within your per-trade maximum of ${usd(i.limits.per_bet_max)}.`,
  });

  const projected = i.monthStakesTotal + i.stake;
  rules.push({
    id: "monthly_stake",
    label: "Monthly staking limit",
    status: projected > i.limits.monthly_stake_limit ? "block" : "pass",
    reason: `This month ${usd(i.monthStakesTotal)} staked + ${usd(i.stake)} = ${usd(projected)} against a limit of ${usd(i.limits.monthly_stake_limit)}.`,
  });

  const lossHit = i.monthLossesTotal >= i.limits.monthly_loss_limit;
  rules.push({
    id: "monthly_loss",
    label: "Monthly loss limit",
    status: lossHit ? "block" : "pass",
    reason: lossHit
      ? `This month's losses of ${usd(i.monthLossesTotal)} have reached your loss limit of ${usd(i.limits.monthly_loss_limit)}.`
      : `This month's losses are ${usd(i.monthLossesTotal)} of a ${usd(i.limits.monthly_loss_limit)} limit.`,
  });

  const losses = consecutiveLosses(i.recentPlaced);
  const last = i.recentPlaced.slice(0, cfg.lossChaseLookback);
  const avg = last.length ? last.reduce((a, t) => a + t.stake, 0) / last.length : 0;
  const chasing = losses >= cfg.lossChaseMinConsecutiveLosses && last.length > 0 && i.stake > cfg.lossChaseMultiplier * avg;
  rules.push({
    id: "loss_chasing",
    label: "Loss chasing",
    status: chasing ? "warn" : "pass",
    reason: chasing
      ? `After ${losses} losses in a row, this stake is more than ${cfg.lossChaseMultiplier}× your recent average of ${usd(avg)}.`
      : losses >= cfg.lossChaseMinConsecutiveLosses
        ? `${losses} losses in a row, but this stake is not well above your recent average of ${usd(avg)}.`
        : "No pattern of raising stakes after losses.",
  });

  const frequent = i.checksInWindow >= cfg.frequencyMaxChecks;
  rules.push({
    id: "frequency",
    label: "Check frequency",
    status: frequent ? "warn" : "pass",
    reason: `${i.checksInWindow} previous check${i.checksInWindow === 1 ? "" : "s"} in the last ${cfg.frequencyWindowMinutes} minutes${frequent ? ` (${cfg.frequencyMaxChecks} or more).` : "."}`,
  });

  const late = i.localHour >= cfg.lateNightStartHour && i.localHour < cfg.lateNightEndHour;
  rules.push({
    id: "late_night",
    label: "Time of day",
    status: late ? "warn" : "pass",
    reason: late ? "This check is between 00:00 and 05:00 your local time." : "Outside the 00:00–05:00 window.",
  });

  const overall = rules.reduce<RuleStatus>((acc, r) => (rank[r.status] > rank[acc] ? r.status : acc), "pass");
  return { overall, rules };
}
