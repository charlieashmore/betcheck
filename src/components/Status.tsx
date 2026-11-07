import { cva } from "class-variance-authority";
import { CheckCircle2, AlertTriangle, XCircle, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tone = "pass" | "warn" | "block" | "neutral";

export const toneSurface = cva("rounded-lg border", {
  variants: {
    tone: {
      pass: "border-pass/30 bg-pass-soft",
      warn: "border-warn/30 bg-warn-soft",
      block: "border-block/30 bg-block-soft",
      neutral: "border-border bg-neutral-soft",
    },
  },
});

const toneText: Record<Tone, string> = { pass: "text-pass", warn: "text-warn", block: "text-block", neutral: "text-neutral" };
const icons = { pass: CheckCircle2, warn: AlertTriangle, block: XCircle, neutral: MinusCircle };
const labels: Record<Tone, string> = { pass: "Pass", warn: "Warning", block: "Blocked", neutral: "No benchmark" };

export function StatusBadge({ tone, label, className }: { tone: Tone; label?: string; className?: string }) {
  const Icon = icons[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-semibold", toneText[tone], className)}>
      <Icon className="h-4 w-4" aria-hidden />
      {label ?? labels[tone]}
    </span>
  );
}
