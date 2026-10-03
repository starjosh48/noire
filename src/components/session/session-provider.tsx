"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useCart } from "@/components/cart/cart-provider";
import type { SessionUser } from "@/lib/auth/session";
import type { Cart } from "@/lib/cart/types";

type SessionContextValue = {
  user: SessionUser | null;
  /** True once the visitor's state has loaded (avoids flashing "signed out"). */
  ready: boolean;
  wishlist: ReadonlySet<string>;
  setSaved: (productId: string, saved: boolean) => void;
  reload: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}

type SessionPayload = { user: SessionUser | null; cart: Cart; wishlist: string[] };

async function fetchSession(): Promise<SessionPayload | null> {
  try {
    const response = await fetch("/api/session", { cache: "no-store", credentials: "same-origin" });
    return response.ok ? ((await response.json()) as SessionPayload) : null;
  } catch {
    return null;
  }
}

/**
 * Loads who is signed in, their cart and wishlist in one request after the page appears, so
 * the pages themselves can be static and served from the edge cache.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const { replaceCart, markReady } = useCart();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [wishlist, setWishlist] = useState<ReadonlySet<string>>(new Set());

  const apply = useCallback(
    (data: SessionPayload | null) => {
      if (data) {
        setUser(data.user);
        setWishlist(new Set(data.wishlist));
        replaceCart(data.cart);
      }
      // Without data (offline, transient error) the visitor keeps browsing as a guest.
      setReady(true);
      markReady();
    },
    [replaceCart, markReady],
  );

  const reload = useCallback(() => fetchSession().then(apply), [apply]);

  useEffect(() => {
    fetchSession().then(apply);
    // Refresh when returning to the tab (another tab may have changed the cart or signed out).
    const onVisible = () => document.visibilityState === "visible" && reload();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [apply, reload]);

  const setSaved = useCallback((productId: string, saved: boolean) => {
    setWishlist((current) => {
      const next = new Set(current);
      if (saved) next.add(productId);
      else next.delete(productId);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ user, ready, wishlist, setSaved, reload }), [user, ready, wishlist, setSaved, reload]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
