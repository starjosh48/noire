import type { Metadata } from "next";
import Link from "next/link";
import { OrderFacts, OrderItems, OrderTotalsBlock } from "@/components/account/order-details";
import { OrderStatusBadge, OrderTimeline } from "@/components/account/order-status";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { getCurrentUser } from "@/lib/auth/session";
import { siteConfig } from "@/lib/config";
import { formatDate } from "@/lib/format";
import { getOrderForViewer } from "@/lib/orders/queries";

export async function generateMetadata({ params }: PageProps<"/orders/[orderNumber]">): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: `Order ${orderNumber.toUpperCase()}`, robots: { index: false } };
}

export default async function OrderPage({ params, searchParams }: PageProps<"/orders/[orderNumber]">) {
  const [{ orderNumber }, { key }] = await Promise.all([params, searchParams]);
  const [order, user] = await Promise.all([
    getOrderForViewer(orderNumber, typeof key === "string" ? key : null),
    getCurrentUser(),
  ]);

  if (!order) {
    return (
      <div className="shell">
        <EmptyState
          headingLevel="h1"
          title="We couldn't find that order"
          description={
            user
              ? "It isn't linked to your account. Open it from your confirmation email, or contact client care."
              : "Sign in to see orders linked to your account, or use the link in your confirmation email."
          }
          action={
            user ? (
              <ButtonLink href="/account/orders">Your orders</ButtonLink>
            ) : (
              <ButtonLink href={`/login?next=${encodeURIComponent(`/orders/${orderNumber}`)}`}>Sign in</ButtonLink>
            )
          }
        />
      </div>
    );
  }

  return (
    <div className="shell pb-24 pt-10 md:pb-32 md:pt-16">
      <div className="mx-auto max-w-4xl">
        {user && (
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-muted hover:text-ink"
          >
            <ArrowLeftIcon size={16} /> All orders
          </Link>
        )}
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-muted">Placed {formatDate(order.created_at)}</p>
            <h1 className="display mt-3 text-[40px] md:text-[60px]">Order {order.order_number}</h1>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="mt-10">
          <OrderTimeline status={order.status} />
        </div>

        <section aria-labelledby="order-items" className="mt-14">
          <h2 id="order-items" className="eyebrow mb-4 text-ink">
            Items
          </h2>
          <OrderItems order={order} />
          <div className="ml-auto mt-6 max-w-sm">
            <OrderTotalsBlock order={order} />
          </div>
        </section>

        <section aria-label="Delivery and payment" className="mt-14 border-t border-line pt-10">
          <OrderFacts order={order} />
        </section>

        <p className="mt-14 border-t border-line pt-8 text-[14px] text-muted">
          Need help with this order? Write to{" "}
          <a href={`mailto:${siteConfig.supportEmail}?subject=Order%20${order.order_number}`} className="text-ink link-underline">
            {siteConfig.supportEmail}
          </a>{" "}
          and quote {order.order_number}.
        </p>
      </div>
    </div>
  );
}
