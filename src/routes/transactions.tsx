import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageTitle, Panel } from "@/components/SiteChrome";
import { flagged, gbp } from "@/lib/demo/data";
import { useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";

export const Route = createFileRoute("/transactions")({
  head: pageHead("Flagged transactions", "Payments that look like betting or betting top-ups, with the reasons and your feedback."),
  component: TransactionsPage,
});

function TransactionsPage() {
  const { state, update } = useDemo();
  const answer = (merchant: string, v: boolean) => update((s) => ({ ...s, feedback: { ...s.feedback, [merchant]: v } }));
  const counted = flagged.filter((t) => state.feedback[t.merchant] ?? t.confidence >= 0.7);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageTitle title="Flagged transactions" sub={`${counted.length} payments counted as betting · ${gbp(counted.reduce((a, t) => a + t.amount, 0))} in the last 10 days`} />
      <ul className="space-y-3">
        {flagged.map((t) => {
          const fb = state.feedback[t.merchant];
          const unsure = t.confidence < 0.7;
          return (
            <li key={t.id}>
              <Panel className="p-4 md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{t.merchant}</p>
                    <p className="text-sm text-muted-foreground">{t.date} · {t.kind}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold num">{gbp(-t.amount)}</p>
                    <p className="text-xs text-muted-foreground">{Math.round(t.confidence * 100)}% confident</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {t.reasons.map((r) => <span key={r} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">{r}</span>)}
                </div>
                {(unsure || fb !== undefined) && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    <span className="text-sm">{fb === undefined ? "Was this for betting?" : fb ? "You said this was for betting." : "You said this wasn't for betting."}</span>
                    <Button size="sm" variant={fb === true ? "default" : "secondary"} className="rounded-full" onClick={() => answer(t.merchant, true)}>Yes</Button>
                    <Button size="sm" variant={fb === false ? "default" : "secondary"} className="rounded-full" onClick={() => answer(t.merchant, false)}>No</Button>
                    <span className="text-xs text-muted-foreground">Applies to every payment to {t.merchant}.</span>
                  </div>
                )}
              </Panel>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
