import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function ShopLoading() {
  return (
    <div className="shell pb-24 pt-10 md:pt-16">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-5 h-14 w-2/3 max-w-md md:h-20" />
      <Skeleton className="mt-5 h-4 w-full max-w-sm" />
      <div className="mt-10 border-y border-line py-4">
        <Skeleton className="h-6 w-full" />
      </div>
      <div className="mt-10">
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
