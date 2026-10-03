"use client";

import { useRouter } from "next/navigation";
import { type RefObject, useEffect, useId, useRef, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import type { ProductVariant } from "@/lib/catalog/types";
import { commerce } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

function defaultVariant(variants: ProductVariant[]) {
  const inStock = variants.filter((v) => v.stock_quantity > 0);
  return inStock.find((v) => v.size_ml === 50) ?? inStock[0] ?? variants[0];
}

export function PurchasePanel({
  productName,
  variants,
  currency,
}: {
  productName: string;
  variants: ProductVariant[];
  currency: string;
}) {
  const router = useRouter();
  const { addItem, cart } = useCart();
  const groupId = useId();
  const [selectedId, setSelectedId] = useState(() => defaultVariant(variants)?.id);
  const [quantity, setQuantity] = useState(1);
  const [action, setAction] = useState<"add" | "buy" | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const showStickyBar = useStickyBar(actionsRef);

  const selected = variants.find((v) => v.id === selectedId);
  const allSoldOut = variants.every((v) => v.stock_quantity <= 0);
  const inCart = cart.lines.find((l) => l.variant.id === selectedId)?.quantity ?? 0;
  const maxSelectable = selected
    ? Math.max(1, Math.min(selected.stock_quantity, commerce.maxQuantityPerLine) - inCart)
    : 1;
  const unavailable = !selected || selected.stock_quantity <= 0;
  const cartFull = !!selected && !unavailable && inCart >= Math.min(selected.stock_quantity, commerce.maxQuantityPerLine);
  const addLabel = allSoldOut
    ? "Sold out"
    : unavailable
      ? "Size sold out"
      : !cartFull
        ? justAdded
          ? "Added ✓"
          : "Add to cart"
        : inCart >= commerce.maxQuantityPerLine
          ? `Limit of ${commerce.maxQuantityPerLine} per order`
          : "All available in your cart";

  const select = (variant: ProductVariant) => {
    setSelectedId(variant.id);
    setQuantity(1);
  };

  const add = async (mode: "add" | "buy") => {
    if (!selected) return;
    setAction(mode);
    const ok = await addItem(selected.id, quantity, { quiet: mode === "buy" });
    if (ok && mode === "buy") {
      router.push("/checkout");
      return;
    }
    setAction(null);
    if (ok) {
      setQuantity(1);
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 1800);
    }
  };

  let stockNote: string;
  if (allSoldOut) stockNote = "Sold out in every size. New stock is on its way.";
  else if (!selected || selected.stock_quantity <= 0) stockNote = "This size is sold out. Please choose another.";
  else if (selected.stock_quantity <= commerce.lowStockThreshold) stockNote = `Only ${selected.stock_quantity} left in ${selected.size_ml} ml.`;
  else stockNote = "In stock. Dispatched within 24 hours.";

  return (
    <div className="flex flex-col gap-7">
      <p className="text-[24px] tabular-nums text-ink" aria-live="polite">
        {selected ? formatPrice(selected.price, currency) : "—"}
        {selected && <span className="ml-2 text-[14px] text-muted">{selected.size_ml} ml</span>}
      </p>

      <fieldset>
        <legend className="eyebrow mb-3 text-ink">Size</legend>
        <div className="grid grid-cols-3 gap-2">
          {variants.map((variant) => {
            const soldOut = variant.stock_quantity <= 0;
            const checked = variant.id === selectedId;
            return (
              <label
                key={variant.id}
                className={cn(
                  "relative flex cursor-pointer flex-col items-center justify-center gap-0.5 border px-2 py-3.5 text-center transition-colors duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
                  checked ? "border-ink bg-ink text-ivory" : "border-line bg-paper text-ink hover:border-ink",
                  soldOut && "cursor-not-allowed border-dashed bg-transparent text-faint hover:border-line",
                )}
              >
                <input
                  type="radio"
                  name={groupId}
                  value={variant.id}
                  checked={checked}
                  disabled={soldOut}
                  onChange={() => select(variant)}
                  className="sr-only"
                />
                <span className="text-[14px] font-medium">{variant.size_ml} ml</span>
                <span className={cn("text-[12px] tabular-nums", checked ? "text-ivory/75" : "text-muted", soldOut && "text-faint")}>
                  {soldOut ? "Sold out" : formatPrice(variant.price, currency)}
                </span>
              </label>
            );
          })}
        </div>
        <p
          className={cn(
            "mt-3 text-[13px]",
            selected && selected.stock_quantity > 0 && selected.stock_quantity <= commerce.lowStockThreshold
              ? "text-champagne-deep"
              : "text-muted",
          )}
          aria-live="polite"
        >
          {stockNote}
        </p>
      </fieldset>

      <div ref={actionsRef} className="flex flex-col gap-3">
        <div className="flex gap-3">
          <QuantityStepper
            label="Quantity"
            value={quantity}
            max={maxSelectable}
            onChange={setQuantity}
            disabled={unavailable || cartFull}
          />
          <Button
            size="lg"
            className="flex-1"
            onClick={() => add("add")}
            loading={action === "add"}
            loadingText="Adding to cart"
            disabled={unavailable || cartFull || action !== null}
          >
            {addLabel}
          </Button>
        </div>
        {!unavailable && !cartFull && (
          <Button
            size="lg"
            variant="secondary"
            fullWidth
            onClick={() => add("buy")}
            loading={action === "buy"}
            loadingText="Preparing checkout"
            disabled={action !== null}
          >
            Buy now
          </Button>
        )}
        {inCart > 0 && (
          <p className="text-[13px] text-muted">
            {inCart} × {selected?.size_ml} ml {productName} already in your cart.
          </p>
        )}
      </div>

      {/* Phones: once the buttons above scroll away, keep "Add to cart" within reach. */}
      <div
        inert={!showStickyBar}
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_32px_-20px_rgba(0,0,0,0.35)] backdrop-blur-sm transition-[translate,opacity] duration-500 ease-out-soft lg:hidden",
          showStickyBar ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0",
        )}
      >
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-[18px] leading-tight text-ink">{productName}</p>
            <p className="text-[12px] tabular-nums text-muted">
              {selected ? `${selected.size_ml} ml · ${formatPrice(selected.price, currency)}` : "—"}
            </p>
          </div>
          <Button
            onClick={() => add("add")}
            loading={action === "add"}
            loadingText="Adding"
            disabled={unavailable || cartFull || action !== null}
            className="shrink-0"
          >
            {unavailable || cartFull || justAdded ? addLabel : "Add to cart"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** True when the page's main purchase buttons have been scrolled past and the footer isn't in view. */
function useStickyBar(target: RefObject<HTMLElement | null>) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const element = target.current;
    const footer = document.querySelector("footer");
    if (!element) return;
    // A scroll listener rather than IntersectionObserver: a fast flick can jump straight past the
    // buttons without them ever intersecting, which an observer would never report.
    let frame = 0;
    const update = () => {
      frame = 0;
      const pastButtons = element.getBoundingClientRect().bottom < 0;
      const footerVisible = !!footer && footer.getBoundingClientRect().top < window.innerHeight;
      setShow(pastButtons && !footerVisible);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [target]);
  return show;
}
