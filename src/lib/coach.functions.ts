import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const input = z.object({
  market: z.string().max(200),
  side: z.enum(["YES", "NO"]),
  stake: z.number().nonnegative().max(1_000_000),
  overall: z.enum(["pass", "warn", "block"]),
  rules: z.array(z.object({ label: z.string().max(100), status: z.string().max(10), reason: z.string().max(300) })).max(20),
  benchmark: z.string().max(300),
  localHour: z.number().int().min(0).max(23),
});

const SYSTEM = `You are a calm, neutral reflection coach inside Stakewise, an information-only tool for people considering Kalshi sports event contracts.
Write 2-4 short sentences in plain British English.
- Name any cognitive patterns the data suggests (e.g. loss-chasing, escalating stakes, high frequency, late-night fatigue, anchoring on a price), or say none stand out.
- Never recommend placing or not placing the trade, never predict outcomes, never use the words "bet", "safe bet" or "good bet", no exclamation marks, no celebration.
- End with one open reflective question for the person.`;

export const getCoachReflection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => input.parse(d))
  .handler(async ({ data }) => {
    const { generateMessage, GatewayError } = await import("@lovable.dev/ai-gateway");
    const facts = [
      `Market: ${data.market}, side ${data.side}, stake $${data.stake.toFixed(2)}, local hour ${data.localHour}.`,
      `Overall affordability: ${data.overall}.`,
      ...data.rules.map((r) => `- ${r.label}: ${r.status} (${r.reason})`),
      `Price benchmark: ${data.benchmark}`,
    ].join("\n");
    try {
      const res = await generateMessage({
        model: "anthropic/claude-haiku-4-5",
        max_tokens: 300,
        system: SYSTEM,
        messages: [{ role: "user", content: facts }],
      });
      const text = res.content
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("")
        .trim();
      return { text: text || null, error: null as string | null };
    } catch (e) {
      console.error("coach error", e);
      const msg = e instanceof GatewayError && e.httpStatus === 402 ? "AI credits are used up." : "Reflection unavailable right now.";
      return { text: null, error: msg };
    }
  });
