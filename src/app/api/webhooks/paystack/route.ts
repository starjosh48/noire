import { NextResponse, type NextRequest } from "next/server";
import { settlePaystackPayment } from "@/lib/orders/payments";
import { isValidWebhookSignature } from "@/lib/payments/paystack";

/**
 * Paystack webhook: confirms payments even if the customer never returns to the site.
 * Configure in Paystack → Settings → API Keys & Webhooks → Webhook URL.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!isValidWebhookSignature(rawBody, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (event.event === "charge.success" && event.data?.reference) {
    // Settlement re-verifies with Paystack and is idempotent, so retries are harmless.
    await settlePaystackPayment(event.data.reference);
  }
  return NextResponse.json({ received: true });
}
