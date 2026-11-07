import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Limits } from "./checkStake";
import { setActivePersona } from "@/lib/backend/api";
import type { PersonaKey } from "@/lib/backend/personas";

export type CheckRecord = { id: string; at: string; market: string; stake: number; verdict: "not-affordable" | "overvalued" | "ok"; hiddenCost: number };

export type DemoState = {
  onboarded: boolean;
  limits: Limits;
  pendingRaise: { weekly?: number; perBet?: number; effectiveAt: number } | null;
  pauseUntil: number | null;
  feedback: Record<string, boolean>;
  checks: CheckRecord[];
  plainLanguage: boolean;
  language: string;
  persona: PersonaKey;
};

const initial: DemoState = {
  onboarded: false,
  limits: { weekly: null, perBet: null },
  pendingRaise: null,
  pauseUntil: null,
  feedback: {},
  checks: [
    { id: "c1", at: "6 Nov, 23:40", market: "Spurs vs Newcastle — Yes", stake: 20, verdict: "not-affordable", hiddenCost: 0.95 },
    { id: "c2", at: "4 Nov, 18:02", market: "Liverpool vs Man City — Man City", stake: 10, verdict: "ok", hiddenCost: 0 },
    { id: "c3", at: "2 Nov, 20:15", market: "Arsenal vs Chelsea — Arsenal", stake: 25, verdict: "overvalued", hiddenCost: 2.18 },
  ],
  plainLanguage: true,
  language: "en",
  persona: "priya",
};

const KEY = "betcheck-demo-v1";
type Ctx = { state: DemoState; update: (fn: (s: DemoState) => DemoState) => void; reset: () => void; now: number };
const DemoCtx = createContext<Ctx | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(initial);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...initial, ...JSON.parse(raw) });
    } catch {}
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const update = useCallback((fn: (s: DemoState) => DemoState) => {
    setState((s) => {
      const next = fn(s);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    try { localStorage.removeItem(KEY); } catch {}
    setState(initial);
  }, []);

  // Apply raises whose 48-hour wait has finished.
  useEffect(() => {
    if (state.pendingRaise && state.pendingRaise.effectiveAt <= now) {
      const { effectiveAt: _e, ...vals } = state.pendingRaise;
      update((s) => ({ ...s, limits: { ...s.limits, ...vals }, pendingRaise: null }));
    }
  }, [now, state.pendingRaise, update]);

  setActivePersona(state.persona);
  return <DemoCtx.Provider value={{ state, update, reset, now }}>{children}</DemoCtx.Provider>;
}

export function useDemo() {
  const c = useContext(DemoCtx);
  if (!c) throw new Error("useDemo outside DemoProvider");
  return c;
}

export function hoursLeft(until: number | null, now: number) {
  if (!until || until <= now) return 0;
  return Math.ceil((until - now) / 3_600_000);
}
