import type { Database } from "@/types/database";

type ProductRow = Database["public"]["Tables"]["noire_products"]["Row"];
type VariantRow = Database["public"]["Tables"]["noire_product_variants"]["Row"];

export type Product = Omit<ProductRow, "search_vector">;

export type ProductSummary = ProductSummaryFields & {
  /** Sizes, smallest first; lets cards offer quick add. */
  variants: QuickVariant[];
};

export type QuickVariant = Pick<VariantRow, "id" | "size_ml" | "price" | "stock_quantity">;

type ProductSummaryFields = Pick<
  ProductRow,
  | "id"
  | "number"
  | "name"
  | "slug"
  | "short_description"
  | "price"
  | "currency"
  | "fragrance_family"
  | "secondary_family"
  | "image_url"
  | "gallery_images"
  | "stock_quantity"
  | "featured"
  | "bestseller"
  | "new_arrival"
>;

export type ProductVariant = Pick<VariantRow, "id" | "size_ml" | "price" | "stock_quantity" | "sku">;

export type ProductDetail = Product & { variants: ProductVariant[] };

export const PRODUCT_SUMMARY_COLUMNS =
  "id, number, name, slug, short_description, price, currency, fragrance_family, secondary_family, image_url, gallery_images, stock_quantity, featured, bestseller, new_arrival, variants:noire_product_variants(id, size_ml, price, stock_quantity)";

export const PRODUCT_DETAIL_COLUMNS =
  "id, number, name, slug, description, short_description, price, currency, category, gender, fragrance_family, secondary_family, top_notes, heart_notes, base_notes, moods, scent_profiles, longevity, sillage, accent_color, image_url, gallery_images, stock_quantity, sales_count, sort_order, featured, bestseller, new_arrival, is_active, created_at, updated_at";
