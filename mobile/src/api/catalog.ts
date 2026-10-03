import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ProductDetail, ProductSummary, SortKey } from "~/shared";
import { apiFetch } from "./client";

export type CatalogQuery = {
  family?: string;
  mood?: string;
  sort?: SortKey;
};

export function useHome() {
  return useQuery({
    queryKey: ["catalog", "home"],
    queryFn: () => apiFetch<{ featured: ProductSummary[]; bestsellers: ProductSummary[] }>("/catalog/home"),
  });
}

export function useProducts(query: CatalogQuery) {
  const params = new URLSearchParams();
  if (query.family) params.set("family", query.family);
  if (query.mood) params.set("mood", query.mood);
  if (query.sort && query.sort !== "featured") params.set("sort", query.sort);
  const search = params.toString();

  return useQuery({
    queryKey: ["catalog", "products", search],
    queryFn: () => apiFetch<{ products: ProductSummary[] }>(`/catalog/products${search ? `?${search}` : ""}`),
    // Keep the current grid on screen while a new filter loads.
    placeholderData: keepPreviousData,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["catalog", "product", slug],
    queryFn: () => apiFetch<{ product: ProductDetail; related: ProductSummary[] }>(`/catalog/products/${encodeURIComponent(slug)}`),
  });
}

export function useSearch(term: string) {
  const q = term.trim();
  return useQuery({
    queryKey: ["catalog", "search", q],
    queryFn: () => apiFetch<{ results: ProductSummary[] }>(`/catalog/search?q=${encodeURIComponent(q)}&limit=24`),
    enabled: q.length >= 2,
    placeholderData: keepPreviousData,
  });
}

/** The scent finder: characters (scent profiles) and moments (moods), as on the website. */
export function useDiscover(scents: string[], moments: string[]) {
  const params = new URLSearchParams();
  if (scents.length) params.set("scent", scents.join(","));
  if (moments.length) params.set("mood", moments.join(","));
  const search = params.toString();
  return useQuery({
    queryKey: ["catalog", "discover", search],
    queryFn: () => apiFetch<{ results: ProductSummary[] }>(`/catalog/discover?${search}`),
    enabled: search.length > 0,
    placeholderData: keepPreviousData,
  });
}
