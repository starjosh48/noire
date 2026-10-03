// The app's only door into the website's code (../src). Everything exported here must be pure:
// no server code, no Next.js, no secrets, no packages the app doesn't have. Types are free (they
// vanish at build time); add runtime exports deliberately.

export type { ProductDetail, ProductSummary, ProductVariant, QuickVariant } from "@/lib/catalog/types";
export type { Cart, CartActionResult, CartLine } from "@/lib/cart/types";
export type { PaymentMethod, PaymentMethodId } from "@/lib/payments";

export {
  families,
  familyLabel,
  familyLine,
  moodBySlug,
  moods,
  scentProfiles,
  sortOptions,
  type SortKey,
} from "@/lib/catalog/taxonomy";
export { calculateTotals, emptyCart } from "@/lib/cart/pricing";
export { commerce, deliveryEstimate, siteConfig } from "@/lib/config";
export { formatDate, formatPrice as formatPriceIntl, pluralize, productLabel, firstName } from "@/lib/format";
export { artwork } from "@/lib/images";
// Checkout validation is the website's own schema, so the app checks exactly what the server checks.
export { checkoutSchema, nigerianStates, shippingCountries, type CheckoutInput } from "@/lib/validation/checkout";
export { orderStatusLabel, orderTimeline } from "@/lib/orders/status";
export { paymentMethodLabel } from "@/lib/payments";
export { greeting } from "@/lib/format";
export type { Database } from "@/types/database";
