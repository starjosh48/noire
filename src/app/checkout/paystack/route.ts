import { NextResponse, type NextRequest } from "next/server";
import { settlePaystackPayment } from "@/lib/orders/payments";
import { requestOrigin } from "@/lib/request-origin";

/** Paystack sends the customer back here. The outcome is verified with Paystack server-side. */
export async function GET(request: NextRequest) {
  const origin = requestOrigin(request);
  const reference = request.nextUrl.searchParams.get("reference") ?? request.nextUrl.searchParams.get("trxref");
  if (!reference) return NextResponse.redirect(`${origin}/checkout?payment=error`);

  const result = await settlePaystackPayment(reference);
  switch (result.outcome) {
    case "paid":
      return NextResponse.redirect(`${origin}/checkout/confirmation/${result.orderNumber}?key=${result.accessToken}`);
    case "pending":
      return NextResponse.redirect(`${origin}/orders/${result.orderNumber}?key=${result.accessToken}&payment=pending`);
    case "failed":
      return NextResponse.redirect(`${origin}/checkout?payment=failed`);
    default:
      return NextResponse.redirect(`${origin}/checkout?payment=error`);
  }
}
