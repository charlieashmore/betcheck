import { describe, expect, it } from "vitest";
import { ceilToCent, describeGap, impliedProbability, kalshiFeePerContract, removeMargin, runBenchmark, type SourceQuote } from "./benchmark";

const now = new Date("2026-11-07T12:00:00Z");
const ago = (s: number) => new Date(now.getTime() - s * 1000).toISOString();
const src = (source: string, odds: number[], age = 5): SourceQuote => ({ source, odds, targetIndex: 0, fetchedAt: ago(age) });

describe("odds conversion", () => {
  it("implied probability is 1/odds", () => {
    expect(impliedProbability(2)).toBe(0.5);
    expect(() => impliedProbability(1)).toThrow();
  });
  it("1.80/2.10 removes margin to ~53.8% / 46.2%", () => {
    const [a, b] = removeMargin([1.8, 2.1]);
    expect(a * 100).toBeCloseTo(53.85, 1);
    expect(b * 100).toBeCloseTo(46.15, 1);
    expect(a + b).toBeCloseTo(1, 10);
  });
});

describe("Kalshi fee", () => {
  it("rounds up to the cent", () => {
    expect(ceilToCent(0.0101)).toBe(0.02);
    expect(ceilToCent(0.02)).toBe(0.02);
  });
  it("0.07 * 0.5 * 0.5 = 0.0175 -> $0.02", () => {
    expect(kalshiFeePerContract(0.5)).toBe(0.02);
  });
  it("price 0.90 -> 0.0063 -> $0.01", () => {
    expect(kalshiFeePerContract(0.9)).toBe(0.01);
  });
});

describe("wording thresholds", () => {
  it("|gap| < 2 is in line", () => expect(describeGap(1.9).direction).toBe("in_line"));
  it("gap >= 2 is above", () => expect(describeGap(2).direction).toBe("above"));
  it("gap <= -2 is below", () => expect(describeGap(-2).direction).toBe("below"));
  it("wording names the points", () => expect(describeGap(5.04).wording).toContain("about 5.0 points ABOVE"));
});

describe("runBenchmark", () => {
  const kalshi = { yesPrice: 0.55, noPrice: 0.47, fetchedAt: ago(5) };

  it("computes gap from effective cost and consensus fair", () => {
    const r = runBenchmark({ side: "YES", kalshi, sources: [src("pinnacle", [1.8, 2.1]), src("betfair", [1.8, 2.1])], hasMapping: true, now });
    expect(r.status).toBe("ok");
    expect(r.fee).toBe(0.02);
    expect(r.effectiveCost).toBe(0.57);
    expect(r.gapPp!).toBeCloseTo(57 - 53.846, 1);
    expect(r.direction).toBe("above");
  });

  it("NO side uses 1 - fair", () => {
    const r = runBenchmark({ side: "NO", kalshi, sources: [src("pinnacle", [1.8, 2.1])], hasMapping: true, now });
    expect(r.fair!).toBeCloseTo(0.4615, 3);
  });

  it("refuses when no mapping exists", () => {
    const r = runBenchmark({ side: "YES", kalshi, sources: [], hasMapping: false, now });
    expect(r.status).toBe("unavailable");
    expect(r.reason).toMatch(/No matched bookmaker market/);
  });

  it("refuses when a price is older than 60 seconds", () => {
    const r = runBenchmark({ side: "YES", kalshi, sources: [src("pinnacle", [1.8, 2.1], 61)], hasMapping: true, now });
    expect(r.status).toBe("unavailable");
    expect(r.reason).toMatch(/older than 60 seconds/);
  });

  it("refuses when the Kalshi price is stale", () => {
    const r = runBenchmark({ side: "YES", kalshi: { ...kalshi, fetchedAt: ago(90) }, sources: [src("pinnacle", [1.8, 2.1])], hasMapping: true, now });
    expect(r.status).toBe("unavailable");
  });

  it("market uncertain when sources disagree by more than 4 points", () => {
    const r = runBenchmark({ side: "YES", kalshi, sources: [src("pinnacle", [1.8, 2.1]), src("betfair", [2.2, 1.7])], hasMapping: true, now });
    expect(r.status).toBe("uncertain");
  });

  it("4 points or fewer apart is still compared", () => {
    // 50% vs ~53.8% fair ≈ 3.8pp
    const r = runBenchmark({ side: "YES", kalshi, sources: [src("a", [1.8, 2.1]), src("b", [2, 2])], hasMapping: true, now });
    expect(r.status).toBe("ok");
  });
});
