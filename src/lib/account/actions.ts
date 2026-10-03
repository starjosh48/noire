"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type WishlistResult = { ok: true; saved: boolean } | { ok: false; error: string; requiresAuth?: boolean };

export async function toggleWishlist(productId: string): Promise<WishlistResult> {
  if (!z.uuid().safeParse(productId).success) return { ok: false, error: "That fragrance couldn't be found." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, requiresAuth: true, error: "Sign in to save fragrances to your wishlist." };

  try {
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("noire_wishlist_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("noire_wishlist_items").delete().eq("id", existing.id);
      if (error) throw error;
      revalidatePath("/account");
      return { ok: true, saved: false };
    }

    const { error } = await supabase.from("noire_wishlist_items").insert({ user_id: user.id, product_id: productId });
    if (error && error.code !== "23505") throw error;
    revalidatePath("/account");
    return { ok: true, saved: true };
  } catch (error) {
    console.error("[wishlist] toggle failed", error);
    return { ok: false, error: "We couldn't update your wishlist. Please try again." };
  }
}

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(120, "That name is a little too long."),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?[0-9][0-9\s()-]{6,18}[0-9])?$/, "Enter a valid phone number, like 0803 123 4567.")
    .optional()
    .or(z.literal("")),
});

export type ProfileState = { status: "idle" | "saved" | "error"; message?: string; fieldErrors?: Record<string, string> };

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) return { status: "error", message: "Your session has expired. Please sign in again." };

  const parsed = profileSchema.safeParse({ fullName: formData.get("fullName"), phone: formData.get("phone") ?? "" });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("noire_profiles")
    .update({ full_name: parsed.data.fullName, phone: parsed.data.phone || null })
    .eq("id", user.id);
  if (error) {
    console.error("[profile] update failed", error);
    return { status: "error", message: "We couldn't save your details. Please try again." };
  }
  revalidatePath("/account");
  return { status: "saved", message: "Your details have been saved." };
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
