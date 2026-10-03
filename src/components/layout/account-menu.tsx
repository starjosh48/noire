"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useSession } from "@/components/session/session-provider";
import { LogOutIcon, UserIcon } from "@/components/ui/icons";
import { signOut } from "@/lib/account/actions";
import { firstName } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Signs out, then reloads so every part of the page forgets the session. */
export async function signOutAndReload() {
  try {
    await signOut();
  } finally {
    window.location.assign(new URL("/", window.location.origin).toString());
  }
}

const iconButton =
  "relative flex size-10 items-center justify-center text-ink transition-opacity duration-200 hover:opacity-60";

export function AccountMenu() {
  const pathname = usePathname();
  const { user, ready } = useSession();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!ready || !user) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className={cn(iconButton, "hidden sm:flex", !ready && "opacity-60")}
        aria-label="Sign in"
      >
        <UserIcon size={21} />
      </Link>
    );
  }

  const name = firstName(user.name);

  return (
    <div ref={rootRef} className="relative hidden sm:block">
      <button
        type="button"
        className={iconButton}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Account menu${name ? `, ${name}` : ""}`}
      >
        <span className="flex size-[26px] items-center justify-center rounded-full bg-ink text-[11px] font-medium uppercase text-ivory transition-transform duration-300 hover:scale-105">
          {(user.name || user.email || "N").charAt(0)}
        </span>
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right border border-line bg-paper shadow-[0_24px_48px_-24px_rgba(0,0,0,0.35)] animate-pop-in"
      >
        <div className="border-b border-line px-5 py-4">
          <p className="font-serif text-[20px] leading-tight text-ink">{name ? `Hello, ${name}` : "Your account"}</p>
          <p className="mt-0.5 truncate text-[12px] text-muted">{user.email}</p>
        </div>
        <ul className="py-2 text-[14px]">
          {[
            { href: "/account", label: "Your account" },
            { href: "/account/orders", label: "Order history" },
            { href: "/account#saved", label: "Saved fragrances" },
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="block px-5 py-2.5 text-ink transition-colors hover:bg-stone"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="border-t border-line p-2">
          <button
            type="button"
            onClick={() => {
              setSigningOut(true);
              signOutAndReload();
            }}
            disabled={signingOut}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-[14px] text-muted transition-colors hover:bg-stone hover:text-ink disabled:opacity-50"
          >
            <LogOutIcon size={17} />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}
