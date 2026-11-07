import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stakewise — check a Kalshi trade before you place it" },
      { name: "description", content: "Stakewise checks whether a proposed Kalshi sports trade fits your limits and how its price compares with the wider betting market." },
      { property: "og:title", content: "Stakewise — check before you trade" },
      { property: "og:description", content: "Affordability and market-benchmark checks for Kalshi sports trades. Information only." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:py-20">
      <p className="text-sm font-medium uppercase tracking-wider text-primary">Advisory tool · 18+</p>
      <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-foreground md:text-5xl">
        Check a Kalshi sports trade before you place it yourself.
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        Stakewise answers two questions with evidence: can you afford it, and how does the Kalshi price compare with what the wider betting market expects?
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild size="lg"><Link to="/auth">Create an account</Link></Button>
        <Button asChild size="lg" variant="outline"><Link to="/auth">Sign in</Link></Button>
      </div>

      <div className="mt-16 grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="font-semibold text-foreground">What it does</h2>
          <ul className="mt-4 space-y-3 text-sm text-foreground">
            {[
              "Checks the stake against your own per-trade, monthly and loss limits.",
              "Flags patterns such as raising stakes after losses or late-night checking.",
              "Compares the Kalshi price (with estimated fee) to a margin-free consensus from sharp bookmakers.",
              "Shows sources and how old each price is — or refuses to compare when data is weak.",
            ].map((t) => (
              <li key={t} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-pass" aria-hidden />{t}</li>
            ))}
          </ul>
        </section>
        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="font-semibold text-foreground">What it does not do</h2>
          <ul className="mt-4 space-y-3 text-sm text-foreground">
            {[
              "It never places trades. You decide and act on Kalshi yourself.",
              "It never recommends an action or tells you whether to trade.",
              "It is not financial advice and cannot predict outcomes.",
            ].map((t) => (
              <li key={t} className="flex gap-2"><X className="mt-0.5 h-4 w-4 shrink-0 text-neutral" aria-hidden />{t}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-border bg-secondary p-6 text-sm text-secondary-foreground">
        <h2 className="font-semibold">18+ only. If gambling stops being fun, get support.</h2>
        <p className="mt-2">
          Free, confidential help is available from{" "}
          <a className="font-medium underline underline-offset-2" href="https://www.gamcare.org.uk" target="_blank" rel="noreferrer">GamCare</a> (0808 8020 133) and{" "}
          <a className="font-medium underline underline-offset-2" href="https://www.begambleaware.org" target="_blank" rel="noreferrer">BeGambleAware</a>.
        </p>
      </section>
    </div>
  );
}
