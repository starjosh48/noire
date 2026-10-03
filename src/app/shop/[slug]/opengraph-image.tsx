import { ImageResponse } from "next/og";
import { getProductBySlug } from "@/lib/catalog/queries";
import { familyLine } from "@/lib/catalog/taxonomy";
import { productLabel } from "@/lib/format";
import { OgFrame, ogSize, publicSvgDataUri } from "@/lib/og";

export const alt = "NOIRÉ fragrance";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  const image = await publicSvgDataUri(
    product?.image_url.startsWith("/") ? product.image_url : "/images/editorial/hero.svg",
  );

  return new ImageResponse(
    product ? (
      <OgFrame
        eyebrow={`${productLabel(product.number)} · ${familyLine(product.fragrance_family, product.secondary_family)}`}
        title={product.name}
        subtitle={`${product.short_description}.`}
        // The OG font has no naira glyph, so spell out the currency code.
        footer={`From ${product.currency} ${Number(product.price).toLocaleString("en-NG")} · ${product.category}`}
        image={image}
      />
    ) : (
      <OgFrame eyebrow="NOIRÉ" title="Modern fragrance house" image={image} />
    ),
    size,
  );
}
