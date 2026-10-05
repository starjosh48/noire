import { NextResponse, type NextRequest } from "next/server";
import { searchProducts } from "@/lib/catalog/queries";
import { CATALOG_CACHE_HEADERS } from "@/lib/mobile/cache";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit")) || 12, 1), 24);
  try {
    const results = await searchProducts(q, limit);
    return NextResponse.json(
      { results },
      { headers: CATALOG_CACHE_HEADERS },
    );
  } catch {
    return NextResponse.json({ results: [], error: "Search is unavailable right now." }, { status: 503 });
  }
}
