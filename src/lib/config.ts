export const siteConfig = {
  name: "NOIRÉ",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  tagline: "Find the scent that feels like you.",
  description:
    "NOIRÉ is a modern fragrance house. Discover twelve considered eaux de parfum, curated for every mood, moment and memory.",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "care@noire.ng",
  /** Shown on the care page only when set. */
  supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() || null,
} as const;

export const commerce = {
  currency: "NGN",
  locale: "en-NG",
  timeZone: "Africa/Lagos",
  /** Flat delivery fee within Nigeria, in naira. */
  shippingFee: 5000,
  /** Orders at or above this subtotal ship free. */
  freeShippingThreshold: 150000,
  maxQuantityPerLine: 10,
  /** Variants at or below this stock level show an "only N left" message. */
  lowStockThreshold: 5,
  returnWindowDays: 14,
} as const;

export function deliveryEstimate(state: string | null | undefined) {
  return state?.toLowerCase() === "lagos" ? "1–2 business days" : "3–5 business days";
}
