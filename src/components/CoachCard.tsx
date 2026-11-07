import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getCoachReflection } from "@/lib/coach.functions";
import type { CheckResult } from "@/components/ResultCard";

export function CoachCard({ r }: { r: CheckResult & { id?: string } }) {
  const fn = useServerFn(getCoachReflection);
  const b = r.benchmark;
  const q = useQuery({
    queryKey: ["coach", r.id ?? `${r.fixture.kalshi_ticker}-${r.side}-${r.stake}`],
    staleTime: Infinity,
    retry: false,
    queryFn: () =>
      fn({
        data: {
          market: `${r.fixture.home} vs ${r.fixture.away}`,
          side: r.side,
          stake: r.stake,
          overall: r.affordability.overall,
          rules: r.affordability.rules.map((x) => ({ label: x.label, status: x.status, reason: x.reason })),
          benchmark: b.status === "ok" ? `in-market gap ${b.gapPp?.toFixed(1)}pp (${b.direction})` : `${b.status}: ${b.reason ?? ""}`,
          localHour: new Date().getHours(),
        },
      }),
  });

  return (
    <section className="rounded-lg border border-border bg-card p-5" aria-labelledby="coach-title" aria-live="polite">
      <h3 id="coach-title" className="font-semibold text-foreground">A moment to reflect</h3>
      <p className="mt-1 text-xs text-muted-foreground">AI reading of your patterns. It does not tell you what to do.</p>
      <div className="mt-3 text-sm leading-relaxed text-foreground">
        {q.isLoading && <p className="text-muted-foreground">Reading your recent pattern…</p>}
        {q.data?.text && <p>{q.data.text}</p>}
        {(q.data?.error || q.isError) && <p className="text-muted-foreground">{q.data?.error ?? "Reflection unavailable right now."}</p>}
      </div>
    </section>
  );
}
