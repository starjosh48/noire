"use server";

import { z } from "zod";
import { getWebViewer } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { saveProfile, toggleWishlistItem, type ProfileState, type WishlistResult } from "./service";

export type { ProfileState, WishlistResult } from "./service";

export async function toggleWishlist(productId: string): Promise<WishlistResult> {
  return toggleWishlistItem(await getWebViewer(), productId);
}

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  return saveProfile(await getWebViewer(), { fullName: formData.get("fullName"), phone: formData.get("phone") ?? "" });
}

/** Ends the session (clears the auth cookies). The caller reloads the page afterwards. */
export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) console.error("[auth] sign out failed", error);
}

const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
});

export type NewsletterState = { status: "idle" | "success" | "error"; message?: string };

export async function subscribeToNewsletter(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  const parsed = newsletterSchema.safeParse({ email: formData.get("email") ?? "" });
  if (!parsed.success) return { status: "error", message: "Enter a valid email address." };

  const { error } = await createAdminClient()
    .from("noire_newsletter_subscribers")
    .upsert({ email: parsed.data.email, source: "website" }, { onConflict: "email", ignoreDuplicates: true });
  if (error) {
    console.error("[newsletter] subscribe failed", error);
    return { status: "error", message: "We couldn't sign you up just now. Please try again." };
  }
  return { status: "success", message: "You're on the list. Expect new releases and rituals, never noise." };
}
