import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Only routes that read the session server-side need it refreshed first. Catalog pages are
// static (served from the edge cache). /api/session refreshes the session itself.
export const config = {
  matcher: ["/account/:path*", "/checkout/:path*", "/orders/:path*", "/login", "/auth/:path*"],
};
