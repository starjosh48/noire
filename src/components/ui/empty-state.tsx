import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
  /** Use "h1" when the empty state is the whole page. */
  headingLevel?: "h1" | "h2";
};

export function EmptyState({ title, description, action, icon, className, headingLevel = "h2" }: EmptyStateProps) {
  const Heading = headingLevel;
  return (
    <div className={cn("flex flex-col items-center px-6 py-20 text-center md:py-28", className)}>
      {icon && <div className="mb-6 text-faint">{icon}</div>}
      <Heading className="display text-[36px] md:text-[48px]">{title}</Heading>
      {description && <div className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">{description}</div>}
      {action && <div className="mt-8 flex flex-col gap-3 sm:flex-row">{action}</div>}
    </div>
  );
}
