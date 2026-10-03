import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { publicEnv, serverEnv } from "@/lib/env";

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Service-role client. Bypasses Row Level Security, so it is server-only and used solely for
 * operations already authorised in code: carts, order placement and guest order lookups.
 */
export function createAdminClient() {
  adminClient ??= createClient<Database>(publicEnv.supabaseUrl(), serverEnv.supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return adminClient;
}
