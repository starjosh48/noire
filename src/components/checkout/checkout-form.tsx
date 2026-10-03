"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { GoogleButton } from "@/components/auth/google-button";
import { useCart } from "@/components/cart/cart-provider";
import { OpenCartButton } from "@/components/cart/open-cart-button";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { AlertIcon, CheckIcon, LockIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { emptyCart } from "@/lib/cart/pricing";
import { formatPrice } from "@/lib/format";
import { placeOrder } from "@/lib/orders/actions";
import { paymentMethods, type PaymentMethodId } from "@/lib/payments";
import { cn } from "@/lib/utils";
import {
  checkoutSchema,
  nigerianStates,
  shippingCountries,
  type CheckoutInput,
} from "@/lib/validation/checkout";

type CheckoutFormProps = {
  defaults: Partial<CheckoutInput>;
  signedInEmail: string | null;
  googleEnabled: boolean;
  googleDirect: boolean;
  /** Online payment (Paystack) is configured; testMode shows test-card guidance. */
  onlinePayment: { available: boolean; testMode: boolean };
};

function Section({ step, title, children, aside }: { step: number; title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section aria-labelledby={`checkout-step-${step}`} className="border-t border-line pt-8">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h2 id={`checkout-step-${step}`} className="flex items-baseline gap-3">
          <span className="text-[12px] tabular-nums text-faint">{String(step).padStart(2, "0")}</span>
          <span className="display text-[30px] md:text-[34px]">{title}</span>
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function CheckoutForm({ defaults, signedInEmail, googleEnabled, googleDirect, onlinePayment }: CheckoutFormProps) {
  const router = useRouter();
  const toast = useToast();
  const { cart, replaceCart } = useCart();
  // One key per checkout visit: double-clicks and retries can never create two orders.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>(onlinePayment.available ? "paystack" : "pay_on_delivery");
  const methods = (onlinePayment.available ? ["paystack", "pay_on_delivery"] : ["pay_on_delivery"]) as PaymentMethodId[];
  const payingOnline = paymentMethods[paymentMethod].online;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    mode: "onTouched",
    defaultValues: { country: "Nigeria", state: undefined, ...defaults },
  });

  const onSubmit = async (values: CheckoutInput) => {
    setFormError(null);
    setSubmitting(true);
    try {
      const result = await placeOrder({ ...values, idempotencyKey, paymentMethod });
      if (result.ok) {
        if (result.redirectTo.startsWith("http")) {
          // Paystack's secure payment page. The cart stays until the payment is confirmed.
          window.location.assign(result.redirectTo);
        } else {
          replaceCart(emptyCart());
          router.replace(result.redirectTo);
        }
        return; // keep the button busy while the next page loads
      }
      if (result.cart) replaceCart(result.cart);
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          if (field in checkoutSchema.shape) setError(field as keyof CheckoutInput, { message }, { shouldFocus: true });
        }
      }
      setFormError(result.error);
      requestAnimationFrame(() => document.getElementById("checkout-error")?.focus());
    } catch {
      setFormError("We couldn't reach NOIRÉ. Check your connection and try again. Your order has not been placed.");
      toast({ tone: "error", title: "Connection problem", description: "Your order has not been placed." });
    }
    setSubmitting(false);
  };

  const blocked = cart.lines.length === 0 || cart.hasIssues;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-12" aria-describedby={formError ? "checkout-error" : undefined}>
      {formError && (
        <div
          id="checkout-error"
          tabIndex={-1}
          role="alert"
          className="flex items-start gap-3 border border-danger/25 bg-danger-soft px-4 py-4 text-[14px] text-danger focus:outline-none"
        >
          <AlertIcon size={18} className="mt-0.5 shrink-0" />
          <div>
            <p>{formError}</p>
            {cart.hasIssues && (
              <OpenCartButton className="mt-2 inline-block font-medium underline underline-offset-4">
                Review your cart
              </OpenCartButton>
            )}
          </div>
        </div>
      )}

      <Section
        step={1}
        title="Contact"
        aside={
          signedInEmail ? (
            <span className="flex items-center gap-1.5 text-[12px] text-muted">
              <CheckIcon size={14} /> Signed in
            </span>
          ) : null
        }
      >
        {!signedInEmail && (
          <div className="mb-6 flex flex-col gap-4 bg-paper p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[14px] text-ink-soft">
              Have an account?{" "}
              <Link href="/login?next=/checkout" className="text-ink link-underline">
                Sign in
              </Link>{" "}
              for a faster checkout, or continue as a guest.
            </p>
            {googleEnabled && (
              <div className="shrink-0 sm:w-56">
                <GoogleButton next="/checkout" label="Sign in with Google" direct={googleDirect} />
              </div>
            )}
          </div>
        )}
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            hint="For your order confirmation."
            error={errors.email?.message}
            {...register("email")}
          />
          <TextField
            label="Phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="0803 123 4567"
            hint="The courier will call before delivery."
            error={errors.phone?.message}
            {...register("phone")}
          />
        </div>
      </Section>

      <Section step={2} title="Delivery">
        <div className="grid gap-5 md:grid-cols-2">
          <TextField
            label="Full name"
            autoComplete="name"
            error={errors.fullName?.message}
            containerClassName="md:col-span-2"
            {...register("fullName")}
          />
          <TextField
            label="Address"
            autoComplete="street-address"
            placeholder="House number, street, estate"
            error={errors.address?.message}
            containerClassName="md:col-span-2"
            {...register("address")}
          />
          <TextField label="City or area" autoComplete="address-level2" error={errors.city?.message} {...register("city")} />
          <SelectField label="State" autoComplete="address-level1" error={errors.state?.message} defaultValue="" {...register("state")}>
            <option value="" disabled>
              Select a state
            </option>
            {nigerianStates.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Country"
            autoComplete="country-name"
            error={errors.country?.message}
            hint="We currently deliver within Nigeria."
            {...register("country")}
          >
            {shippingCountries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectField>
          <TextField
            label="Postal code"
            optional
            autoComplete="postal-code"
            error={errors.postalCode?.message}
            {...register("postalCode")}
          />
          <TextAreaField
            label="Delivery notes"
            optional
            placeholder="Gate code, landmark, or the best time to reach you"
            error={errors.deliveryNotes?.message}
            containerClassName="md:col-span-2"
            rows={3}
            {...register("deliveryNotes")}
          />
        </div>
      </Section>

      <Section step={3} title="Payment">
        <fieldset>
          <legend className="sr-only">Choose how to pay</legend>
          <div className="flex flex-col gap-3">
            {methods.map((id) => {
              const method = paymentMethods[id];
              const selected = paymentMethod === id;
              return (
                <label
                  key={id}
                  className={cn(
                    "flex cursor-pointer items-start gap-4 border p-5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
                    selected ? "border-ink bg-paper" : "border-line hover:border-muted",
                  )}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={id}
                    checked={selected}
                    onChange={() => setPaymentMethod(id)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border",
                      selected ? "border-ink bg-ink" : "border-sand bg-paper",
                    )}
                    aria-hidden="true"
                  >
                    {selected && <span className="size-1.5 rounded-full bg-ivory" />}
                  </span>
                  <span>
                    <span className="block text-[15px] font-medium text-ink">{method.label}</span>
                    <span className="mt-1 block text-[14px] leading-relaxed text-muted">{method.description}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        {payingOnline && onlinePayment.testMode && (
          <p className="mt-4 border border-dashed border-sand px-4 py-3 text-[13px] leading-relaxed text-muted">
            <span className="font-medium text-ink">Test mode.</span> No real money moves. On the Paystack page, use the
            test card <span className="tabular-nums text-ink">4084 0840 8408 4081</span>, any future expiry date and CVV{" "}
            <span className="tabular-nums text-ink">408</span>.
          </p>
        )}
      </Section>

      <div className="flex flex-col gap-4 border-t border-line pt-8">
        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={submitting}
          loadingText={payingOnline ? "Taking you to secure payment" : "Placing your order"}
          disabled={blocked}
        >
          {payingOnline ? `Pay ${formatPrice(cart.total)} securely` : `Place order · ${formatPrice(cart.total)}`}
        </Button>
        <p className="flex items-start justify-center gap-2 text-center text-[12px] leading-relaxed text-muted">
          <LockIcon size={14} className="mt-0.5 shrink-0" />
          {payingOnline
            ? "You'll complete payment on Paystack's secure page. Your order is confirmed once payment goes through."
            : "Nothing is charged now. You'll pay when your order is delivered."}
        </p>
      </div>
    </form>
  );
}
