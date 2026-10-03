"use client";

import Script from "next/script";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { signInWithGoogleCode } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/client";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

type GoogleButtonProps = {
  next: string;
  /** Google sign-in is enabled in Supabase. */
  enabled?: boolean;
  /** Use Google's popup with this site's own button (client ID + secret configured). */
  direct?: boolean;
  label?: string;
};

type CodeResponse = { code?: string; error?: string };
type CodeClient = { requestCode: () => void };
type GoogleOAuth2 = {
  accounts: {
    oauth2: {
      initCodeClient: (config: {
        client_id: string;
        scope: string;
        ux_mode: "popup";
        select_account?: boolean;
        callback: (response: CodeResponse) => void;
        error_callback?: (error: { type: string }) => void;
      }) => CodeClient;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleOAuth2;
  }
}

/**
 * "Continue with Google" in the NOIRÉ button style.
 * Direct mode opens Google's popup on this site, so Google's screen names this domain;
 * otherwise it falls back to Supabase's redirect flow.
 */
export function GoogleButton({ next, enabled = true, direct = false, label = "Continue with Google" }: GoogleButtonProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const codeClient = useRef<CodeClient | null>(null);
  const useDirect = enabled && direct && !!googleClientId;

  const fail = (description = "Please try again, or continue with your email address.") => {
    setLoading(false);
    toast({ tone: "error", title: "Google sign-in didn't complete", description });
  };

  const onCode = async ({ code, error }: CodeResponse) => {
    if (error || !code) {
      if (error === "access_denied") {
        setLoading(false);
        return;
      }
      return fail("Google didn't allow the sign-in. If NOIRÉ is still in testing, your Google account must be added as a test user.");
    }
    try {
      const result = await signInWithGoogleCode({ code });
      if (!result.ok) return fail(result.error);
      const destination = new URL(next, window.location.origin);
      destination.searchParams.set("signed_in", "1");
      // Full navigation so the header, cart and account reflect the new session everywhere.
      window.location.assign(destination.toString());
    } catch {
      fail("We couldn't reach NOIRÉ. Check your connection and try again.");
    }
  };

  const signInDirect = () => {
    if (!window.google || !googleClientId) return fail();
    // Create the client on first click; requestCode must run inside the click to open the popup.
    codeClient.current ??= window.google.accounts.oauth2.initCodeClient({
      client_id: googleClientId,
      scope: "openid email profile",
      ux_mode: "popup",
      select_account: true,
      callback: onCode,
      error_callback: ({ type }) => {
        if (type === "popup_failed_to_open") {
          // Pop-ups blocked (in-app browsers, strict settings): continue as a full-page redirect.
          window.location.assign(new URL(`/auth/google/start?next=${encodeURIComponent(next)}`, window.location.origin).toString());
        } else {
          // popup_closed: the customer closed the window themselves.
          setLoading(false);
        }
      },
    });
    setLoading(true);
    codeClient.current.requestCode();
  };

  const signInWithRedirect = async () => {
    setLoading(true);
    try {
      const { error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
      // The browser is now navigating to Google; keep the loading state.
    } catch {
      fail();
    }
  };

  return (
    <div>
      {useDirect && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onReady={() => setScriptReady(true)}
        />
      )}
      <Button
        variant="secondary"
        size="lg"
        fullWidth
        textStyle="plain"
        onClick={useDirect ? signInDirect : signInWithRedirect}
        loading={loading}
        loadingText="Signing in with Google"
        disabled={!enabled || (useDirect && !scriptReady)}
        aria-describedby={enabled ? undefined : "google-unavailable"}
      >
        <GoogleIcon />
        {label}
      </Button>
      {!enabled && (
        <p id="google-unavailable" className="mt-2 text-[13px] text-muted">
          Google sign-in isn&rsquo;t available right now. Please continue with your email address.
        </p>
      )}
    </div>
  );
}
