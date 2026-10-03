import "server-only";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { CATALOG_TAG } from "@/lib/supabase/public";

/**
 * Cancels online-payment orders left unpaid for 30+ minutes and returns their stock, so an
 * abandoned Paystack checkout doesn't keep a size showing as sold out. Returns how many were released.
 */
export async function releaseAbandonedCheckouts() {
  const { data, error } = await createAdminClient().rpc("noire_cancel_stale_unpaid_orders", {});
  if (error) {
    console.error("[orders] Could not release abandoned checkouts", error.message);
    return 0;
  }
  const released = (data as number | null) ?? 0;
  if (released > 0) revalidateTag(CATALOG_TAG, { expire: 0 });
  return released;
}
