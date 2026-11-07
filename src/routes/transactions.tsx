import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadError, Loading, PageTitle, Panel } from "@/components/SiteChrome";
import { gbp } from "@/lib/demo/data";
import { pageHead } from "@/lib/demo/head";
import { api, q, type Classified } from "@/lib/backend/api";

export const Route = createFileRoute("/transactions")({
  head: pageHead("Flagged transactions", "Payments that look like betting or betting top-ups, with the reasons and your feedback."),
  component: TransactionsPage,
});

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const kind: Record<string, string> = { gambling_operator: "betting", prediction_market: "prediction market", crypto_onramp: "crypto", ewallet: "e-wallet", international_transfer: "international transfer", other: "other" };

function Row({ c, ask, onAnswer, busy }: { c: Classified; ask: boolean; onAnswer: (v: boolean) => void; busy: boolean }) {
  const t = c.transaction;
  return (
    <Panel className="p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{t.description}</p>
          <p className="text-sm text-muted-foreground">{when(t.posted_at)} · {kind[c.category] ?? c.category}{c.source === "user" ? " · your answer" : c.source === "llm" ? " · checked by AI" : ""}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold num">{gbp(Number(t.amount))}</p>
          <p className="text-xs text-muted-foreground">{Math.round(c.confidence * 100)}% confident</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {c.reasons.map((r) => <span key={r} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">{r}</span>)}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <span className="text-sm">{ask ? "Was this for betting?" : "Not betting?"}</span>
        {ask && <Button size="sm" className="rounded-full" disabled={busy} onClick={() => onAnswer(true)}>Yes</Button>}
        <Button size="sm" variant="secondary" className="rounded-full" disabled={busy} onClick={() => onAnswer(false)}>{ask ? "No" : "Tell us"}</Button>
        <span className="text-xs text-muted-foreground">Applies to every payment to this merchant.</span>
      </div>
    </Panel>
  );
}

function TransactionsPage() {
  const qc = useQueryClient();
  const data = useQuery(q.classify());
  const answer = useMutation({
    mutationFn: ({ id, v }: { id: string; v: boolean }) => api.feedback(id, v),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bc"] }); toast("Thanks. Your forecast and coach now use your answer."); },
    onError: () => toast("Couldn't save that. Please try again."),
  });

  if (data.isPending) return <Loading label="Checking 90 days of transactions…" />;
  if (data.isError) return <LoadError error={data.error} />;
  const { flagged, questions } = data.data;
  const total = flagged.reduce((a, c) => a + Math.abs(Number(c.transaction.amount)), 0);
  const sort = (xs: Classified[]) => [...xs].sort((a, b) => b.transaction.posted_at.localeCompare(a.transaction.posted_at));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageTitle title="Flagged transactions" sub={`${flagged.length} payments counted as betting · ${gbp(Math.round(total))} over 90 days`} />
      {questions.length > 0 && (
        <>
          <h2 className="mb-3 text-lg font-semibold">Can you help? ({questions.length})</h2>
          <ul className="mb-8 space-y-3">
            {sort(questions).map((c) => <li key={c.transaction_id}><Row c={c} ask busy={answer.isPending} onAnswer={(v) => answer.mutate({ id: c.transaction_id, v })} /></li>)}
          </ul>
        </>
      )}
      <h2 className="mb-3 text-lg font-semibold">Counted as betting</h2>
      <ul className="space-y-3">
        {sort(flagged).map((c) => <li key={c.transaction_id}><Row c={c} ask={false} busy={answer.isPending} onAnswer={(v) => answer.mutate({ id: c.transaction_id, v })} /></li>)}
      </ul>
    </div>
  );
}
