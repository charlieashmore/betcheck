import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LimitField, LimitValues } from "@/lib/limits";

const FIELDS: { key: LimitField; label: string; help: string }[] = [
  { key: "monthly_income_after_essentials", label: "Monthly income after essentials (USD)", help: "What's left after rent, bills and food." },
  { key: "monthly_stake_limit", label: "Monthly staking limit (USD)", help: "Total you're willing to stake in a calendar month." },
  { key: "per_bet_max", label: "Per-trade maximum (USD)", help: "Largest single stake." },
  { key: "monthly_loss_limit", label: "Monthly loss limit (USD)", help: "Checks are blocked once losses reach this." },
];

export function LimitsForm({ initial, submitLabel, onSubmit, busy }: { initial?: LimitValues; submitLabel: string; onSubmit: (v: LimitValues) => void; busy?: boolean }) {
  const [v, setV] = useState<Record<LimitField, string>>(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, initial ? String(initial[f.key]) : ""])) as Record<LimitField, string>,
  );
  const parsed = Object.fromEntries(FIELDS.map((f) => [f.key, Number(v[f.key])])) as LimitValues;
  const valid = FIELDS.every((f) => v[f.key] !== "" && Number.isFinite(parsed[f.key]) && parsed[f.key] >= 0);
  const overIncome = valid && parsed.monthly_stake_limit > parsed.monthly_income_after_essentials;

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit(parsed);
      }}
    >
      {FIELDS.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <Label htmlFor={f.key}>{f.label}</Label>
          <Input id={f.key} inputMode="decimal" type="number" min={0} step="0.01" required className="num" aria-describedby={`${f.key}-help`} value={v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />
          <p id={`${f.key}-help`} className="text-xs text-muted-foreground">{f.help}</p>
        </div>
      ))}
      {overIncome && (
        <p role="status" className="rounded-md border border-warn/30 bg-warn-soft p-3 text-sm text-foreground">
          Your monthly staking limit is higher than your income after essentials.
        </p>
      )}
      <Button type="submit" disabled={!valid || busy}>{busy ? "Saving…" : submitLabel}</Button>
    </form>
  );
}
