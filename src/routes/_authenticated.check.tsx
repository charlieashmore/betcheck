import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ResultCard, type CheckResult } from "@/components/ResultCard";
import { CoachCard } from "@/components/CoachCard";
import { TimeTravel } from "@/components/TimeTravel";
import { getLimitsState, runCheck } from "@/lib/stakewise.functions";
import { fixturesQuery } from "@/lib/queries";
import { DATA_MODE } from "@/lib/config";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/check")({
  head: () => ({
    meta: [
      { title: "Check a trade — Stakewise" },
      { name: "description", content: "Run an affordability and market-benchmark check on a Kalshi sports trade." },
      { property: "og:title", content: "Check a trade — Stakewise" },
      { property: "og:description", content: "Affordability and benchmark check for a Kalshi trade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CheckPage,
});

function CheckPage() {
  const navigate = useNavigate();
  const getLimits = useServerFn(getLimitsState);
  const run = useServerFn(runCheck);
  const limits = useQuery({ queryKey: ["limits"], queryFn: () => getLimits() });
  const fixtures = useQuery(fixturesQuery);

  const [q, setQ] = useState("");
  const [fixtureId, setFixtureId] = useState<string>("");
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [mode, setMode] = useState<"usd" | "contracts">("usd");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);

  useEffect(() => {
    if (limits.data && (!limits.data.limits || !limits.data.hasProfile)) navigate({ to: "/onboarding" });
  }, [limits.data, navigate]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (fixtures.data ?? []).filter((f) => !t || `${f.home} ${f.away} ${f.kalshi_ticker} ${f.sport}`.toLowerCase().includes(t));
  }, [fixtures.data, q]);

  const excludedUntil = limits.data?.excludedUntil;
  const amt = Number(amount);
  const canRun = !!fixtureId && amt > 0 && (mode === "usd" || Number.isInteger(amt)) && !busy;

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 lg:grid-cols-[1fr_1fr]">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Check a trade</h1>
        {DATA_MODE === "mock" && <p className="mt-1 text-xs text-muted-foreground">Demo data: prices are sample fixtures, not live markets.</p>}

        {excludedUntil && (
          <p role="alert" className="mt-4 rounded-md border border-block/30 bg-block-soft p-3 text-sm text-foreground">
            Self-exclusion is active until {new Date(excludedUntil).toLocaleString()}. All checks are blocked.
          </p>
        )}

        <form
          className="mt-6 space-y-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!canRun) return;
            setBusy(true);
            setResult(null);
            try {
              const r = await run({
                data: { fixtureId, side, localHour: new Date().getHours(), ...(mode === "usd" ? { stake: amt } : { contracts: amt }) },
              });
              setResult(r as CheckResult);
            } catch (err) {
              toast.error((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">1. Market</legend>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Label htmlFor="fx-search" className="sr-only">Search fixtures</Label>
              <Input id="fx-search" placeholder="Search team or ticker" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <RadioGroup value={fixtureId} onValueChange={setFixtureId} className="max-h-80 gap-0 overflow-y-auto rounded-md border border-border bg-card" aria-label="Fixtures">
              {fixtures.isLoading && <p className="p-3 text-sm text-muted-foreground">Loading fixtures…</p>}
              {list.map((f) => (
                <label key={f.id} htmlFor={`fx-${f.id}`} className={cn("flex cursor-pointer items-start gap-3 border-b border-border p-3 last:border-b-0 hover:bg-muted", fixtureId === f.id && "bg-accent")}>
                  <RadioGroupItem id={`fx-${f.id}`} value={f.id} className="mt-1" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">{f.home} vs {f.away}</span>
                    <span className="block text-xs text-muted-foreground">
                      {f.sport} · {new Date(f.start_time).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="num block truncate text-xs text-muted-foreground">{f.kalshi_ticker}</span>
                  </span>
                </label>
              ))}
              {!fixtures.isLoading && list.length === 0 && <p className="p-3 text-sm text-muted-foreground">No fixtures match.</p>}
            </RadioGroup>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">2. Side</legend>
            <ToggleGroup type="single" variant="outline" value={side} onValueChange={(v) => v && setSide(v as "YES" | "NO")} aria-label="Side">
              <ToggleGroupItem value="YES" className="px-6">YES</ToggleGroupItem>
              <ToggleGroupItem value="NO" className="px-6">NO</ToggleGroupItem>
            </ToggleGroup>
            <p className="text-xs text-muted-foreground">YES = home team wins in regulation time.</p>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">3. Size</legend>
            <ToggleGroup type="single" variant="outline" size="sm" value={mode} onValueChange={(v) => v && setMode(v as "usd" | "contracts")} aria-label="Enter size as">
              <ToggleGroupItem value="usd">Stake (USD)</ToggleGroupItem>
              <ToggleGroupItem value="contracts">Contracts</ToggleGroupItem>
            </ToggleGroup>
            <Label htmlFor="amount" className="sr-only">{mode === "usd" ? "Stake in USD" : "Number of contracts"}</Label>
            <Input id="amount" type="number" inputMode="decimal" min={0} step={mode === "usd" ? "0.01" : "1"} placeholder={mode === "usd" ? "e.g. 25.00" : "e.g. 40"} className="num" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </fieldset>

          <Button type="submit" size="lg" disabled={!canRun}>{busy ? "Running check…" : "Run check"}</Button>
        </form>
      </div>

      <div aria-live="polite">
        {result ? (
          <div className="space-y-6">
            <ResultCard r={result} />
            <CoachCard r={result} />
            <TimeTravel r={result} />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-8 text-sm text-muted-foreground">
            Pick a market, side and size, then run a check. The result shows whether it fits your limits and how the price compares with the wider market.
          </div>
        )}
      </div>
    </div>
  );
}
