import { NextResponse, type NextRequest } from "next/server";
import { GOOGLE_STATE_COOKIE, googleAuthorizeUrl } from "@/lib/auth/google";
import { requestOrigin } from "@/lib/request-origin";
import { safeRedirectPath } from "@/lib/utils";

/** Starts Google sign-in as a full-page redirect (used when the popup is blocked). */
export async function GET(request: NextRequest) {
  const origin = requestOrigin(request);
  const next = safeRedirectPath(request.nextUrl.searchParams.get("next"), "/account");
  const state = crypto.randomUUID();
  const authorizeUrl = googleAuthorizeUrl(origin, state);

  if (!authorizeUrl) {
    return NextResponse.redirect(`${origin}/login?error=oauth&next=${encodeURIComponent(next)}`);
  }

  const response = NextResponse.redirect(authorizeUrl);
  // Bind the round trip to this browser; checked when Google sends the customer back.
  response.cookies.set(GOOGLE_STATE_COOKIE, JSON.stringify({ state, next }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth/google",
    maxAge: 600,
  });
  return response;
}
