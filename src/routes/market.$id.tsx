import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { markets } from "@/lib/demo/data";
import { pageHead } from "@/lib/demo/head";

export const Route = createFileRoute("/market/$id")({
  loader: ({ params }) => {
    const m = markets.find((x) => x.id === params.id);
    if (!m) throw notFound();
    return m;
  },
  head: pageHead("Demo market", "A mock prediction-market page used to show how BetCheck checks a stake."),
  component: MarketPage,
});

function MarketPage() {
  const m = Route.useLoaderData();
  const navigate = useNavigate();
  const [stake, setStake] = useState("40");
  const n = Number(stake);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="mb-3 inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-medium">Mock {m.platform} page · demo only</p>
      <div className="rounded-2xl border border-border p-6">
        <p className="text-sm text-muted-foreground">{m.platform} · closes {m.closes}</p>
        <h1 className="mt-1 text-2xl font-bold">{m.title}</h1>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-foreground p-4 text-background">
            <p className="text-sm opacity-70">{m.outcome}</p>
            <p className="text-3xl font-bold num">{m.price}p</p>
          </div>
          <div className="rounded-xl bg-secondary p-4">
            <p className="text-sm text-muted-foreground">Other</p>
            <p className="text-3xl font-bold num">{100 - m.price}p</p>
          </div>
        </div>
        <form
          className="mt-6 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (n > 0) navigate({ to: "/result", search: { market: m.id, stake: n } });
          }}
        >
          <label className="sr-only" htmlFor="stake">Stake in pounds</label>
          <Input id="stake" type="number" min={1} value={stake} onChange={(e) => setStake(e.target.value)} className="h-11 rounded-full bg-input px-5" />
          <Button type="submit" className="h-11 rounded-full px-6" disabled={!(n > 0)}>Check with BetCheck</Button>
        </form>
      </div>
    </div>
  );
}
