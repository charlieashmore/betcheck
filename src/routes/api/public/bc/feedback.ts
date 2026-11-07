import { createFileRoute } from "@tanstack/react-router";
import handler from "@/lib/backend/handlers/feedback";

// Backend team's "feedback" endpoint (demo mode: Priya). Same request/response contract as their API.
export const Route = createFileRoute("/api/public/bc/feedback")({
  server: { handlers: { GET: ({ request }) => handler(request), POST: ({ request }) => handler(request), OPTIONS: ({ request }) => handler(request) } },
});
