import "server-only";
import { unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
};

/**
 * The signed-in customer, verified from the session JWT (signature checked by getClaims).
 * Deduplicated per request.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    const claims = data?.claims;
    if (error || !claims?.sub) return null;
    const meta = (claims.user_metadata ?? {}) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);
    return {
      id: claims.sub,
      email: str(claims.email) ?? "",
      name: str(meta.full_name) ?? str(meta.name),
      avatarUrl: str(meta.avatar_url) ?? str(meta.picture),
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[auth] Failed to read session", error);
    return null;
  }
});

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
};

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("noire_profiles")
    .select("id, email, full_name, avatar_url, phone, created_at")
    .eq("id", user.id)
    .maybeSingle();
  if (error) {
    console.error("[auth] Failed to load profile", error);
    return null;
  }
  return data;
});
