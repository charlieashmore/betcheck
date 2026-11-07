# BetCheck: rebuild from the spec sheet and mockups

BetCheck becomes an AI money coach. It finds betting money in Priya's mock bank data, forecasts her balance on rent day, coaches her with one clear action, and checks stakes on a mock market page. The look follows the mockups: monochrome, with red for risk and yellow for value, the BetCheck logo, DM Sans and pill buttons. The spec's palette (ink, cream, amber, teal) is not used, and "bet" wording is allowed, as you confirmed.

## Pages (in demo order)
1. **Dashboard**: a header with today's balance (£320 on 7 Nov 2026) and a coach card with one action ("Set a £30 weekly limit", "Pause 48 hours", "Talk to someone"). A "Why am I seeing this?" link lists the transactions and signals behind the alert. The cards from the mockup stay: Recent bet checks, Need a break / change limits, and Check a bet. When the risk is high, the panel reading "You are not currently in the position to make a bet" appears, with GamCare and BeGambleAware links.
2. **Forecast** ("financial time travel"): a 35-day chart showing the likely range, the typical line, a £0 line and a rent-day marker on 28 Nov. It compares two futures: the current pace (-£148 on rent day, 93% chance of going short) against a £30 weekly limit (+£90, 8%). One button accepts the suggested limit.
3. **Flagged transactions**: betting and funding top-ups (Sky Bet, Coinbase, Skrill), each with its reasons and confidence. Uncertain ones ask "Was this for betting?". Your answer applies to every payment to that merchant.
4. **Your limits**: weekly limit, per-bet maximum and a 48-hour pause. Lowering a limit takes effect at once, and raising one shows a 48-hour countdown. The dashboard's "Not available for X hrs" button uses this countdown.
5. **Mock market page and check result**: a fake Kalshi or Polymarket market page. Entering a stake opens the result screen from the mockup: "Based on data, this bet might be overvalued / not affordable". It shows the AI summary, the hidden cost (for example a £40 stake at 57p costs about £3.49 over fair), the list of rules, and the effect on the rent-day balance. Below that are "Redirect to place bet" and "Not place bet", plus a disclaimer. The paste-a-link box on the dashboard opens this flow too.
6. **Account**: plain-language toggle, language picker, a demo reset button and the history of checks.
7. **Onboarding and consent**: a mocked "Connect your bank" step with Open Banking consent.
8. **Help and support**: GamCare, BeGambleAware and StepChange.
9. A persistent footer ("Information only, 18+"), loading and error states, and a layout that works on mobile.

## How it works
- **Demo data**: Priya's profile, with 188 sample transactions over 90 days, loaded into the database for every new account. "Today" is fixed at 7 Nov 2026.
- **Detect**: rules first (betting merchant code, known operators, crypto and e-wallet top-ups, plus signals such as late night, near payday, repeated top-ups and round amounts). AI re-scores the uncertain items, and your answer always wins.
- **Forecast**: 500 simulated futures over 35 days, seeded so the demo gives the same numbers every time. It also works out the suggested weekly limit.
- **Coach**: AI writes the headline, a body of up to 60 words and one action, using only numbers the app has worked out. Any reply with an invented number is replaced by a ready-written message. AI calls stop after 12 seconds and use your Lovable credits.
- **Stake check**: limits, the pause, the effect on rent day, loss-chasing and late-night rules, plus the hidden cost from bookmaker odds and platform fees. Every check is saved to a permanent record.

## What changes from today's app
- The current fixture list and stake form are replaced by the dashboard, the mock market page and the check result.
- The old affordability, benchmark and coach logic is reused where it fits and changed to use pounds and the spec's rules.
- Project memory is updated with the BetCheck name, the mockup colours, the allowed "bet" wording and the demo numbers.

## Technical details
- The backend uses `createServerFn` in `*.functions.ts` files instead of Supabase Edge Functions, because the stack requires it. There are six functions matching the spec's API: classify, feedback, forecast, coach, check-stake and limits.
- Pure modules with Vitest tests: `detect.ts`, `forecast-mc.ts` (seeded random generator, p10/p50/p90, suggested limit), `coach-guard.ts` (rejects replies with unsupplied numbers) and `checkStake.ts`. There will be at least 13 tests, including the demo numbers as written in the spec.
- New tables: `transactions`, `classifications`, `merchant_feedback` and `coach_messages`. `profiles` and `limits` gain new columns, and `checks` stays append-only. Each table is limited to its owner, and Priya's seed is copied in when a new account signs up.
- The coach uses `@lovable.dev/ai-gateway` (Claude Haiku), with JSON output, a 12-second timeout and a template fallback.
- Design tokens are set in `styles.css`: ink #000, canvas #FFF, muted #8A8A8A, disabled #C8C8C8, input #E6E6E6, risk #FF1A1A and value #FFE70D. DM Sans is loaded with a link tag, and the logo is an inline SVG.
- `AGENTS.md` is updated for the new modules.
