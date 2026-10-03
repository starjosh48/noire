import { useQuery } from "@tanstack/react-query";
import type { Cart, CheckoutInput, PaymentMethod, PaymentMethodId } from "~/shared";
import { apiFetch } from "./client";

export type CheckoutData = {
  cart: Cart;
  defaults: Partial<CheckoutInput>;
  paymentMethods: PaymentMethod[];
  paystackTestMode: boolean;
};

export type PlaceOrderResponse = {
  ok: true;
  order: { orderNumber: string; accessToken: string };
  /** Paystack's payment page for online payments; null when the order is already confirmed. */
  paymentUrl: string | null;
};

export type PlaceOrderRefusal = { ok: false; error: string; fieldErrors?: Record<string, string>; cart?: Cart };

export function useCheckout() {
  return useQuery({
    queryKey: ["me", "checkout"],
    queryFn: () => apiFetch<CheckoutData>("/checkout"),
    // Prefill once; don't overwrite what the customer is typing.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function placeOrder(input: CheckoutInput & { idempotencyKey: string; paymentMethod: PaymentMethodId; returnUrl: string }) {
  return apiFetch<PlaceOrderResponse>("/checkout", { method: "POST", body: JSON.stringify(input) });
}
