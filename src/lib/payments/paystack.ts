import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env";

// Paystack API: https://paystack.com/docs/api/transaction
const API = "https://api.paystack.co";

export function paystackConfigured() {
  return serverEnv.paystackSecretKey() !== null;
}

export function paystackTestMode() {
  return serverEnv.paystackSecretKey()?.startsWith("sk_test_") ?? false;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const secret = serverEnv.paystackSecretKey();
  if (!secret) throw new Error("Paystack is not configured");
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json", ...init?.headers },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: T };
  if (!response.ok || !body.status || !body.data) {
    throw new Error(`Paystack ${path} failed (${response.status}): ${body.message ?? "unknown error"}`);
  }
  return body.data;
}

/** Starts a transaction and returns Paystack's hosted payment page. Amount is in kobo. */
export function initializeTransaction(input: {
  email: string;
  amountMinor: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  return call<{ authorization_url: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amountMinor,
      currency: input.currency,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
}

export type PaystackTransaction = {
  status: "success" | "failed" | "abandoned" | "ongoing" | "pending" | "processing" | "queued" | "reversed";
  reference: string;
  amount: number;
  currency: string;
  paid_at: string | null;
  metadata: { order_id?: string } | null;
};

/** Asks Paystack directly for the outcome. Never trust the browser's redirect alone. */
export function verifyTransaction(reference: string) {
  return call<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

/** Webhooks are signed with HMAC-SHA512 of the raw body using the secret key. */
export function isValidWebhookSignature(rawBody: string, signature: string | null) {
  const secret = serverEnv.paystackSecretKey();
  if (!secret || !signature) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
