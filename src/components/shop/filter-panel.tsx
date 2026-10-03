"use client";

import type { CatalogFilters } from "@/lib/catalog/filters";
import { families, genders, moods, priceRanges, scentProfiles, sizes } from "@/lib/catalog/taxonomy";
import { CheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

type ListKey = "family" | "gender" | "mood" | "scent";

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-line py-6 first:pt-2">
      <legend className="eyebrow mb-4 text-ink">{title}</legend>
      {children}
    </fieldset>
  );
}

function CheckOption({
  checked,
  onChange,
  label,
  type = "checkbox",
  name,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  type?: "checkbox" | "radio";
  name?: string;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-3 py-1.5 text-[14px] text-ink">
      <input type={type} name={name} checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        className={cn(
          "flex size-[18px] shrink-0 items-center justify-center border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink",
          type === "radio" && "rounded-full",
          checked ? "border-ink bg-ink text-ivory" : "border-sand bg-paper group-hover:border-muted",
        )}
        aria-hidden="true"
      >
        {checked &&
          (type === "radio" ? <span className="size-1.5 rounded-full bg-ivory" /> : <CheckIcon size={12} strokeWidth={2} />)}
      </span>
      {label}
    </label>
  );
}

export function FilterPanel({
  filters,
  onChange,
}: {
  filters: CatalogFilters;
  onChange: (next: CatalogFilters) => void;
}) {
  const toggle = (key: ListKey, value: string) => {
    const list = filters[key];
    onChange({ ...filters, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] });
  };

  return (
    <div>
      <Group title="Fragrance family">
        {families.map((f) => (
          <CheckOption key={f.slug} label={f.label} checked={filters.family.includes(f.slug)} onChange={() => toggle("family", f.slug)} />
        ))}
      </Group>

      <Group title="Character">
        <div className="grid grid-cols-2 gap-x-4">
          {scentProfiles.map((s) => (
            <CheckOption key={s.slug} label={s.label} checked={filters.scent.includes(s.slug)} onChange={() => toggle("scent", s.slug)} />
          ))}
        </div>
      </Group>

      <Group title="Mood">
        {moods.map((m) => (
          <CheckOption key={m.slug} label={m.label} checked={filters.mood.includes(m.slug)} onChange={() => toggle("mood", m.slug)} />
        ))}
      </Group>

      <Group title="Size">
        <div className="flex gap-2">
          {sizes.map((size) => {
            const active = filters.size.includes(size);
            return (
              <button
                key={size}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  onChange({
                    ...filters,
                    size: active ? filters.size.filter((s) => s !== size) : [...filters.size, size],
                  })
                }
                className={cn(
                  "h-11 flex-1 border text-[13px] transition-colors",
                  active ? "border-ink bg-ink text-ivory" : "border-line bg-paper text-ink hover:border-ink",
                )}
              >
                {size} ml
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Price">
        <CheckOption
          type="radio"
          name="price"
          label="Any price"
          checked={!filters.price}
          onChange={() => onChange({ ...filters, price: null })}
        />
        {priceRanges.map((r) => (
          <CheckOption
            key={r.slug}
            type="radio"
            name="price"
            label={r.label}
            checked={filters.price === r.slug}
            onChange={() => onChange({ ...filters, price: r.slug })}
          />
        ))}
      </Group>

      <Group title="Wears as">
        {genders.map((g) => (
          <CheckOption key={g.slug} label={g.label} checked={filters.gender.includes(g.slug)} onChange={() => toggle("gender", g.slug)} />
        ))}
      </Group>

      <Group title="Availability">
        <CheckOption
          label="In stock only"
          checked={filters.inStock}
          onChange={() => onChange({ ...filters, inStock: !filters.inStock })}
        />
      </Group>
    </div>
  );
}
