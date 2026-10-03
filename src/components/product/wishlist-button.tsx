"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { useSession } from "@/components/session/session-provider";
import { HeartIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { toggleWishlist } from "@/lib/account/actions";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  productName,
  className,
}: {
  productId: string;
  productName: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const { wishlist, setSaved: setSavedFor } = useSession();
  const saved = wishlist.has(productId);
  const setSaved = (value: boolean) => setSavedFor(productId, value);
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    const previous = saved;
    setSaved(!previous);
    startTransition(async () => {
      const result = await toggleWishlist(productId).catch(() => ({ ok: false as const, error: "Connection problem. Please try again." }));
      if (result.ok) {
        setSaved(result.saved);
        toast({
          tone: "success",
          title: result.saved ? "Saved to your wishlist" : "Removed from your wishlist",
          description: result.saved ? `${productName} is waiting in your account.` : undefined,
        });
        return;
      }
      setSaved(previous);
      if ("requiresAuth" in result && result.requiresAuth) {
        toast({ tone: "info", title: "Sign in to save fragrances", description: "We'll bring you right back here." });
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
      } else {
        toast({ tone: "error", title: "Wishlist not updated", description: result.error });
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
      className={cn(
        "flex size-11 items-center justify-center border border-line text-ink transition-colors hover:border-ink",
        className,
      )}
    >
      <HeartIcon size={20} filled={saved} className={cn("transition-transform", saved && "animate-pop")} />
    </button>
  );
}
