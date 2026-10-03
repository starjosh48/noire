import "server-only";
import type { User } from "@supabase/supabase-js";
import { mergeGuestCartIntoUser } from "@/lib/cart/service";
import { claimGuestOrders } from "@/lib/orders/claim";
import { syncProfile } from "./profile";

/**
 * Everything that happens right after a successful sign-in, whichever method was used.
 * Must run where cookies are writable (Route Handler or Server Action).
 */
export async function completeSignIn(user: User) {
  // Profile first: claiming guest orders may fill in its name and phone.
  await syncProfile(user);
  await claimGuestOrders(user);
  await mergeGuestCartIntoUser(user.id);
}
