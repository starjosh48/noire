"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { useSession } from "@/components/session/session-provider";
import { Drawer } from "@/components/ui/drawer";
import { ArrowRightIcon, CartIcon, LogOutIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { AccountMenu, signOutAndReload } from "./account-menu";
import { isActivePath, primaryNav } from "./nav-links";
import { SearchPanel } from "./search-panel";
import { ThemeToggle } from "./theme-toggle";

const iconButton =
  "relative flex size-10 items-center justify-center text-ink transition-opacity duration-200 hover:opacity-60";

export function SiteHeader() {
  const pathname = usePathname();
  const { cart, openCart } = useCart();
  const { user } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const accountHref = user ? "/account" : `/login?next=${encodeURIComponent(pathname)}`;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b bg-ivory/95 backdrop-blur-sm transition-[border-color] duration-300 supports-[backdrop-filter]:bg-ivory/85",
          scrolled ? "border-line" : "border-transparent",
        )}
      >
        <div className="shell grid h-16 grid-cols-[1fr_auto_1fr] items-center md:h-[72px]">
          {/* Left: menu (mobile) / wordmark (desktop) */}
          <div className="flex items-center">
            <button
              type="button"
              className={cn(iconButton, "-ml-2 lg:hidden")}
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-haspopup="dialog"
            >
              <MenuIcon size={22} />
            </button>
            <Link
              href="/"
              aria-label="NOIRÉ, home"
              className="hidden font-serif text-[30px] leading-none tracking-[0.28em] text-ink lg:inline"
            >
              NOIRÉ
            </Link>
          </div>

          {/* Centre: wordmark (mobile) / primary navigation (desktop) */}
          <div className="flex justify-center">
            <Link
              href="/"
              aria-label="NOIRÉ, home"
              className="px-2 font-serif text-[26px] leading-none tracking-[0.28em] text-ink md:text-[30px] lg:hidden"
            >
              <span className="mr-[-0.28em]">NOIRÉ</span>
            </Link>
            <nav aria-label="Primary" className="hidden lg:block">
              <ul className="flex items-center gap-10">
                {primaryNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
                      className="text-[12px] uppercase tracking-[0.16em] text-ink link-reveal"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Right: search, account, cart */}
          <div className="flex items-center justify-end gap-0.5 md:gap-2">
            <button
              type="button"
              className={iconButton}
              onClick={() => setSearchOpen(true)}
              aria-label="Search fragrances"
              aria-haspopup="dialog"
            >
              <SearchIcon size={21} />
            </button>
            <ThemeToggle className="hidden size-10 justify-center sm:flex" />
            <AccountMenu />
            <button
              type="button"
              className={cn(iconButton, "-mr-2")}
              onClick={openCart}
              aria-label={`Cart, ${cart.itemCount} ${cart.itemCount === 1 ? "item" : "items"}`}
              aria-haspopup="dialog"
            >
              <CartIcon size={21} />
              {cart.itemCount > 0 && (
                <span
                  key={cart.itemCount}
                  className="absolute right-0.5 top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-ink px-1 text-[10px] font-medium tabular-nums text-ivory animate-pop"
                  aria-hidden="true"
                >
                  {cart.itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" side="left">
        <nav aria-label="Mobile" className="flex h-full flex-col px-6 py-8">
          <ul className="flex flex-col gap-1">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
                  className="group flex items-center justify-between py-3 font-serif text-[40px] leading-none text-ink aria-[current=page]:italic"
                >
                  {item.label}
                  <ArrowRightIcon size={20} className="opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-col gap-4 border-t border-line pt-6 text-[14px]">
            <Link href={accountHref} onClick={() => setMenuOpen(false)} className="flex items-center gap-3">
              <UserIcon size={20} />
              {user ? "Your account" : "Sign in or create an account"}
            </Link>
            {user && (
              <Link href="/account/orders" onClick={() => setMenuOpen(false)} className="pl-8 text-muted">
                Order history
              </Link>
            )}
            <Link href="/care" onClick={() => setMenuOpen(false)} className="pl-8 text-muted">
              Delivery, returns &amp; help
            </Link>
            <ThemeToggle withLabel className="[&>span:first-child]:size-5" />
            {user && (
              <button
                type="button"
                onClick={() => signOutAndReload()}
                className="flex items-center gap-3 text-left text-muted transition-colors hover:text-ink"
              >
                <LogOutIcon size={20} />
                Sign out
              </button>
            )}
          </div>
        </nav>
      </Drawer>

      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
