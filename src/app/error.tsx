"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="shell flex min-h-[60dvh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow text-muted">Something went wrong</p>
      <h1 className="display mt-5 max-w-2xl text-[44px] md:text-[64px]">We couldn&rsquo;t load this page.</h1>
      <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
        This is usually temporary. Please try again. If you were placing an order, check your email or account before
        retrying.
      </p>
      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className="text-[12px] uppercase tracking-[0.16em] link-underline">
          Return home
        </Link>
      </div>
      {error.digest && <p className="mt-10 text-[12px] text-faint">Reference: {error.digest}</p>}
    </div>
  );
}
