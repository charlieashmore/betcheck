import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageTitle, Panel, VerdictPill } from "@/components/SiteChrome";
import { gbp, profile } from "@/lib/demo/data";
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
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageTitle title="Account" sub={`${profile.name} · ${state.onboarded ? profile.bank : "No bank connected"}`} />
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
          {state.checks.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span><span className="font-medium">{c.market}</span><span className="text-muted-foreground"> · {c.at} · {gbp(c.stake)}</span></span>
              <VerdictPill verdict={c.verdict} />
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="mt-6">
        <h2 className="text-lg font-semibold">Demo</h2>
        <p className="text-sm text-muted-foreground">Clear limits, feedback and checks to run the demo again.</p>
        <Button variant="secondary" className="mt-3 rounded-full" onClick={() => { reset(); toast("Demo reset."); }}>Reset demo</Button>
      </Panel>
    </div>
  );
}
