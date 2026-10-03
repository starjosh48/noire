import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  action?: { href: string; label: string };
  className?: string;
  id?: string;
  /** Leave room on the right for carousel controls. */
  reserveControls?: boolean;
};

export function SectionHeading({ eyebrow, title, description, action, className, id, reserveControls }: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-col gap-6 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-2xl">
        <p className="eyebrow text-muted">{eyebrow}</p>
        <h2 id={id} className="display mt-3 text-[40px] md:text-[56px]">
          {title}
        </h2>
        {description && <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">{description}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 self-start text-[12px] uppercase tracking-[0.16em] text-ink link-underline md:self-auto",
            reserveControls && "md:mr-[112px]",
          )}
        >
          {action.label}
          <ArrowRightIcon size={16} />
        </Link>
      )}
    </div>
  );
}
