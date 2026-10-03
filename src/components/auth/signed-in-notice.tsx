"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useSession } from "@/components/session/session-provider";
import { useToast } from "@/components/ui/toast";
import { firstName } from "@/lib/format";

/** Confirms a completed sign-in (the auth callback adds ?signed_in=1) and tidies the URL. */
export function SignedInNotice() {
  const { user, ready } = useSession();
  const name = firstName(user?.name) || null;
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const shown = useRef(false);

  useEffect(() => {
    if (!ready || params.get("signed_in") !== "1" || shown.current) return;
    shown.current = true;
    toast({
      tone: "success",
      title: name ? `Welcome, ${name}` : "You're signed in",
      description: "Your cart and orders are saved to your account.",
    });
    const rest = new URLSearchParams(params);
    rest.delete("signed_in");
    const qs = rest.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [params, pathname, router, toast, name, ready]);

  return null;
}
