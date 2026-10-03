"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AlertIcon, CheckIcon, CloseIcon } from "./icons";

type ToastTone = "success" | "error" | "info";
type Toast = {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
  /** One follow-up action, e.g. "View cart". */
  action?: { label: string; onClick: () => void };
  /** Toasts with the same slot replace each other instead of stacking (e.g. repeated adds). */
  slot?: string;
};
type ToastInput = Omit<Toast, "id">;

const ToastContext = createContext<{ toast: (input: ToastInput) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx.toast;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = ++nextId.current;
      setToasts((current) => {
        const replaced = input.slot ? current.filter((t) => t.slot === input.slot) : [];
        for (const t of replaced) {
          window.clearTimeout(timers.current.get(t.id));
          timers.current.delete(t.id);
        }
        return [...current.filter((t) => !replaced.includes(t)).slice(-2), { ...input, id }];
      });
      timers.current.set(id, window.setTimeout(() => dismiss(id), input.tone === "error" ? 7000 : 4500));
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:top-auto sm:bottom-4 sm:left-auto sm:right-4 sm:items-end sm:p-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 border bg-paper px-4 py-3.5 shadow-[0_18px_40px_-20px_rgba(26,25,24,0.35)] animate-rise",
              t.tone === "error" ? "border-danger/30" : "border-line",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                t.tone === "error" ? "bg-danger-soft text-danger" : "bg-ink text-ivory",
              )}
            >
              {t.tone === "error" ? <AlertIcon size={14} /> : <CheckIcon size={12} strokeWidth={2} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-ink">{t.title}</p>
              {t.description && <p className="mt-0.5 text-[13px] leading-snug text-muted">{t.description}</p>}
              {t.action && (
                <button
                  type="button"
                  onClick={() => {
                    t.action?.onClick();
                    dismiss(t.id);
                  }}
                  className="mt-2 text-[11px] font-medium uppercase tracking-[0.16em] text-ink link-underline"
                >
                  {t.action.label}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="-m-1 p-1 text-muted transition-colors hover:text-ink"
              aria-label="Dismiss notification"
            >
              <CloseIcon size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
