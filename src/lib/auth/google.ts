import "server-only";
import type { User } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { completeSignIn } from "./complete-sign-in";

/** Popup flow: Google hands the code to the page via postMessage. */
export const POPUP_REDIRECT_URI = "postmessage";

export const GOOGLE_STATE_COOKIE = "noire_google_state";

/** Redirect flow: where Google sends the browser back. Must be registered in Google Cloud. */
export function googleRedirectUri(origin: string) {
  return `${origin}/auth/google`;
}

export function googleAuthorizeUrl(origin: string, state: string) {
  const google = serverEnv.googleOAuth();
  if (!google) return null;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: google.clientId,
    redirect_uri: googleRedirectUri(origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  }).toString();
  return url.toString();
}

/**
 * Exchanges Google's one-time code for its signed ID token (using the client secret), signs in
 * with Supabase, which verifies the token, then runs the post-sign-in steps.
 * Must run where cookies are writable (Server Action or Route Handler).
 */
export async function signInWithGoogleAuthCode(code: string, redirectUri: string): Promise<User | null> {
  const google = serverEnv.googleOAuth();
  if (!google) return null;

  let idToken: string;
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: google.clientId,
        client_secret: google.clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await response.json().catch(() => ({}))) as { id_token?: string; error?: string };
    if (!response.ok || !body.id_token) {
      console.warn("[auth] Google code exchange failed", response.status, body.error);
      return null;
    }
    idToken = body.id_token;
  } catch (error) {
    console.error("[auth] Google code exchange request failed", error);
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithIdToken({ provider: "google", token: idToken });
  if (error || !data.user) {
    console.warn("[auth] Supabase rejected the Google ID token", error?.message);
    return null;
  }

  await completeSignIn(data.user);
  return data.user;
}
