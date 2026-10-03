"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <div className="border-b border-line">
      <nav aria-label="Account">
        <ul className="flex gap-8">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className="-mb-px block border-b py-4 text-[12px] uppercase tracking-[0.16em] transition-colors aria-[current=page]:border-ink aria-[current=page]:text-ink border-transparent text-muted hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
