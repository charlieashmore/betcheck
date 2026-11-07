import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadError, Loading, PageTitle, Panel } from "@/components/SiteChrome";
import { gbp } from "@/lib/demo/data";
import { pageHead } from "@/lib/demo/head";
import { api, pauseHoursLeft, q } from "@/lib/backend/api";

export const Route = createFileRoute("/limits")({
  head: pageHead("Your limits", "Set a weekly betting limit, a per-bet maximum, or take a 48-hour break."),
  component: LimitsPage,
});

function LimitsPage() {
  const qc = useQueryClient();
  const data = useQuery(q.limits());
  const [weekly, setWeekly] = useState("");
  const [perBet, setPerBet] = useState("");
  const lim = data.data?.limits ?? null;
  useEffect(() => {
    setWeekly(lim?.weekly_gambling_limit != null ? String(Number(lim.weekly_gambling_limit)) : "");
    setPerBet(lim?.per_bet_max != null ? String(Number(lim.per_bet_max)) : "");
  }, [lim?.weekly_gambling_limit, lim?.per_bet_max]);

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.setLimits(body),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["bc"] });
      toast(r.cooling_off ? `Lower limits apply now. Raises take effect in ${r.cooling_off.hours} hours.` : "Saved and active now.");
    },
    onError: () => toast("Couldn't save that. Please try again."),
  });

  if (data.isPending) return <Loading />;
  if (data.isError) return <LoadError error={data.error} />;
  const pauseHrs = pauseHoursLeft(lim);
  const pendingAt = lim?.pending_effective_at ? Date.parse(lim.pending_effective_at) : 0;
  const raiseHrs = pendingAt > Date.now() ? Math.ceil((pendingAt - Date.now()) / 3_600_000) : 0;
  const toNum = (s: string) => (s.trim() === "" ? null : Math.max(0, Number(s)));

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
        <Button className="mt-5 rounded-full" disabled={save.isPending} onClick={() => save.mutate({ weekly_gambling_limit: toNum(weekly), per_bet_max: toNum(perBet) })}>Save limits</Button>
        {lim?.pending_increase && raiseHrs > 0 && (
          <div className="mt-5 rounded-xl bg-value px-4 py-3 text-sm text-value-foreground">
            Raise pending:{" "}
            {lim.pending_increase["weekly_gambling_limit"] != null && `weekly to ${gbp(Number(lim.pending_increase["weekly_gambling_limit"]))} `}
            {lim.pending_increase["per_bet_max"] != null && `per bet to ${gbp(Number(lim.pending_increase["per_bet_max"]))} `}
            · Not available for {raiseHrs} hrs.
          </div>
        )}
      </Panel>

      <Panel className="mt-6">
        <h2 className="text-lg font-semibold">48-hour break</h2>
        <p className="mt-1 text-sm text-muted-foreground">Every bet check is blocked until the break ends. You can't end it early.</p>
        <Button className="mt-4 rounded-full" disabled={pauseHrs > 0 || save.isPending} onClick={() => save.mutate({ pause_hours: 48 })}>
          {pauseHrs > 0 ? `On a break · ${pauseHrs} hrs left` : "Start a 48-hour break"}
        </Button>
      </Panel>
    </div>
  );
}
