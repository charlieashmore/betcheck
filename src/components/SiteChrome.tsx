import { Link, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const navCls = "rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const activeCls = "bg-secondary text-foreground font-medium";

export function SiteHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3">
        <Link to="/" className="mr-auto flex items-center gap-2 font-semibold text-foreground">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
          Stakewise
        </Link>
        {user ? (
          <nav aria-label="Main" className="flex flex-wrap items-center gap-1">
            <Link to="/check" className={navCls} activeProps={{ className: activeCls }}>Check a trade</Link>
            <Link to="/limits" className={navCls} activeProps={{ className: activeCls }}>My limits</Link>
            <Link to="/history" className={navCls} activeProps={{ className: activeCls }}>History</Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/" });
              }}
            >
              Sign out
            </Button>
          </nav>
        ) : (
          <Button asChild size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto max-w-5xl px-4 py-4 text-sm text-muted-foreground">
        Information only, not financial or betting advice. 18+. Gambling help:{" "}
        <a className="font-medium text-foreground underline underline-offset-2" href="tel:08088020133">GamCare 0808 8020 133</a>.
      </div>
    </footer>
  );
}
