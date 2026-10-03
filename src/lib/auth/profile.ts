import "server-only";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Makes sure the signed-in user has an up-to-date profile. The database trigger normally does
 * this; running it here as well covers accounts created before the trigger existed and fills
 * in a name or avatar that the identity provider only shares on later sign-ins.
 */
export async function syncProfile(user: User) {
  const meta = user.user_metadata ?? {};
  const fullName = (meta.full_name ?? meta.name ?? null) as string | null;
  const avatarUrl = (meta.avatar_url ?? meta.picture ?? null) as string | null;
  const admin = createAdminClient();

  const { data: existing, error } = await admin
    .from("noire_profiles")
    .select("id, full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  if (error) {
    console.error("[auth] profile lookup failed", error);
    return;
  }

  if (!existing) {
    const { error: insertError } = await admin
      .from("noire_profiles")
      .insert({ id: user.id, email: user.email ?? "", full_name: fullName, avatar_url: avatarUrl });
    if (insertError && insertError.code !== "23505") console.error("[auth] profile insert failed", insertError);
    return;
  }

  const updates: { full_name?: string; avatar_url?: string; email?: string } = {};
  if (!existing.full_name && fullName) updates.full_name = fullName;
  if (avatarUrl && avatarUrl !== existing.avatar_url) updates.avatar_url = avatarUrl;
  if (user.email) updates.email = user.email;
  const { error: updateError } = await admin.from("noire_profiles").update(updates).eq("id", user.id);
  if (updateError) console.error("[auth] profile update failed", updateError);
}
