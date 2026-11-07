import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Slider } from "@/components/ui/slider";
import { expectedReturnPerDollar, projectForecast } from "@/lib/forecasting";
import type { CheckResult } from "@/components/ResultCard";

const usd = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(0)}`;
const SAVINGS_APY = 0.04;

export function TimeTravel({ r }: { r: CheckResult }) {
  const [months, setMonths] = useState(12);
  const [perWeek, setPerWeek] = useState(2);
  const er = expectedReturnPerDollar(r.benchmark.fair, r.benchmark.effectiveCost);
  const points = useMemo(
    () => projectForecast({ stake: r.stake, tradesPerWeek: perWeek, expectedReturnPerDollar: er, savingsApy: SAVINGS_APY, months }),
    [r.stake, perWeek, er, months],
  );
  const end = points[points.length - 1];

  return (
    <section className="rounded-lg border border-border bg-card p-5" aria-labelledby="tt-title">
      <h3 id="tt-title" className="font-semibold text-foreground">Financial time travel</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        If a stake like this became a habit, here is where the same money could be — on average, not a prediction of any single result.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium text-foreground">Horizon</p>
          <ToggleGroup type="single" variant="outline" size="sm" value={String(months)} onValueChange={(v) => v && setMonths(Number(v))} aria-label="Horizon">
            {[1, 3, 6, 12].map((m) => <ToggleGroupItem key={m} value={String(m)}>{m} mo</ToggleGroupItem>)}
          </ToggleGroup>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-foreground">Times per week: <span className="num">{perWeek}</span></p>
          <Slider min={1} max={14} step={1} value={[perWeek]} onValueChange={(v) => setPerWeek(v[0])} aria-label="Trades per week" />
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <div><dt className="text-xs text-muted-foreground">Total staked</dt><dd className="num font-semibold text-foreground">{usd(end.staked)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Expected trading result</dt><dd className="num font-semibold text-foreground">{usd(end.tradingExpected)}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Same money saved at 4%</dt><dd className="num font-semibold text-foreground">{usd(end.savingsValue)}</dd></div>
      </dl>

      <div className="mt-4 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ left: 0, right: 8, top: 8 }}>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={(m) => `${m}m`} stroke="var(--color-muted-foreground)" fontSize={11} />
            <YAxis tickFormatter={(v) => usd(v)} stroke="var(--color-muted-foreground)" fontSize={11} width={56} />
            <Tooltip formatter={(v: number) => usd(v)} labelFormatter={(m) => `Month ${m}`} />
            <Area type="monotone" dataKey="savingsValue" name="Saved instead" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.15} />
            <Area type="monotone" dataKey="tradingExpected" name="Expected trading result" stroke="var(--color-muted-foreground)" fill="var(--color-muted-foreground)" fillOpacity={0.1} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Expected result uses {r.benchmark.status === "ok" ? "this price against the market's fair value" : "Kalshi's fee as a typical cost"} ({(er * 100).toFixed(1)}% per $1). Savings rate is illustrative.
      </p>
    </section>
  );
}
