import Link from "next/link";
import { NewsletterForm } from "@/components/home/newsletter-form";
import { siteConfig } from "@/lib/config";

const columns = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All fragrances" },
      { href: "/shop?sort=newest", label: "New arrivals" },
      { href: "/shop?sort=bestselling", label: "Bestsellers" },
      { href: "/collections", label: "Collections" },
    ],
  },
  {
    title: "Discover",
    links: [
      { href: "/discovery", label: "Find your scent" },
      { href: "/collections#families", label: "Fragrance families" },
      { href: "/about", label: "Our philosophy" },
    ],
  },
  {
    title: "Client care",
    links: [
      { href: "/account", label: "Your account" },
      { href: "/account/orders", label: "Order history" },
      { href: "/care#delivery", label: "Delivery" },
      { href: "/care#returns", label: "Returns" },
      { href: "/care#contact", label: "Contact us" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-paper">
      <div className="shell grid gap-14 py-16 md:py-20 lg:grid-cols-[1.2fr_2fr] lg:gap-20">
        <div className="max-w-md">
          <p className="display text-[34px] md:text-[40px]">Letters from the atelier</p>
          <p className="mt-3 text-[14px] leading-relaxed text-muted">
            New releases, scent rituals and quiet previews, a few times a season.
          </p>
          <NewsletterForm className="mt-6" />
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="eyebrow text-muted">{column.title}</h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="tap-target text-[14px] text-ink link-reveal">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="shell flex flex-col gap-4 border-t border-line py-8 text-[12px] text-muted md:flex-row md:items-center md:justify-between">
        <p className="font-serif text-[20px] tracking-[0.28em] text-ink">NOIRÉ</p>
        <p>
          Questions?{" "}
          <a href={`mailto:${siteConfig.supportEmail}`} className="tap-target text-ink link-underline">
            {siteConfig.supportEmail}
          </a>
        </p>
        <p>
          © {new Date().getFullYear()} NOIRÉ. Made in Lagos. ·{" "}
          <Link href="/care#privacy" className="tap-target link-reveal">
            Privacy
          </Link>{" "}
          ·{" "}
          <Link href="/care#terms" className="tap-target link-reveal">
            Terms
          </Link>
        </p>
      </div>
    </footer>
  );
}
