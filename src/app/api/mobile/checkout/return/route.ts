import { NextResponse, type NextRequest } from "next/server";
import { isAppReturnUrl } from "@/lib/mobile/return-url";
import { settlePaystackPayment } from "@/lib/orders/payments";

/**
 * Paystack sends app customers here after paying. The outcome is verified with Paystack
 * server-side (exactly like the website's /checkout/paystack), then the in-app browser is sent
 * back into the app. Only the outcome travels in the link: the app already holds the order's
 * number and access key from placing it.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const to = params.get("to");
  if (!to || !isAppReturnUrl(to)) {
    return new NextResponse("This payment link is invalid. Please return to the NOIRÉ app.", { status: 400 });
  }

  const reference = params.get("reference") ?? params.get("trxref");
  const result = reference ? await settlePaystackPayment(reference) : ({ outcome: "unknown" } as const);

  const back = new URL(to);
  back.searchParams.set("status", result.outcome === "unknown" ? "error" : result.outcome);
  if ("orderNumber" in result && result.orderNumber) back.searchParams.set("order", result.orderNumber);
  return NextResponse.redirect(back.toString(), 303);
}
