// The app's only door into the website's code (../src). Everything exported here must be pure:
// no server code, no Next.js, no secrets, no packages the app doesn't have. Types are free (they
// vanish at build time); add runtime exports deliberately.

export type { ProductDetail, ProductSummary, ProductVariant, QuickVariant } from "@/lib/catalog/types";
export type { Cart, CartLine } from "@/lib/cart/types";

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
export { commerce } from "@/lib/config";
export { formatPrice as formatPriceIntl, pluralize, productLabel } from "@/lib/format";
export { artwork } from "@/lib/images";
