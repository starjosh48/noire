import { NextResponse, type NextRequest } from "next/server";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog/queries";

export async function GET(_request: NextRequest, { params }: RouteContext<"/api/mobile/catalog/products/[slug]">) {
  const { slug } = await params;
  try {
    const product = await getProductBySlug(slug);
    if (!product) return NextResponse.json({ error: "That fragrance couldn't be found." }, { status: 404 });
    const related = await getRelatedProducts(product, 4);
    return NextResponse.json(
      { product, related },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch {
    return NextResponse.json({ error: "We couldn't load this fragrance right now." }, { status: 503 });
  }
}
