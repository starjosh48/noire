import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <div className="shell pt-6 md:pt-10" role="status" aria-label="Loading fragrance">
      <Skeleton className="mb-6 h-3 w-48" />
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <Skeleton className="aspect-[4/5] w-full" />
        </div>
        <div className="flex flex-col gap-5 lg:col-span-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-14 w-3/4" />
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="mt-4 h-8 w-32" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    </div>
  );
}
