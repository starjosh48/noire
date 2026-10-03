"use client";

import { useActionState, useId } from "react";
import { CheckIcon } from "@/components/ui/icons";
import { subscribeToNewsletter, type NewsletterState } from "@/lib/account/actions";
import { cn } from "@/lib/utils";

const initial: NewsletterState = { status: "idle" };

export function NewsletterForm({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const [state, action, pending] = useActionState(subscribeToNewsletter, initial);
  const id = useId();
  const dark = tone === "dark";

  if (state.status === "success") {
    return (
      <p className={cn("flex items-start gap-2 text-[14px]", dark ? "text-ivory" : "text-ink", className)} role="status">
        <CheckIcon size={18} className="mt-0.5 shrink-0" />
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className={cn("w-full", className)} noValidate>
      <label htmlFor={id} className="sr-only">
        Email address
      </label>
      <div className={cn("flex items-center border-b", dark ? "border-ivory/50" : "border-ink")}>
        <input
          id={id}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          aria-invalid={state.status === "error" || undefined}
          aria-describedby={state.status === "error" ? `${id}-error` : undefined}
          className={cn(
            "h-12 w-full bg-transparent text-[15px] focus:outline-none",
            dark ? "text-ivory placeholder:text-ivory/50" : "text-ink placeholder:text-faint",
          )}
        />
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "shrink-0 py-3 pl-4 text-[12px] uppercase tracking-[0.16em] transition-opacity disabled:opacity-50",
            dark ? "text-ivory" : "text-ink",
          )}
        >
          {pending ? "Joining…" : "Subscribe"}
        </button>
      </div>
      {state.status === "error" && (
        <p id={`${id}-error`} className={cn("mt-2 text-[13px]", dark ? "text-[#f0b9b0]" : "text-danger")} role="alert">
          {state.message}
        </p>
      )}
    </form>
  );
}
