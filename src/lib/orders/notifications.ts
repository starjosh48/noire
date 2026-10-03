import "server-only";
import { siteConfig } from "@/lib/config";
import { orderConfirmationEmail } from "@/lib/email/order-confirmation";
import { sendEmail } from "@/lib/email/mailgun";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrderForEmail } from "./queries";

/**
 * Sends the order confirmation once. Runs after the order is committed; failures are logged
 * and never affect the order itself. `confirmation_email_sent_at` makes it safe to retry.
 */
export async function sendOrderConfirmation(orderId: string) {
  try {
    const order = await getOrderForEmail(orderId);
    if (!order) {
      console.error(`[email] Order ${orderId} not found for confirmation email`);
      return;
    }
    // Online orders are only confirmed (and emailed) once the payment is verified.
    if (order.confirmation_email_sent_at || order.status === "pending_payment" || order.status === "cancelled") return;

    const email = orderConfirmationEmail(order);
    const result = await sendEmail({
      to: order.customer_email,
      ...email,
      replyTo: siteConfig.supportEmail,
      tags: ["order-confirmation"],
    });
    if (!result.sent) return;

    const { error } = await createAdminClient()
      .from("noire_orders")
      .update({ confirmation_email_sent_at: new Date().toISOString() })
      .eq("id", order.id);
    if (error) console.error("[email] Sent confirmation but failed to record it", error);
  } catch (error) {
    console.error(`[email] Unexpected error sending confirmation for order ${orderId}`, error);
  }
}
