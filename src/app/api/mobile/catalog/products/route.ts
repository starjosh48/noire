import { NextResponse, type NextRequest } from "next/server";
import { parseFilters } from "@/lib/catalog/filters";
import { getProducts } from "@/lib/catalog/queries";

/** Catalog listing. Accepts the same query parameters as the website's /shop page. */
export async function GET(request: NextRequest) {
  try {
    const products = await getProducts(parseFilters(request.nextUrl.searchParams));
    return NextResponse.json(
      { products },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch {
    return NextResponse.json({ error: "We couldn't load the collection right now." }, { status: 503 });
  }
}
