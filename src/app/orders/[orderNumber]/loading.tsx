import { Skeleton } from "@/components/ui/skeleton";

export default function OrderLoading() {
  return (
    <div className="shell pb-24 pt-10 md:pt-16" role="status" aria-label="Loading order">
      <div className="mx-auto max-w-4xl">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-5 h-14 w-2/3" />
        <Skeleton className="mt-10 h-8 w-full" />
        <div className="mt-14 flex flex-col gap-6">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-6">
              <Skeleton className="aspect-[4/5] w-[88px]" />
              <div className="flex flex-1 flex-col gap-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
