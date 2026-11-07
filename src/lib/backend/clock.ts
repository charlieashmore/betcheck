// One source of truth for "today" and "now", so a pinned demo never mixes in the real clock.
// DEMO_TODAY=2026-11-07  pins the date. DEMO_NOW=2026-11-07T00:30:00Z pins the exact moment
// (use it to demo the late-night rule). Without either, the real clock is used.

export function today(): string {
  return (process.env["DEMO_TODAY"] ?? "2026-11-07") ?? new Date().toISOString().slice(0, 10);
}

export function nowUtc(): Date {
  const exact = process.env["DEMO_NOW"];
  if (exact) return new Date(exact);
  const day = (process.env["DEMO_TODAY"] ?? "2026-11-07");
  return day ? new Date(`${day}T12:00:00Z`) : new Date();
}
