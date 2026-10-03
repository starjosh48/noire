import "server-only";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { sessionUserFromClaims, type SessionUser, type Viewer } from "@/lib/auth/session";
import { isCartId, type CartOwner, type GuestCartStore } from "@/lib/cart/service";
import type { Cart } from "@/lib/cart/types";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

// The mobile app has no cookies. It identifies itself on every request with:
//   Authorization: Bearer <Supabase access token>   when the customer is signed in
//   X-Noire-Cart: <guest cart id>                    the guest cart it was given (if any)
// Responses that can change the guest cart return `cartToken`; the app stores it and sends it
// back (null means forget it, e.g. after the guest cart was merged into the account).

export const GUEST_CART_HEADER = "x-noire-cart";

export type MobileContext = Viewer &
  CartOwner & {
    accessToken: string | null;
    /** The guest cart id the app should keep after this request (null when signed in). */
    cartToken(): string | null;
  };

function bearerToken(request: NextRequest) {
  const header = request.headers.get("authorization");
  const match = header?.match(/^Bearer\s+(\S+)$/i);
  return match?.[1] ?? null;
}

/** A JWT's header and payload must be base64url-encoded JSON; anything else is not a session. */
function isWellFormedJwt(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts.every((part) => /^[A-Za-z0-9_-]+$/.test(part))) return false;
  try {
    parts.slice(0, 2).forEach((part) => JSON.parse(Buffer.from(part, "base64url").toString("utf8")));
    return true;
  } catch {
    return false;
  }
}

function supabaseFor(accessToken: string | null) {
  return createClient<Database>(publicEnv.supabaseUrl(), publicEnv.supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
  });
}

function headerGuestStore(request: NextRequest) {
  const sent = request.headers.get(GUEST_CART_HEADER);
  let current = isCartId(sent) ? sent : null;
  const store: GuestCartStore = {
    read: async () => current,
    remember: async (cartId) => {
      current = cartId;
    },
    forget: async () => {
      current = null;
    },
  };
  return { store, current: () => current };
}

/**
 * Establishes who is calling. A bearer token that fails verification is answered with 401
 * (instead of quietly treating the caller as a guest) so the app knows to refresh its session.
 */
export async function getMobileContext(request: NextRequest): Promise<MobileContext | NextResponse> {
  const accessToken = bearerToken(request);
  const supabase = supabaseFor(accessToken);
  let user: SessionUser | null = null;

  if (accessToken) {
    const expired = () => mobileError("Your session has expired. Please sign in again.", 401, { code: "SESSION_EXPIRED" });
    if (!isWellFormedJwt(accessToken)) return expired();
    let claims;
    try {
      const { data, error } = await supabase.auth.getClaims(accessToken);
      claims = error ? null : data?.claims;
    } catch (error) {
      // Signing keys unreachable: the token may well be valid, so don't sign the customer out.
      console.error("[mobile] Could not verify access token", error);
      return mobileError("We couldn't reach the server. Please try again.", 503, { code: "UNAVAILABLE" });
    }
    if (!claims?.sub) return expired();
    user = sessionUserFromClaims(claims);
  }

  const guest = headerGuestStore(request);
  return {
    user,
    supabase,
    accessToken,
    guestStore: guest.store,
    cartToken: () => (user ? null : guest.current()),
  };
}

const NO_STORE = { "Cache-Control": "private, no-store" };

export function mobileJson<T>(body: T, init?: { status?: number }) {
  return NextResponse.json(body, { status: init?.status ?? 200, headers: NO_STORE });
}

export function mobileError(error: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status, headers: NO_STORE });
}

/** Cart responses always carry the guest cart id the app should keep. */
export function cartJson(context: MobileContext, body: { cart?: Cart } & Record<string, unknown>, status = 200) {
  return mobileJson({ ...body, cartToken: context.cartToken() }, { status });
}

export async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
