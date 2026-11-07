import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { LimitsForm } from "@/components/LimitsForm";
import { saveLimits } from "@/lib/stakewise.functions";

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
  const save = useServerFn(saveLimits);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold text-foreground">Set your limits</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Every check measures a trade against these numbers. Enter your income manually for now — bank connection is coming later. After today, lowering a limit applies instantly; raising one takes 48 hours.
      </p>
      <div className="mt-6 rounded-lg border border-border bg-card p-6">
        <LimitsForm
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
