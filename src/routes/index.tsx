import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel, VerdictPill } from "@/components/SiteChrome";
import { forecast, gbp, markets, profile, flagged, support } from "@/lib/demo/data";
import { hoursLeft, useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";

export const Route = createFileRoute("/")({
  head: pageHead("Dashboard", "Your balance, rent-day outlook, coach advice and recent bet checks in one place."),
  component: Dashboard,
});

function Dashboard() {
  const { state, update, now } = useDemo();
  const navigate = useNavigate();
  const [why, setWhy] = useState(false);
  const [link, setLink] = useState("");
  const pauseHrs = hoursLeft(state.pauseUntil, now);
  const raiseHrs = hoursLeft(state.pendingRaise?.effectiveAt ?? null, now);
  const highRisk = forecast.current.shortChance > 0.5 && state.limits.weekly == null;

  const openLink = () => {
    const m = markets.find((mk) => link.toLowerCase().includes(mk.id)) ?? markets[0];
    navigate({ to: "/market/$id", params: { id: m.id } });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {!state.onboarded && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-secondary px-5 py-4">
          <p className="text-sm">Connect your bank so BetCheck can spot betting spend. This demo uses sample data for Priya.</p>
          <Button asChild size="sm" className="rounded-full"><Link to="/onboarding">Connect bank</Link></Button>
        </div>
      )}

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Hi {profile.name} · Saturday 7 November 2026</p>
          <p className="mt-1 text-4xl font-bold tracking-tight num">{gbp(profile.balance)}</p>
          <p className="text-sm text-muted-foreground">Balance today · rent of {gbp(profile.rent)} due {profile.payday}</p>
        </div>
        <Link to="/forecast" className="text-sm font-medium underline underline-offset-4">See your rent-day forecast</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Panel className="bg-foreground text-background">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-70">Your coach</p>
            <h2 className="mt-2 text-2xl font-bold">
              {state.limits.weekly != null ? "You've set a weekly limit. Nice work." : `You could be ${gbp(Math.abs(forecast.current.rentDay))} short on rent day.`}
            </h2>
            <p className="mt-2 max-w-xl opacity-80">
              {state.plainLanguage
                ? `At your current pace, there's a ${Math.round(forecast.current.shortChance * 100)}% chance you won't cover rent. A £${forecast.suggestedWeeklyLimit} weekly limit brings that down to ${Math.round(forecast.limited.shortChance * 100)}%.`
                : `Across 500 simulated futures, ${Math.round(forecast.current.shortChance * 100)}% end below £0 on 28 Nov (median ${gbp(forecast.current.rentDay)}). Capping betting at £${forecast.suggestedWeeklyLimit}/week moves the median to ${gbp(forecast.limited.rentDay)}.`}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="rounded-full"
                disabled={state.limits.weekly != null}
                onClick={() => update((s) => ({ ...s, limits: { ...s.limits, weekly: forecast.suggestedWeeklyLimit } }))}
              >
                Set a £{forecast.suggestedWeeklyLimit} weekly limit
              </Button>
              <Button variant="outline" className="rounded-full border-background/40 bg-transparent text-background hover:bg-background/10 hover:text-background" asChild>
                <Link to="/limits">Pause 48 hours</Link>
              </Button>
              <Button variant="outline" className="rounded-full border-background/40 bg-transparent text-background hover:bg-background/10 hover:text-background" asChild>
                <Link to="/help">Talk to someone</Link>
              </Button>
            </div>
            <button onClick={() => setWhy((w) => !w)} className="mt-5 flex items-center gap-1 text-sm underline underline-offset-4 opacity-80" aria-expanded={why}>
              Why am I seeing this? <ChevronDown className={`h-4 w-4 transition-transform ${why ? "rotate-180" : ""}`} />
            </button>
            {why && (
              <ul className="mt-3 space-y-1 text-sm opacity-80">
                <li>· {flagged.length} payments look like betting or betting top-ups in the last 10 days ({gbp(flagged.reduce((a, t) => a + t.amount, 0))}).</li>
                <li>· Two Sky Bet top-ups within 30 minutes, after 11pm.</li>
                <li>· Your balance is falling faster than usual before payday.</li>
                <li><Link to="/transactions" className="underline">Review flagged transactions</Link></li>
              </ul>
            )}
          </Panel>

          <Panel>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent bet checks</h2>
              <Link to="/account" className="text-sm text-muted-foreground underline underline-offset-4">All checks</Link>
            </div>
            <ul className="divide-y divide-border">
              {state.checks.slice(0, 4).map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium">{c.market}</p>
                    <p className="text-sm text-muted-foreground">{c.at} · {gbp(c.stake)} stake</p>
                  </div>
                  <VerdictPill verdict={c.verdict} />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <h2 className="text-lg font-semibold">Check a bet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Paste a Kalshi or Polymarket link, or pick a demo market.</p>
            <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); openLink(); }}>
              <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://kalshi.com/markets/..." className="h-11 rounded-full bg-input px-5" aria-label="Market link" />
              <Button type="submit" className="h-11 rounded-full px-6">Check</Button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              {markets.map((m) => (
                <Link key={m.id} to="/market/$id" params={{ id: m.id }} className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-secondary">
                  {m.platform}: {m.title.split(" — ")[0]}
                </Link>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel>
            <h2 className="text-lg font-semibold">Need a break?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Pause checks for 48 hours or change your limits.</p>
            <div className="mt-4 grid gap-2">
              <Button
                className="rounded-full"
                disabled={pauseHrs > 0}
                onClick={() => update((s) => ({ ...s, pauseUntil: Date.now() + 48 * 3_600_000 }))}
              >
                {pauseHrs > 0 ? `Paused · ${pauseHrs} hrs left` : "Take a 48-hour break"}
              </Button>
              <Button asChild variant="secondary" className="rounded-full">
                <Link to="/limits">{raiseHrs > 0 ? `Limit change in ${raiseHrs} hrs` : "Change limits"}</Link>
              </Button>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted-foreground">Weekly limit</dt><dd className="font-semibold num">{state.limits.weekly != null ? gbp(state.limits.weekly) : "Not set"}</dd></div>
              <div><dt className="text-muted-foreground">Per bet</dt><dd className="font-semibold num">{state.limits.perBet != null ? gbp(state.limits.perBet) : "Not set"}</dd></div>
            </dl>
          </Panel>

          {highRisk && (
            <Panel className="border-risk bg-risk-soft">
              <p className="text-xs font-semibold uppercase tracking-widest text-risk">Heads up</p>
              <h2 className="mt-1 text-lg font-bold">You are not currently in the position to make a bet.</h2>
              <p className="mt-1 text-sm">Rent is due in 21 days and your forecast is below £0. Free, confidential help is available.</p>
              <ul className="mt-4 space-y-2">
                {support.slice(0, 2).map((s) => (
                  <li key={s.name}>
                    <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="flex items-center justify-between rounded-full bg-background px-4 py-2 text-sm font-medium">
                      {s.name} <span className="flex items-center gap-1 num"><Phone className="h-3.5 w-3.5" />{s.phone}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
