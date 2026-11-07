// Single source of tunable rules. Change values here, not in the logic modules.
export type DataMode = "mock" | "live";
export const DATA_MODE: DataMode = "mock";

export const RULES_VERSION = "2026.11-1";

export const BENCHMARK_CONFIG = {
  kalshiFeeRate: 0.07,
  inLineThresholdPp: 2,
  maxPriceAgeSeconds: 60,
  maxSourceDisagreementPp: 4,
};
export type BenchmarkConfig = typeof BENCHMARK_CONFIG;

export const AFFORDABILITY_CONFIG = {
  lossChaseMultiplier: 1.5,
  lossChaseMinConsecutiveLosses: 2,
  lossChaseLookback: 5,
  frequencyWindowMinutes: 30,
  frequencyMaxChecks: 4,
  lateNightStartHour: 0,
  lateNightEndHour: 5,
};
export type AffordabilityConfig = typeof AFFORDABILITY_CONFIG;

export const LIMIT_RAISE_DELAY_HOURS = 48;

// Placeholder list — review against Kalshi's real eligibility rules before launch.
// Keep in sync with public.handle_new_user() in the database.
export const INELIGIBLE_COUNTRIES = ["FR", "BE", "SG", "AU", "CH", "IT", "PL", "TH", "TW", "CN"];

export const COUNTRIES: { code: string; name: string }[] = [
  { code: "GB", name: "United Kingdom" },
  { code: "IE", name: "Ireland" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "DE", name: "Germany" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "SE", name: "Sweden" },
  { code: "FR", name: "France" },
  { code: "BE", name: "Belgium" },
  { code: "IT", name: "Italy" },
  { code: "CH", name: "Switzerland" },
  { code: "PL", name: "Poland" },
  { code: "AU", name: "Australia" },
  { code: "SG", name: "Singapore" },
  { code: "TH", name: "Thailand" },
  { code: "TW", name: "Taiwan" },
  { code: "CN", name: "China" },
];

export const EXCLUSION_PERIODS = [
  { id: "1d", label: "1 day", ms: 86_400_000 },
  { id: "7d", label: "7 days", ms: 7 * 86_400_000 },
  { id: "30d", label: "30 days", ms: 30 * 86_400_000 },
  { id: "6m", label: "6 months", ms: 182 * 86_400_000 },
] as const;
