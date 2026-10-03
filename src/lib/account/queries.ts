import "server-only";
import { getWebViewer, type Viewer } from "@/lib/auth/session";
import { toSummary } from "@/lib/catalog/queries";
import { PRODUCT_SUMMARY_COLUMNS, type ProductSummary } from "@/lib/catalog/types";

export async function getWishlistProductIds(viewer?: Viewer): Promise<string[]> {
  const { user, supabase } = viewer ?? (await getWebViewer());
  if (!user) return [];
  const { data, error } = await supabase.from("noire_wishlist_items").select("product_id").eq("user_id", user.id);
  if (error) {
    console.error("[wishlist] failed to load ids", error);
    return [];
  }
  return (data ?? []).map((row) => row.product_id);
}

export async function getWishlistProducts(viewer?: Viewer): Promise<ProductSummary[]> {
  const { user, supabase } = viewer ?? (await getWebViewer());
  if (!user) return [];
  const { data, error } = await supabase
    .from("noire_wishlist_items")
    .select(`created_at, product:noire_products!inner(${PRODUCT_SUMMARY_COLUMNS})`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[wishlist] failed to load products", error);
    return [];
  }
  return (data ?? []).map((row) => toSummary(row.product as unknown as ProductSummary));
}
