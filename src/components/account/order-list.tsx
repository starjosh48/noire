import Link from "next/link";
import { ProductImage } from "@/components/product/product-image";
import { ArrowRightIcon } from "@/components/ui/icons";
import { formatDate, formatPrice, pluralize } from "@/lib/format";
import type { OrderListItem } from "@/lib/orders/queries";
import { OrderStatusBadge } from "./order-status";

export function OrderList({ orders }: { orders: OrderListItem[] }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {orders.map((order) => {
        const count = order.items.reduce((n, i) => n + i.quantity, 0);
        const names = order.items.map((i) => i.product_name);
        return (
          <li key={order.id}>
            <Link
              href={`/orders/${order.order_number}`}
              className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 py-6 md:grid-cols-[auto_1.4fr_1fr_auto_auto] md:gap-8"
            >
              <div className="flex -space-x-6">
                {order.items.slice(0, 3).map((item, index) => (
                  <ProductImage
                    key={`${item.image_url}-${index}`}
                    src={item.image_url}
                    alt=""
                    sizes="64px"
                    className="aspect-[4/5] w-12 border-2 border-ivory md:w-14"
                  />
                ))}
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-medium text-ink">{order.order_number}</p>
                <p className="mt-0.5 truncate text-[13px] text-muted">
                  {pluralize(count, "item")} · {names.slice(0, 2).join(", ")}
                  {names.length > 2 ? ` +${names.length - 2} more` : ""}
                </p>
                <p className="mt-0.5 text-[13px] text-muted md:hidden">{formatDate(order.created_at)}</p>
              </div>
              <p className="hidden text-[14px] text-muted md:block">{formatDate(order.created_at)}</p>
              <div className="hidden md:block">
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[14px] tabular-nums">{formatPrice(order.total, order.currency)}</span>
                <ArrowRightIcon size={18} className="hidden text-muted transition-transform group-hover:translate-x-1 group-hover:text-ink md:block" />
              </div>
              <div className="col-span-3 md:hidden">
                <OrderStatusBadge status={order.status} />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
