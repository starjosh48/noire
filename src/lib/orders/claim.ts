import "server-only";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Attaches guest orders placed with this email to the account. Only runs for addresses the
 * identity provider has verified (Google, or a clicked email link), so the customer has
 * proven they own the inbox those orders were confirmed to.
 */
export async function claimGuestOrders(user: User) {
  const email = user.email?.toLowerCase();
  if (!email || !user.email_confirmed_at) return;

  const admin = createAdminClient();
  const { data: claimed, error } = await admin
    .from("noire_orders")
    .update({ user_id: user.id })
    .is("user_id", null)
    .eq("customer_email", email)
    .select("customer_name, customer_phone, created_at");
  if (error) {
    console.error("[orders] Failed to claim guest orders", error);
    return;
  }
  if (!claimed?.length) return;

  // Use the most recent order to fill in a profile that has no name or phone yet.
  const latest = [...claimed].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  await completeProfile(user.id, latest.customer_name, latest.customer_phone);
}

/** Fills in a profile's missing name and phone; never overwrites what the customer set. */
export async function completeProfile(userId: string, fullName: string, phone: string) {
  const admin = createAdminClient();
  const { data: profile } = await admin.from("noire_profiles").select("full_name, phone").eq("id", userId).maybeSingle();
  if (!profile || (profile.full_name && profile.phone)) return;
  const { error } = await admin
    .from("noire_profiles")
    .update({ full_name: profile.full_name || fullName, phone: profile.phone || phone })
    .eq("id", userId);
  if (error) console.error("[orders] Failed to complete profile", error);
}
