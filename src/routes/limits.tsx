import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTitle, Panel } from "@/components/SiteChrome";
import { gbp } from "@/lib/demo/data";
import { hoursLeft, useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";

export const Route = createFileRoute("/limits")({
  head: pageHead("Your limits", "Set a weekly betting limit, a per-bet maximum, or take a 48-hour break."),
  component: LimitsPage,
});

const H48 = 48 * 3_600_000;

function LimitsPage() {
  const { state, update, now } = useDemo();
  const [weekly, setWeekly] = useState("");
  const [perBet, setPerBet] = useState("");
  useEffect(() => {
    setWeekly(state.limits.weekly?.toString() ?? "");
    setPerBet(state.limits.perBet?.toString() ?? "");
  }, [state.limits.weekly, state.limits.perBet]);

  const pauseHrs = hoursLeft(state.pauseUntil, now);
  const raiseHrs = hoursLeft(state.pendingRaise?.effectiveAt ?? null, now);

  const save = () => {
    const w = weekly === "" ? null : Math.max(0, Number(weekly));
    const p = perBet === "" ? null : Math.max(0, Number(perBet));
    const isRaise = (cur: number | null, next: number | null) => cur != null && (next == null || next > cur);
    const raise: { weekly?: number; perBet?: number } = {};
    const now: typeof state.limits = { ...state.limits };
    if (isRaise(state.limits.weekly, w)) raise.weekly = w ?? undefined; else now.weekly = w;
    if (isRaise(state.limits.perBet, p)) raise.perBet = p ?? undefined; else now.perBet = p;
    const hasRaise = Object.keys(raise).length > 0;
    update((s) => ({ ...s, limits: now, pendingRaise: hasRaise ? { ...raise, effectiveAt: Date.now() + H48 } : s.pendingRaise }));
    toast(hasRaise ? "Lower limits apply now. Raises take effect in 48 hours." : "Limits saved and active now.");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageTitle title="Your limits" sub="Lowering a limit works straight away. Raising one takes 48 hours, so it's a decision you make with a clear head." />
      <Panel>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="weekly">Weekly limit (£)</Label>
            <Input id="weekly" type="number" min={0} inputMode="decimal" value={weekly} onChange={(e) => setWeekly(e.target.value)} placeholder="e.g. 30" className="h-11 rounded-full bg-input px-5" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="perbet">Per-bet maximum (£)</Label>
            <Input id="perbet" type="number" min={0} inputMode="decimal" value={perBet} onChange={(e) => setPerBet(e.target.value)} placeholder="e.g. 10" className="h-11 rounded-full bg-input px-5" />
          </div>
        </div>
        <Button className="mt-5 rounded-full" onClick={save}>Save limits</Button>
        {state.pendingRaise && raiseHrs > 0 && (
          <div className="mt-5 rounded-xl bg-value px-4 py-3 text-sm text-value-foreground">
            Raise pending: {state.pendingRaise.weekly != null && `weekly to ${gbp(state.pendingRaise.weekly)} `}
            {state.pendingRaise.perBet != null && `per bet to ${gbp(state.pendingRaise.perBet)} `}
            · Not available for {raiseHrs} hrs.
            <button className="ml-2 underline" onClick={() => update((s) => ({ ...s, pendingRaise: null }))}>Cancel raise</button>
          </div>
        )}
      </Panel>

      <Panel className="mt-6">
        <h2 className="text-lg font-semibold">48-hour break</h2>
        <p className="mt-1 text-sm text-muted-foreground">Every bet check is marked not affordable until the break ends. You can't end it early.</p>
        <Button className="mt-4 rounded-full" disabled={pauseHrs > 0} onClick={() => update((s) => ({ ...s, pauseUntil: Date.now() + H48 }))}>
          {pauseHrs > 0 ? `On a break · ${pauseHrs} hrs left` : "Start a 48-hour break"}
        </Button>
      </Panel>
    </div>
  );
}
