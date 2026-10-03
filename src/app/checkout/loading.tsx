import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <div className="shell pb-24 pt-10 md:pt-14" role="status" aria-label="Loading checkout">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-6 h-16 w-64" />
      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="flex flex-col gap-5 lg:col-span-7">
          <Skeleton className="h-8 w-40" />
          <div className="grid gap-5 md:grid-cols-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
          <Skeleton className="mt-6 h-8 w-40" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <div className="grid gap-5 md:grid-cols-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        </div>
        <Skeleton className="hidden h-96 lg:col-span-5 lg:block" />
      </div>
    </div>
  );
}
