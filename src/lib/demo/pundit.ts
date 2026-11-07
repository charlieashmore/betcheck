export type PunditSide = "yes" | "no";

export type PunditMarket = {
  id: string;
  tag: string;
  question: string;
  yes: number;
  no: number;
  change: string;
  resolution: string;
  volume: string;
  closes: string;
  traders: string;
  odds: [number, number] | null;
  oddsNote: string;
  history: number[];
};

export const PUNDIT_MARKETS: PunditMarket[] = [
  {
    id: "city",
    tag: "Premier League · Sat 3pm",
    question: "Will Man City beat Arsenal?",
    yes: 57,
    no: 45,
    change: "+3 today",
    resolution: "Resolves YES if Manchester City win in 90 minutes plus stoppage time.",
    volume: "£2.4m",
    closes: "Sat 8 Nov, 17:00",
    traders: "18,204",
    odds: [1.8, 2.1],
    oddsNote: "Sharp bookmaker consensus: City win 1.80, draw or Arsenal 2.10.",
    history: [49, 50, 52, 51, 53, 52, 54, 55, 53, 54, 56, 55, 57],
  },
  {
    id: "liv",
    tag: "Premier League · Sun 4:30pm",
    question: "Will Liverpool beat Chelsea?",
    yes: 48,
    no: 54,
    change: "−2 today",
    resolution: "Resolves YES if Liverpool win in 90 minutes plus stoppage time.",
    volume: "£1.7m",
    closes: "Sun 9 Nov, 18:30",
    traders: "12,950",
    odds: [2.05, 1.85],
    oddsNote: "Sharp bookmaker consensus: Liverpool win 2.05, draw or Chelsea 1.85.",
    history: [52, 51, 52, 50, 51, 50, 49, 50, 49, 50, 49, 50, 48],
  },
  {
    id: "boe",
    tag: "Economy · Bank of England",
    question: "Will the Bank of England cut rates in December?",
    yes: 62,
    no: 40,
    change: "+1 today",
    resolution: "Resolves YES if the MPC announces a cut to Bank Rate at its December meeting.",
    volume: "£860k",
    closes: "Thu 18 Dec, 12:00",
    traders: "6,311",
    odds: null,
    oddsNote: "No bookmaker market to compare with: BetCheck will show that no benchmark is available.",
    history: [55, 56, 58, 57, 59, 60, 59, 61, 60, 61, 62, 61, 62],
  },
];

const aliases: Record<string, string> = {
  "ars-che": "city",
  "liv-mci": "liv",
  "tot-new": "boe",
};

export function resolvePunditMarket(id: string) {
  const resolved = aliases[id] ?? id;
  return PUNDIT_MARKETS.find((market) => market.id === resolved);
}

export type OverlayTicket = {
  market: PunditMarket;
  side: PunditSide;
  stake: number;
};

export const ticketPrice = (ticket: Pick<OverlayTicket, "market" | "side">) =>
  (ticket.side === "yes" ? ticket.market.yes : ticket.market.no) / 100;

export function ticketCheckBody(ticket: OverlayTicket): Record<string, unknown> {
  const odds = ticket.market.odds;
  return {
    platform: "other",
    market_title: `${ticket.market.question} — ${ticket.side.toUpperCase()}`,
    price: ticketPrice(ticket),
    stake_gbp: ticket.stake,
    bookmaker_odds: odds ? (ticket.side === "yes" ? odds : [odds[1], odds[0]]) : undefined,
  };
}

export function chartPaths(history: number[]) {
  const width = 600;
  const height = 180;
  const low = Math.min(...history) - 4;
  const high = Math.max(...history) + 4;
  const points = history.map((value, index) => [
    index * (width / (history.length - 1)),
    height - ((value - low) / (high - low)) * (height - 20) - 10,
  ]);
  const line = points.map(([x, y], index) => `${index ? "L" : "M"}${x!.toFixed(1)} ${y!.toFixed(1)}`).join(" ");
  return { line, area: `${line} L${width} ${height} L0 ${height} Z` };
}
