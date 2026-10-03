import "server-only";
import { loadProfile, type Viewer } from "@/lib/auth/session";
import { nigerianStates, type CheckoutInput } from "@/lib/validation/checkout";
import { getLastDeliveryDetails } from "./queries";

/** Checkout form values: signed-in customers get their latest delivery details, then their profile. */
export async function getCheckoutDefaults(viewer: Viewer): Promise<Partial<CheckoutInput>> {
  const { user } = viewer;
  const [profile, last] = user ? await Promise.all([loadProfile(viewer), getLastDeliveryDetails(viewer)]) : [null, null];
  const state = last?.state && (nigerianStates as readonly string[]).includes(last.state) ? last.state : undefined;
  return {
    email: profile?.email || user?.email || "",
    fullName: last?.customer_name ?? profile?.full_name ?? user?.name ?? "",
    phone: last?.customer_phone ?? profile?.phone ?? "",
    address: last?.shipping_address ?? "",
    city: last?.city ?? "",
    state: state as CheckoutInput["state"] | undefined,
    postalCode: last?.postal_code ?? "",
  };
}
