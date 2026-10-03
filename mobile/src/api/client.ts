import Constants from "expo-constants";
import { supabase } from "~/lib/supabase";
import { getCartToken, setCartToken } from "./cart-token";

/**
 * The NOIRÉ website, which serves the app's API (/api/mobile/*) and images.
 * EXPO_PUBLIC_API_URL wins when set (release builds). In development the app talks to the
 * computer running `expo start`, where the website runs on port 3100.
 */
function resolveApiUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const devHost = Constants.expoConfig?.hostUri?.split(":")[0];
  return `http://${devHost ?? "localhost"}:3100`;
}

export const API_URL = resolveApiUrl();

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    /** The response body, for endpoints that explain failures (field errors, an updated cart). */
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get offline() {
    return this.status === 0;
  }
}

export const OFFLINE_MESSAGE = "We couldn't reach NOIRÉ. Check your connection and try again.";
const GENERIC_MESSAGE = "Something went wrong. Please try again.";

let onSessionExpired: (() => void) | null = null;
/** Called once when the server rejects the session and a refresh can't save it. */
export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

async function send(path: string, init: RequestInit | undefined, accessToken: string | null) {
  const headers: Record<string, string> = { Accept: "application/json", ...(init?.headers as Record<string, string>) };
  if (init?.body) headers["Content-Type"] = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const cartToken = await getCartToken();
  if (cartToken) headers["X-Noire-Cart"] = cartToken;

  // A manual timeout: AbortSignal.timeout isn't available in every React Native runtime.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    return await fetch(`${API_URL}/api/mobile${path}`, { ...init, headers, signal: controller.signal });
  } catch {
    throw new ApiError(OFFLINE_MESSAGE, 0);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Every call to the NOIRÉ API goes through here: it attaches the signed-in session and the
 * guest cart id, keeps the cart id the server hands back, and turns failures into ApiErrors
 * with messages that are safe to show.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession();
  let response = await send(path, init, data.session?.access_token ?? null);

  if (response.status === 401 && data.session) {
    // The access token may have expired in the background: refresh once and retry.
    const { data: refreshed } = await supabase.auth.refreshSession();
    if (refreshed.session) response = await send(path, init, refreshed.session.access_token);
    if (response.status === 401) onSessionExpired?.();
  }

  const body = (await response.json().catch(() => null)) as (Record<string, unknown> & { error?: string; code?: string }) | null;
  if (body && "cartToken" in body) await setCartToken((body.cartToken as string | null) ?? null);

  if (!response.ok) {
    const message = response.status >= 500 && !body?.error ? GENERIC_MESSAGE : (body?.error ?? GENERIC_MESSAGE);
    throw new ApiError(message, response.status, body?.code, body);
  }
  if (body === null) throw new ApiError(GENERIC_MESSAGE, response.status);
  return body as T;
}
