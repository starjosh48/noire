"use server";

import { z } from "zod";
import { POPUP_REDIRECT_URI, signInWithGoogleAuthCode } from "./google";

const schema = z.object({ code: z.string().min(10).max(2048) });

export type GoogleSignInResult = { ok: true } | { ok: false; error: string };

/** Completes Google sign-in from the popup flow (the code arrives in the page via postMessage). */
export async function signInWithGoogleCode(input: { code: string }): Promise<GoogleSignInResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Google sign-in couldn't be completed. Please try again." };

  const user = await signInWithGoogleAuthCode(parsed.data.code, POPUP_REDIRECT_URI);
  return user
    ? { ok: true }
    : { ok: false, error: "Google sign-in couldn't be completed. Please try again, or continue with email." };
}
