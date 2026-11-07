import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/Status";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { AffordabilityResult } from "@/lib/affordability";
import type { BenchmarkResult } from "@/lib/benchmark";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "History — Stakewise" },
      { name: "description", content: "Your past checks, and the trades you marked as placed." },
      { property: "og:title", content: "History — Stakewise" },
      { property: "og:description", content: "Past checks and outcomes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const [{ data: checks, error }, { data: trades }, { data: fixtures }] = await Promise.all([
        supabase.from("checks").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("placed_trades").select("*"),
        supabase.from("fixtures").select("id, home, away"),
      ]);
      if (error) throw error;
      const t = new Map((trades ?? []).map((x) => [x.check_id, x]));
      const f = new Map((fixtures ?? []).map((x) => [x.id, x]));
      return (checks ?? []).map((c) => ({ ...c, trade: t.get(c.id), fixture: f.get(c.fixture_id) }));
    },
  });

  const upsert = async (checkId: string, placed: boolean, outcome: "won" | "lost" | null) => {
    const { error } = await supabase.from("placed_trades").upsert({ check_id: checkId, user_id: user!.id, placed, outcome: placed ? outcome : null, updated_at: new Date().toISOString() });
    if (error) toast.error(error.message);
    await qc.invalidateQueries({ queryKey: ["history"] });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-foreground">History</h1>
      <p className="mt-2 text-sm text-muted-foreground">Every check is kept as a permanent record. Mark the trades you placed on Kalshi and their outcome — this is what the limits and loss-chasing rules use.</p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Market</TableHead>
              <TableHead className="text-right">Stake</TableHead>
              <TableHead>Affordability</TableHead>
              <TableHead>Benchmark</TableHead>
              <TableHead>Placed</TableHead>
              <TableHead>Outcome</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {q.data?.map((c) => {
              const a = c.affordability_result as unknown as AffordabilityResult;
              const b = c.benchmark_result as unknown as BenchmarkResult;
              const placed = c.trade?.placed ?? false;
              return (
                <TableRow key={c.id}>
                  <TableCell className="num whitespace-nowrap text-xs">{new Date(c.created_at).toLocaleString()}</TableCell>
                  <TableCell className="whitespace-nowrap">{c.fixture ? `${c.fixture.home} v ${c.fixture.away}` : c.fixture_id} · {c.side}</TableCell>
                  <TableCell className="num text-right">${Number(c.stake).toFixed(2)}</TableCell>
                  <TableCell><StatusBadge tone={a.overall} /></TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {b.status === "ok" ? <span className="num">{b.gapPp! >= 0 ? "+" : ""}{b.gapPp!.toFixed(1)} pts</span> : <StatusBadge tone="neutral" label={b.status === "uncertain" ? "Uncertain" : "None"} />}
                  </TableCell>
                  <TableCell>
                    <Checkbox aria-label="I placed this trade" checked={placed} onCheckedChange={(v) => upsert(c.id, v === true, c.trade?.outcome as "won" | "lost" | null ?? null)} />
                  </TableCell>
                  <TableCell>
                    <Select disabled={!placed} value={(c.trade?.outcome as string) ?? "pending"} onValueChange={(v) => upsert(c.id, true, v === "pending" ? null : (v as "won" | "lost"))}>
                      <SelectTrigger className="h-8 w-28" aria-label="Outcome"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="won">Won</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              );
            })}
            {q.data?.length === 0 && (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">No checks yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
