import { notFound } from "next/navigation";
import { orderConfirmationEmail } from "@/lib/email/order-confirmation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrderForEmail } from "@/lib/orders/queries";

/** Development only: preview the order confirmation email in the browser. */
export async function GET(_request: Request, { params }: RouteContext<"/dev/email/[orderNumber]">) {
  if (process.env.NODE_ENV !== "development") notFound();

  const { orderNumber } = await params;
  const { data } = await createAdminClient()
    .from("noire_orders")
    .select("id")
    .eq("order_number", orderNumber.toUpperCase())
    .maybeSingle();
  const order = data ? await getOrderForEmail(data.id) : null;
  if (!order) return new Response("Order not found", { status: 404 });

  const email = orderConfirmationEmail(order);
  return new Response(email.html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
