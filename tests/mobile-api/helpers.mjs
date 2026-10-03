// Shared helpers for the mobile API tests. They run against the LOCAL stack only:
//   1. npx supabase start          (local database, auth and realtime)
//   2. npm run dev -- -p 3100      (the website, which serves /api/mobile)
//   3. node --test tests/mobile-api
//
// The hosted Supabase project is shared with other live data, so these helpers refuse to run
// against anything but a local Supabase. The keys below are Supabase's public local-development
// defaults (printed by `npx supabase status`), not secrets.

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export const API = (process.env.NOIRE_API_URL ?? "http://127.0.0.1:3100").replace(/\/$/, "");
export const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(SUPABASE_URL)) {
  throw new Error(`Refusing to run tests against ${SUPABASE_URL}: use the local Supabase (npx supabase start).`);
}

export const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

/** A fresh customer with a password session; call cleanup() when done. */
export async function createCustomer(name = "Test Customer") {
  const email = `mobile-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
  const password = `Pw-${crypto.randomUUID()}`;
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (error) throw error;

  const client = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
  const { data, error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;

  return {
    id: created.user.id,
    email,
    session: data.session,
    /** Supabase client signed in as this customer (what the app uses for auth and realtime). */
    client,
    cleanup: async () => {
      await client.removeAllChannels();
      await admin.auth.admin.deleteUser(created.user.id);
    },
  };
}

/** A mobile API caller: sends the bearer token and keeps the guest cart token like the app does. */
export function mobileClient(session = null) {
  let cartToken = null;
  async function call(method, path, body) {
    const headers = { "content-type": "application/json" };
    if (session) headers.authorization = `Bearer ${session.access_token}`;
    if (cartToken) headers["x-noire-cart"] = cartToken;
    const response = await fetch(`${API}/api/mobile${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: "manual",
    });
    const json = await response.json().catch(() => null);
    if (json && "cartToken" in json) cartToken = json.cartToken;
    return { status: response.status, body: json, headers: response.headers };
  }
  return {
    call,
    get cartToken() {
      return cartToken;
    },
    set cartToken(value) {
      cartToken = value;
    },
  };
}

/**
 * The website's view of a signed-in customer: the same session stored in the website's auth
 * cookies (written by @supabase/ssr, exactly as the website's sign-in does), then read through
 * the website's own /api/session endpoint.
 */
export async function websiteClient(session) {
  const jar = new Map();
  const ssr = createServerClient(SUPABASE_URL, ANON_KEY, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => cookies.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
    },
  });
  const { error } = await ssr.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  if (error) throw error;
  const cookie = [...jar].map(([name, value]) => `${name}=${value}`).join("; ");

  return {
    async session() {
      const response = await fetch(`${API}/api/session`, { headers: { cookie } });
      return response.json();
    },
  };
}

export async function getProduct(slug = "noire-01") {
  const response = await fetch(`${API}/api/mobile/catalog/products/${slug}`);
  const { product } = await response.json();
  return product;
}

/** First variant with at least `min` in stock. */
export function inStockVariant(product, min = 3) {
  const variant = product.variants.find((v) => v.stock_quantity >= min);
  if (!variant) throw new Error(`${product.name} has no size with ${min}+ in stock`);
  return variant;
}

/**
 * Subscribes `listener` (a signed-in customer) to realtime changes of the cart owned by
 * `ownerId`, the way the website and app do. Resolves once the subscription is live.
 */
export async function watchCart(listener, ownerId) {
  const events = [];
  let waiter = null;
  const channel = listener.client
    .channel(`test-cart-${ownerId}-${Math.random().toString(36).slice(2)}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "noire_carts", filter: `user_id=eq.${ownerId}` }, (e) => {
      events.push(e);
      waiter?.();
    });
  await new Promise((resolve, reject) => {
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") resolve();
      else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") reject(new Error(`Realtime ${status}`));
    });
  });
  // Realtime needs a moment after SUBSCRIBED before it routes changes to a new subscription
  // (the apps cover this gap by refetching the cart as soon as they subscribe).
  await sleep(2000);

  return {
    events,
    /** Waits for the next event; resolves with it, or null if none arrives within `ms`. */
    next(ms = 6000) {
      const seen = events.length;
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          waiter = null;
          resolve(null);
        }, ms);
        waiter = () => {
          if (events.length > seen) {
            clearTimeout(timer);
            waiter = null;
            resolve(events[events.length - 1]);
          }
        };
      });
    },
    close: () => listener.client.removeChannel(channel),
  };
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
