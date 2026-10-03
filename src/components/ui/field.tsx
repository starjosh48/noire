import { forwardRef, useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AlertIcon, ChevronDownIcon } from "./icons";

const control =
  "peer block w-full rounded-none border bg-paper px-4 text-[15px] text-ink placeholder:text-faint transition-[border-color,box-shadow] duration-200 focus:outline-none focus-visible:outline-none focus:border-ink focus:shadow-[0_0_0_1px_var(--color-ink)] disabled:bg-stone disabled:text-muted";

type FieldShellProps = {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  children: ReactNode;
  className?: string;
};

function FieldShell({ id, label, error, hint, optional, children, className }: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="flex items-baseline justify-between text-[13px] font-medium text-ink">
        <span>{label}</span>
        {optional && <span className="text-[12px] font-normal text-muted">Optional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-[13px] text-danger" role="alert">
          <AlertIcon size={15} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = ComponentProps<"input"> & {
  label: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  containerClassName?: string;
};

export const TextField = forwardRef<HTMLInputElement, InputProps>(function TextField(
  { label, error, hint, optional, containerClassName, className, id, ...props },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} optional={optional} className={containerClassName}>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(control, "h-12", error ? "border-danger" : "border-line hover:border-muted", className)}
        {...props}
      />
    </FieldShell>
  );
});

type TextAreaProps = ComponentProps<"textarea"> & {
  label: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  containerClassName?: string;
};

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextAreaField(
  { label, error, hint, optional, containerClassName, className, id, ...props },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} optional={optional} className={containerClassName}>
      <textarea
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(control, "min-h-24 py-3", error ? "border-danger" : "border-line hover:border-muted", className)}
        {...props}
      />
    </FieldShell>
  );
});

type SelectProps = ComponentProps<"select"> & {
  label: string;
  error?: string;
  hint?: ReactNode;
  containerClassName?: string;
};

export const SelectField = forwardRef<HTMLSelectElement, SelectProps>(function SelectField(
  { label, error, hint, containerClassName, className, id, children, ...props },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} className={containerClassName}>
      <div className="relative">
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          className={cn(
            control,
            "h-12 appearance-none pr-10",
            error ? "border-danger" : "border-line hover:border-muted",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDownIcon size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
      </div>
    </FieldShell>
  );
});
