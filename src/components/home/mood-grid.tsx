import Image from "next/image";
import Link from "next/link";
import { moods } from "@/lib/catalog/taxonomy";
import { artwork } from "@/lib/images";
import { cn } from "@/lib/utils";

/** Six campaign tiles linking to the catalog filtered by mood. */
export function MoodGrid({ className }: { className?: string }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5", className)}>
      {moods.map((mood, index) => (
        <li key={mood.slug} className={cn(index === 0 && "col-span-2 md:col-span-1")}>
          <Link href={`/shop?mood=${mood.slug}`} className="group relative block overflow-hidden bg-stone">
            <div className={cn("relative", index === 0 ? "aspect-[4/3] md:aspect-[3/4]" : "aspect-[3/4]")}>
              <Image
                src={artwork(mood.image)}
                alt=""
                fill
                sizes="(min-width: 768px) 33vw, 50vw"
                className="object-cover transition-[scale] duration-[1400ms] ease-out-soft group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-night/75 via-night/15 to-transparent" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-4 text-cream md:p-6">
              <p className="eyebrow text-cream/80">Mood {String(index + 1).padStart(2, "0")}</p>
              <h3 className="display mt-2 text-[26px] md:text-[36px]">{mood.label}</h3>
              <p className="mt-2 hidden max-w-xs text-[13px] leading-snug text-cream/85 md:block">{mood.description}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
