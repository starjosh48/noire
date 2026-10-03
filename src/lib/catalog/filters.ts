import { families, genders, moods, priceRanges, scentProfiles, sizes, sortOptions, type SortKey } from "./taxonomy";

// Catalog filters live in the URL (shareable, back-button friendly):
//   /shop?family=woody,amber&size=50&price=under-60000&gender=unisex&mood=after-dark&scent=warm&availability=in-stock&sort=price-asc

export type CatalogFilters = {
  family: string[];
  size: number[];
  price: string | null;
  gender: string[];
  mood: string[];
  scent: string[];
  inStock: boolean;
  sort: SortKey;
};

export type SearchParamsInput = URLSearchParams | Record<string, string | string[] | undefined>;

function read(params: SearchParamsInput, key: string): string[] {
  const raw = params instanceof URLSearchParams ? params.getAll(key) : [params[key]].flat();
  return raw
    .filter((v): v is string => typeof v === "string")
    .flatMap((v) => v.split(","))
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

const allowed = <T extends { slug: string }>(list: readonly T[], values: string[]) =>
  values.filter((v, i) => list.some((item) => item.slug === v) && values.indexOf(v) === i);

export function parseFilters(params: SearchParamsInput): CatalogFilters {
  const sort = read(params, "sort")[0];
  const price = read(params, "price")[0];
  return {
    family: allowed(families, read(params, "family")),
    size: read(params, "size")
      .map(Number)
      .filter((n, i, arr) => (sizes as readonly number[]).includes(n) && arr.indexOf(n) === i),
    price: priceRanges.some((r) => r.slug === price) ? price : null,
    gender: allowed(genders, read(params, "gender")),
    mood: allowed(moods, read(params, "mood")),
    scent: allowed(scentProfiles, read(params, "scent")),
    inStock: read(params, "availability")[0] === "in-stock",
    sort: (sortOptions.some((o) => o.slug === sort) ? sort : "featured") as SortKey,
  };
}

export function filtersToSearchParams(filters: CatalogFilters) {
  const params = new URLSearchParams();
  if (filters.family.length) params.set("family", filters.family.join(","));
  if (filters.size.length) params.set("size", filters.size.join(","));
  if (filters.price) params.set("price", filters.price);
  if (filters.gender.length) params.set("gender", filters.gender.join(","));
  if (filters.mood.length) params.set("mood", filters.mood.join(","));
  if (filters.scent.length) params.set("scent", filters.scent.join(","));
  if (filters.inStock) params.set("availability", "in-stock");
  if (filters.sort !== "featured") params.set("sort", filters.sort);
  return params;
}

export function activeFilterCount(filters: CatalogFilters) {
  return (
    filters.family.length +
    filters.size.length +
    (filters.price ? 1 : 0) +
    filters.gender.length +
    filters.mood.length +
    filters.scent.length +
    (filters.inStock ? 1 : 0)
  );
}

export const emptyFilters: CatalogFilters = {
  family: [],
  size: [],
  price: null,
  gender: [],
  mood: [],
  scent: [],
  inStock: false,
  sort: "featured",
};
