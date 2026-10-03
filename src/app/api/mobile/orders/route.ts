import type { NextRequest } from "next/server";
import { getMobileContext, mobileError, mobileJson } from "@/lib/mobile/context";
import { getOrdersForCurrentUser } from "@/lib/orders/queries";

export async function GET(request: NextRequest) {
  const context = await getMobileContext(request);
  if (context instanceof Response) return context;
  if (!context.user) return mobileError("Sign in to see your orders.", 401, { code: "SIGNED_OUT" });
  try {
    return mobileJson({ orders: await getOrdersForCurrentUser(undefined, context) });
  } catch {
    return mobileError("We couldn't load your orders right now.", 500);
  }
}
