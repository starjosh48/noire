import "server-only";
import { publicEnv, serverEnv } from "@/lib/env";

export type AuthProviders = {
  /** Google sign-in is enabled in Supabase. */
  google: boolean;
  /** The site's own Google button can be used (client ID and secret configured). */
  googleDirect: boolean;
  email: boolean;
};

/**
 * Which sign-in methods Supabase Auth currently has enabled. Lets the UI disable Google
 * sign-in with a clear explanation (instead of a dead end) until it is configured.
 */
export async function getAuthProviders(): Promise<AuthProviders> {
  const googleDirect = serverEnv.googleOAuth() !== null;
  try {
    const response = await fetch(`${publicEnv.supabaseUrl()}/auth/v1/settings`, {
      headers: { apikey: publicEnv.supabaseAnonKey() },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) throw new Error(`settings ${response.status}`);
    const settings = (await response.json()) as { external?: Record<string, boolean> };
    const google = Boolean(settings.external?.google);
    return { google, googleDirect: google && googleDirect, email: settings.external?.email !== false };
  } catch (error) {
    console.error("[auth] Could not read auth settings", error);
    // Fail open: show both options and let Supabase report any problem.
    return { google: true, googleDirect, email: true };
  }
}
