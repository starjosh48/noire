import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type CartTotalsProps = {
  subtotal: number;
  shippingFee: number;
  total: number;
  className?: string;
  shippingNote?: string;
};

export function CartTotals({ subtotal, shippingFee, total, className, shippingNote }: CartTotalsProps) {
  return (
    <dl className={cn("flex flex-col gap-2.5 text-[14px]", className)}>
      <div className="flex justify-between">
        <dt className="text-muted">Subtotal</dt>
        <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted">
          Delivery
          {shippingNote && <span className="block text-[12px] text-faint">{shippingNote}</span>}
        </dt>
        <dd className="tabular-nums">{shippingFee > 0 ? formatPrice(shippingFee) : "Free"}</dd>
      </div>
      <div className="mt-2 flex items-baseline justify-between border-t border-line pt-4">
        <dt className="text-[15px] font-medium">Total</dt>
        <dd className="text-[18px] font-medium tabular-nums">{formatPrice(total)}</dd>
      </div>
    </dl>
  );
}
