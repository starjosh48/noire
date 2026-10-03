import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="shell flex min-h-[70dvh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow text-muted">404</p>
      <h1 className="display mt-5 max-w-3xl text-[52px] md:text-[88px]">This page has evaporated.</h1>
      <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
        Like the top notes of a fragrance, the page you were looking for is gone. The rest of NOIRÉ is right where you
        left it.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/shop">Explore fragrances</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Return home
        </ButtonLink>
      </div>
    </div>
  );
}
