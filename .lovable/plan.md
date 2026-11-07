# Rebrand to BetCheck from the mockups

The spec sheet hasn't arrived yet. This plan covers the three mockups and the design guide. Pages that appear only in the spec will be added once it arrives.

## Visual language (from the design guide)
- Black, white and grey only. Red (#FF1A1A) marks "not affordable" and yellow (#FFE70D) marks overvalued or undervalued. No indigo.
- DM Sans throughout. The BetCheck wordmark and the winking $ face logo go in the header.
- Black cards for results, white cards with soft shadows for actions, pill-shaped black buttons, grey disabled buttons, and a grey pill-shaped box for pasting links.
- Header links: Dashboard, Your limits, Account.

## Pages
1. **Dashboard (the main signed-in page)**
   - A black "Recent bet checks" card. Each row shows the market, the platform and its result (Not affordable / Overvalued / Undervalued / OK) and opens the full check.
   - A "Need a break? / Want to change limits?" card. "Take a 48hr break" starts the existing self-exclusion. "Change limits" shows "Not available" or "Not available for X hrs" while the 48-hour wait is running.
   - A "Want to check a bet?" card with a box for pasting a bet's link and a "Check bet" button.
   - **Blocked state:** while you're on a break or can't afford to bet, a panel on the right says "You are not currently in the position to make a bet", with links to GamCare and BeGambleAware.
2. **Check result page:** a black card reading "Based on data, this bet might be overvalued/undervalued/not affordable". Below it is the AI summary, written from your money situation and the odds. On the right, "How do you want to proceed?" offers "Redirect to place bet" (opens the market and records it as placed) and "Not place bet" (records it as skipped).
3. **Your limits** and **Account** (sign out, profile, history) restyled in the same look.
4. Any other pages in the spec, built in the same look.

## Technical details
- Replace the colours in the stylesheet and load DM Sans. Add tokens for the "risk" and "valuation" signals.
- Update the memory rules: the brand name becomes BetCheck, "bet" wording is now allowed, and the colours are monochrome plus red and yellow.
- Pasting a link: recognise Kalshi, Polymarket and bet365 links, and match Kalshi ones to known fixtures. Show a clear message when a link isn't supported yet.
- Reuse the existing check, limits, self-exclusion and AI coach logic. The proceed buttons write to the record of placed trades.
