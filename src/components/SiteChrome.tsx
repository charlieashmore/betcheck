import { Link } from "@tanstack/react-router";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground" aria-label="BetCheck home">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
        <rect width="26" height="26" rx="8" fill="currentColor" />
        <path d="M7 13.5l4 4 8-9" stroke="var(--background)" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      BetCheck
    </Link>
  );
}

const nav = [
  { to: "/", label: "Dashboard" },
  { to: "/forecast", label: "Forecast" },
  { to: "/transactions", label: "Transactions" },
  { to: "/limits", label: "Your limits" },
  { to: "/account", label: "Account" },
] as const;

const navCls = "whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4">
        <Logo />
        <nav aria-label="Main" className="-mx-1 flex flex-1 items-center gap-1 overflow-x-auto md:justify-end">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className={navCls} activeOptions={{ exact: n.to === "/" }} activeProps={{ className: "bg-foreground font-medium text-background hover:text-background" }}>
              {n.label}
            </Link>
          ))}
          <Link to="/help" className={navCls} activeProps={{ className: "bg-foreground font-medium text-background hover:text-background" }}>Help</Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 text-sm text-muted-foreground md:flex-row md:justify-between">
        <span>Information only, not financial or betting advice. 18+. Demo data.</span>
        <span>
          Gambling help: <a className="font-medium text-foreground underline underline-offset-2" href="tel:08088020133">GamCare 0808 8020 133</a>
        </span>
      </div>
    </footer>
  );
}

export function Panel({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <section className={`rounded-2xl border border-border bg-card p-5 md:p-6 ${className}`}>{children}</section>;
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
      {sub && <p className="mt-1 text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function VerdictPill({ verdict }: { verdict: "not-affordable" | "overvalued" | "ok" }) {
  const map = {
    "not-affordable": ["Not affordable", "bg-risk text-destructive-foreground"],
    overvalued: ["Overvalued", "bg-value text-value-foreground"],
    ok: ["Within limits", "bg-secondary text-foreground"],
  } as const;
  const [label, cls] = map[verdict];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}

export function StatusPill({ status }: { status: "pass" | "warn" | "block" }) {
  const map = {
    block: ["Not affordable", "bg-risk text-destructive-foreground"],
    warn: ["Worth a second look", "bg-value text-value-foreground"],
    pass: ["Within budget", "bg-secondary text-foreground"],
  } as const;
  const [label, cls] = map[status];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted-foreground">{label}</div>;
}

export function LoadError({ error }: { error: unknown }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center" role="alert">
      <p className="font-semibold">We couldn't load this right now.</p>
      <p className="mt-1 text-sm text-muted-foreground">{error instanceof Error ? error.message.slice(0, 200) : "Please try again."}</p>
    </div>
  );
}
