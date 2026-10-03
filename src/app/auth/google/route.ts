import { NextResponse, type NextRequest } from "next/server";
import { GOOGLE_STATE_COOKIE, googleRedirectUri, signInWithGoogleAuthCode } from "@/lib/auth/google";
import { requestOrigin } from "@/lib/request-origin";
import { safeRedirectPath } from "@/lib/utils";

/** Google sends the customer back here after the full-page sign-in. */
export async function GET(request: NextRequest) {
  const origin = requestOrigin(request);
  const params = request.nextUrl.searchParams;

  let saved: { state?: string; next?: string } = {};
  try {
    saved = JSON.parse(request.cookies.get(GOOGLE_STATE_COOKIE)?.value ?? "{}");
  } catch {
    saved = {};
  }
  const next = safeRedirectPath(saved.next, "/account");

  const finish = (url: string) => {
    const response = NextResponse.redirect(url);
    response.cookies.set(GOOGLE_STATE_COOKIE, "", { path: "/auth/google", maxAge: 0 });
    return response;
  };
  const fail = () => finish(`${origin}/login?error=oauth&next=${encodeURIComponent(next)}`);

  const code = params.get("code");
  if (params.get("error") || !code) return fail();
  if (!saved.state || params.get("state") !== saved.state) {
    console.warn("[auth] Google redirect state mismatch");
    return fail();
  }

  const user = await signInWithGoogleAuthCode(code, googleRedirectUri(origin));
  if (!user) return fail();

  const destination = new URL(next, origin);
  destination.searchParams.set("signed_in", "1");
  return finish(destination.toString());
}
