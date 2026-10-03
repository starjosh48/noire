"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Keeps a signed-in customer's cart live across devices (e.g. items added in the mobile app).
 * Supabase Realtime announces changes to the customer's own cart row (see the cart_realtime
 * migration); the event is only a signal, and the cart itself is re-read from the server.
 */
export function useCartRealtime(userId: string | null, refresh: () => Promise<void>) {
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    // One refresh for a burst of changes (a merge or checkout touches several items at once).
    const scheduleRefresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void refresh(), 400);
    };

    const channel = supabase
      .channel(`cart:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "noire_carts", filter: `user_id=eq.${userId}` },
        scheduleRefresh,
      )
      .subscribe();

    return () => {
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [userId, refresh]);
}
