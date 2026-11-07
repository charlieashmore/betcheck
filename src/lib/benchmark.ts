// Pure benchmark logic. No I/O. Unit-tested in benchmark.test.ts.
import { BENCHMARK_CONFIG, type BenchmarkConfig } from "./config";

export type Side = "YES" | "NO";

export function impliedProbability(decimalOdds: number): number {
  if (!(decimalOdds > 1)) throw new Error(`Invalid decimal odds: ${decimalOdds}`);
  return 1 / decimalOdds;
}

/** fair_i = q_i / sum(q) */
export function removeMargin(decimalOdds: number[]): number[] {
  const q = decimalOdds.map(impliedProbability);
  const total = q.reduce((a, b) => a + b, 0);
  return q.map((x) => x / total);
}

export function ceilToCent(x: number): number {
  return Math.ceil(Math.round(x * 1e6) / 1e4) / 100;
}

/** Fee per contract = ceil_to_cent(rate * P * (1 - P)), P in dollars. */
export function kalshiFeePerContract(price: number, rate = BENCHMARK_CONFIG.kalshiFeeRate): number {
  return ceilToCent(rate * price * (1 - price));
}

export interface SourceQuote {
  source: string;
  /** Decimal odds for every outcome of the bookmaker market (e.g. home/draw/away). */
  odds: number[];
  /** Index of the outcome that the Kalshi YES contract corresponds to. */
  targetIndex: number;
  fetchedAt: string;
}

export interface KalshiQuote {
  yesPrice: number;
  noPrice: number;
  fetchedAt: string;
}

export interface BenchmarkInput {
  side: Side;
  kalshi: KalshiQuote | null;
  sources: SourceQuote[];
  hasMapping: boolean;
  now: Date;
}

export type Direction = "above" | "in_line" | "below";

export interface SourceDetail {
  source: string;
  fair: number;
  ageSeconds: number;
}

export interface BenchmarkResult {
  status: "ok" | "unavailable" | "uncertain";
  reason?: string;
  price?: number;
  fee?: number;
  effectiveCost?: number;
  fair?: number;
  gapPp?: number;
  direction?: Direction;
  wording?: string;
  kalshiAgeSeconds?: number;
  sources: SourceDetail[];
}

const ageSeconds = (iso: string, now: Date) => Math.max(0, (now.getTime() - new Date(iso).getTime()) / 1000);

export function describeGap(gapPp: number, cfg: BenchmarkConfig = BENCHMARK_CONFIG): { direction: Direction; wording: string } {
  const pts = Math.abs(gapPp).toFixed(1);
  if (Math.abs(gapPp) < cfg.inLineThresholdPp) {
    return { direction: "in_line", wording: "This price is in line with what the betting market expects." };
  }
  if (gapPp > 0) {
    return { direction: "above", wording: `This price is about ${pts} points ABOVE what the betting market expects.` };
  }
  return { direction: "below", wording: `This price is about ${pts} points BELOW what the betting market expects.` };
}

export function runBenchmark(input: BenchmarkInput, cfg: BenchmarkConfig = BENCHMARK_CONFIG): BenchmarkResult {
  const { side, kalshi, sources, now } = input;

  const details: SourceDetail[] = sources.map((s) => {
    const fairs = removeMargin(s.odds);
    const yesFair = fairs[s.targetIndex];
    return { source: s.source, fair: side === "YES" ? yesFair : 1 - yesFair, ageSeconds: ageSeconds(s.fetchedAt, now) };
  });

  if (!input.hasMapping || sources.length === 0) {
    return { status: "unavailable", reason: "No matched bookmaker market exists for this Kalshi contract.", sources: details };
  }
  if (!kalshi) {
    return { status: "unavailable", reason: "No Kalshi price is available for this contract.", sources: details };
  }

  const kalshiAge = ageSeconds(kalshi.fetchedAt, now);
  const stale = [
    ...(kalshiAge > cfg.maxPriceAgeSeconds ? [`Kalshi (${Math.round(kalshiAge)}s old)`] : []),
    ...details.filter((d) => d.ageSeconds > cfg.maxPriceAgeSeconds).map((d) => `${d.source} (${Math.round(d.ageSeconds)}s old)`),
  ];
  if (stale.length) {
    return {
      status: "unavailable",
      reason: `Prices are older than ${cfg.maxPriceAgeSeconds} seconds: ${stale.join(", ")}.`,
      kalshiAgeSeconds: kalshiAge,
      sources: details,
    };
  }

  const fairs = details.map((d) => d.fair);
  const spreadPp = (Math.max(...fairs) - Math.min(...fairs)) * 100;
  if (spreadPp > cfg.maxSourceDisagreementPp) {
    return {
      status: "uncertain",
      reason: `Market uncertain: the sharp sources disagree by ${spreadPp.toFixed(1)} points (limit ${cfg.maxSourceDisagreementPp}).`,
      kalshiAgeSeconds: kalshiAge,
      sources: details,
    };
  }

  const price = side === "YES" ? kalshi.yesPrice : kalshi.noPrice;
  const fee = kalshiFeePerContract(price, cfg.kalshiFeeRate);
  const effectiveCost = Math.round((price + fee) * 100) / 100;
  const fair = fairs.reduce((a, b) => a + b, 0) / fairs.length;
  const gapPp = (effectiveCost - fair) * 100;
  const { direction, wording } = describeGap(gapPp, cfg);

  return { status: "ok", price, fee, effectiveCost, fair, gapPp, direction, wording, kalshiAgeSeconds: kalshiAge, sources: details };
}
