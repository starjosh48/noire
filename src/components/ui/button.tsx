import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "inverse" | "cream";
type Size = "sm" | "md" | "lg";
type TextStyle = "caps" | "plain";

const textStyles: Record<TextStyle, string> = {
  caps: "text-[12px] font-medium uppercase tracking-[0.16em]",
  plain: "text-[15px]",
};

const base =
  "group/button relative inline-flex items-center justify-center gap-2.5 whitespace-nowrap transition-[background-color,color,border-color,opacity,translate,scale,box-shadow] duration-300 ease-out-soft hover:-translate-y-px active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-ivory hover:bg-ink-soft hover:shadow-[0_14px_28px_-18px_rgba(26,25,24,0.6)]",
  secondary: "border border-ink/80 text-ink hover:bg-ink hover:text-ivory",
  ghost: "text-ink hover:bg-stone",
  inverse: "bg-ivory text-ink hover:bg-paper",
  /** Light button on photography/dark bands; the same in both themes. */
  cream: "bg-cream text-night hover:bg-white",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4",
  md: "h-12 px-6",
  lg: "h-14 px-8",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  textStyle = "caps",
  fullWidth,
  className,
}: { variant?: Variant; size?: Size; textStyle?: TextStyle; fullWidth?: boolean; className?: string } = {}) {
  return cn(base, textStyles[textStyle], variants[variant], sizes[size], fullWidth && "w-full", className);
}

function Spinner() {
  return (
    <span className="absolute inset-0 flex items-center justify-center gap-1" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1 rounded-full bg-current animate-shimmer"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </span>
  );
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  loading?: boolean;
  loadingText?: string;
};

export function Button({
  variant,
  size,
  textStyle,
  fullWidth,
  loading,
  loadingText = "Please wait",
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, textStyle, fullWidth, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      <span className={cn("inline-flex items-center gap-2.5", loading && "invisible")}>{children}</span>
      {loading && (
        <>
          <Spinner />
          <span className="sr-only">{loadingText}</span>
        </>
      )}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
};

export function ButtonLink({ variant, size, fullWidth, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses({ variant, size, fullWidth, className })} {...props} />;
}
