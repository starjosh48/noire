import type { Metadata } from "next";
import { OrderList } from "@/components/account/order-list";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { pluralize } from "@/lib/format";
import { getOrdersForCurrentUser } from "@/lib/orders/queries";

export const metadata: Metadata = {
  title: "Order history",
  robots: { index: false },
};

export default async function OrdersPage() {
  const orders = await getOrdersForCurrentUser().catch(() => null);

  return (
    <div>
      <h1 className="display text-[48px] md:text-[72px]">Order history</h1>
      {orders === null ? (
        <p className="mt-10 text-[14px] text-danger" role="alert">
          We couldn&rsquo;t load your orders right now. Please refresh the page.
        </p>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Your orders will appear here once you've placed one. Guest orders appear too, once you sign in with the email you used."
          action={<ButtonLink href="/shop">Explore fragrances</ButtonLink>}
        />
      ) : (
        <>
          <p className="mt-4 text-[15px] text-muted">{pluralize(orders.length, "order")}</p>
          <div className="mt-10">
            <OrderList orders={orders} />
          </div>
        </>
      )}
    </div>
  );
}
