<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Benchmark and affordability logic live as pure modules in `src/lib/benchmark.ts`, `src/lib/affordability.ts`, `src/lib/limits.ts` with tunables in `src/lib/config.ts`; keep I/O out so they stay unit-tested.
- Server logic (run-check, limits, exclusion, ingest) uses TanStack `createServerFn` in `src/lib/stakewise.functions.ts`, not Supabase Edge Functions, per the stack's server rules.
- Limits and exclusions are written only through server functions with the admin client (RLS allows select only), so the 48h raise delay and self-exclusion can't be bypassed from the browser.
- `checks` is append-only (DB trigger blocks update/delete) — it is the audit log.
- Eligible-country list exists in both `config.ts` and `public.handle_new_user()`; change both together.
- AI reflection coach and financial time-travel projection are separate modules (`src/lib/coach.functions.ts`, pure `src/lib/forecasting.ts`) so the advisory rules engine stays deterministic and testable.
- Pages read backend data only through `src/lib/backend/api.ts` (React Query options over the `callBc` server function, which runs the team's handlers in-process); `src/lib/demo/` now holds only static demo content (markets, support links) and browser-only settings.
- Backend team's code (repo kalshi-safe-betting, branch backend) lives verbatim in `src/lib/backend/` (ts-nocheck, Deno env swapped for process.env) and is served as server routes at `/api/public/bc/<function>` with their original request/response contract; tables use a `bc_` prefix because older Stakewise tables with the same names are kept, not dropped.
- Demo persona (Priya/Marcus, `src/lib/backend/personas.ts`) is passed to every backend call and mapped to an `x-demo-user` header; demo reset hides old checks via `bc_demo_resets` timestamps instead of deleting the append-only audit log.
