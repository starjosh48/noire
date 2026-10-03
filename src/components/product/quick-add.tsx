"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { CheckIcon, PlusIcon } from "@/components/ui/icons";
import type { QuickVariant } from "@/lib/catalog/types";
import { formatPrice, productLabel } from "@/lib/format";
import { artwork } from "@/lib/images";
import { cn } from "@/lib/utils";

type QuickAddProps = {
  product: { name: string; number: number; imageUrl: string; family: string; currency: string };
  variants: QuickVariant[];
};

const defaultSize = (variants: QuickVariant[]) => {
  const inStock = variants.filter((v) => v.stock_quantity > 0);
  return inStock.find((v) => v.size_ml === 50) ?? inStock[0] ?? null;
};

/**
 * Quick add, as on luxury fragrance sites: the card stays clean at rest.
 * - Pointer devices: "Quick add" slides up over the image on hover/focus; choosing a size
 *   (shown with its price) adds it and opens the cart drawer.
 * - Touch devices: a "+" opens a bottom sheet to choose the size.
 */
export function QuickAdd({ product, variants }: QuickAddProps) {
  const { addItem } = useCart();
  const [expanded, setExpanded] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  // The sheet is only mounted once it's first needed, so grids don't carry a dialog per card.
  const [sheetMounted, setSheetMounted] = useState(false);
  const sizesRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const [sheetChoice, setSheetChoice] = useState<string | null>(() => defaultSize(variants)?.id ?? null);

  // Keyboard users keep their place: focus moves into the sizes when they open, and back to
  // "Quick add" when they close.
  useEffect(() => {
    if (expanded) sizesRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    else if (restoreFocus.current) triggerRef.current?.focus();
    restoreFocus.current = false;
  }, [expanded]);

  if (!variants.some((v) => v.stock_quantity > 0)) return null;

  const collapse = (returnFocus: boolean) => {
    restoreFocus.current = returnFocus;
    setExpanded(false);
  };

  const add = async (variantId: string) => {
    if (pendingId) return;
    setPendingId(variantId);
    // Keyboard users go back to "Quick add"; mouse users shouldn't have the bar pinned open by focus.
    const keyboard = !!document.activeElement?.matches(":focus-visible");
    const ok = await addItem(variantId, 1);
    setPendingId(null);
    if (ok) {
      collapse(keyboard);
      setSheetOpen(false);
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 1800);
    }
  };

  const sizeButton = (variant: QuickVariant, layout: "bar" | "sheet") => {
    const soldOut = variant.stock_quantity <= 0;
    const pending = pendingId === variant.id;
    const selected = layout === "sheet" && sheetChoice === variant.id;
    return (
      <button
        key={variant.id}
        type="button"
        disabled={soldOut || pendingId !== null}
        onClick={() => (layout === "bar" ? add(variant.id) : setSheetChoice(variant.id))}
        aria-pressed={layout === "sheet" ? selected : undefined}
        aria-label={
          soldOut
            ? `${variant.size_ml} ml, sold out`
            : layout === "bar"
              ? `Add ${product.name} ${variant.size_ml} ml to cart, ${formatPrice(variant.price, product.currency)}`
              : `${variant.size_ml} ml, ${formatPrice(variant.price, product.currency)}`
        }
        className={cn(
          "flex flex-col items-center justify-center border transition-colors duration-200",
          layout === "bar" ? "h-12 gap-0.5" : "h-16 gap-1",
          soldOut
            ? "cursor-not-allowed border-dashed border-line text-faint"
            : selected
              ? "border-ink bg-ink text-ivory"
              : "border-line bg-paper text-ink hover:border-ink hover:bg-ink hover:text-ivory",
          pending && "animate-shimmer",
        )}
      >
        <span className={cn("text-[12px] font-medium", soldOut && "line-through")}>{variant.size_ml} ml</span>
        <span className="text-[11px] tabular-nums opacity-75">
          {soldOut ? "Sold out" : formatPrice(variant.price, product.currency)}
        </span>
      </button>
    );
  };

  const sheetVariant = variants.find((v) => v.id === sheetChoice);

  return (
    <>
      {/* Pointer devices: hover/focus reveal */}
      <div
        className="pointer-events-none absolute inset-x-3 bottom-3 hidden translate-y-3 opacity-0 transition-[opacity,translate] duration-500 ease-out-soft group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 pointer-fine:block"
        onMouseLeave={() => setExpanded(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && expanded) {
            event.stopPropagation();
            collapse(true);
          }
        }}
      >
        <div className="bg-ivory/95 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          {expanded ? (
            <div className="p-3 animate-pop-in">
              <p className="eyebrow pb-2.5 text-center text-muted">Select size</p>
              <div ref={sizesRef} className="grid grid-cols-3 gap-1.5" role="group" aria-label={`Choose a size of ${product.name}`}>
                {variants.map((v) => sizeButton(v, "bar"))}
              </div>
            </div>
          ) : (
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setExpanded(true)}
              aria-expanded={false}
              className="flex h-12 w-full items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:bg-ink hover:text-ivory"
            >
              {justAdded ? (
                <>
                  <CheckIcon size={14} strokeWidth={1.75} className="animate-check" />
                  Added
                </>
              ) : (
                <>
                  <PlusIcon size={14} strokeWidth={1.75} />
                  Quick add
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Touch devices: open a size sheet */}
      <button
        type="button"
        onClick={() => {
          setSheetMounted(true);
          setSheetOpen(true);
        }}
        aria-label={`Quick add ${product.name}`}
        aria-haspopup="dialog"
        className="absolute bottom-3 right-3 hidden size-10 items-center justify-center rounded-full bg-ivory/95 text-ink shadow-[0_6px_18px_-8px_rgba(0,0,0,0.45)] transition-transform active:scale-90 pointer-coarse:flex"
      >
        {justAdded ? <CheckIcon size={18} strokeWidth={1.5} className="animate-check" /> : <PlusIcon size={18} strokeWidth={1.5} />}
      </button>

      {sheetMounted && (
      <Drawer open={sheetOpen} onClose={() => setSheetOpen(false)} title="Quick add" side="bottom">
        <div className="flex flex-col gap-6 px-5 pb-7 pt-5">
          <div className="flex items-center gap-4">
            <div className="relative aspect-[4/5] w-16 shrink-0 overflow-hidden bg-stone">
              <Image src={artwork(product.imageUrl)} alt="" fill sizes="64px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="eyebrow text-muted">{productLabel(product.number)}</p>
              <p className="font-serif text-[24px] leading-tight text-ink">{product.name}</p>
              <p className="text-[12px] text-muted">{product.family}</p>
            </div>
          </div>
          <div>
            <p className="eyebrow mb-3 text-ink">Size</p>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label={`Choose a size of ${product.name}`}>
              {variants.map((v) => sizeButton(v, "sheet"))}
            </div>
          </div>
          <Button
            size="lg"
            fullWidth
            disabled={!sheetVariant || sheetVariant.stock_quantity <= 0}
            loading={pendingId !== null}
            loadingText="Adding to cart"
            onClick={() => sheetVariant && add(sheetVariant.id)}
          >
            Add to cart{sheetVariant ? ` · ${formatPrice(sheetVariant.price, product.currency)}` : ""}
          </Button>
        </div>
      </Drawer>
      )}
    </>
  );
}
