import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Phone } from "lucide-react";
import { PageTitle, Panel } from "@/components/SiteChrome";
import { support } from "@/lib/demo/data";
import { pageHead } from "@/lib/demo/head";

export const Route = createFileRoute("/help")({
  head: pageHead("Help and support", "Free, confidential support for gambling and money worries: GamCare, BeGambleAware and StepChange."),
  component: HelpPage,
});

function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageTitle title="Help and support" sub="Talking to someone helps. These services are free and confidential." />
      <ul className="space-y-3">
        {support.map((s) => (
          <li key={s.name}>
            <Panel className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">{s.name}</p>
                <p className="text-sm text-muted-foreground">{s.detail}</p>
              </div>
              <div className="flex gap-2">
                <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"><Phone className="h-4 w-4" />{s.phone}</a>
                <a href={s.href} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-medium">Website <ExternalLink className="h-4 w-4" /></a>
              </div>
            </Panel>
          </li>
        ))}
      </ul>
      <Panel className="mt-6">
        <h2 className="font-semibold">How BetCheck works</h2>
        <p className="mt-2 text-sm text-muted-foreground">BetCheck reads your bank data (with your consent), spots payments that look like betting, forecasts your balance to rent day and checks a stake against your limits and a fair price. It never places bets and never moves money.</p>
      </Panel>
    </div>
  );
}
