import { PERSONAS } from "@/lib/backend/personas";
import { useDemo } from "@/lib/demo/store";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { BetCheckOverlay } from "@/components/pundit/BetCheckOverlay";
import { api, pauseHoursLeft, q } from "@/lib/backend/api";
import { gbp } from "@/lib/demo/data";
import {
  PUNDIT_MARKETS,
  chartPaths,
  type OverlayTicket,
  type PunditSide,
} from "@/lib/demo/pundit";
import { cn } from "@/lib/utils";

export function PunditMarketPage({ initialMarketId }: { initialMarketId: string }) {
  const { persona } = useDemo().state;
  const queryClient = useQueryClient();
  const stakeInput = useRef<HTMLInputElement>(null);
  const [marketId, setMarketId] = useState(initialMarketId);
  const [side, setSide] = useState<PunditSide>("yes");
  const [stake, setStake] = useState("");
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState<OverlayTicket | null>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [pausedUntil, setPausedUntil] = useState<string | null>(null);
  const limits = useQuery(q.limits());

  const market = PUNDIT_MARKETS.find((item) => item.id === marketId) ?? PUNDIT_MARKETS[0]!;
  const price = side === "yes" ? market.yes : market.no;
  const numericStake = Number(stake);
  const shares = numericStake > 0 ? numericStake / (price / 100) : 0;
  const paths = chartPaths(market.history);
  const pauseHours = pauseHoursLeft(limits.data?.limits);
  const paused = pauseHours > 0;

  const check = useMutation({
    mutationFn: (nextTicket: OverlayTicket) => api.overlayCheck({ market_id: nextTicket.market.id, side: nextTicket.side, stake_gbp: nextTicket.stake }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["bc", "checks"] });
      if (res.status === "paused" && res.paused_until) setPausedUntil(res.paused_until);
    },
  });

  const setWeeklyLimit = useMutation({
    mutationFn: (amount: number) => api.setLimits({ weekly_gambling_limit: amount }),
    onSuccess: (response, amount) => {
      queryClient.setQueryData(q.limits().queryKey, { limits: response.limits });
      queryClient.invalidateQueries({ queryKey: ["bc"] });
      toast(`Weekly limit set to £${amount}. It applies straight away.`);
      if (ticket) check.mutate(ticket);
    },
    onError: () => toast("Couldn't set the limit. Please try again."),
  });

  const pause = useMutation({
    mutationFn: () => api.setLimits({ pause_hours: 48 }),
    onSuccess: (response) => {
      queryClient.setQueryData(q.limits().queryKey, { limits: response.limits });
      queryClient.invalidateQueries({ queryKey: ["bc"] });
      setPausedUntil(response.limits.self_exclusion_until);
      toast("Paused for 48 hours.");
    },
    onError: () => toast("Couldn't start the pause. Please try again."),
  });

  const runCheck = (nextTicket: OverlayTicket) => {
    setTicket(nextTicket);
    setPausedUntil(null);
    setOverlayOpen(true);
    check.mutate(nextTicket);
  };

  const buy = () => {
    const amount = Number(stake);
    if (!stake.trim() || !(amount > 0)) {
      setError("Enter an amount first.");
      stakeInput.current?.focus();
      return;
    }
    if (amount > 10_000) {
      setError("Enter an amount of £10,000 or less.");
      return;
    }
    if (paused) return;
    setError("");
    runCheck({ market, side, stake: Math.round(amount * 100) / 100 });
  };

  const changeStake = () => {
    setOverlayOpen(false);
    window.setTimeout(() => {
      stakeInput.current?.focus();
      stakeInput.current?.select();
    }, 100);
  };

  const placeMock = () => {
    if (!ticket) return;
    setOverlayOpen(false);
    setStake("");
    check.reset();
    toast(`Mock order placed: ${ticket.side.toUpperCase()} ${gbp(ticket.stake)}. No real money moved.`);
  };

  return (
    <div className="min-h-full bg-pundit-background font-pundit-sans text-pundit-foreground">
      <div className="bg-pundit-banner px-4 py-1.5 text-center text-xs tracking-wide text-pundit-banner-foreground">
        MOCK MARKET FOR THE BETCHECK DEMO · fictional brand, no real money, no real trades
      </div>

      <header className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-pundit-border px-5 py-3.5 md:px-6">
        <div className="flex items-center gap-2 font-pundit-display text-xl font-bold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-pundit-brand text-sm text-pundit-brand-foreground">P</span>
          Pundit Markets
        </div>
        <nav aria-label="Pundit market categories" className="hidden items-center gap-4 text-sm text-pundit-muted md:flex">
          <span className="text-pundit-foreground">Sport</span><span>Politics</span><span>Economy</span><span>Culture</span>
        </nav>
        <div className="ml-auto text-sm text-pundit-muted">Demo wallet: <strong className="text-pundit-foreground num">£412.60</strong> · {PERSONAS[persona].name}</div>
        <button
          type="button"
          onClick={() => toast("BetCheck is watching this page. It checks your stake against your budget before you buy.")}
          className="flex items-center gap-2 rounded-full bg-overlay-background px-3 py-1.5 text-xs font-semibold text-overlay-foreground"
          aria-label="BetCheck extension: active"
        >
          <ShieldCheck className="h-4 w-4" /> BetCheck on
        </button>
      </header>

      <main className="mx-auto grid max-w-[1400px] gap-5 px-5 py-5 md:px-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_340px]">
        <section className="self-start overflow-hidden rounded-2xl border border-pundit-border bg-pundit-card" aria-label="Trending markets">
          <h2 className="px-4 pb-2 pt-3.5 text-xs font-semibold uppercase tracking-wide text-pundit-muted">Trending markets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1">
            {PUNDIT_MARKETS.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-pressed={item.id === market.id}
                onClick={() => {
                  setMarketId(item.id);
                  setSide("yes");
                  setError("");
                  setOverlayOpen(false);
                  setTicket(null);
                  check.reset();
                }}
                className={cn("border-t border-pundit-border px-4 py-3 text-left transition-colors hover:bg-pundit-card-raised", item.id === market.id && "bg-pundit-card-raised")}
              >
                <span className="block text-sm leading-snug">{item.question}</span>
                <span className="mt-1.5 flex items-center justify-between gap-2 text-xs text-pundit-muted">
                  <span>{item.volume} vol</span><strong className="font-semibold text-pundit-yes num">{item.yes}% YES</strong>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="self-start rounded-2xl border border-pundit-border bg-pundit-card p-5 md:p-6" aria-live="polite">
          <span className="inline-flex rounded-md bg-pundit-card-raised px-2 py-1 text-xs text-pundit-muted">{market.tag}</span>
          <h1 className="mt-3 font-pundit-display text-2xl font-bold leading-tight md:text-3xl">{market.question}</h1>
          <p className="mt-2 text-sm leading-relaxed text-pundit-muted">{market.resolution}</p>
          <div className="mt-5 flex flex-wrap items-baseline gap-2.5">
            <span className="font-pundit-display text-5xl font-bold num">{market.yes}%</span>
            <span className="text-sm text-pundit-muted">chance YES</span>
            <span className="text-sm text-pundit-yes">{market.change}</span>
          </div>
          <svg className="mt-2 block h-[180px] w-full" viewBox="0 0 600 180" preserveAspectRatio="none" role="img" aria-label={`Price history for ${market.question}`}>
            <path d={paths.area} className="fill-pundit-yes opacity-10" />
            <path d={paths.line} fill="none" className="stroke-pundit-yes" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          </svg>
          <dl className="mt-3 flex flex-wrap gap-x-7 gap-y-3 text-sm text-pundit-muted">
            <div><dt>Volume</dt><dd className="mt-0.5 font-semibold text-pundit-foreground num">{market.volume}</dd></div>
            <div><dt>Closes</dt><dd className="mt-0.5 font-semibold text-pundit-foreground">{market.closes}</dd></div>
            <div><dt>Traders</dt><dd className="mt-0.5 font-semibold text-pundit-foreground num">{market.traders}</dd></div>
          </dl>
          <p className="mt-5 rounded-xl bg-pundit-card-raised p-3.5 text-sm leading-relaxed text-pundit-muted">{market.oddsNote}</p>
        </section>

        <section className="self-start rounded-2xl border border-pundit-border bg-pundit-card pb-4 lg:col-span-2 xl:col-span-1" aria-label="Place a mock order">
          <h2 className="px-4 pb-2 pt-3.5 text-xs font-semibold uppercase tracking-wide text-pundit-muted">Buy</h2>
          <div className="grid grid-cols-2 gap-2.5 px-4">
            <button
              type="button"
              aria-pressed={side === "yes"}
              onClick={() => { setSide("yes"); setError(""); }}
              className={cn("rounded-xl border-2 border-transparent bg-pundit-yes-soft px-3 py-3 font-semibold text-pundit-yes", side === "yes" && "border-pundit-yes")}
            >
              YES<span className="mt-0.5 block text-xs font-medium num">{market.yes}p</span>
            </button>
            <button
              type="button"
              aria-pressed={side === "no"}
              onClick={() => { setSide("no"); setError(""); }}
              className={cn("rounded-xl border-2 border-transparent bg-pundit-no-soft px-3 py-3 font-semibold text-pundit-no", side === "no" && "border-pundit-no")}
            >
              NO<span className="mt-0.5 block text-xs font-medium num">{market.no}p</span>
            </button>
          </div>

          <label htmlFor="pundit-stake" className="block px-4 pb-1.5 pt-4 text-xs text-pundit-muted">Amount (£)</label>
          <div className="mx-4 flex items-center gap-2 rounded-xl border border-pundit-border bg-pundit-background px-3 py-2.5">
            <span className="text-lg text-pundit-muted">£</span>
            <input
              ref={stakeInput}
              id="pundit-stake"
              inputMode="decimal"
              type="number"
              min="0"
              step="0.01"
              value={stake}
              onChange={(event) => { setStake(event.target.value); setError(""); }}
              onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); buy(); } }}
              placeholder="0"
              aria-describedby="pundit-order-error"
              className="w-full min-w-0 bg-transparent font-pundit-sans text-xl font-semibold text-pundit-foreground outline-none placeholder:text-pundit-muted"
            />
          </div>
          <div className="flex gap-2 px-4 pt-2.5">
            {[5, 10, 25, 40].map((amount) => (
              <button
                type="button"
                key={amount}
                onClick={() => { setStake(amount === 40 ? "40" : String((Number(stake) || 0) + amount)); setError(""); }}
                className="flex-1 rounded-lg border border-pundit-border bg-pundit-card-raised px-1 py-1.5 text-xs text-pundit-foreground"
              >
                {amount === 40 ? "£40" : `+£${amount}`}
              </button>
            ))}
          </div>

          <dl className="mx-4 mt-4 grid gap-1.5 text-sm text-pundit-muted">
            <div className="flex justify-between"><dt>Avg price</dt><dd className="font-semibold text-pundit-foreground num">{price}p</dd></div>
            <div className="flex justify-between"><dt>Contracts</dt><dd className="font-semibold text-pundit-foreground num">{shares ? shares.toFixed(1) : "0"}</dd></div>
            <div className="flex justify-between"><dt>Returns if right</dt><dd className="font-semibold text-pundit-foreground num">{gbp(shares)}</dd></div>
          </dl>
          <button
            type="button"
            onClick={buy}
            disabled={paused}
            className={cn("mx-4 mt-4 w-[calc(100%-2rem)] rounded-xl px-4 py-3.5 text-base font-bold text-pundit-buy-foreground disabled:cursor-not-allowed disabled:opacity-40", side === "yes" ? "bg-pundit-yes" : "bg-pundit-no")}
          >
            {paused ? `Paused · ${pauseHours} hrs left` : `Buy ${side.toUpperCase()}`}
          </button>
          <p id="pundit-order-error" role="alert" className="mx-4 mt-2 min-h-5 text-xs text-pundit-no">
            {error || (paused ? `BetCheck pause is on for another ${pauseHours} hours.` : "")}
          </p>
          <p className="px-4 pt-1 text-xs leading-relaxed text-pundit-muted">Each contract pays £1 if right, £0 if wrong. Pundit Markets is fictional and made for the BetCheck demo.</p>
        </section>
      </main>

      <BetCheckOverlay
        open={overlayOpen}
        onOpenChange={setOverlayOpen}
        ticket={ticket}
        result={check.data}
        checking={check.isPending}
        error={check.error}
        pausedUntil={pausedUntil}
        actionPending={setWeeklyLimit.isPending || pause.isPending}
        onRetry={() => { if (ticket) runCheck(ticket); }}
        onSetLimit={(amount) => setWeeklyLimit.mutate(amount)}
        onPause={() => pause.mutate()}
        onChangeStake={changeStake}
        onPlaceMock={placeMock}
      />
    </div>
  );
}
