import { Skeleton } from "@/components/ui/skeleton";

export default function CartLoading() {
  return (
    <div className="shell pb-24 pt-10 md:pt-16" role="status" aria-label="Loading your cart">
      <Skeleton className="h-3 w-36" />
      <Skeleton className="mt-6 h-16 w-64" />
      <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="flex flex-col gap-8 lg:col-span-7">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-6">
              <Skeleton className="aspect-[4/5] w-[120px]" />
              <div className="flex flex-1 flex-col gap-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-80 lg:col-span-5" />
      </div>
    </div>
  );
}
