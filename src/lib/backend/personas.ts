export const PERSONAS = {
  priya: { id: "00000000-0000-0000-0000-000000000001", name: "Priya", blurb: "Tight budget, rent due 28 Nov. The £40 check gets blocked." },
  marcus: { id: "00000000-0000-0000-0000-000000000002", name: "Marcus", blurb: "Salaried and comfortable, rent due 1 Dec. The £40 check passes." },
} as const;
export type PersonaKey = keyof typeof PERSONAS;
export const isPersona = (v: unknown): v is PersonaKey => v === "priya" || v === "marcus";
