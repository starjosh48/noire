"use client";

import { usePathname, useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { ChevronDownIcon, CloseIcon, SearchIcon, SlidersIcon } from "@/components/ui/icons";
import {
  activeFilterCount,
  emptyFilters,
  filtersToSearchParams,
  type CatalogFilters,
} from "@/lib/catalog/filters";
import {
  families,
  familyLabel,
  genderLabel,
  moodBySlug,
  priceRanges,
  scentProfiles,
  sortOptions,
  type SortKey,
} from "@/lib/catalog/taxonomy";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FilterPanel } from "./filter-panel";

type CatalogShellProps = {
  filters: CatalogFilters;
  total: number;
  heading: { eyebrow: string; title: string; description?: string };
  children: ReactNode;
};

export function CatalogShell({ filters: committed, total, heading, children }: CatalogShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  // Reflect the new selection instantly while the server renders the matching products.
  const [filters, setOptimisticFilters] = useOptimistic(committed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const activeCount = activeFilterCount(filters);

  const navigate = (next: CatalogFilters) => {
    const qs = filtersToSearchParams(next).toString();
    startTransition(() => {
      setOptimisticFilters(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  const chips = [
    ...filters.family.map((v) => ({ label: familyLabel(v), remove: () => navigate({ ...filters, family: filters.family.filter((x) => x !== v) }) })),
    ...filters.scent.map((v) => ({
      label: scentProfiles.find((s) => s.slug === v)?.label ?? v,
      remove: () => navigate({ ...filters, scent: filters.scent.filter((x) => x !== v) }),
    })),
    ...filters.mood.map((v) => ({ label: moodBySlug(v)?.label ?? v, remove: () => navigate({ ...filters, mood: filters.mood.filter((x) => x !== v) }) })),
    ...filters.size.map((v) => ({ label: `${v} ml`, remove: () => navigate({ ...filters, size: filters.size.filter((x) => x !== v) }) })),
    ...(filters.price
      ? [{ label: priceRanges.find((r) => r.slug === filters.price)?.label ?? "", remove: () => navigate({ ...filters, price: null }) }]
      : []),
    ...filters.gender.map((v) => ({ label: genderLabel(v), remove: () => navigate({ ...filters, gender: filters.gender.filter((x) => x !== v) }) })),
    ...(filters.inStock ? [{ label: "In stock", remove: () => navigate({ ...filters, inStock: false }) }] : []),
  ];

  return (
    <div className="shell pt-10 md:pt-16">
      <header className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow text-muted">{heading.eyebrow}</p>
          <h1 className="display mt-3 text-[48px] md:text-[80px]">{heading.title}</h1>
          {heading.description && <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted">{heading.description}</p>}
        </div>
        <form
          role="search"
          className="flex w-full items-center gap-2 border-b border-line pb-2 transition-colors focus-within:border-ink md:w-72"
          onSubmit={(event) => {
            event.preventDefault();
            if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
          }}
        >
          <SearchIcon size={18} className="shrink-0 text-muted" />
          <label htmlFor="shop-search" className="sr-only">
            Search fragrances
          </label>
          <input
            id="shop-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes, names, moods"
            className="h-9 w-full bg-transparent text-[14px] placeholder:text-faint focus:outline-none"
          />
        </form>
      </header>

      {/* Toolbar */}
      <div className="sticky top-16 z-20 -mx-5 mt-10 border-y border-line bg-ivory/95 px-5 backdrop-blur-sm md:top-[72px] md:-mx-8 md:px-8 xl:-mx-14 xl:px-14">
        <div className="flex h-14 items-center gap-4">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-ink"
            aria-haspopup="dialog"
          >
            <SlidersIcon size={18} />
            Filter
            {activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1.5 text-[10px] tabular-nums text-ivory">
                {activeCount}
              </span>
            )}
          </button>

          <div className="hidden items-center gap-1 border-l border-line pl-4 lg:flex" role="group" aria-label="Quick family filter">
            {families.map((f) => {
              const active = filters.family.length === 1 && filters.family[0] === f.slug;
              return (
                <button
                  key={f.slug}
                  type="button"
                  aria-pressed={active}
                  onClick={() => navigate({ ...filters, family: active ? [] : [f.slug] })}
                  className={cn(
                    "px-3 py-1.5 text-[13px] transition-colors",
                    active ? "bg-ink text-ivory" : "text-muted hover:text-ink",
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <p className="ml-auto hidden text-[13px] text-muted sm:block" aria-live="polite">
            {pluralize(total, "fragrance")}
          </p>

          <div className="relative ml-auto sm:ml-4">
            <label htmlFor="shop-sort" className="sr-only">
              Sort by
            </label>
            <select
              id="shop-sort"
              value={filters.sort}
              onChange={(e) => navigate({ ...filters, sort: e.target.value as SortKey })}
              className="h-10 appearance-none bg-transparent pr-7 text-right text-[13px] text-ink focus:outline-none"
            >
              {sortOptions.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.slug === "featured" ? "Sort: Featured" : o.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon size={15} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-muted" />
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={chip.remove}
              className="inline-flex items-center gap-1.5 border border-line bg-paper py-1.5 pl-3 pr-2 text-[12px] text-ink transition-colors hover:border-ink"
              aria-label={`Remove filter: ${chip.label}`}
            >
              {chip.label}
              <CloseIcon size={13} />
            </button>
          ))}
          <button
            type="button"
            onClick={() => navigate({ ...emptyFilters, sort: filters.sort })}
            className="ml-1 text-[12px] uppercase tracking-[0.14em] text-muted link-reveal hover:text-ink"
          >
            Clear all
          </button>
        </div>
      )}

      <p className="mt-6 text-[13px] text-muted sm:hidden" aria-live="polite">
        {pluralize(total, "fragrance")}
      </p>

      <div
        className={cn("mt-8 transition-opacity duration-300 md:mt-10", isPending && "pointer-events-none opacity-40")}
        aria-busy={isPending || undefined}
      >
        {children}
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={activeCount ? `Filter · ${activeCount} selected` : "Filter"}
        side="left"
        footer={
          <div className="flex gap-3 px-5 py-4 md:px-7">
            <Button
              variant="secondary"
              className="flex-1"
              disabled={activeCount === 0}
              onClick={() => navigate({ ...emptyFilters, sort: filters.sort })}
            >
              Clear
            </Button>
            <Button className="flex-[2]" loading={isPending} loadingText="Updating results" onClick={() => setDrawerOpen(false)}>
              Show {pluralize(total, "result")}
            </Button>
          </div>
        }
      >
        <div className="px-5 md:px-7">
          <FilterPanel filters={filters} onChange={navigate} />
        </div>
      </Drawer>
    </div>
  );
}
