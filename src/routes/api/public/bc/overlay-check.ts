import { createFileRoute } from "@tanstack/react-router";
import handler from "@/lib/backend/handlers/overlay-check";

// Backend team's "overlay-check" endpoint (demo mode: Priya). Same request/response contract as their API.
export const Route = createFileRoute("/api/public/bc/overlay-check")({
  server: { handlers: { GET: ({ request }) => handler(request), POST: ({ request }) => handler(request), OPTIONS: ({ request }) => handler(request) } },
});
