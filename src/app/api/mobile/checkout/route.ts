import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { getCart } from "@/lib/cart/service";
import { cartJson, getMobileContext, readJson } from "@/lib/mobile/context";
import { isAppReturnUrl } from "@/lib/mobile/return-url";
import { getCheckoutDefaults } from "@/lib/orders/checkout-defaults";
import { placeOrderFor } from "@/lib/orders/place";
import { paymentMethods } from "@/lib/payments";
import { paystackConfigured, paystackTestMode } from "@/lib/payments/paystack";
import { requestOrigin } from "@/lib/request-origin";
import { CATALOG_TAG } from "@/lib/supabase/public";

/** What the checkout screen needs: the cart, prefilled details and the payment methods on offer. */
export async function GET(request: NextRequest) {
  const context = await getMobileContext(request);
  if (context instanceof Response) return context;
  const [cart, defaults] = await Promise.all([getCart(context), getCheckoutDefaults(context)]);
  return cartJson(context, {
    cart,
    defaults,
    paymentMethods: Object.values(paymentMethods).filter((method) => !method.online || paystackConfigured()),
    paystackTestMode: paystackTestMode(),
  });
}

/**
 * Places the order. Body: the checkout fields plus idempotencyKey, paymentMethod and returnUrl
 * (the app link Paystack should come back to, e.g. noire://checkout/return).
 *
 * Responds with { ok, order: { orderNumber, accessToken }, paymentUrl }. When paymentUrl is set
 * the app opens it; after paying, the customer lands on returnUrl?status=paid|pending|failed.
 */
export async function POST(request: NextRequest) {
  const context = await getMobileContext(request);
  if (context instanceof Response) return context;

  const body = (await readJson(request)) as Record<string, unknown> | null;
  const { returnUrl, ...input } = body ?? {};
  if (typeof returnUrl !== "string" || !isAppReturnUrl(returnUrl)) {
    return cartJson(context, { ok: false, error: "The app sent an invalid return link." }, 400);
  }

  // Built from the address the app reached, so it also works against a dev server on the LAN.
  const callback = new URL("/api/mobile/checkout/return", requestOrigin(request));
  callback.searchParams.set("to", returnUrl);

  const result = await placeOrderFor(context, input, {
    paystackCallbackUrl: callback.toString(),
    onStockChanged: () => revalidateTag(CATALOG_TAG, { expire: 0 }),
  });
  return cartJson(context, result, result.ok ? 200 : 422);
}
