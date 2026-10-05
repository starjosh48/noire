import { NextResponse, type NextRequest } from "next/server";
import { parseFilters } from "@/lib/catalog/filters";
import { getProducts } from "@/lib/catalog/queries";
import { CATALOG_CACHE_HEADERS } from "@/lib/mobile/cache";

/** Catalog listing. Accepts the same query parameters as the website's /shop page. */
export async function GET(request: NextRequest) {
  try {
    const products = await getProducts(parseFilters(request.nextUrl.searchParams));
    return NextResponse.json(
      { products },
      { headers: CATALOG_CACHE_HEADERS },
    );
  } catch {
    return NextResponse.json({ error: "We couldn't load the collection right now." }, { status: 503 });
  }
}
