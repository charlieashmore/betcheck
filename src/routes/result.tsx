import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/SiteChrome";
import { gbp, markets, support } from "@/lib/demo/data";
import { checkStake } from "@/lib/demo/checkStake";
import { hoursLeft, useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";

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
  const { state, update, now } = useDemo();
  const navigate = useNavigate();
  const m = markets.find((x) => x.id === id) ?? markets[0]!;
  const paused = hoursLeft(state.pauseUntil, now) > 0;
  const r = useMemo(() => checkStake(m, stake, state.limits, paused), [m, stake, state.limits, paused]);
  const logged = useRef(false);

  useEffect(() => {
    if (logged.current) return;
    logged.current = true;
    update((s) => ({
      ...s,
      checks: [{ id: crypto.randomUUID(), at: "7 Nov, 16:00", market: `${m.title.split(" — ")[0]} — ${m.outcome}`, stake, verdict: r.verdict, hiddenCost: r.hiddenCost }, ...s.checks],
    }));
  }, [m, stake, r, update]);

  const headline = { "not-affordable": "Based on data, this bet is not affordable", overvalued: "Based on data, this bet might be overvalued", ok: "This bet fits your limits" }[r.verdict];
  const tone = r.verdict === "not-affordable" ? "bg-risk text-destructive-foreground" : r.verdict === "overvalued" ? "bg-value text-value-foreground" : "bg-secondary";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className={`rounded-2xl p-6 ${tone}`}>
        <p className="text-sm opacity-80">{m.platform} · {m.title} · {m.outcome} at {m.price}p</p>
        <h1 className="mt-2 text-2xl font-bold md:text-3xl">{headline}</h1>
        <p className="mt-1 opacity-90">{gbp(stake)} stake</p>
      </div>

      <Panel className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">AI summary</p>
        <p className="mt-2">
          {r.verdict === "not-affordable"
            ? `Placing ${gbp(stake)} now would push your rent-day forecast to ${gbp(r.rentDayAfter)}. ${r.hiddenCost > 0 ? `The price is also about ${gbp(r.hiddenCost)} above fair.` : ""}`
            : r.verdict === "overvalued"
              ? `You can afford this, but at ${m.price}p you'd pay about ${gbp(r.hiddenCost)} more than the bookmaker-implied fair price of ${m.fair.toFixed(0)}p.`
              : `This stake is within your limits and the price is close to fair.`}
        </p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          <div><dt className="text-sm text-muted-foreground">Hidden cost</dt><dd className="text-xl font-bold num">{gbp(r.hiddenCost)}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Fair price</dt><dd className="text-xl font-bold num">{m.fair.toFixed(1)}p</dd></div>
          <div><dt className="text-sm text-muted-foreground">Rent day after</dt><dd className={`text-xl font-bold num ${r.rentDayAfter < 0 ? "text-risk" : ""}`}>{gbp(r.rentDayAfter)}</dd></div>
        </dl>
      </Panel>

      <Panel className="mt-6">
        <h2 className="font-semibold">What we checked</h2>
        <ul className="mt-3 space-y-2">
          {r.rules.map((rule) => (
            <li key={rule.label} className="flex items-center gap-2 text-sm">
              {rule.ok ? <Check className="h-4 w-4" aria-label="Passed" /> : <X className="h-4 w-4 text-risk" aria-label="Failed" />}
              {rule.label}
            </li>
          ))}
        </ul>
      </Panel>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <Button variant="secondary" className="h-11 rounded-full" onClick={() => toast("In the real app, this opens the market. BetCheck never places bets for you.")}>Redirect to place bet</Button>
        <Button className="h-11 rounded-full" onClick={() => { toast("Good call. Nothing was placed."); navigate({ to: "/" }); }}>Not place bet</Button>
      </div>

      {r.verdict === "not-affordable" && (
        <p className="mt-4 text-sm">
          Want to talk? <a className="underline" href={support[0]!.href} target="_blank" rel="noreferrer">GamCare</a> · <Link to="/help" className="underline">All support</Link>
        </p>
      )}
      <p className="mt-6 text-xs text-muted-foreground">BetCheck gives information only. It doesn't place bets or tell you what to do. Prices are demo data.</p>
    </div>
  );
}
