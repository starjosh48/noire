import { router } from "expo-router";
import { useEffect } from "react";
import { LoadingState } from "~/components/states";

/**
 * Paystack's return link (noire://payment-return?status=…). The checkout screen reads the
 * outcome from the in-app browser; on Android the link can also open this route, which simply
 * steps back to checkout.
 */
export default function PaymentReturnScreen() {
  useEffect(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/cart");
  }, []);
  return <LoadingState />;
}
