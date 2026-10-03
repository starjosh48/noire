import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NotesPyramid } from "@/components/product/notes-pyramid";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { WishlistButton } from "@/components/product/wishlist-button";
import { Reveal } from "@/components/ui/reveal";
import { ChevronDownIcon, DropletIcon, ReturnIcon, TruckIcon, LockIcon } from "@/components/ui/icons";
import { getProductBySlug, getProductSlugs, getRelatedProducts } from "@/lib/catalog/queries";
import { familyLine, genderLabel, moodBySlug } from "@/lib/catalog/taxonomy";
import { commerce, siteConfig } from "@/lib/config";
import { artwork } from "@/lib/images";
import { formatPrice, productLabel } from "@/lib/format";

// Pre-build every product page; new products render on first visit and are then cached.
export const revalidate = 300;

export async function generateStaticParams() {
  const products = await getProductSlugs().catch(() => []);
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Fragrance not found" };

  const title = `${product.name} (${productLabel(product.number)}) ${product.category}`;
  const description = `${product.short_description}. ${familyLine(product.fragrance_family, product.secondary_family)} fragrance from ${formatPrice(product.price, product.currency)}.`;
  return {
    title,
    description,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${title} | NOIRÉ`,
      description,
      url: `/shop/${product.slug}`,
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product, 4);
  const images = product.gallery_images.length ? product.gallery_images : [product.image_url];
  const label = productLabel(product.number);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${label} ${product.name}`,
    description: product.description,
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: "NOIRÉ" },
    category: product.category,
    image: images.map((src) => `${siteConfig.url}${artwork(src)}`),
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      name: `${product.name} ${v.size_ml} ml`,
      price: v.price,
      priceCurrency: product.currency,
      availability: v.stock_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${siteConfig.url}/shop/${product.slug}`,
    })),
  };

  const details = [
    {
      title: "The composition",
      body: (
        <>
          <p>{product.description}</p>
          <p className="mt-3 text-muted">
            {product.category}. Composed in Lagos. {genderLabel(product.gender)}.
          </p>
        </>
      ),
    },
    {
      title: "Longevity & projection",
      body: (
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-muted">Longevity</dt>
            <dd className="mt-1">{product.longevity}</dd>
          </div>
          <div>
            <dt className="text-muted">Sillage</dt>
            <dd className="mt-1">{product.sillage}</dd>
          </div>
        </dl>
      ),
    },
    {
      title: "How to wear it",
      body: (
        <p>
          Spray once or twice on pulse points (the inner wrists, the base of the throat, behind the ears) from about
          15 cm away. Let it settle rather than rubbing it in. For a softer trail, mist the air and walk through it.
        </p>
      ),
    },
    {
      title: "Delivery & returns",
      body: (
        <ul className="flex flex-col gap-2">
          <li>Free delivery on orders over {formatPrice(commerce.freeShippingThreshold)}. Otherwise {formatPrice(commerce.shippingFee)}.</li>
          <li>Lagos: 1–2 business days. Elsewhere in Nigeria: 3–5 business days.</li>
          <li>Unopened fragrances can be returned within {commerce.returnWindowDays} days of delivery.</li>
        </ul>
      ),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <div className="shell pt-6 md:pt-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-[12px] text-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/shop" className="tap-target link-reveal hover:text-ink">
                Shop
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/shop?family=${product.fragrance_family}`} className="tap-target link-reveal hover:text-ink">
                {familyLine(product.fragrance_family)}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <ProductGallery images={images} name={`${label} ${product.name}`} />
          </div>

          <div className="lg:col-span-5">
            <div className="flex flex-col gap-8 lg:sticky lg:top-28">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow text-muted">{label}</p>
                    <h1 className="display mt-3 text-[48px] md:text-[64px]">{product.name}</h1>
                  </div>
                  <WishlistButton
                    productId={product.id}
                    productName={product.name}
                    className="mt-1 shrink-0"
                  />
                </div>
                <p className="mt-3 text-[12px] uppercase tracking-[0.16em] text-muted">
                  {familyLine(product.fragrance_family, product.secondary_family)} · {product.category}
                </p>
                <p className="mt-5 font-serif text-[22px] italic leading-snug text-ink-soft">{product.short_description}.</p>
                {product.moods.length > 0 && (
                  <ul className="mt-5 flex flex-wrap gap-2" aria-label="Moods">
                    {product.moods.map((m) => (
                      <li key={m}>
                        <Link
                          href={`/shop?mood=${m}`}
                          className="inline-block border border-line px-3 py-1 text-[12px] text-ink transition-colors hover:border-ink"
                        >
                          {moodBySlug(m)?.label ?? m}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <PurchasePanel productName={product.name} variants={product.variants} currency={product.currency} />

              <ul className="flex flex-col gap-3 border-t border-line pt-6 text-[13px] text-ink-soft">
                <li className="flex items-center gap-3">
                  <TruckIcon size={18} className="shrink-0 text-muted" />
                  Free delivery on orders over {formatPrice(commerce.freeShippingThreshold)}
                </li>
                <li className="flex items-center gap-3">
                  <LockIcon size={18} className="shrink-0 text-muted" />
                  Pay on delivery by card, transfer or cash
                </li>
                <li className="flex items-center gap-3">
                  <ReturnIcon size={18} className="shrink-0 text-muted" />
                  Unopened returns within {commerce.returnWindowDays} days
                </li>
                <li className="flex items-center gap-3">
                  <DropletIcon size={18} className="shrink-0 text-muted" />
                  {product.longevity} on skin{product.sillage ? ` · ${product.sillage.toLowerCase()} sillage` : ""}
                </li>
              </ul>

              <div className="border-t border-line">
                {details.map((d, index) => (
                  <details key={d.title} className="group border-b border-line" open={index === 0}>
                    <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-[13px] font-medium uppercase tracking-[0.14em] text-ink [&::-webkit-details-marker]:hidden">
                      {d.title}
                      <ChevronDownIcon size={16} className="transition-transform duration-300 group-open:rotate-180" />
                    </summary>
                    <div className="pb-6 text-[14px] leading-relaxed text-ink-soft">{d.body}</div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section aria-labelledby="notes-title" className="shell mt-24 md:mt-36">
        <div className="mb-10 max-w-2xl">
          <p className="eyebrow text-muted">The notes</p>
          <h2 id="notes-title" className="display mt-3 text-[40px] md:text-[56px]">
            How {product.name} unfolds
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            A fragrance changes as it warms on your skin. Here is what you will notice, and when.
          </p>
        </div>
        <Reveal>
          <NotesPyramid top={product.top_notes} heart={product.heart_notes} base={product.base_notes} />
        </Reveal>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="shell mt-24 pb-24 md:mt-36 md:pb-32">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow text-muted">Also consider</p>
              <h2 id="related-title" className="display mt-3 text-[40px] md:text-[56px]">
                You may also like
              </h2>
            </div>
          </div>
          <Reveal>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
            {related.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
          </Reveal>
        </section>
      )}
    </>
  );
}
