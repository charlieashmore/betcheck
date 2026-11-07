import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LimitsForm } from "@/components/LimitsForm";
import { completeProfile, getLimitsState, saveLimits } from "@/lib/stakewise.functions";
import { COUNTRIES, INELIGIBLE_COUNTRIES } from "@/lib/config";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set your limits — Stakewise" },
      { name: "description", content: "Set your income, staking and loss limits before running checks." },
      { property: "og:title", content: "Set your limits — Stakewise" },
      { property: "og:description", content: "Set your staking and loss limits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const get = useServerFn(getLimitsState);
  const save = useServerFn(saveLimits);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["limits"], queryFn: () => get() });
  const [busy, setBusy] = useState(false);

  if (q.isLoading) return <div className="mx-auto max-w-lg px-4 py-10 text-sm text-muted-foreground">Loading…</div>;
  if (q.data && !q.data.hasProfile) return <ProfileStep />;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold text-foreground">Set your limits</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Every check measures a trade against these numbers. Enter your income manually for now — bank connection is coming later. After today, lowering a limit applies instantly; raising one takes 48 hours.
      </p>
      <div className="mt-6 rounded-lg border border-border bg-card p-6">
        <LimitsForm
          initial={q.data?.limits ?? undefined}
          submitLabel="Save and continue"
          busy={busy}
          onSubmit={async (v) => {
            setBusy(true);
            try {
              await save({ data: v });
              await qc.invalidateQueries({ queryKey: ["limits"] });
              navigate({ to: "/check" });
            } catch (e) {
              toast.error((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        />
      </div>
    </div>
  );
}

function ProfileStep() {
  const complete = useServerFn(completeProfile);
  const qc = useQueryClient();
  const [country, setCountry] = useState("");
  const [adult, setAdult] = useState(false);
  const ineligible = country !== "" && INELIGIBLE_COUNTRIES.includes(country);
  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold text-foreground">Confirm your details</h1>
      <form
        className="mt-6 space-y-4 rounded-lg border border-border bg-card p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!adult || !country || ineligible) return;
          try {
            await complete({ data: { country, adult: true } });
            await qc.invalidateQueries({ queryKey: ["limits"] });
          } catch (err) {
            toast.error((err as Error).message);
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="pf-country">Country of residence</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger id="pf-country"><SelectValue placeholder="Choose your country" /></SelectTrigger>
            <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          {ineligible && <p role="alert" className="rounded-md border border-block/30 bg-block-soft p-3 text-sm text-block">Stakewise isn't available in this country.</p>}
        </div>
        <div className="flex items-start gap-3">
          <Checkbox id="pf-adult" checked={adult} onCheckedChange={(v) => setAdult(v === true)} />
          <Label htmlFor="pf-adult" className="text-sm font-normal">I confirm I am 18 or over.</Label>
        </div>
        <Button type="submit" disabled={!adult || !country || ineligible}>Continue</Button>
      </form>
    </div>
  );
}
