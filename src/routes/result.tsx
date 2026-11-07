import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Check, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadError, Loading, Panel } from "@/components/SiteChrome";
import { gbp, markets, support } from "@/lib/demo/data";
import { pageHead } from "@/lib/demo/head";
import { api } from "@/lib/backend/api";

export const Route = createFileRoute("/result")({
  validateSearch: (s: Record<string, unknown>) => ({
    market: typeof s["market"] === "string" ? s["market"] : markets[0]!.id,
    stake: Number(s["stake"]) > 0 ? Number(s["stake"]) : 40,
  }),
  head: pageHead("Bet check result", "Whether a stake is affordable and fairly priced, with the hidden cost and rent-day impact."),
  component: ResultPage,
});

function ResultPage() {
  const { market: id, stake } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const m = markets.find((x) => x.id === id) ?? markets[0]!;
  const res = useQuery({
    queryKey: ["bc", "check-stake", m.id, stake],
    queryFn: () => api.checkStake({ platform: m.platform.toLowerCase(), market_title: `${m.title.split(" — ")[0]} — ${m.outcome}`, price: m.price / 100, stake_gbp: stake, bookmaker_odds: m.odds }),
    staleTime: Infinity,
    retry: false,
  });
  useEffect(() => { if (res.isSuccess) qc.invalidateQueries({ queryKey: ["bc", "checks"] }); }, [res.isSuccess, qc]);

  if (res.isPending) return <Loading label="Checking this bet against your budget and the market…" />;
  if (res.isError) return <LoadError error={res.error} />;
  const r = res.data;
  const over = r.hidden_cost.verdict === "above_market";
  const headline = r.status === "block" ? "Based on data, this bet is not affordable" : over ? "Based on data, this bet might be overvalued" : r.status === "warn" ? "Worth a second look" : "This bet fits your budget";
  const tone = r.status === "block" ? "bg-risk text-destructive-foreground" : over || r.status === "warn" ? "bg-value text-value-foreground" : "bg-secondary";
  const fi = r.forecast_impact;
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className={`rounded-2xl p-6 ${tone}`}>
        <p className="text-sm opacity-80">{m.platform} · {m.title} · {m.outcome} at {m.price}p</p>
        <h1 className="mt-2 text-2xl font-bold md:text-3xl">{headline}</h1>
        <p className="mt-1 opacity-90">{gbp(stake)} stake</p>
      </div>

      <Panel className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Summary</p>
        <p className="mt-2">{r.headline}</p>
        <p className="mt-2 text-sm text-muted-foreground">{r.hidden_cost.message}</p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          <div><dt className="text-sm text-muted-foreground">Hidden cost</dt><dd className="text-xl font-bold num">{r.hidden_cost.hidden_cost_gbp != null ? gbp(r.hidden_cost.hidden_cost_gbp) : "—"}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Fair price</dt><dd className="text-xl font-bold num">{r.hidden_cost.fair_probability != null ? `${(r.hidden_cost.fair_probability * 100).toFixed(1)}p` : "—"}</dd></div>
          <div>
            <dt className="text-sm text-muted-foreground">Rent day after{fi ? ` (${fmt(fi.date)})` : ""}</dt>
            <dd className={`text-xl font-bold num ${(fi?.typical_balance_with ?? 0) < 0 ? "text-risk" : ""}`}>{fi?.typical_balance_with != null ? gbp(Math.round(fi.typical_balance_with)) : "—"}</dd>
          </div>
        </dl>
        {fi && <p className="mt-3 text-sm text-muted-foreground">Chance of going short: {Math.round(fi.shortfall_chance_without * 100)}% now → {Math.round(fi.shortfall_chance_with * 100)}% with this bet.</p>}
      </Panel>

      <Panel className="mt-6">
        <h2 className="font-semibold">What we checked</h2>
        <ul className="mt-3 space-y-2">
          {r.rules.map((rule) => (
            <li key={rule.rule + rule.reason} className="flex items-start gap-2 text-sm">
              {rule.status === "pass" ? <Check className="mt-0.5 h-4 w-4 shrink-0" aria-label="Passed" /> : rule.status === "warn" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-label="Warning" /> : <X className="mt-0.5 h-4 w-4 shrink-0 text-risk" aria-label="Blocked" />}
              {rule.reason}
            </li>
          ))}
        </ul>
      </Panel>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <Button variant="secondary" className="h-11 rounded-full" onClick={() => toast("In the real app, this opens the market. BetCheck never places bets for you.")}>Redirect to place bet</Button>
        <Button className="h-11 rounded-full" onClick={() => { toast("Good call. Nothing was placed."); navigate({ to: "/" }); }}>Not place bet</Button>
      </div>

      {r.status === "block" && (
        <p className="mt-4 text-sm">
          Want to talk? <a className="underline" href={support[0]!.href} target="_blank" rel="noreferrer">GamCare</a> · <Link to="/help" className="underline">All support</Link>
        </p>
      )}
      <p className="mt-6 text-xs text-muted-foreground">{r.disclaimer} BetCheck doesn't place bets. Market prices are demo data.</p>
    </div>
  );
}
