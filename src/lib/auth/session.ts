import "server-only";
import type { JwtPayload, SupabaseClient } from "@supabase/supabase-js";
import { unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
};

/**
 * Who is asking, and a Supabase client that acts as them (Row Level Security applies).
 * The website builds one from session cookies; the mobile API from a bearer token.
 */
export type Viewer = {
  user: SessionUser | null;
  supabase: SupabaseClient<Database>;
};

/** Maps verified JWT claims to the customer fields the storefront uses. */
export function sessionUserFromClaims(claims: JwtPayload): SessionUser {
  const meta = (claims.user_metadata ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);
  return {
    id: claims.sub,
    email: str(claims.email) ?? "",
    name: str(meta.full_name) ?? str(meta.name),
    avatarUrl: str(meta.avatar_url) ?? str(meta.picture),
  };
}

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
    return sessionUserFromClaims(claims);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[auth] Failed to read session", error);
    return null;
  }
});

/** The website visitor, from their session cookies. */
export async function getWebViewer(): Promise<Viewer> {
  const [user, supabase] = await Promise.all([getCurrentUser(), createClient()]);
  return { user, supabase };
}

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
};

export async function loadProfile({ user, supabase }: Viewer): Promise<Profile | null> {
  if (!user) return null;
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
}

export const getProfile = cache(async (): Promise<Profile | null> => loadProfile(await getWebViewer()));
