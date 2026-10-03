import "server-only";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTransaction } from "@/lib/payments/paystack";
import { CATALOG_TAG } from "@/lib/supabase/public";
import { sendOrderConfirmation } from "./notifications";

export type SettlementOutcome =
  | { outcome: "paid"; orderNumber: string; accessToken: string }
  | { outcome: "pending"; orderNumber: string; accessToken: string }
  | { outcome: "failed"; orderNumber?: string }
  | { outcome: "unknown" };

/**
 * Settles a Paystack payment by asking Paystack for the result (the browser redirect and the
 * webhook only tell us which reference to check). Confirms the order and sends the email once,
 * or cancels the order and returns its stock. Safe to run repeatedly for the same reference.
 */
export async function settlePaystackPayment(reference: string): Promise<SettlementOutcome> {
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("noire_orders")
    .select("id, order_number, access_token, status, payment_status, total, currency")
    .eq("payment_reference", reference)
    .maybeSingle();
  if (error || !order) {
    console.warn("[payments] No order for Paystack reference", reference, error?.message);
    return { outcome: "unknown" };
  }

  const ids = { orderNumber: order.order_number, accessToken: order.access_token };
  if (order.payment_status === "paid") return { outcome: "paid", ...ids };
  if (order.status === "cancelled") return { outcome: "failed", orderNumber: order.order_number };

  let transaction;
  try {
    transaction = await verifyTransaction(reference);
  } catch (err) {
    console.error("[payments] Paystack verification failed", err);
    return { outcome: "pending", ...ids };
  }

  if (transaction.status === "success") {
    if (transaction.metadata?.order_id && transaction.metadata.order_id !== order.id) {
      console.error("[payments] Paystack metadata does not match order", reference);
      return { outcome: "pending", ...ids };
    }
    const { data, error: confirmError } = await admin.rpc("noire_confirm_payment", {
      p_order_id: order.id,
      p_reference: reference,
      p_amount_minor: transaction.amount,
      p_currency: transaction.currency,
    });
    if (confirmError) {
      // AMOUNT_MISMATCH or an order that can no longer be paid: leave it for a human to review.
      console.error("[payments] Could not confirm payment", reference, confirmError.message);
      return { outcome: "pending", ...ids };
    }
    if ((data as { newly_confirmed?: boolean })?.newly_confirmed) {
      await sendOrderConfirmation(order.id);
    }
    return { outcome: "paid", ...ids };
  }

  if (transaction.status === "failed" || transaction.status === "abandoned" || transaction.status === "reversed") {
    const { error: cancelError } = await admin.rpc("noire_cancel_unpaid_order", { p_order_id: order.id });
    if (cancelError) console.error("[payments] Could not cancel unpaid order", cancelError.message);
    // Reserved stock was returned.
    else revalidateTag(CATALOG_TAG, { expire: 0 });
    return { outcome: "failed", orderNumber: order.order_number };
  }

  // ongoing / pending / processing / queued: e.g. a bank transfer that hasn't landed yet.
  return { outcome: "pending", ...ids };
}
