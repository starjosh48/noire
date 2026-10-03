export const orderStatusLabels: Record<string, string> = {
  pending_payment: "Awaiting payment",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** The fulfilment journey shown on order pages, in order. */
export const orderTimeline = ["confirmed", "processing", "shipped", "delivered"] as const;

export function orderStatusLabel(status: string) {
  return orderStatusLabels[status] ?? status;
}

export function orderUrl(order: { order_number: string; access_token?: string | null }, withKey = true) {
  const base = `/orders/${order.order_number}`;
  return withKey && order.access_token ? `${base}?key=${order.access_token}` : base;
}
