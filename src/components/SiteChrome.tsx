import { Link } from "@tanstack/react-router";

export function LogoMark({ className = "h-[26px] w-[26px]" }: { className?: string }) {
  return (
      <svg className={className} viewBox="0 0 51 51" fill="none" aria-hidden>
        <circle cx="25.4458" cy="25.4458" r="24" fill="var(--background)" strokeWidth="2.89157" stroke="currentColor" />
        <path d="M16.1927 34.4096C23.6952 38.3483 27.9798 38.1809 34.6988 34.4096" strokeWidth="2.89157" strokeLinecap="round" stroke="currentColor" />
        <path d="M12.4337 19.3735L20.8193 22.1205" strokeWidth="2.89157" strokeLinecap="round" stroke="currentColor" />
        <path d="M33.746 29.1522C33.4484 29.1522 33.2071 28.911 33.2071 28.6134V12.8675C33.2071 12.5698 33.4484 12.3286 33.746 12.3286C34.0436 12.3286 34.2849 12.5698 34.2849 12.8675V28.6134C34.2849 28.911 34.0436 29.1522 33.746 29.1522ZM37.4908 17.5465C36.9711 17.5465 36.5666 17.1292 36.2907 16.6888C36.1478 16.4606 35.9545 16.2646 35.7109 16.1008C35.2027 15.7547 34.5631 15.5816 33.792 15.5816C33.2399 15.5816 32.7624 15.6692 32.3593 15.8445C31.9563 16.0153 31.643 16.2519 31.4196 16.5542C31.2005 16.8521 31.091 17.1917 31.091 17.5728C31.091 17.8927 31.1655 18.1687 31.3144 18.4009C31.4678 18.6331 31.6671 18.828 31.9125 18.9858C32.1622 19.1391 32.4294 19.2683 32.7142 19.3735C32.999 19.4743 33.2728 19.5575 33.5357 19.6232L34.85 19.9649C35.2794 20.0701 35.7197 20.2125 36.1709 20.3921C36.6222 20.5717 37.0406 20.8083 37.4261 21.1019C37.8117 21.3954 38.1228 21.759 38.3593 22.1928C38.6003 22.6265 38.7208 23.1457 38.7208 23.7503C38.7208 24.5126 38.5236 25.1895 38.1293 25.7809C37.7394 26.3724 37.172 26.839 36.4272 27.1807C35.6868 27.5224 34.7909 27.6933 33.7394 27.6933C32.7317 27.6933 31.8599 27.5334 31.1238 27.2136C30.3878 26.8938 29.8117 26.4403 29.3955 25.8532C29.1746 25.5393 29.0061 25.1946 28.8901 24.819C28.7158 24.2545 29.202 23.7503 29.7927 23.7503C30.3294 23.7503 30.742 24.1872 31.0018 24.6567C31.0628 24.767 31.1341 24.87 31.2158 24.966C31.4962 25.2859 31.8533 25.5246 32.287 25.6824C32.7252 25.8357 33.2049 25.9124 33.7263 25.9124C34.3002 25.9124 34.8106 25.8226 35.2575 25.6429C35.7087 25.4589 36.0636 25.2048 36.3221 24.8806C36.5806 24.552 36.7098 24.1687 36.7098 23.7306C36.7098 23.3319 36.5959 23.0055 36.3681 22.7514C36.1447 22.4973 35.8402 22.287 35.4546 22.1205C35.0735 21.954 34.6419 21.8072 34.16 21.6802L32.5696 21.2464C31.4919 20.9529 30.6375 20.5214 30.0066 19.9518C29.3801 19.3823 29.0669 18.6287 29.0669 17.6911C29.0669 16.9157 29.2772 16.2388 29.6978 15.6605C30.1184 15.0821 30.6879 14.6331 31.4064 14.3132C32.1249 13.989 32.9355 13.8269 33.838 13.8269C34.7493 13.8269 35.5532 13.9869 36.2498 14.3067C36.9508 14.6265 37.5028 15.0668 37.9059 15.6276C38.1062 15.9041 38.2589 16.2012 38.364 16.5188C38.5441 17.0633 38.0643 17.5465 37.4908 17.5465Z" fill="currentColor" />
      </svg>
  );
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-sans text-lg font-bold tracking-[-0.05em] text-foreground" aria-label="BetCheck home">
      <LogoMark />
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
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 font-sans tracking-[-0.05em]">
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
