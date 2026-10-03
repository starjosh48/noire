import type { NextRequest } from "next/server";
import { completeSignIn } from "@/lib/auth/complete-sign-in";
import { getMobileContext, mobileError, mobileJson } from "@/lib/mobile/context";

/**
 * Called by the app once, right after it signs in with Supabase: syncs the profile, attaches
 * guest orders placed with the same verified email and merges the guest cart into the account.
 */
export async function POST(request: NextRequest) {
  const context = await getMobileContext(request);
  if (context instanceof Response) return context;
  if (!context.accessToken) return mobileError("Sign in first.", 401, { code: "SIGNED_OUT" });

  const { data, error } = await context.supabase.auth.getUser(context.accessToken);
  if (error || !data.user) return mobileError("Your session has expired. Please sign in again.", 401, { code: "SESSION_EXPIRED" });

  await completeSignIn(data.user, context.guestStore);
  return mobileJson({ ok: true, cartToken: null });
}
