import "server-only";
import { getWebViewer, type Viewer } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type OrderRow = Database["public"]["Tables"]["noire_orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["noire_order_items"]["Row"];

export type OrderItem = Pick<
  OrderItemRow,
  "id" | "product_name" | "product_number" | "product_slug" | "image_url" | "size_ml" | "quantity" | "unit_price" | "total_price"
>;

export type OrderDetail = Omit<OrderRow, "idempotency_key" | "cart_id" | "payment_reference"> & { items: OrderItem[] };

export type OrderListItem = Pick<OrderRow, "id" | "order_number" | "status" | "total" | "currency" | "created_at"> & {
  items: Pick<OrderItemRow, "product_name" | "product_number" | "image_url" | "size_ml" | "quantity">[];
};

const ORDER_COLUMNS =
  "id, user_id, order_number, status, payment_status, payment_method, subtotal, shipping_fee, total, currency, customer_email, customer_name, customer_phone, shipping_address, city, state, country, postal_code, delivery_notes, access_token, confirmation_email_sent_at, paid_at, created_at, updated_at";
const ITEM_COLUMNS =
  "id, product_name, product_number, product_slug, image_url, size_ml, quantity, unit_price, total_price";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ORDER_NUMBER = /^NO-\d{8}-[A-Z0-9]{4,8}$/;

/** Orders for the signed-in customer, newest first (Row Level Security scopes the query). */
export async function getOrdersForCurrentUser(limit?: number, viewer?: Viewer): Promise<OrderListItem[]> {
  const { user, supabase } = viewer ?? (await getWebViewer());
  if (!user) return [];
  let query = supabase
    .from("noire_orders")
    .select(
      "id, order_number, status, total, currency, created_at, items:noire_order_items(product_name, product_number, image_url, size_ml, quantity)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) {
    console.error("[orders] Failed to list orders", error);
    throw new Error("We couldn't load your orders right now.");
  }
  return data ?? [];
}

/**
 * Loads an order for whoever is looking: its owner (via their session and RLS), or anyone
 * holding the secret access key from the confirmation link or email.
 */
export async function getOrderForViewer(
  orderNumber: string,
  accessKey?: string | null,
  viewer?: Viewer,
): Promise<OrderDetail | null> {
  const number = orderNumber.toUpperCase();
  if (!ORDER_NUMBER.test(number)) return null;

  const { user, supabase } = viewer ?? (await getWebViewer());
  if (user) {
    const { data, error } = await supabase
      .from("noire_orders")
      .select(`${ORDER_COLUMNS}, items:noire_order_items(${ITEM_COLUMNS})`)
      .eq("order_number", number)
      .maybeSingle();
    if (error) console.error("[orders] Failed to load order for owner", error);
    if (data) return data;
  }

  if (accessKey && UUID.test(accessKey)) {
    const { data, error } = await createAdminClient()
      .from("noire_orders")
      .select(`${ORDER_COLUMNS}, items:noire_order_items(${ITEM_COLUMNS})`)
      .eq("order_number", number)
      .eq("access_token", accessKey)
      .maybeSingle();
    if (error) console.error("[orders] Failed to load order by access key", error);
    if (data) return data;
  }

  return null;
}

/** Most recent delivery details, used to prefill checkout for returning customers. */
export async function getLastDeliveryDetails(viewer?: Viewer) {
  const { user, supabase } = viewer ?? (await getWebViewer());
  if (!user) return null;
  const { data } = await supabase
    .from("noire_orders")
    .select("customer_name, customer_phone, shipping_address, city, state, country, postal_code")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getOrderForEmail(orderId: string): Promise<OrderDetail | null> {
  const { data, error } = await createAdminClient()
    .from("noire_orders")
    .select(`${ORDER_COLUMNS}, items:noire_order_items(${ITEM_COLUMNS})`)
    .eq("id", orderId)
    .maybeSingle();
  if (error) console.error("[orders] Failed to load order for email", error);
  return data;
}
