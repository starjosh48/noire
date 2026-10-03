import type { NextRequest } from "next/server";
import { getMobileContext, mobileError, mobileJson } from "@/lib/mobile/context";
import { getOrderForViewer } from "@/lib/orders/queries";

/** One order, for its signed-in owner or anyone holding its access key (?key=…), as on the website. */
export async function GET(request: NextRequest, { params }: RouteContext<"/api/mobile/orders/[orderNumber]">) {
  const context = await getMobileContext(request);
  if (context instanceof Response) return context;
  const { orderNumber } = await params;
  const order = await getOrderForViewer(orderNumber, request.nextUrl.searchParams.get("key"), context);
  if (!order) return mobileError("We couldn't find that order.", 404);
  return mobileJson({ order });
}
