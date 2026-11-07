import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PageTitle, Panel } from "@/components/SiteChrome";
import { useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";

export const Route = createFileRoute("/onboarding")({
  head: pageHead("Connect your bank", "Give BetCheck read-only Open Banking access so it can spot betting spend and forecast rent day."),
  component: Onboarding,
});

const banks = ["Monzo", "Barclays", "HSBC", "Lloyds", "Nationwide", "Starling"];

function Onboarding() {
  const { update } = useDemo();
  const navigate = useNavigate();
  const [bank, setBank] = useState<string | null>(null);
  const [age, setAge] = useState(false);
  const [consent, setConsent] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const connect = () => {
    setConnecting(true);
    setTimeout(() => { update((s) => ({ ...s, onboarded: true })); navigate({ to: "/" }); }, 1200);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <PageTitle title="Connect your bank" sub="BetCheck reads your last 90 days of transactions. It can't move money or place bets." />
      <Panel>
        <p className="font-semibold">1. Choose your bank</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {banks.map((b) => (
            <button key={b} onClick={() => setBank(b)} aria-pressed={bank === b} className={`rounded-full border px-4 py-2.5 text-sm font-medium ${bank === b ? "border-foreground bg-foreground text-background" : "border-border hover:bg-secondary"}`}>{b}</button>
          ))}
        </div>
        <p className="mt-6 font-semibold">2. Your consent</p>
        <div className="mt-3 space-y-3 text-sm">
          <label className="flex items-start gap-3"><Checkbox checked={age} onCheckedChange={(v) => setAge(v === true)} className="mt-0.5" />I'm 18 or over.</label>
          <label className="flex items-start gap-3"><Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />I agree to share read-only account and transaction data for 90 days via Open Banking. I can withdraw this at any time.</label>
        </div>
        <Button className="mt-6 h-11 w-full rounded-full" disabled={!bank || !age || !consent || connecting} onClick={connect}>
          {connecting ? "Connecting…" : bank ? `Connect ${bank}` : "Connect"}
        </Button>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5" />Demo only: no real bank is contacted. Sample data for Priya is used.</p>
      </Panel>
    </div>
  );
}
