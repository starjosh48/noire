import type { Metadata } from "next";
import Link from "next/link";
import { CartView } from "@/components/cart/cart-view";
import { ArrowLeftIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <div className="shell pb-24 pt-10 md:pb-32 md:pt-16">
      <Link href="/shop" className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-muted hover:text-ink">
        <ArrowLeftIcon size={16} /> Continue shopping
      </Link>
      <h1 className="display mt-6 text-[48px] md:text-[72px]">Your cart</h1>
      <div className="mt-10 md:mt-14">
        <CartView />
      </div>
    </div>
  );
}
