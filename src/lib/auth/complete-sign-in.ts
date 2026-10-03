import "server-only";
import type { User } from "@supabase/supabase-js";
import { cookieGuestStore, mergeGuestCartIntoUser, type GuestCartStore } from "@/lib/cart/service";
import { claimGuestOrders } from "@/lib/orders/claim";
import { syncProfile } from "./profile";

/**
 * Everything that happens right after a successful sign-in, whichever method was used.
 * On the website, must run where cookies are writable (Route Handler or Server Action).
 */
export async function completeSignIn(user: User, guestStore: GuestCartStore = cookieGuestStore) {
  // Profile first: claiming guest orders may fill in its name and phone.
  await syncProfile(user);
  await claimGuestOrders(user);
  await mergeGuestCartIntoUser(user.id, guestStore);
}
