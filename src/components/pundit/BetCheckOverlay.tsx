import * as Dialog from "@radix-ui/react-dialog";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Check, LoaderCircle, X } from "lucide-react";
import { LogoMark } from "@/components/SiteChrome";
import { gbp } from "@/lib/demo/data";
import { ticketPrice, type OverlayTicket } from "@/lib/demo/pundit";
import type { StakeRes } from "@/lib/backend/api";
import { cn } from "@/lib/utils";

const statusCopy = {
  block: { label: "DOESN’T FIT YOUR BUDGET", className: "bg-block-soft text-block" },
  warn: { label: "WORTH A SECOND LOOK", className: "bg-warn-soft text-warn" },
  pass: { label: "FITS YOUR BUDGET", className: "bg-pass-soft text-pass" },
} as const;

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function friendlyReason(text: string) {
  return text
    .replace(/[A-Z][A-Z&' ]*RENT\b/g, "rent")
    .replace(/(\d{4})-(\d{2})-(\d{2})/g, (_, year, month, day) => `${Number(day)} ${months[Number(month) - 1]}`);
}

function formatPause(iso: string) {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "the end of your break";
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]!.slice(0, 3)}, ${String(date.getUTCHours()).padStart(2, "0")}:00`;
}

function money(value: number | null | undefined) {
  return value == null ? "—" : gbp(Math.round(value));
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: OverlayTicket | null;
  result?: StakeRes;
  checking: boolean;
  error: unknown;
  pausedUntil: string | null;
  hasWeeklyLimit: boolean;
  actionPending: boolean;
  onRetry: () => void;
  onSetLimit: () => void;
  onPause: () => void;
  onChangeStake: () => void;
  onPlaceMock: () => void;
};

export function BetCheckOverlay({
  open,
  onOpenChange,
  ticket,
  result,
  checking,
  error,
  pausedUntil,
  hasWeeklyLimit,
  actionPending,
  onRetry,
  onSetLimit,
  onPause,
  onChangeStake,
  onPlaceMock,
}: Props) {
  const status = result ? statusCopy[result.status] : null;
  const impact = result?.forecast_impact;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-pundit-scrim data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex h-dvh w-full max-w-[440px] flex-col border-t-8 border-overlay-accent bg-overlay-background font-sans text-overlay-foreground shadow-2xl duration-300 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right">
          <div className="flex items-center gap-2.5 px-6 pb-2 pt-5">
            <LogoMark className="h-7 w-7" />
            <Dialog.Title className="text-lg font-bold tracking-[-0.05em]">BetCheck</Dialog.Title>
            <Dialog.Close className="ml-auto rounded-full p-1.5 text-overlay-muted transition-colors hover:bg-overlay-line hover:text-overlay-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-overlay-foreground" aria-label="Close BetCheck">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">A live check of this mock order against your budget, limits and rent-day forecast.</Dialog.Description>

          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
            {pausedUntil ? (
              <div>
                <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-bold tracking-wide text-secondary-foreground">PAUSED</span>
                <h2 className="mt-4 text-2xl font-bold leading-tight">Betting paused until {formatPause(pausedUntil)}</h2>
                <p className="mt-3 text-sm leading-relaxed text-overlay-muted">You can lower limits any time. Raising one, or ending a pause early, waits 48 hours.</p>
                <p className="mt-5 text-sm leading-relaxed text-overlay-muted">If you’d like to talk to someone: <a className="font-medium text-overlay-foreground underline" href="tel:08088020133">GamCare 0808 8020 133</a> (free, 24/7), or <Link to="/help" className="underline">StepChange for debt advice</Link>.</p>
                <Dialog.Close className="mt-6 w-full rounded-xl bg-overlay-foreground px-4 py-3 text-sm font-semibold text-overlay-background">Close</Dialog.Close>
              </div>
            ) : checking ? (
              <div className="flex items-center gap-3 py-8 text-sm text-overlay-muted" role="status">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Checking this against your budget and rent day…
              </div>
            ) : error ? (
              <div role="alert">
                <h2 className="mt-4 text-2xl font-bold">BetCheck couldn’t run this check</h2>
                <p className="mt-3 text-sm leading-relaxed text-overlay-muted">{error instanceof Error ? error.message.slice(0, 220) : "Please try again."} Nothing has been placed.</p>
                <div className="mt-6 grid gap-2.5">
                  <button type="button" onClick={onRetry} className="rounded-xl bg-overlay-foreground px-4 py-3 text-sm font-semibold text-overlay-background">Try again</button>
                  <Dialog.Close className="rounded-xl border-2 border-overlay-foreground px-4 py-3 text-sm font-semibold">Close</Dialog.Close>
                </div>
              </div>
            ) : result && ticket && status ? (
              <div>
                <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-wide", status.className)}>{status.label}</span>
                <h2 className="mt-4 text-2xl font-bold leading-tight">{friendlyReason(result.headline)}</h2>
                <p className="mt-2.5 text-sm text-overlay-muted">
                  {ticket.market.question} · {ticket.side.toUpperCase()} at {Math.round(ticketPrice(ticket) * 100)}p · {gbp(ticket.stake)} stake
                </p>

                <div className="mt-4 rounded-xl border border-overlay-line bg-card p-3.5 text-sm leading-relaxed">
                  <p className="mb-1 text-xs font-bold tracking-wide text-overlay-accent-dark">HIDDEN COST</p>
                  {result.hidden_cost.message}
                </div>

                {impact && (
                  <div className="mt-3 grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl border border-overlay-line bg-card p-3 text-xs leading-relaxed text-overlay-muted">
                      Rent day, without this
                      <strong className="mt-1 block text-xl font-bold text-overlay-foreground num">{money(impact.typical_balance_without)}</strong>
                      {Math.round(impact.shortfall_chance_without * 100)}% chance of going short
                    </div>
                    <div className="rounded-xl border border-overlay-line bg-card p-3 text-xs leading-relaxed text-overlay-muted">
                      Rent day, with this
                      <strong className={cn("mt-1 block text-xl font-bold num", (impact.typical_balance_with ?? 0) < 0 ? "text-block" : "text-overlay-foreground")}>{money(impact.typical_balance_with)}</strong>
                      {Math.round(impact.shortfall_chance_with * 100)}% chance of going short
                    </div>
                  </div>
                )}

                <details className="mt-4 text-sm text-overlay-muted">
                  <summary className="cursor-pointer font-semibold text-overlay-foreground">Why am I seeing this?</summary>
                  <ul className="mt-3 grid gap-2.5">
                    {result.rules.map((rule) => (
                      <li key={rule.rule + rule.reason} className="grid grid-cols-[58px_1fr] items-start gap-2.5 leading-relaxed">
                        <span className={cn("rounded-md px-1 py-0.5 text-center text-[10px] font-bold", rule.status === "block" ? "bg-block-soft text-block" : rule.status === "warn" ? "bg-warn-soft text-warn" : "bg-pass-soft text-pass")}>
                          {rule.status.toUpperCase()}
                        </span>
                        <span>{friendlyReason(rule.reason)}</span>
                      </li>
                    ))}
                  </ul>
                </details>

                <div className="mt-5 grid gap-2.5">
                  {!hasWeeklyLimit && (
                    <button type="button" disabled={actionPending} onClick={onSetLimit} className="rounded-xl bg-overlay-foreground px-4 py-3 text-sm font-semibold text-overlay-background disabled:opacity-50">
                      {actionPending ? "Saving…" : "Set a £30 weekly limit"}
                    </button>
                  )}
                  <button type="button" disabled={actionPending} onClick={onPause} className={cn("rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-50", hasWeeklyLimit ? "bg-overlay-foreground text-overlay-background" : "border-2 border-overlay-foreground")}>
                    {actionPending ? "Saving…" : "Pause betting for 48 hours"}
                  </button>
                  <button type="button" onClick={onChangeStake} className="rounded-xl border-2 border-overlay-foreground px-4 py-3 text-sm font-semibold">Change my stake</button>
                  <button type="button" onClick={onPlaceMock} className="px-4 py-1 text-xs font-medium text-overlay-muted underline">I understand, place the mock order anyway</button>
                </div>

                {result.status === "block" && (
                  <p className="mt-4 text-xs leading-relaxed text-overlay-muted">
                    Worried about money or betting? <a className="text-overlay-foreground underline" href="tel:08088020133">GamCare: 0808 8020 133</a> (free, 24/7) · <Link to="/help" className="underline">StepChange for debt advice</Link>.
                  </p>
                )}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-overlay-line px-6 py-3 text-[11px] text-overlay-muted">
            <span>Information only, not financial or betting advice. 18+</span>
            <span className="whitespace-nowrap">Live backend</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
