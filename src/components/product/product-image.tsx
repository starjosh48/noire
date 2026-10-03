import Image from "next/image";
import { artwork } from "@/lib/images";
import { cn } from "@/lib/utils";

type ProductImageProps = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
};

/** Fixed-ratio product image on the stone ground used across the store. */
export function ProductImage({ src, alt, sizes, priority, className, imageClassName }: ProductImageProps) {
  return (
    <div className={cn("relative overflow-hidden bg-stone", className)}>
      <Image
        src={artwork(src)}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn("object-cover", imageClassName)}
      />
    </div>
  );
}
