import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageTitle, Panel, StatusPill } from "@/components/SiteChrome";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { setActivePersona } from "@/lib/backend/api";
import { resetDemo } from "@/lib/backend/bc.functions";
import { PERSONAS, type PersonaKey } from "@/lib/backend/personas";
import { q } from "@/lib/backend/api";
import { gbp } from "@/lib/demo/data";
import { useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";

export const Route = createFileRoute("/account")({
  head: pageHead("Account", "Language, plain-language mode, connected bank and your full history of bet checks."),
  component: AccountPage,
});

const languages = [
  ["en", "English"], ["cy", "Cymraeg"], ["pl", "Polski"], ["ur", "اردو"], ["pa", "ਪੰਜਾਬੀ"],
] as const;

function AccountPage() {
  const { state, update, reset } = useDemo();
  const checks = useQuery(q.checks());
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const who = PERSONAS[state.persona];
  const switchTo = (p: PersonaKey) => {
    if (p === state.persona) return;
    setActivePersona(p);
    update((s) => ({ ...s, persona: p }));
    qc.removeQueries({ queryKey: ["bc"] });
    toast(`Now viewing as ${PERSONAS[p].name}.`);
  };
  const doReset = async () => {
    if (!confirm("Reset the demo? This clears limits, breaks, your answers and the check list for both accounts.")) return;
    setBusy(true);
    try {
      await resetDemo();
      reset();
      setActivePersona("priya");
      qc.removeQueries({ queryKey: ["bc"] });
      toast("Demo reset.");
    } catch {
      toast.error("Couldn't reset the demo. Try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageTitle title="Account" sub={`${who.name} · ${state.onboarded ? "Monzo (demo)" : "No bank connected"}`} />
      <Panel className="mb-6">
        <h2 className="text-lg font-semibold">Demo account</h2>
        <p className="text-sm text-muted-foreground">Switch to see how the same bet looks for someone in a different situation.</p>
        <div role="radiogroup" aria-label="Demo account" className="mt-3 grid gap-3 sm:grid-cols-2">
          {(Object.keys(PERSONAS) as PersonaKey[]).map((k) => {
            const active = state.persona === k;
            return (
              <button key={k} role="radio" aria-checked={active} onClick={() => switchTo(k)}
                className={`rounded-2xl border p-4 text-left transition ${active ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}>
                <div className="font-semibold">{PERSONAS[k].name}</div>
                <div className={`text-sm ${active ? "opacity-80" : "text-muted-foreground"}`}>{PERSONAS[k].blurb}</div>
              </button>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="plain" className="text-base">Plain language</Label>
              <p className="text-sm text-muted-foreground">Short, simple coach messages without percentiles.</p>
            </div>
            <Switch id="plain" checked={state.plainLanguage} onCheckedChange={(v) => update((s) => ({ ...s, plainLanguage: v }))} />
          </div>
        </Panel>
        <Panel>
          <Label htmlFor="lang" className="text-base">Language</Label>
          <select id="lang" value={state.language} onChange={(e) => update((s) => ({ ...s, language: e.target.value }))} className="mt-2 h-11 w-full rounded-full bg-input px-4">
            {languages.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {state.language !== "en" && <p className="mt-2 text-xs text-muted-foreground">Translations arrive with the full release.</p>}
        </Panel>
      </div>

      <Panel className="mt-6">
        <h2 className="text-lg font-semibold">All bet checks</h2>
        <p className="text-sm text-muted-foreground">A permanent record of every check.</p>
        <ul className="mt-3 divide-y divide-border">
          {checks.isPending && <li className="py-3 text-sm text-muted-foreground">Loading…</li>}
          {checks.data?.length === 0 && <li className="py-3 text-sm text-muted-foreground">No checks yet.</li>}
          {checks.data?.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span><span className="font-medium">{c.market}</span><span className="text-muted-foreground"> · {new Date(c.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {gbp(c.stake)}</span></span>
              <StatusPill status={c.status} />
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="mt-6">
        <h2 className="text-lg font-semibold">Demo</h2>
        <p className="text-sm text-muted-foreground">Start fresh for both accounts: clears limits, breaks, your transaction answers and the check list, and switches back to Priya.</p>
        <Button variant="secondary" className="mt-3 rounded-full" disabled={busy} onClick={doReset}>{busy ? "Resetting…" : "Reset demo"}</Button>
      </Panel>
    </div>
  );
}
