import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Viewer } from "@/lib/auth/session";

export type WishlistResult = { ok: true; saved: boolean } | { ok: false; error: string; requiresAuth?: boolean };

export async function toggleWishlistItem({ user, supabase }: Viewer, productId: string): Promise<WishlistResult> {
  if (!z.uuid().safeParse(productId).success) return { ok: false, error: "That fragrance couldn't be found." };
  if (!user) return { ok: false, requiresAuth: true, error: "Sign in to save fragrances to your wishlist." };

  try {
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

export async function saveProfile({ user, supabase }: Viewer, input: { fullName: unknown; phone: unknown }): Promise<ProfileState> {
  if (!user) return { status: "error", message: "Your session has expired. Please sign in again." };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors };
  }

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
