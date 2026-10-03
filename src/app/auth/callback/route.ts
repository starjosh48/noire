import { NextResponse, type NextRequest } from "next/server";
import { completeSignIn } from "@/lib/auth/complete-sign-in";
import { requestOrigin } from "@/lib/request-origin";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils";

/** Completes Google OAuth and email-link sign-in (PKCE code exchange). */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeRedirectPath(url.searchParams.get("next"), "/account");
  const code = url.searchParams.get("code");
  const origin = requestOrigin(request);

  const fail = (reason: "oauth" | "link") =>
    NextResponse.redirect(`${origin}/login?error=${reason}&next=${encodeURIComponent(next)}`);

  if (url.searchParams.get("error")) {
    console.warn("[auth] provider returned an error", url.searchParams.get("error_description"));
    return fail("oauth");
  }
  if (!code) return fail("link");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    console.warn("[auth] code exchange failed", error?.message);
    return fail("link");
  }

  await completeSignIn(data.user);

  const destination = new URL(next, origin);
  destination.searchParams.set("signed_in", "1");
  return NextResponse.redirect(destination);
}

