import { createFileRoute, notFound } from "@tanstack/react-router";
import { PunditMarketPage } from "@/components/pundit/PunditMarketPage";
import { resolvePunditMarket } from "@/lib/demo/pundit";
import { pageHead } from "@/lib/demo/head";

export const Route = createFileRoute("/market/$id")({
  loader: ({ params }) => {
    const market = resolvePunditMarket(params.id);
    if (!market) throw notFound();
    return { marketId: market.id };
  },
  head: pageHead("Pundit mock market", "Try a mock prediction-market order and see the live BetCheck overlay before you buy."),
  component: MarketPage,
});

function MarketPage() {
  const { marketId } = Route.useLoaderData();
  return <PunditMarketPage key={marketId} initialMarketId={marketId} />;
}
