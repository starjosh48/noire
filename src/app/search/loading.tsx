import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="shell pb-24 pt-10 md:pt-16">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-5 h-14 w-full" />
      <Skeleton className="mt-6 h-4 w-40" />
      <div className="mt-10">
        <ProductGridSkeleton count={4} />
      </div>
    </div>
  );
}
