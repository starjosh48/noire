import type { Metadata } from "next";
import { OrderFacts, OrderItems, OrderTotalsBlock } from "@/components/account/order-details";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckIcon } from "@/components/ui/icons";
import { getCurrentUser } from "@/lib/auth/session";
import { deliveryEstimate } from "@/lib/config";
import { firstName } from "@/lib/format";
import { getOrderForViewer } from "@/lib/orders/queries";
import { orderUrl } from "@/lib/orders/status";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

export default async function ConfirmationPage({ params, searchParams }: PageProps<"/checkout/confirmation/[orderNumber]">) {
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
          title="We couldn't open that order"
          description="The link may be incomplete. Your confirmation email has a link to your order, or sign in to see it in your account."
          action={
            <>
              <ButtonLink href="/account/orders">View your orders</ButtonLink>
              <ButtonLink href="/shop" variant="secondary">
                Continue shopping
              </ButtonLink>
            </>
          }
        />
      </div>
    );
  }

  const name = firstName(order.customer_name);

  return (
    <div className="shell pb-24 pt-12 md:pb-32 md:pt-20">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-ink text-ivory animate-rise">
            <CheckIcon size={26} strokeWidth={1.5} />
          </span>
          <p className="eyebrow mt-8 text-muted">Order {order.order_number}</p>
          <h1 className="display mt-4 text-[52px] md:text-[80px] animate-rise [animation-delay:80ms]">Order confirmed</h1>
          <p className="mt-4 font-serif text-[26px] italic text-ink-soft">Thank you{name ? `, ${name}` : ""}.</p>
          <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-muted">
            We&rsquo;re preparing your order now. A confirmation is on its way to{" "}
            <span className="text-ink">{order.customer_email}</span>, and you can expect delivery within{" "}
            <span className="text-ink">{deliveryEstimate(order.state)}</span>.{" "}
            {order.payment_status === "paid" ? "Your payment has been received." : "You’ll pay when it arrives."}
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href={orderUrl(order)} size="lg">
              View order
            </ButtonLink>
            <ButtonLink href="/shop" size="lg" variant="secondary">
              Continue shopping
            </ButtonLink>
          </div>
        </div>

        <section aria-labelledby="confirmation-items" className="mt-16 md:mt-20">
          <h2 id="confirmation-items" className="eyebrow mb-4 text-ink">
            Items purchased
          </h2>
          <OrderItems order={order} />
          <div className="ml-auto mt-6 max-w-sm">
            <OrderTotalsBlock order={order} />
          </div>
        </section>

        <section aria-label="Delivery and payment" className="mt-14 border-t border-line pt-10">
          <OrderFacts order={order} />
        </section>

        {!user && (
          <aside className="mt-14 bg-paper p-6 text-center md:p-8">
            <p className="display text-[28px]">Keep track of this order</p>
            <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-muted">
              Sign in with <span className="text-ink">{order.customer_email}</span> and this order will appear in your
              account, along with faster checkout next time.
            </p>
            <ButtonLink href="/login?next=/account/orders" variant="secondary" className="mt-6">
              Sign in or create an account
            </ButtonLink>
          </aside>
        )}
      </div>
    </div>
  );
}
