"use client";

import { useState } from "react";
import { signOutAndReload } from "@/components/layout/account-menu";

export function SignOutLink() {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true);
        signOutAndReload();
      }}
      className="text-ink link-underline disabled:opacity-50"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
