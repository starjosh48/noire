import { Skeleton } from "@/components/ui/skeleton";

export default function AccountLoading() {
  return (
    <div className="flex flex-col gap-16" role="status" aria-label="Loading your account">
      <div>
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-5 h-16 w-3/4 max-w-xl" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-56" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}
