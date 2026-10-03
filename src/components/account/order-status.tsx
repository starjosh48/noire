import { CheckIcon } from "@/components/ui/icons";
import { orderStatusLabel, orderTimeline } from "@/lib/orders/status";
import { cn } from "@/lib/utils";

export function OrderStatusBadge({ status }: { status: string }) {
  const cancelled = status === "cancelled";
  const delivered = status === "delivered";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em]",
        cancelled ? "border-danger/30 text-danger" : delivered ? "border-success/30 text-success" : "border-line text-ink",
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", cancelled ? "bg-danger" : delivered ? "bg-success" : "bg-champagne")}
      />
      {orderStatusLabel(status)}
    </span>
  );
}

/** Confirmed → Processing → Shipped → Delivered, with the current step marked in text. */
export function OrderTimeline({ status }: { status: string }) {
  if (status === "pending_payment") {
    return (
      <p className="text-[14px] text-ink-soft">
        We&rsquo;re waiting for Paystack to confirm your payment. This page updates once it does. Usually within a few
        minutes.
      </p>
    );
  }
  if (status === "cancelled") {
    return <p className="text-[14px] text-danger">This order was cancelled. If you have questions, contact client care.</p>;
  }
  const current = Math.max(0, orderTimeline.indexOf(status as (typeof orderTimeline)[number]));

  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Order progress">
      {orderTimeline.map((step, index) => {
        const done = index <= current;
        return (
          <li key={step} className="flex flex-col gap-3" aria-current={index === current ? "step" : undefined}>
            <span className={cn("h-px w-full", done ? "bg-ink" : "bg-line")} aria-hidden="true" />
            <span className="flex items-center gap-1.5 text-[12px]">
              {done ? (
                <CheckIcon size={13} className="shrink-0 text-ink" aria-hidden="true" />
              ) : (
                <span className="size-[13px] shrink-0" aria-hidden="true" />
              )}
              <span className={done ? "text-ink" : "text-faint"}>{orderStatusLabel(step)}</span>
              <span className="sr-only">{index < current ? "(complete)" : index === current ? "(current)" : "(upcoming)"}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
