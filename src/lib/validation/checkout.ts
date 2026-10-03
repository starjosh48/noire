import { z } from "zod";
import { paymentMethodIds } from "@/lib/payments";

export const nigerianStates = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River",
  "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna",
  "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
] as const;

export const shippingCountries = ["Nigeria"] as const;

const trimmed = (min: number, max: number, message: string) =>
  z.string().trim().min(min, message).max(max, "That's a little too long.");

export const checkoutSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address.").pipe(z.email("Enter a valid email address, like name@example.com.")),
  phone: z
    .string()
    .trim()
    .min(1, "Enter a phone number so the courier can reach you.")
    .regex(/^\+?[0-9][0-9\s()-]{6,18}[0-9]$/, "Enter a valid phone number, like 0803 123 4567."),
  fullName: trimmed(2, 120, "Enter the full name of the person receiving the order."),
  address: trimmed(5, 240, "Enter a delivery address with house number and street."),
  city: trimmed(2, 80, "Enter a city or area."),
  state: z.enum(nigerianStates, { error: "Choose a state." }),
  country: z.enum(shippingCountries, { error: "We currently deliver within Nigeria only." }),
  postalCode: z
    .string()
    .trim()
    .max(12, "That postal code looks too long.")
    .regex(/^[A-Za-z0-9\s-]*$/, "Postal codes can only contain letters, numbers and dashes.")
    .optional()
    .or(z.literal("")),
  deliveryNotes: z.string().trim().max(300, "Keep delivery notes under 300 characters.").optional().or(z.literal("")),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const placeOrderSchema = checkoutSchema.extend({
  idempotencyKey: z.uuid(),
  paymentMethod: z.enum(paymentMethodIds as [string, ...string[]]).transform((v) => v as (typeof paymentMethodIds)[number]),
});
