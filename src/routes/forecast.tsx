import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadError, Loading, PageTitle, Panel } from "@/components/SiteChrome";
import { gbp } from "@/lib/demo/data";
import { useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";
import { api, q, type Forecast } from "@/lib/backend/api";

export const Route = createFileRoute("/forecast")({
  head: pageHead("Rent-day forecast", "See where your balance is heading over the next 35 days, and how a weekly limit changes rent day."),
  component: ForecastPage,
});

function Chart({ f }: { f: Forecast }) {
  const W = 720, H = 280, pad = 36;
  const band = f.days;
  const n = band.length - 1 || 1;
  const min = Math.min(-100, ...band.map((b) => b.p10));
  const max = Math.max(...band.map((b) => b.p90)) + 50;
  const x = (i: number) => pad + (i / n) * (W - pad * 2);
  const y = (v: number) => H - pad - ((v - min) / (max - min)) * (H - pad * 2);
  const area = band.map((b, i) => `${x(i)},${y(b.p90)}`).join(" ") + " " + band.map((b, i) => `${x(i)},${y(b.p10)}`).reverse().join(" ");
  const line = band.map((b, i) => `${x(i)},${y(b.p50)}`).join(" ");
  const billIdx = f.next_big_bill ? band.findIndex((b) => b.date === f.next_big_bill!.date) : -1;
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Balance forecast chart">
      <polygon points={area} fill="var(--secondary)" />
      <line x1={pad} x2={W - pad} y1={y(0)} y2={y(0)} stroke="var(--risk)" strokeDasharray="4 4" />
      <text x={W - pad} y={y(0) - 6} textAnchor="end" fontSize="11" fill="var(--risk)">£0</text>
      {billIdx >= 0 && (
        <>
          <line x1={x(billIdx)} x2={x(billIdx)} y1={pad / 2} y2={H - pad} stroke="var(--foreground)" />
          <text x={x(billIdx) + 6} y={pad / 2 + 10} fontSize="11" fill="var(--foreground)">Rent day · {fmt(f.next_big_bill!.date)}</text>
        </>
      )}
      <polyline points={line} fill="none" stroke="var(--foreground)" strokeWidth="2.5" />
      <text x={pad} y={H - 10} fontSize="11" fill="var(--muted-foreground)">{band[0] ? fmt(band[0].date) : ""}</text>
      <text x={W - pad} y={H - 10} textAnchor="end" fontSize="11" fill="var(--muted-foreground)">{band.at(-1) ? fmt(band.at(-1)!.date) : ""}</text>
    </svg>
  );
}

function ForecastPage() {
  const { state } = useDemo();
  const qc = useQueryClient();
  const [mode, setMode] = useState<"current" | "limited">("current");
  const coach = useQuery(q.coach(state.plainLanguage));
  const limits = useQuery(q.limits());
  const accept = useMutation({
    mutationFn: (v: number) => api.setLimits({ weekly_gambling_limit: v }),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["bc"] }); toast(r.cooling_off ? "Saved. This raise takes effect in 48 hours." : "Weekly limit set."); },
    onError: () => toast("Couldn't save that. Please try again."),
  });

  if (coach.isPending) return <Loading label="Running 500 simulated futures…" />;
  if (coach.isError) return <LoadError error={coach.error} />;
  const { baseline, with_suggested_limit, suggested_weekly_limit: sugg } = coach.data.forecast;
  const shown = mode === "current" ? baseline : with_suggested_limit;
  const accepted = Number(limits.data?.limits?.weekly_gambling_limit) === sugg;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageTitle title="Financial time travel" sub="Your likely balance over the next 35 days, from 500 simulated futures built around your pay days and bills." />
      <div className="mb-4 inline-flex rounded-full bg-secondary p-1" role="tablist">
        {(["current", "limited"] as const).map((m) => (
          <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`rounded-full px-4 py-1.5 text-sm font-medium ${mode === m ? "bg-foreground text-background" : "text-muted-foreground"}`}>
            {m === "current" ? "Current pace" : `With a £${sugg} weekly limit`}
          </button>
        ))}
      </div>
      <Panel>
        <Chart f={shown} />
        <p className="mt-2 text-xs text-muted-foreground">Shaded area: likely range (10th–90th percentile). Line: typical outcome.</p>
      </Panel>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {([["current", baseline, "If nothing changes"], ["limited", with_suggested_limit, `With a £${sugg} weekly limit`]] as const).map(([k, f, label]) => {
          const v = f.balance_at_next_big_bill?.p50;
          return (
            <Panel key={k} className={k === "current" && (v ?? 0) < 0 ? "border-risk" : ""}>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className={`mt-1 text-3xl font-bold num ${(v ?? 0) < 0 ? "text-risk" : ""}`}>{v != null ? gbp(Math.round(v)) : "—"}</p>
              <p className="text-sm">on rent day · {Math.round(f.shortfall_probability * 100)}% chance of going short</p>
            </Panel>
          );
        })}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button className="rounded-full" disabled={accepted || accept.isPending} onClick={() => accept.mutate(sugg)}>
          {accepted ? "Weekly limit set" : `Accept the £${sugg} weekly limit`}
        </Button>
        <Button asChild variant="secondary" className="rounded-full"><Link to="/limits">Set my own limits</Link></Button>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">A forecast is an estimate, not a guarantee. It uses your last 90 days of transactions.</p>
    </div>
  );
}
