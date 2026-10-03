import type { Database } from "@/types/database";

type OrderStatus = Database["public"]["Enums"]["noire_order_status"];

export type PaymentMethodId = "paystack" | "pay_on_delivery";

/**
 * Payment methods offered at checkout. Shared by client and server (no secrets here).
 *
 * - paystack: the customer pays on Paystack's hosted page. The order starts as
 *   pending_payment, keeps the cart and reserves stock until the server verifies the payment.
 * - pay_on_delivery: nothing is charged online; the order is confirmed immediately.
 */
export type PaymentMethod = {
  id: PaymentMethodId;
  label: string;
  description: string;
  initialStatus: OrderStatus;
  online: boolean;
};

export const paymentMethods: Record<PaymentMethodId, PaymentMethod> = {
  paystack: {
    id: "paystack",
    label: "Pay now with card, transfer or USSD",
    description: "Pay securely on Paystack. Your order is confirmed as soon as the payment goes through.",
    initialStatus: "pending_payment",
    online: true,
  },
  pay_on_delivery: {
    id: "pay_on_delivery",
    label: "Pay on delivery",
    description:
      "Pay by card, transfer or cash when your order arrives. Nothing is charged when you place your order.",
    initialStatus: "confirmed",
    online: false,
  },
};

export const paymentMethodIds = Object.keys(paymentMethods) as PaymentMethodId[];

export function paymentMethodLabel(id: string) {
  if (id === "paystack") return "Paid online (Paystack)";
  return paymentMethods[id as PaymentMethodId]?.label ?? id;
}
