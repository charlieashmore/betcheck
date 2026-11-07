import { createFileRoute } from "@tanstack/react-router";
import handler from "@/lib/backend/handlers/forecast";

// Backend team's "forecast" endpoint (demo mode: Priya). Same request/response contract as their API.
export const Route = createFileRoute("/api/public/bc/forecast")({
  server: { handlers: { GET: ({ request }) => handler(request), POST: ({ request }) => handler(request), OPTIONS: ({ request }) => handler(request) } },
});
