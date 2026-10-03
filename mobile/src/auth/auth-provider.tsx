import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { apiFetch, setSessionExpiredHandler } from "~/api/client";
import { setCartToken } from "~/api/cart-token";
import { supabase } from "~/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export type SignInResult = { ok: true } | { ok: false; cancelled?: boolean; error?: string };

type AuthContextValue = {
  session: Session | null;
  userId: string | null;
  /** False until the stored session has been restored on launch. */
  ready: boolean;
  /** Set when the server rejected the session; cleared on the next sign-in. */
  expired: boolean;
  signInWithGoogle: () => Promise<SignInResult>;
  sendEmailLink: (email: string) => Promise<SignInResult>;
  completeFromUrl: (url: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Where Supabase sends the customer back after Google or an email link: noire://auth/callback (exp://… in Expo Go). */
export const authRedirectUrl = () => Linking.createURL("auth/callback");

const SIGN_IN_FAILED = "Sign-in couldn't be completed. Please try again.";

/** Reads a sign-in return link: a PKCE code, tokens in the fragment, or an error. */
export function readAuthResult(url: string) {
  const parsed = new URL(url);
  const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  const get = (key: string) => parsed.searchParams.get(key) ?? fragment.get(key);
  return {
    code: get("code"),
    accessToken: get("access_token"),
    refreshToken: get("refresh_token"),
    error: get("error_description") ?? get("error"),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [expired, setExpired] = useState(false);
  const usedCodes = useRef(new Set<string>());

  useEffect(() => {
    // Restore the stored session (refreshing it if needed), then follow every change.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  // Whoever is signed in, every customer-specific query belongs to them: refetch on change.
  const previousUser = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (!ready) return;
    if (previousUser.current !== undefined && previousUser.current !== userId) {
      queryClient.removeQueries({ queryKey: ["me"] });
    }
    previousUser.current = userId;
  }, [ready, userId, queryClient]);

  const signOut = useCallback(async () => {
    // Local scope: signs this app out without ending the customer's website sessions.
    await supabase.auth.signOut({ scope: "local" });
    await setCartToken(null);
    queryClient.removeQueries({ queryKey: ["me"] });
  }, [queryClient]);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setExpired(true);
      void signOut();
    });
  }, [signOut]);

  /** After any sign-in: profile sync, guest orders claimed, guest cart merged (server side). */
  const finishSignIn = useCallback(async () => {
    setExpired(false);
    try {
      await apiFetch("/auth/complete", { method: "POST" });
    } catch {
      // Not fatal: the next cart request merges the guest cart as well.
    }
    await queryClient.invalidateQueries({ queryKey: ["me"] });
  }, [queryClient]);

  const completeFromUrl = useCallback(
    async (url: string): Promise<SignInResult> => {
      let result;
      try {
        result = readAuthResult(url);
      } catch {
        return { ok: false, error: SIGN_IN_FAILED };
      }
      if (result.error) return { ok: false, error: SIGN_IN_FAILED };

      if (result.code) {
        // The same link can arrive twice (browser result and deep link); a code works only once.
        if (usedCodes.current.has(result.code)) return { ok: true };
        usedCodes.current.add(result.code);
        const { error } = await supabase.auth.exchangeCodeForSession(result.code);
        if (error) return { ok: false, error: SIGN_IN_FAILED };
      } else if (result.accessToken && result.refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
        });
        if (error) return { ok: false, error: SIGN_IN_FAILED };
      } else {
        return { ok: false, error: SIGN_IN_FAILED };
      }

      await finishSignIn();
      return { ok: true };
    },
    [finishSignIn],
  );

  const signInWithGoogle = useCallback(async (): Promise<SignInResult> => {
    const redirectTo = authRedirectUrl();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: "select_account" } },
    });
    if (error || !data.url) {
      return { ok: false, error: "Google sign-in is unavailable right now. Please try email instead." };
    }
    const outcome = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (outcome.type !== "success") return { ok: false, cancelled: true };
    return completeFromUrl(outcome.url);
  }, [completeFromUrl]);

  const sendEmailLink = useCallback(async (email: string): Promise<SignInResult> => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: authRedirectUrl(), shouldCreateUser: true },
    });
    if (!error) return { ok: true };
    return {
      ok: false,
      error:
        error.status === 429
          ? "You've requested a few links already. Please wait a minute and try again."
          : "We couldn't send your sign-in link. Please check the address and try again.",
    };
  }, []);

  const value = useMemo(
    () => ({ session, userId, ready, expired, signInWithGoogle, sendEmailLink, completeFromUrl, signOut }),
    [session, userId, ready, expired, signInWithGoogle, sendEmailLink, completeFromUrl, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
