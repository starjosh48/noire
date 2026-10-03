"use client";

import { cn } from "@/lib/utils";
import { MinusIcon, PlusIcon } from "./icons";

type QuantityStepperProps = {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  label: string;
  size?: "sm" | "md";
};

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function QuantityStepper({ value, min = 1, max, onChange, disabled, label, size = "md" }: QuantityStepperProps) {
  const dimension = size === "sm" ? "h-9 w-9" : "h-12 w-12";
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex items-center border border-line bg-paper", disabled && "opacity-60")}
    >
      <button
        type="button"
        className={cn(dimension, "flex items-center justify-center text-ink transition-colors hover:bg-stone disabled:text-faint disabled:hover:bg-transparent")}
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= min}
        aria-label={`Decrease ${lowerFirst(label)}`}
      >
        <MinusIcon size={size === "sm" ? 14 : 16} />
      </button>
      <output
        aria-live="polite"
        className={cn("min-w-8 text-center tabular-nums", size === "sm" ? "text-[13px]" : "text-[15px]")}
      >
        {value}
      </output>
      <button
        type="button"
        className={cn(dimension, "flex items-center justify-center text-ink transition-colors hover:bg-stone disabled:text-faint disabled:hover:bg-transparent")}
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label={`Increase ${lowerFirst(label)}`}
      >
        <PlusIcon size={size === "sm" ? 14 : 16} />
      </button>
    </div>
  );
}
