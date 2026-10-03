import { NextResponse } from "next/server";
import { getBestsellers, getFeaturedProducts } from "@/lib/catalog/queries";

export async function GET() {
  try {
    const [featured, bestsellers] = await Promise.all([getFeaturedProducts(6), getBestsellers(4)]);
    return NextResponse.json(
      { featured, bestsellers },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch {
    return NextResponse.json({ error: "We couldn't load the collection right now." }, { status: 503 });
  }
}
