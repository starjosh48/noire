import "server-only";
import { after } from "next/server";
import { commerce } from "@/lib/config";
import { resolveCartIdForWrite, loadCart, type CartOwner } from "@/lib/cart/service";
import type { Cart } from "@/lib/cart/types";
import { paymentMethods } from "@/lib/payments";
import { initializeTransaction, paystackConfigured } from "@/lib/payments/paystack";
import { createAdminClient } from "@/lib/supabase/admin";
import { placeOrderSchema } from "@/lib/validation/checkout";
import { completeProfile } from "./claim";
import { sendOrderConfirmation } from "./notifications";

export type PlaceOrderOutcome =
  | {
      ok: true;
      order: { orderNumber: string; accessToken: string };
      /** Paystack's hosted payment page, for online payments. Null when the order is already confirmed. */
      paymentUrl: string | null;
    }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string>;
      cart?: Cart;
    };

export type PlaceOrderOptions = {
  /** Where Paystack sends the customer after paying (it is given ?reference=…). */
  paystackCallbackUrl: string;
  /** Called when the order reserved stock, so catalog pages can show fresh availability. */
  onStockChanged: () => void;
};

type StockIssue = { name: string; size_ml: number; available?: number };

type PlacedOrder = {
  id: string;
  order_number: string;
  access_token: string;
  status: string;
  total: number;
  created: boolean;
};

function parseIssues(details: string | undefined): StockIssue[] {
  try {
    return details ? (JSON.parse(details) as StockIssue[]) : [];
  } catch {
    return [];
  }
}

/** Places an order from the owner's cart. Shared by the website checkout and the mobile API. */
export async function placeOrderFor(owner: CartOwner, input: unknown, options: PlaceOrderOptions): Promise<PlaceOrderOutcome> {
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, error: "Please check the highlighted details.", fieldErrors };
  }
  const { idempotencyKey, paymentMethod: methodId, ...details } = parsed.data;
  const method = paymentMethods[methodId];
  if (method.online && !paystackConfigured()) {
    return { ok: false, error: "Online payment is unavailable right now. Please choose pay on delivery." };
  }

  try {
    const { user } = owner;
    const cartId = await resolveCartIdForWrite({ create: false }, owner);
    if (!cartId) {
      return { ok: false, error: "Your cart is empty. Add a fragrance to place an order." };
    }

    const admin = createAdminClient();
    if (method.online) {
      // Release stock held by checkouts that were abandoned on the payment page.
      await admin.rpc("noire_cancel_stale_unpaid_orders", {});
    }

    const { data, error } = await admin.rpc("noire_place_order", {
      p_cart_id: cartId,
      // The function accepts null for guest checkouts.
      p_user_id: (user?.id ?? null) as string,
      p_idempotency_key: idempotencyKey,
      p_customer: {
        email: details.email,
        full_name: details.fullName,
        phone: details.phone,
        address: details.address,
        city: details.city,
        state: details.state,
        country: details.country,
        postal_code: details.postalCode ?? "",
        delivery_notes: details.deliveryNotes ?? "",
      },
      p_shipping_fee: commerce.shippingFee,
      p_free_shipping_threshold: commerce.freeShippingThreshold,
      p_currency: commerce.currency,
      p_payment_method: method.id,
      p_status: method.initialStatus,
      // Online payments keep the cart until the payment is confirmed.
      p_clear_cart: !method.online,
    });

    if (error) {
      if (error.message === "EMPTY_CART") {
        return { ok: false, error: "Your cart is empty. Add a fragrance to place an order.", cart: await loadCart(cartId) };
      }
      if (error.message === "OUT_OF_STOCK") {
        const issues = parseIssues(error.details);
        const list = issues
          .map((i) => (i.available ? `${i.name} ${i.size_ml} ml (only ${i.available} left)` : `${i.name} ${i.size_ml} ml (sold out)`))
          .join(", ");
        return {
          ok: false,
          error: `Some items just ran low: ${list || "please review your cart"}. Update your cart to continue.`,
          cart: await loadCart(cartId),
        };
      }
      if (error.message === "PRODUCT_UNAVAILABLE") {
        return {
          ok: false,
          error: "A fragrance in your cart is no longer available. Please remove it to continue.",
          cart: await loadCart(cartId),
        };
      }
      throw error;
    }

    const order = data as PlacedOrder;
    if (order.created) options.onStockChanged();
    if (user && order.created) after(() => completeProfile(user.id, details.fullName, details.phone));

    if (order.status === "cancelled") {
      return { ok: false, error: "This checkout has expired. Please refresh the page and try again." };
    }

    const placed = { orderNumber: order.order_number, accessToken: order.access_token };

    if (order.status === "pending_payment") {
      // A new reference for every attempt: Paystack rejects references it has already seen.
      const reference = `${order.order_number}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
      const { error: referenceError } = await admin
        .from("noire_orders")
        .update({ payment_reference: reference })
        .eq("id", order.id);
      if (referenceError) throw referenceError;

      const payment = await initializeTransaction({
        email: details.email,
        amountMinor: Math.round(Number(order.total) * 100),
        currency: commerce.currency,
        reference,
        callbackUrl: options.paystackCallbackUrl,
        metadata: { order_id: order.id, order_number: order.order_number },
      });
      return { ok: true, order: placed, paymentUrl: payment.authorization_url };
    }

    if (order.created) {
      // Send the confirmation after the response so a slow or failing mail provider never
      // delays or breaks a completed order.
      after(() => sendOrderConfirmation(order.id));
    }
    return { ok: true, order: placed, paymentUrl: null };
  } catch (error) {
    console.error("[orders] placeOrder failed", error);
    return {
      ok: false,
      error: "We couldn't place your order just now. Nothing has been charged. Please try again in a moment.",
    };
  }
}
