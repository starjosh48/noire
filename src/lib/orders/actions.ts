"use server";

import { updateTag } from "next/cache";
import { siteConfig } from "@/lib/config";
import { getWebCartOwner } from "@/lib/cart/service";
import type { Cart } from "@/lib/cart/types";
import { CATALOG_TAG } from "@/lib/supabase/public";
import { placeOrderFor } from "./place";

export type PlaceOrderResult =
  | { ok: true; redirectTo: string }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string>;
      cart?: Cart;
    };

export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const result = await placeOrderFor(await getWebCartOwner(), input, {
    paystackCallbackUrl: `${siteConfig.url}/checkout/paystack`,
    // Stock changed: product pages and listings show fresh availability on the next visit.
    onStockChanged: () => updateTag(CATALOG_TAG),
  });
  if (!result.ok) return result;

  const { orderNumber, accessToken } = result.order;
  return {
    ok: true,
    redirectTo: result.paymentUrl ?? `/checkout/confirmation/${orderNumber}?key=${accessToken}`,
  };
}
