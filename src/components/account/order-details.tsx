import Link from "next/link";
import { CartTotals } from "@/components/cart/cart-totals";
import { ProductImage } from "@/components/product/product-image";
import { deliveryEstimate } from "@/lib/config";
import { formatDate, formatPrice, productLabel } from "@/lib/format";
import type { OrderDetail } from "@/lib/orders/queries";
import { paymentMethodLabel } from "@/lib/payments";

export function OrderItems({ order }: { order: OrderDetail }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {order.items.map((item) => (
        <li key={item.id} className="flex items-center gap-4 py-5 md:gap-6">
          <Link href={`/shop/${item.product_slug}`} className="shrink-0" tabIndex={-1} aria-hidden="true">
            <ProductImage src={item.image_url} alt="" sizes="96px" className="aspect-[4/5] w-[72px] md:w-[88px]" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-muted">{productLabel(item.product_number)}</p>
            <Link href={`/shop/${item.product_slug}`} className="font-serif text-[21px] leading-tight hover:opacity-70">
              {item.product_name}
            </Link>
            <p className="mt-1 text-[13px] text-muted">
              {item.size_ml} ml · Qty {item.quantity} · {formatPrice(item.unit_price, order.currency)} each
            </p>
          </div>
          <p className="text-[14px] tabular-nums">{formatPrice(item.total_price, order.currency)}</p>
        </li>
      ))}
    </ul>
  );
}

export function OrderFacts({ order }: { order: OrderDetail }) {
  return (
    <dl className="grid gap-8 text-[14px] leading-relaxed sm:grid-cols-2">
      <div>
        <dt className="eyebrow mb-2 text-muted">Delivering to</dt>
        <dd>
          {order.customer_name}
          <br />
          {order.shipping_address}
          <br />
          {order.city}, {order.state}
          <br />
          {order.country}
          {order.postal_code ? ` ${order.postal_code}` : ""}
          <br />
          <span className="text-muted">{order.customer_phone}</span>
        </dd>
      </div>
      <div>
        <dt className="eyebrow mb-2 text-muted">Delivery</dt>
        <dd>
          Expected within {deliveryEstimate(order.state)}
          {order.delivery_notes && <span className="mt-1 block text-muted">Note: {order.delivery_notes}</span>}
        </dd>
        <dt className="eyebrow mb-2 mt-6 text-muted">Payment</dt>
        <dd>
          {paymentMethodLabel(order.payment_method)}
          <span className="block text-muted">
            {order.payment_status === "paid"
              ? `Paid${order.paid_at ? ` on ${formatDate(order.paid_at)}` : ""}`
              : order.status === "pending_payment"
                ? "Awaiting payment confirmation."
                : order.status === "cancelled"
                  ? "Not charged."
                  : "Payment due on delivery. Nothing has been charged."}
          </span>
        </dd>
      </div>
      <div>
        <dt className="eyebrow mb-2 text-muted">Order placed</dt>
        <dd>{formatDate(order.created_at, { hour: "numeric", minute: "2-digit" })}</dd>
      </div>
      <div>
        <dt className="eyebrow mb-2 text-muted">Confirmation sent to</dt>
        <dd className="break-all">{order.customer_email}</dd>
      </div>
    </dl>
  );
}

export function OrderTotalsBlock({ order }: { order: OrderDetail }) {
  return <CartTotals subtotal={order.subtotal} shippingFee={order.shipping_fee} total={order.total} />;
}
