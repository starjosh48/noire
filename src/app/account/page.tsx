import type { Metadata } from "next";
import Link from "next/link";
import { OrderList } from "@/components/account/order-list";
import { ProfileForm } from "@/components/account/profile-form";
import { SignOutLink } from "@/components/account/sign-out-link";
import { ProductCard } from "@/components/product/product-card";
import { ButtonLink } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { getWishlistProducts } from "@/lib/account/queries";
import { getCurrentUser, getProfile } from "@/lib/auth/session";
import { firstName, formatDate, greeting } from "@/lib/format";
import { getOrdersForCurrentUser } from "@/lib/orders/queries";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false },
};

export default async function AccountPage() {
  const [user, profile, orders, wishlist] = await Promise.all([
    getCurrentUser(),
    getProfile(),
    getOrdersForCurrentUser(3).catch(() => null),
    getWishlistProducts(),
  ]);
  const name = firstName(profile?.full_name ?? user?.name);

  return (
    <div className="flex flex-col gap-20 md:gap-28">
      <header>
        <p className="eyebrow text-muted">Your fragrance journey</p>
        <h1 className="display mt-4 text-[48px] md:text-[80px]">
          {greeting()}
          {name ? `, ${name}` : ""}.
        </h1>
        {profile?.created_at && (
          <p className="mt-4 text-[15px] text-muted">Member since {formatDate(profile.created_at, { day: undefined })}</p>
        )}
      </header>

      <section aria-labelledby="recent-orders">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 id="recent-orders" className="display text-[34px] md:text-[44px]">
            Recent orders
          </h2>
          {orders && orders.length > 0 && (
            <Link href="/account/orders" className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] link-underline">
              All orders <ArrowRightIcon size={16} />
            </Link>
          )}
        </div>
        {orders === null ? (
          <p className="border-y border-line py-10 text-[14px] text-danger" role="alert">
            We couldn&rsquo;t load your orders right now. Please refresh the page.
          </p>
        ) : orders.length > 0 ? (
          <OrderList orders={orders} />
        ) : (
          <div className="border-y border-line py-12 text-center">
            <p className="font-serif text-[26px]">No orders yet</p>
            <p className="mt-2 text-[14px] text-muted">When you place an order, you&rsquo;ll be able to follow it here.</p>
            <ButtonLink href="/shop" variant="secondary" className="mt-6">
              Explore fragrances
            </ButtonLink>
          </div>
        )}
      </section>

      <section id="saved" aria-labelledby="saved-fragrances" className="scroll-mt-28">
        <h2 id="saved-fragrances" className="display mb-8 text-[34px] md:text-[44px]">
          Saved fragrances
        </h2>
        {wishlist.length > 0 ? (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
            {wishlist.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="border-y border-line py-12 text-center">
            <p className="font-serif text-[26px]">Nothing saved yet</p>
            <p className="mt-2 text-[14px] text-muted">Tap the heart on any fragrance to keep it here for later.</p>
          </div>
        )}
      </section>

      <section aria-labelledby="profile-details" className="grid gap-10 border-t border-line pt-12 lg:grid-cols-[1fr_2fr]">
        <div>
          <h2 id="profile-details" className="display text-[34px] md:text-[44px]">
            Profile
          </h2>
          <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-muted">
            Your details are used to speed up checkout. We never share them.
          </p>
        </div>
        <div className="max-w-xl">
          <ProfileForm
            email={profile?.email ?? user?.email ?? ""}
            fullName={profile?.full_name ?? user?.name ?? ""}
            phone={profile?.phone ?? ""}
          />
          <p className="mt-12 border-t border-line pt-6 text-[13px] text-muted">
            Signed in as <span className="text-ink">{profile?.email ?? user?.email}</span> · <SignOutLink />
          </p>
        </div>
      </section>
    </div>
  );
}
