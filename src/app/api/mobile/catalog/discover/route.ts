import { NextResponse, type NextRequest } from "next/server";
import { parseFilters } from "@/lib/catalog/filters";
import { discoverProducts } from "@/lib/catalog/queries";
import { CATALOG_CACHE_HEADERS } from "@/lib/mobile/cache";

/** The scent finder, as on the website's /discovery: ?scent=warm,woody&mood=after-dark */
export async function GET(request: NextRequest) {
  const { scent, mood } = parseFilters(request.nextUrl.searchParams);
  try {
    const results = await discoverProducts(scent, mood);
    return NextResponse.json(
      { results },
      { headers: CATALOG_CACHE_HEADERS },
    );
  } catch {
    return NextResponse.json({ results: [], error: "The scent finder is unavailable right now." }, { status: 503 });
  }
}
