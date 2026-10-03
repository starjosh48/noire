import type { Metadata } from "next";
import { commerce, siteConfig } from "@/lib/config";
import { formatPrice } from "@/lib/format";

// Served from the edge cache; refreshed in the background at most every 5 minutes.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Client care",
  description: "Delivery, returns, payment and contact information for NOIRÉ.",
  alternates: { canonical: "/care" },
};

const sections = [
  {
    id: "delivery",
    title: "Delivery",
    body: (
      <>
        <p>
          We deliver across Nigeria. Orders placed before 2pm on a business day are dispatched the same day; later
          orders leave the next business day.
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          <li>Lagos: 1–2 business days</li>
          <li>Rest of Nigeria: 3–5 business days</li>
          <li>
            Delivery costs {formatPrice(commerce.shippingFee)}, and is free on orders over{" "}
            {formatPrice(commerce.freeShippingThreshold)}.
          </li>
        </ul>
        <p className="mt-4">Our courier will call the number you provide before delivering.</p>
      </>
    ),
  },
  {
    id: "payment",
    title: "Payment",
    body: (
      <p>
        You pay when your order arrives, by card, bank transfer or cash. Nothing is charged when you place an order,
        and you&rsquo;ll receive a receipt from the courier on payment.
      </p>
    ),
  },
  {
    id: "returns",
    title: "Returns",
    body: (
      <p>
        Unopened fragrances in their original packaging can be returned within {commerce.returnWindowDays} days of
        delivery for a full refund. For hygiene reasons we can&rsquo;t accept opened bottles, unless they arrived
        damaged, in which case we will replace them at no cost. Email us with your order number to arrange a collection.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <>
        <p>Our client care team replies within one business day, Monday to Saturday.</p>
        <p className="mt-4">
          Email:{" "}
          <a href={`mailto:${siteConfig.supportEmail}`} className="text-ink link-underline">
            {siteConfig.supportEmail}
          </a>
          {siteConfig.supportPhone && (
            <>
              <br />
              Phone:{" "}
              <a href={`tel:${siteConfig.supportPhone.replace(/\s/g, "")}`} className="text-ink link-underline">
                {siteConfig.supportPhone}
              </a>
            </>
          )}
        </p>
      </>
    ),
  },
  {
    id: "privacy",
    title: "Privacy",
    body: (
      <p>
        We use your details only to fulfil your orders, provide your account and, if you subscribe, send our
        newsletter. We never sell your data. Sign-in is handled securely by our authentication provider, and you can
        ask us to delete your account and order history at any time by emailing client care.
      </p>
    ),
  },
  {
    id: "terms",
    title: "Terms of sale",
    body: (
      <p>
        Prices are shown in Nigerian naira and include VAT. An order is accepted when you receive our confirmation
        email, and stock is reserved for you from that moment. Payment is due on delivery; if you decline a delivery,
        the order is cancelled at no cost.
      </p>
    ),
  },
];

export default function CarePage() {
  return (
    <div className="shell pb-24 pt-10 md:pb-32 md:pt-16">
      <div className="grid gap-12 lg:grid-cols-12">
        <header className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <p className="eyebrow text-muted">Client care</p>
            <h1 className="display mt-3 text-[52px] md:text-[72px]">How can we help?</h1>
            <nav aria-label="Client care topics" className="mt-8">
              <ul className="flex flex-wrap gap-x-6 gap-y-2 lg:flex-col">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-[14px] text-ink link-reveal">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>
        <div className="divide-y divide-line border-y border-line lg:col-span-7 lg:col-start-6">
          {sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="scroll-mt-28 py-10">
              <h2 id={`${s.id}-title`} className="display text-[34px]">
                {s.title}
              </h2>
              <div className="mt-4 text-[15px] leading-relaxed text-ink-soft">{s.body}</div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
