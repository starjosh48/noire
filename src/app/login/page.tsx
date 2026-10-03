import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmailSignIn } from "@/components/auth/email-sign-in";
import { GoogleButton } from "@/components/auth/google-button";
import { AlertIcon } from "@/components/ui/icons";
import { getAuthProviders } from "@/lib/auth/providers";
import { getCurrentUser } from "@/lib/auth/session";
import { safeRedirectPath } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to NOIRÉ to save fragrances, track orders and check out faster.",
  robots: { index: false },
};

const errors: Record<string, string> = {
  oauth: "Google sign-in was cancelled or couldn't be completed. Please try again.",
  link: "That sign-in link has expired or was already used. Request a new one below. Links work in the browser you requested them from.",
  session: "Your session has expired. Please sign in again.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeRedirectPath(typeof params.next === "string" ? params.next : null, "/account");
  const errorKey = typeof params.error === "string" ? params.error : null;

  const [user, providers] = await Promise.all([getCurrentUser(), getAuthProviders()]);
  if (user) redirect(next);

  const fromCheckout = next.startsWith("/checkout");

  return (
    <div className="grid min-h-[calc(100dvh-108px)] lg:grid-cols-2">
      <div className="relative hidden bg-stone lg:block">
        <Image
          src="/images/moods/quiet-luxury.webp"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
      </div>

      <div className="flex items-center justify-center px-5 py-16 md:px-10">
        <div className="w-full max-w-[420px]">
          <p className="eyebrow text-muted">{fromCheckout ? "Checkout" : "Your account"}</p>
          <h1 className="display mt-4 text-[48px] md:text-[60px]">Welcome to NOIRÉ</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            Sign in to save your fragrances, track orders, and enjoy a faster checkout.
          </p>

          {errorKey && errors[errorKey] && (
            <p className="mt-6 flex items-start gap-2 border border-danger/25 bg-danger-soft px-4 py-3 text-[14px] text-danger" role="alert">
              <AlertIcon size={18} className="mt-0.5 shrink-0" />
              {errors[errorKey]}
            </p>
          )}

          <div className="mt-8">
            <GoogleButton next={next} enabled={providers.google} direct={providers.googleDirect} />
          </div>

          <div className="my-7 flex items-center gap-4 text-[12px] uppercase tracking-[0.16em] text-faint" aria-hidden="true">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>

          <EmailSignIn next={next} />

          <div className="mt-10 border-t border-line pt-6 text-[13px] leading-relaxed text-muted">
            <p>New to NOIRÉ? Your account is created the first time you sign in.</p>
            {fromCheckout ? (
              <p className="mt-3">
                Prefer not to sign in?{" "}
                <Link href="/checkout" className="text-ink link-underline">
                  Continue as a guest
                </Link>
              </p>
            ) : (
              <p className="mt-3">
                <Link href="/shop" className="text-ink link-underline">
                  Continue browsing
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
