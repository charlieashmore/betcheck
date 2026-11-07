import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { LimitsForm } from "@/components/LimitsForm";
import { getLimitsState, saveLimits, startExclusion } from "@/lib/stakewise.functions";
import { EXCLUSION_PERIODS } from "@/lib/config";

export const Route = createFileRoute("/_authenticated/limits")({
  head: () => ({
    meta: [
      { title: "My limits — Stakewise" },
      { name: "description", content: "Edit your staking and loss limits, and set a self-exclusion period." },
      { property: "og:title", content: "My limits — Stakewise" },
      { property: "og:description", content: "Edit limits and self-exclusion." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LimitsPage,
});

const LABELS: Record<string, string> = { monthly_stake_limit: "Monthly staking limit", per_bet_max: "Per-trade maximum", monthly_loss_limit: "Monthly loss limit" };

function useCountdown(target: string | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return null;
  const ms = Math.max(0, new Date(target).getTime() - now);
  const h = Math.floor(ms / 3_600_000), m = Math.floor((ms % 3_600_000) / 60_000), s = Math.floor((ms % 60_000) / 1000);
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

function LimitsPage() {
  const get = useServerFn(getLimitsState);
  const save = useServerFn(saveLimits);
  const exclude = useServerFn(startExclusion);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["limits"], queryFn: () => get() });
  const [busy, setBusy] = useState(false);
  const lim = q.data?.limits;
  const countdown = useCountdown(lim?.effective_at ?? null);

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 lg:grid-cols-2">
      <section>
        <h1 className="text-2xl font-semibold text-foreground">My limits</h1>
        <p className="mt-2 text-sm text-muted-foreground">Lowering a limit applies instantly. Raising one is scheduled 48 hours ahead.</p>

        {lim?.pending_increase && (
          <div role="status" className="mt-4 rounded-md border border-warn/30 bg-warn-soft p-4 text-sm text-foreground">
            <p className="font-medium">Scheduled increase — applies in <span className="num">{countdown}</span></p>
            <ul className="mt-2 space-y-1">
              {Object.entries(lim.pending_increase).map(([k, v]) => (
                <li key={k} className="num">{LABELS[k] ?? k}: ${Number(lim[k as keyof typeof lim]).toFixed(2)} → ${Number(v).toFixed(2)}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 rounded-lg border border-border bg-card p-6">
          {lim ? (
            <LimitsForm
              key={JSON.stringify(lim)}
              initial={lim}
              submitLabel="Save changes"
              busy={busy}
              onSubmit={async (v) => {
                setBusy(true);
                try {
                  const r = await save({ data: v });
                  toast.success(r.scheduled ? "Saved. Increases take effect in 48 hours." : "Saved.");
                  await qc.invalidateQueries({ queryKey: ["limits"] });
                } catch (e) {
                  toast.error((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{q.isLoading ? "Loading…" : "No limits set yet."}</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-foreground">Self-exclusion</h2>
        <p className="mt-2 text-sm text-muted-foreground">Blocks every check for the chosen period. It cannot be cancelled once started.</p>
        {q.data?.excludedUntil ? (
          <p role="status" className="mt-4 rounded-md border border-block/30 bg-block-soft p-4 text-sm text-foreground">
            Self-exclusion is active until <strong>{new Date(q.data.excludedUntil).toLocaleString()}</strong>.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {EXCLUSION_PERIODS.map((p) => (
              <AlertDialog key={p.id}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">{p.label}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Self-exclude for {p.label}?</AlertDialogTitle>
                    <AlertDialogDescription>All checks will be blocked until the period ends. You won't be able to undo this.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          await exclude({ data: { period: p.id } });
                          await qc.invalidateQueries({ queryKey: ["limits"] });
                          toast.success(`Self-exclusion started for ${p.label}.`);
                        } catch (e) {
                          toast.error((e as Error).message);
                        }
                      }}
                    >
                      Start self-exclusion
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ))}
          </div>
        )}
        <p className="mt-6 text-sm text-muted-foreground">
          Need to talk to someone? <a className="font-medium text-foreground underline underline-offset-2" href="https://www.gamcare.org.uk" target="_blank" rel="noreferrer">GamCare</a> ·{" "}
          <a className="font-medium text-foreground underline underline-offset-2" href="https://www.begambleaware.org" target="_blank" rel="noreferrer">BeGambleAware</a>
        </p>
      </section>
    </div>
  );
}
