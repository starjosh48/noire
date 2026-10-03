import { artwork, formatPriceIntl } from "~/shared";
import { API_URL } from "~/api/client";

export { pluralize, productLabel } from "~/shared";

/**
 * The website's price format (₦54,000). Some Android Intl builds reject parts of it, so fall
 * back to the same output built by hand rather than crash a screen over a price.
 */
export function formatPrice(amount: number | string, currency?: string) {
  try {
    return formatPriceIntl(amount, currency);
  } catch {
    const whole = Math.round(Number(amount)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `₦${whole}`;
  }
}

/** Catalog images are site paths (/images/...svg); the app loads the site's pre-rendered WebP. */
export function imageUrl(path: string) {
  return /^https?:\/\//.test(path) ? path : `${API_URL}${artwork(path)}`;
}
