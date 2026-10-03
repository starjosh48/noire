import { commerce } from "@/lib/config";

const formatters = new Map<string, Intl.NumberFormat>();

export function formatPrice(amount: number | string, currency: string = commerce.currency) {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat(commerce.locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 0,
    });
    formatters.set(currency, formatter);
  }
  return formatter.format(Number(amount));
}

export function formatDate(value: string | Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: commerce.timeZone,
    ...options,
  }).format(new Date(value));
}

export function productLabel(number: number) {
  return `NOIRÉ ${String(number).padStart(2, "0")}`;
}

export function firstName(fullName: string | null | undefined) {
  return fullName?.trim().split(/\s+/)[0] ?? "";
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Time-of-day greeting in the brand's home time zone. */
export function greeting(date = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: commerce.timeZone }).format(date),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
