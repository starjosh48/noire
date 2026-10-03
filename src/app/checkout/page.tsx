import type { Metadata } from "next";
import { OpenCartButton } from "@/components/cart/open-cart-button";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { CheckoutSync } from "@/components/checkout/checkout-sync";
import { OrderSummary } from "@/components/checkout/order-summary";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertIcon, ArrowLeftIcon, CartIcon } from "@/components/ui/icons";
import { getAuthProviders } from "@/lib/auth/providers";
import { getCurrentUser, getProfile } from "@/lib/auth/session";
import { getCart } from "@/lib/cart/service";
import { getLastDeliveryDetails } from "@/lib/orders/queries";
import { paystackConfigured, paystackTestMode } from "@/lib/payments/paystack";
import { nigerianStates, type CheckoutInput } from "@/lib/validation/checkout";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

const paymentNotices: Record<string, string> = {
  failed: "Your payment didn't go through, so nothing was charged. Your cart is just as you left it. Please try again, or choose pay on delivery.",
  error: "We couldn't confirm that payment. If money left your account, contact client care with your order email before trying again.",
};

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const { payment } = await searchParams;
  const paymentNotice = typeof payment === "string" ? paymentNotices[payment] : undefined;
  const [cart, user, providers] = await Promise.all([getCart(), getCurrentUser(), getAuthProviders()]);

  if (cart.lines.length === 0) {
    return (
      <div className="shell">
        <EmptyState
          headingLevel="h1"
          icon={<CartIcon size={36} />}
          title="Your cart is empty"
          description="Add a fragrance to your cart to check out."
          action={<ButtonLink href="/shop">Explore fragrances</ButtonLink>}
        />
      </div>
    );
  }

  const [profile, last] = user ? await Promise.all([getProfile(), getLastDeliveryDetails()]) : [null, null];
  const state = last?.state && (nigerianStates as readonly string[]).includes(last.state) ? last.state : undefined;
  const defaults: Partial<CheckoutInput> = {
    email: profile?.email || user?.email || "",
    fullName: last?.customer_name ?? profile?.full_name ?? user?.name ?? "",
    phone: last?.customer_phone ?? profile?.phone ?? "",
    address: last?.shipping_address ?? "",
    city: last?.city ?? "",
    state: state as CheckoutInput["state"] | undefined,
    postalCode: last?.postal_code ?? "",
  };

  return (
    <div className="shell pb-24 pt-10 md:pb-32 md:pt-14">
      <CheckoutSync cart={cart} />
      <OpenCartButton className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink">
        <ArrowLeftIcon size={16} /> Edit cart
      </OpenCartButton>
      <h1 className="display mt-6 text-[48px] md:text-[72px]">Checkout</h1>
      {paymentNotice && (
        <p className="mt-8 flex max-w-3xl items-start gap-2 border border-danger/25 bg-danger-soft px-4 py-3 text-[14px] text-danger" role="alert">
          <AlertIcon size={18} className="mt-0.5 shrink-0" />
          {paymentNotice}
        </p>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:order-2 lg:col-span-5">
          <OrderSummary />
        </div>
        <div className="lg:order-1 lg:col-span-7">
          <CheckoutForm defaults={defaults} signedInEmail={user?.email ?? null} googleEnabled={providers.google} googleDirect={providers.googleDirect}
            onlinePayment={{ available: paystackConfigured(), testMode: paystackTestMode() }}
          />
        </div>
      </div>
    </div>
  );
}
