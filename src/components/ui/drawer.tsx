"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CloseIcon } from "./icons";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Visually hide the title (still announced to assistive tech). */
  hideTitle?: boolean;
  side?: "right" | "left" | "top" | "bottom";
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/**
 * Modal panel built on <dialog>: native focus trapping, Escape to close and an inert page
 * behind it. Slides in with CSS transitions (@starting-style).
 */
export function Drawer({ open, onClose, title, hideTitle, side = "right", children, footer, className }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
    }
    if (!open) document.documentElement.style.overflow = "";
  }, [open]);

  useEffect(() => {
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, []);

  const position = {
    right:
      "ml-auto mr-0 h-dvh max-h-dvh w-full max-w-[440px] translate-x-full open:translate-x-0 starting:open:translate-x-full",
    left: "mr-auto ml-0 h-dvh max-h-dvh w-full max-w-[min(400px,86vw)] -translate-x-full open:translate-x-0 starting:open:-translate-x-full",
    top: "mt-0 mb-auto w-full max-w-none -translate-y-4 opacity-0 open:translate-y-0 open:opacity-100 starting:open:-translate-y-4 starting:open:opacity-0",
    bottom: "mb-0 mt-auto max-h-[85dvh] w-full max-w-none translate-y-full rounded-t-2xl open:translate-y-0 starting:open:translate-y-full",
  }[side];

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // Clicks on the backdrop land on the <dialog> element itself.
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "m-0 bg-ivory p-0 text-ink shadow-[0_0_60px_-20px_rgba(0,0,0,0.35)] transition-[translate,opacity,display,overlay] duration-500 ease-out-soft transition-discrete",
        position,
        className,
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-4 md:px-7">
          <h2 id={titleId} className={cn("eyebrow text-ink", hideTitle && "sr-only")}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 flex size-10 items-center justify-center text-ink transition-opacity hover:opacity-60"
            aria-label="Close"
          >
            <CloseIcon size={20} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="border-t border-line bg-paper">{footer}</div>}
      </div>
    </dialog>
  );
}
