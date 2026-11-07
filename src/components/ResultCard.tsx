import { ExternalLink, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { StatusBadge, toneSurface, type Tone } from "@/components/Status";
import type { AffordabilityResult } from "@/lib/affordability";
import type { BenchmarkResult } from "@/lib/benchmark";
import { cn } from "@/lib/utils";

const SOURCE_NAMES: Record<string, string> = { pinnacle: "Pinnacle", betfair_exchange: "Betfair Exchange", smarkets: "Smarkets", kalshi: "Kalshi" };
const usd = (n: number) => `$${n.toFixed(2)}`;
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const age = (s: number) => (s < 60 ? `${Math.round(s)}s ago` : `${Math.round(s / 60)} min ago`);

export interface CheckResult {
  fixture: { home: string; away: string; kalshi_ticker: string };
  side: "YES" | "NO";
  stake: number;
  affordability: AffordabilityResult;
  benchmark: BenchmarkResult;
}

export function benchmarkTone(b: BenchmarkResult): Tone {
  return b.status === "ok" ? "neutral" : "neutral";
}

export function ResultCard({ r }: { r: CheckResult }) {
  const blocked = r.affordability.overall === "block";
  const bench = <Benchmark b={r.benchmark} />;
  return (
    <article className="rounded-lg border border-border bg-card" aria-labelledby="result-title">
      <header className="border-b border-border p-5">
        <h2 id="result-title" className="font-semibold text-foreground">
          {r.fixture.home} vs {r.fixture.away} · {r.side} · <span className="num">{usd(r.stake)}</span>
        </h2>
        <p className="num mt-1 text-xs text-muted-foreground">{r.fixture.kalshi_ticker}</p>
      </header>

      <section className="p-5" aria-labelledby="aff-title">
        <div className="flex items-center justify-between gap-2">
          <h3 id="aff-title" className="font-semibold text-foreground">Affordability</h3>
          <StatusBadge tone={r.affordability.overall} />
        </div>
        <ul className="mt-3 space-y-2">
          {r.affordability.rules.map((rule) => (
            <li key={rule.id} className={cn(toneSurface({ tone: rule.status }), "p-3")}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{rule.label}</span>
                <StatusBadge tone={rule.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{rule.reason}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-border p-5" aria-labelledby="bench-title">
        {blocked ? (
          <Collapsible>
            <CollapsibleTrigger className="group flex w-full items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <h3 id="bench-title" className="font-semibold text-foreground">Market benchmark</h3>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">Show <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden /></span>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">{bench}</CollapsibleContent>
          </Collapsible>
        ) : (
          <>
            <h3 id="bench-title" className="font-semibold text-foreground">Market benchmark</h3>
            <div className="mt-3">{bench}</div>
          </>
        )}
      </section>

      <footer className="border-t border-border p-5">
        <Button asChild variant="outline">
          <a href={`https://kalshi.com/markets/${r.fixture.kalshi_ticker.toLowerCase()}`} target="_blank" rel="noreferrer noopener">
            Open on Kalshi <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        </Button>
      </footer>
    </article>
  );
}

function Benchmark({ b }: { b: BenchmarkResult }) {
  if (b.status !== "ok") {
    return (
      <div className={cn(toneSurface({ tone: "neutral" }), "p-4")}>
        <StatusBadge tone="neutral" label={b.status === "uncertain" ? "Market uncertain" : "No benchmark available"} />
        <p className="mt-2 text-sm text-foreground">{b.reason}</p>
        {b.sources.length > 0 && <Sources b={b} />}
      </div>
    );
  }
  const rows: [string, string][] = [
    ["Kalshi price", usd(b.price!)],
    ["Estimated fee (per contract)", usd(b.fee!)],
    ["Effective cost", usd(b.effectiveCost!)],
    ["Consensus fair probability", pct(b.fair!)],
    ["Gap", `${b.gapPp! >= 0 ? "+" : ""}${b.gapPp!.toFixed(1)} pts`],
  ];
  return (
    <div>
      <p className="rounded-md bg-accent p-3 text-sm font-medium text-accent-foreground">{b.wording}</p>
      <dl className="mt-3 divide-y divide-border rounded-md border border-border">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between px-3 py-2 text-sm">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="num text-foreground">{v}</dd>
          </div>
        ))}
      </dl>
      <Sources b={b} />
    </div>
  );
}

function Sources({ b }: { b: BenchmarkResult }) {
  return (
    <div className="mt-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sources</h4>
      <ul className="mt-1 space-y-1 text-sm">
        {b.kalshiAgeSeconds !== undefined && (
          <li className="flex justify-between"><span>Kalshi</span><span className="num text-muted-foreground">updated {age(b.kalshiAgeSeconds)}</span></li>
        )}
        {b.sources.map((s) => (
          <li key={s.source} className="flex justify-between gap-2">
            <span>{SOURCE_NAMES[s.source] ?? s.source} <span className="num text-muted-foreground">· fair {pct(s.fair)}</span></span>
            <span className="num text-muted-foreground">updated {age(s.ageSeconds)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
