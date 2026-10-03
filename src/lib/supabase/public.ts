import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { publicEnv } from "@/lib/env";

/** Cache tag for catalog data; invalidated whenever orders change stock. */
export const CATALOG_TAG = "catalog";

let publicClient: ReturnType<typeof createClient<Database>> | null = null;

// Catalog reads go through Next's data cache, so pages can be served from the edge and
// rebuilt only when the catalog changes (or at most every few minutes).
const cachedFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, next: { revalidate: 300, tags: [CATALOG_TAG] } });

/** Session-less anon client for public catalog reads (cached). */
export function createPublicClient() {
  publicClient ??= createClient<Database>(publicEnv.supabaseUrl(), publicEnv.supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: cachedFetch },
  });
  return publicClient;
}
