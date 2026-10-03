import Link from "next/link";
import { families } from "@/lib/catalog/taxonomy";

/** The six fragrance families, each with its colour swatch, linking to the filtered catalog. */
export function FamilyIndex({ counts }: { counts?: Record<string, number> }) {
  return (
    <ul className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
      {families.map((family) => (
        <li key={family.slug} className="bg-ivory">
          <Link
            href={`/shop?family=${family.slug}`}
            className="group flex h-full flex-col gap-6 p-6 transition-colors duration-500 hover:bg-paper md:p-8"
          >
            <div className="flex items-center justify-between">
              <span
                className="block h-12 w-12 rounded-full transition-[scale] duration-700 ease-out-soft group-hover:scale-110"
                style={{ background: `radial-gradient(circle at 35% 30%, ${family.swatch}66, ${family.swatch})` }}
                aria-hidden="true"
              />
              {counts?.[family.slug] !== undefined && (
                <span className="text-[12px] text-muted">
                  {counts[family.slug]} {counts[family.slug] === 1 ? "fragrance" : "fragrances"}
                </span>
              )}
            </div>
            <div>
              <h3 className="display text-[32px] md:text-[38px]">{family.label}</h3>
              <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-muted">{family.description}</p>
            </div>
            <span className="mt-auto text-[12px] uppercase tracking-[0.16em] text-ink link-reveal self-start">
              Explore {family.label.toLowerCase()}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
