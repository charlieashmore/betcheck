import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageTitle, Panel } from "@/components/SiteChrome";
import { buildBand, forecast, gbp, HORIZON_DAYS, RENT_DAY_INDEX, type Band } from "@/lib/demo/data";
import { useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";

export const Route = createFileRoute("/forecast")({
  head: pageHead("Rent-day forecast", "See where your balance is heading over the next 35 days, and how a weekly limit changes rent day."),
  component: ForecastPage,
});

function Chart({ band }: { band: Band[] }) {
  const W = 720, H = 280, pad = 36;
  const min = Math.min(-400, ...band.map((b) => b.p10));
  const max = Math.max(...band.map((b) => b.p90)) + 50;
  const x = (d: number) => pad + (d / HORIZON_DAYS) * (W - pad * 2);
  const y = (v: number) => H - pad - ((v - min) / (max - min)) * (H - pad * 2);
  const area = band.map((b) => `${x(b.day)},${y(b.p90)}`).join(" ") + " " + [...band].reverse().map((b) => `${x(b.day)},${y(b.p10)}`).join(" ");
  const line = band.map((b) => `${x(b.day)},${y(b.p50)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Balance forecast chart">
      <polygon points={area} fill="var(--secondary)" />
      <line x1={pad} x2={W - pad} y1={y(0)} y2={y(0)} stroke="var(--risk)" strokeDasharray="4 4" />
      <text x={W - pad} y={y(0) - 6} textAnchor="end" fontSize="11" fill="var(--risk)">£0</text>
      <line x1={x(RENT_DAY_INDEX)} x2={x(RENT_DAY_INDEX)} y1={pad / 2} y2={H - pad} stroke="var(--foreground)" strokeWidth="1" />
      <text x={x(RENT_DAY_INDEX) + 6} y={pad / 2 + 10} fontSize="11" fill="var(--foreground)">Rent day · 28 Nov</text>
      <polyline points={line} fill="none" stroke="var(--foreground)" strokeWidth="2.5" />
      <text x={pad} y={H - 10} fontSize="11" fill="var(--muted-foreground)">Today</text>
      <text x={W - pad} y={H - 10} textAnchor="end" fontSize="11" fill="var(--muted-foreground)">12 Dec</text>
    </svg>
  );
}

function ForecastPage() {
  const { state, update } = useDemo();
  const [mode, setMode] = useState<"current" | "limited">("current");
  const f = forecast[mode];
  const band = useMemo(() => buildBand(f.rentDay), [f.rentDay]);
  const accepted = state.limits.weekly === forecast.suggestedWeeklyLimit;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageTitle title="Financial time travel" sub="Your likely balance over the next 35 days, based on 500 simulated futures from your spending pattern." />
      <div className="mb-4 inline-flex rounded-full bg-secondary p-1" role="tablist">
        {(["current", "limited"] as const).map((m) => (
          <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`rounded-full px-4 py-1.5 text-sm font-medium ${mode === m ? "bg-foreground text-background" : "text-muted-foreground"}`}>
            {m === "current" ? "Current pace" : `With a £${forecast.suggestedWeeklyLimit} weekly limit`}
          </button>
        ))}
      </div>
      <Panel>
        <Chart band={band} />
        <p className="mt-2 text-xs text-muted-foreground">Shaded area: likely range (10th–90th percentile). Line: typical outcome.</p>
      </Panel>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {(["current", "limited"] as const).map((m) => (
          <Panel key={m} className={m === "current" ? "border-risk" : ""}>
            <p className="text-sm text-muted-foreground">{m === "current" ? "If nothing changes" : `With a £${forecast.suggestedWeeklyLimit} weekly limit`}</p>
            <p className={`mt-1 text-3xl font-bold num ${forecast[m].rentDay < 0 ? "text-risk" : ""}`}>{gbp(forecast[m].rentDay)}</p>
            <p className="text-sm">on rent day · {Math.round(forecast[m].shortChance * 100)}% chance of going short</p>
          </Panel>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button className="rounded-full" disabled={accepted} onClick={() => update((s) => ({ ...s, limits: { ...s.limits, weekly: forecast.suggestedWeeklyLimit } }))}>
          {accepted ? "Weekly limit set" : `Accept the £${forecast.suggestedWeeklyLimit} weekly limit`}
        </Button>
        <Button asChild variant="secondary" className="rounded-full"><Link to="/limits">Set my own limits</Link></Button>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">A forecast is an estimate, not a guarantee. It uses your last 90 days of transactions.</p>
    </div>
  );
}
