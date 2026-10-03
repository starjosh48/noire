import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import type { CatalogFilters } from "./filters";
import { priceRanges } from "./taxonomy";
import {
  PRODUCT_DETAIL_COLUMNS,
  PRODUCT_SUMMARY_COLUMNS,
  type ProductDetail,
  type ProductSummary,
  type ProductVariant,
} from "./types";

export class CatalogError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "CatalogError";
  }
}

function fail(context: string, cause: unknown): never {
  console.error(`[catalog] ${context}`, cause);
  throw new CatalogError("We couldn't load the collection right now.", { cause });
}

/** Catalog listing with filters and sorting applied in the database. */
export async function getProducts(filters: CatalogFilters): Promise<ProductSummary[]> {
  const supabase = createPublicClient();
  const range = filters.price ? priceRanges.find((r) => r.slug === filters.price) : undefined;
  const filterOnVariants = filters.size.length > 0 || range !== undefined;

  // When filtering by size or price, inner-join the variants so a product matches only if
  // one of its sizes satisfies every variant condition at once.
  const columns = filterOnVariants
    ? `${PRODUCT_SUMMARY_COLUMNS}, matching_variants:noire_product_variants!inner(size_ml, price, stock_quantity)`
    : PRODUCT_SUMMARY_COLUMNS;

  let query = supabase.from("noire_products").select(columns).eq("is_active", true);

  if (filters.family.length) query = query.in("fragrance_family", filters.family);
  if (filters.gender.length) query = query.in("gender", filters.gender as ("unisex" | "feminine" | "masculine")[]);
  if (filters.mood.length) query = query.overlaps("moods", filters.mood);
  if (filters.scent.length) query = query.overlaps("scent_profiles", filters.scent);
  if (filters.size.length) query = query.in("matching_variants.size_ml", filters.size);
  if (range) {
    query = query.gte("matching_variants.price", range.min);
    if (range.max !== null) query = query.lte("matching_variants.price", range.max);
  }
  if (filters.inStock) {
    query = filterOnVariants ? query.gt("matching_variants.stock_quantity", 0) : query.gt("stock_quantity", 0);
  }

  switch (filters.sort) {
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "price-asc":
      query = query.order("price", { ascending: true }).order("sort_order");
      break;
    case "price-desc":
      query = query.order("price", { ascending: false }).order("sort_order");
      break;
    case "bestselling":
      query = query.order("sales_count", { ascending: false });
      break;
    default:
      query = query.order("featured", { ascending: false }).order("sort_order");
  }

  const { data, error } = await query;
  if (error) fail("getProducts", error);
  return ((data ?? []) as unknown as ProductSummary[]).map(toSummary);
}

/** Narrow any product-shaped row to the fields a product card needs. */
export function toSummary(p: ProductSummary): ProductSummary {
  return {
    id: p.id,
    number: p.number,
    name: p.name,
    slug: p.slug,
    short_description: p.short_description,
    price: p.price,
    currency: p.currency,
    fragrance_family: p.fragrance_family,
    secondary_family: p.secondary_family,
    image_url: p.image_url,
    gallery_images: p.gallery_images,
    stock_quantity: p.stock_quantity,
    featured: p.featured,
    bestseller: p.bestseller,
    new_arrival: p.new_arrival,
    variants: [...(p.variants ?? [])].sort((a, b) => a.size_ml - b.size_ml),
  };
}

export async function getFeaturedProducts(limit = 6): Promise<ProductSummary[]> {
  const { data, error } = await createPublicClient()
    .from("noire_products")
    .select(PRODUCT_SUMMARY_COLUMNS)
    .eq("is_active", true)
    .eq("featured", true)
    .order("sort_order")
    .limit(limit);
  if (error) fail("getFeaturedProducts", error);
  return (data ?? []).map(toSummary);
}

export async function getBestsellers(limit = 4): Promise<ProductSummary[]> {
  const { data, error } = await createPublicClient()
    .from("noire_products")
    .select(PRODUCT_SUMMARY_COLUMNS)
    .eq("is_active", true)
    .order("bestseller", { ascending: false })
    .order("sales_count", { ascending: false })
    .limit(limit);
  if (error) fail("getBestsellers", error);
  return (data ?? []).map(toSummary);
}

export const getProductBySlug = cache(async (slug: string): Promise<ProductDetail | null> => {
  const { data, error } = await createPublicClient()
    .from("noire_products")
    .select(`${PRODUCT_DETAIL_COLUMNS}, variants:noire_product_variants(id, size_ml, price, stock_quantity, sku)`)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) fail("getProductBySlug", error);
  if (!data) return null;
  const variants = [...((data.variants ?? []) as ProductVariant[])].sort((a, b) => a.size_ml - b.size_ml);
  return { ...data, variants };
});

/** Fragrances that share a family or a mood, best matches first. */
export async function getRelatedProducts(product: ProductDetail, limit = 4): Promise<ProductSummary[]> {
  const { data, error } = await createPublicClient()
    .from("noire_products")
    .select(`${PRODUCT_SUMMARY_COLUMNS}, moods, scent_profiles`)
    .eq("is_active", true)
    .neq("id", product.id);
  if (error) fail("getRelatedProducts", error);

  const score = (p: { fragrance_family: string; moods: string[]; scent_profiles: string[] }) =>
    (p.fragrance_family === product.fragrance_family ? 3 : 0) +
    p.moods.filter((m) => product.moods.includes(m)).length +
    p.scent_profiles.filter((s) => product.scent_profiles.includes(s)).length;

  return (data ?? [])
    .map((p) => ({ p, s: score(p) }))
    .sort((a, b) => b.s - a.s || a.p.number - b.p.number)
    .slice(0, limit)
    .map(({ p }) => toSummary(p));
}

export async function searchProducts(term: string, limit?: number): Promise<ProductSummary[]> {
  const q = term.trim().slice(0, 80);
  if (!q) return [];
  let query = createPublicClient().rpc("noire_search_products", { search_query: q }).select(PRODUCT_SUMMARY_COLUMNS);
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) fail("searchProducts", error);
  return ((data ?? []) as unknown as ProductSummary[]).map(toSummary);
}

/** Guided discovery: rank fragrances by how many selected characters and moments they match. */
export async function discoverProducts(scents: string[], moments: string[]): Promise<ProductSummary[]> {
  if (!scents.length && !moments.length) return [];
  let query = createPublicClient()
    .from("noire_products")
    .select(`${PRODUCT_SUMMARY_COLUMNS}, moods, scent_profiles`)
    .eq("is_active", true);
  if (scents.length) query = query.overlaps("scent_profiles", scents);
  if (moments.length) query = query.overlaps("moods", moments);
  const { data, error } = await query;
  if (error) fail("discoverProducts", error);

  return (data ?? [])
    .map((p) => ({
      p,
      score:
        p.scent_profiles.filter((s) => scents.includes(s)).length * 2 +
        p.moods.filter((m) => moments.includes(m)).length,
    }))
    .sort((a, b) => b.score - a.score || a.p.number - b.p.number)
    .map(({ p }) => toSummary(p));
}

export async function getProductSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  const { data, error } = await createPublicClient()
    .from("noire_products")
    .select("slug, updated_at")
    .eq("is_active", true)
    .order("sort_order");
  if (error) fail("getProductSlugs", error);
  return data ?? [];
}
