import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronDown, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadError, Loading, Panel, StatusPill } from "@/components/SiteChrome";
import { gbp, support } from "@/lib/demo/data";
import { PUNDIT_MARKETS } from "@/lib/demo/pundit";
import { useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";
import { api, pauseHoursLeft, q } from "@/lib/backend/api";

export const Route = createFileRoute("/")({
  head: pageHead("Dashboard", "Your balance, rent-day outlook, coach advice and recent bet checks in one place."),
  component: Dashboard,
});

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function Dashboard() {
  const { state } = useDemo();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [why, setWhy] = useState(false);
  const [link, setLink] = useState("");
  const coach = useQuery(q.coach(state.plainLanguage));
  const limits = useQuery(q.limits());
  const checks = useQuery(q.checks());

  const setLimit = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.setLimits(body),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["bc"] });
      toast(r.cooling_off ? `Saved. Raises take effect in ${r.cooling_off.hours} hours.` : "Saved and active now.");
    },
    onError: () => toast("Couldn't save that. Please try again."),
  });

  if (coach.isPending) return <Loading label="Your coach is reading your last 90 days…" />;
  if (coach.isError) return <LoadError error={coach.error} />;

  const c = coach.data;
  const facts = c.evidence.facts;
  const base = c.forecast.baseline;
  const withLimit = c.forecast.with_suggested_limit;
  const sugg = c.forecast.suggested_weekly_limit;
  const lim = limits.data?.limits ?? null;
  const pauseHrs = pauseHoursLeft(lim);
  const raisePending = lim?.pending_effective_at && Date.parse(lim.pending_effective_at) > Date.now();
  const rentP50 = base.balance_at_next_big_bill?.p50 ?? null;
  const highRisk = base.shortfall_probability > 0.5 && lim?.weekly_gambling_limit == null;
  const bill = facts.next_big_bill;

  const doAction = () => {
    const a = c.message.action;
    if (!a) return;
    if (a.type === "set_weekly_limit") setLimit.mutate({ weekly_gambling_limit: a.value ?? sugg });
    else if (a.type === "pause") setLimit.mutate({ pause_hours: a.value ?? 48 });
    else navigate({ to: "/help" });
  };

  const openLink = () => {
    const m = markets.find((mk) => link.toLowerCase().includes(mk.id)) ?? markets[0]!;
    navigate({ to: "/market/$id", params: { id: m.id } });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {!state.onboarded && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-secondary px-5 py-4">
          <p className="text-sm">Connect your bank so BetCheck can spot betting spend. This demo uses sample data for {facts.first_name}.</p>
          <Button asChild size="sm" className="rounded-full"><Link to="/onboarding">Connect bank</Link></Button>
        </div>
      )}

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Hi {facts.first_name} · Saturday 7 November 2026</p>
          <p className="mt-1 text-4xl font-bold tracking-tight num">{gbp(facts.balance_now)}</p>
          <p className="text-sm text-muted-foreground">
            Balance today{bill ? ` · rent of ${gbp(bill.amount)} due ${shortDate(bill.date)}` : ""}
          </p>
        </div>
        <Link to="/forecast" className="text-sm font-medium underline underline-offset-4">See your rent-day forecast</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Panel className="bg-foreground text-background">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-70">Your coach</p>
            <h2 className="mt-2 text-2xl font-bold">{c.message.headline}</h2>
            <p className="mt-2 max-w-xl opacity-80">{c.message.body}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {c.message.action && (
                <Button variant="secondary" className="rounded-full" disabled={setLimit.isPending || (c.message.action.type === "set_weekly_limit" && lim?.weekly_gambling_limit != null)} onClick={doAction}>
                  {c.message.action.label}
                </Button>
              )}
              <Button variant="outline" className="rounded-full border-background/40 bg-transparent text-background hover:bg-background/10 hover:text-background" disabled={pauseHrs > 0 || setLimit.isPending} onClick={() => setLimit.mutate({ pause_hours: 48 })}>
                {pauseHrs > 0 ? `Paused · ${pauseHrs} hrs left` : "Pause 48 hours"}
              </Button>
              <Button variant="outline" className="rounded-full border-background/40 bg-transparent text-background hover:bg-background/10 hover:text-background" asChild>
                <Link to="/help">Talk to someone</Link>
              </Button>
            </div>
            <button onClick={() => setWhy((w) => !w)} className="mt-5 flex items-center gap-1 text-sm underline underline-offset-4 opacity-80" aria-expanded={why}>
              Why am I seeing this? <ChevronDown className={`h-4 w-4 transition-transform ${why ? "rotate-180" : ""}`} />
            </button>
            {why && (
              <div className="mt-3 space-y-1 text-sm opacity-80">
                <p>· At your current pace (about {gbp(Math.round(base.gambling_weekly_pace))} a week on betting), your typical balance on rent day is {rentP50 != null ? gbp(Math.round(rentP50)) : "unknown"}, with a {Math.round(base.shortfall_probability * 100)}% chance of going short.</p>
                <p>· With a £{sugg} weekly limit: {withLimit.balance_at_next_big_bill ? gbp(Math.round(withLimit.balance_at_next_big_bill.p50)) : "—"}, {Math.round(withLimit.shortfall_probability * 100)}% chance.</p>
                {c.evidence.gambling_change_pct != null && <p>· Betting spend is up {c.evidence.gambling_change_pct}% on the previous 4 weeks.</p>}
                <ul className="mt-2 space-y-0.5">
                  {c.evidence.flagged.slice(0, 5).map((f) => (
                    <li key={f.transaction_id}>· {shortDate(f.posted_at)} {f.description} {gbp(f.amount)}: {f.reason}</li>
                  ))}
                </ul>
                <Link to="/transactions" className="inline-block pt-1 underline">Review flagged transactions</Link>
                <p className="pt-1 text-xs opacity-70">{c.message.source === "llm" ? "Written by AI using only numbers BetCheck calculated." : "Standard message (AI not used)."}</p>
              </div>
            )}
          </Panel>

          <Panel>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent bet checks</h2>
              <Link to="/account" className="text-sm text-muted-foreground underline underline-offset-4">All checks</Link>
            </div>
            {checks.isPending ? <p className="text-sm text-muted-foreground">Loading…</p> : !checks.data?.length ? (
              <p className="text-sm text-muted-foreground">No checks yet. Try one below.</p>
            ) : (
              <ul className="divide-y divide-border">
                {checks.data.slice(0, 4).map((k) => (
                  <li key={k.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="font-medium">{k.market}</p>
                      <p className="text-sm text-muted-foreground">{when(k.at)} · {gbp(k.stake)} stake</p>
                    </div>
                    <StatusPill status={k.status} />
                  </li>
                ))}
              </ul>
            )}
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
            <p className="mt-1 text-sm text-muted-foreground">Pause for 48 hours or change your limits.</p>
            <div className="mt-4 grid gap-2">
              <Button className="rounded-full" disabled={pauseHrs > 0 || setLimit.isPending} onClick={() => setLimit.mutate({ pause_hours: 48 })}>
                {pauseHrs > 0 ? `Paused · ${pauseHrs} hrs left` : "Take a 48-hour break"}
              </Button>
              <Button asChild variant="secondary" className="rounded-full">
                <Link to="/limits">{raisePending ? "Limit change pending" : "Change limits"}</Link>
              </Button>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted-foreground">Weekly limit</dt><dd className="font-semibold num">{lim?.weekly_gambling_limit != null ? gbp(Number(lim.weekly_gambling_limit)) : "Not set"}</dd></div>
              <div><dt className="text-muted-foreground">Per bet</dt><dd className="font-semibold num">{lim?.per_bet_max != null ? gbp(Number(lim.per_bet_max)) : "Not set"}</dd></div>
            </dl>
          </Panel>

          {(highRisk || c.message.support_link) && (
            <Panel className="border-risk bg-risk-soft">
              <p className="text-xs font-semibold uppercase tracking-widest text-risk">Heads up</p>
              <h2 className="mt-1 text-lg font-bold">You are not currently in the position to make a bet.</h2>
              <p className="mt-1 text-sm">Your rent-day forecast is below £0. Free, confidential help is available.</p>
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
