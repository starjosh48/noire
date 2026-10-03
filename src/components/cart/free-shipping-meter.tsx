import { commerce } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function FreeShippingMeter({ subtotal, className }: { subtotal: number; className?: string }) {
  const remaining = Math.max(0, commerce.freeShippingThreshold - subtotal);
  const progress = Math.min(100, (subtotal / commerce.freeShippingThreshold) * 100);

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <p className="text-[13px] text-ink" aria-live="polite">
        {remaining > 0 ? (
          <>
            You&rsquo;re <span className="font-medium">{formatPrice(remaining)}</span> away from free delivery.
          </>
        ) : (
          <>Your order qualifies for free delivery.</>
        )}
      </p>
      <div
        className="h-px w-full bg-line"
        role="progressbar"
        aria-label="Progress towards free delivery"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <div
          className="h-px bg-ink transition-[width] duration-700 ease-out-soft"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
