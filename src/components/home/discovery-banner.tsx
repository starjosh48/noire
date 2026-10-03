import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";

export function DiscoveryBanner() {
  return (
    <section aria-labelledby="discovery-banner-title" className="relative overflow-hidden bg-night text-cream">
      <Image
        src="/images/editorial/discovery.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-[72%_50%]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-night/90 via-night/50 to-transparent" />
      <div className="shell relative flex min-h-[520px] flex-col justify-center py-20 md:min-h-[600px]">
        <div className="max-w-lg">
          <p className="eyebrow text-cream/70">The scent finder</p>
          <h2 id="discovery-banner-title" className="display mt-4 text-[44px] md:text-[68px]">
            Not sure where to start?
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-cream/80">
            Find your signature scent. Tell us what you&rsquo;re drawn to and when you&rsquo;ll wear it, and
            we&rsquo;ll narrow twelve fragrances down to the ones made for you.
          </p>
          <ButtonLink href="/discovery" variant="cream" size="lg" className="mt-9">
            Find your signature scent
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
