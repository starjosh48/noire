"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { MailIcon } from "@/components/ui/icons";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().trim().min(1, "Enter your email address.").pipe(z.email("Enter a valid email address, like name@example.com.")),
});

type Values = z.infer<typeof schema>;

export function EmailSignIn({ next }: { next: string }) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }: Values) => {
    setFormError(null);
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        shouldCreateUser: true,
      },
    });
    if (error) {
      setFormError(
        error.status === 429
          ? "You've requested a few links already. Please wait a minute and try again."
          : "We couldn't send your sign-in link. Please check the address and try again.",
      );
      return;
    }
    setSentTo(email);
  };

  if (sentTo) {
    return (
      <div className="border border-line bg-paper p-6 text-center" role="status">
        <MailIcon size={28} className="mx-auto text-ink" />
        <p className="display mt-4 text-[28px]">Check your inbox</p>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          We&rsquo;ve sent a secure sign-in link to <span className="text-ink">{sentTo}</span>. Open it on this device to
          continue. The link expires in one hour.
        </p>
        <button
          type="button"
          onClick={() => setSentTo(null)}
          className="mt-5 text-[12px] uppercase tracking-[0.14em] text-ink link-underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <TextField
        label="Email address"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="name@example.com"
        error={errors.email?.message}
        {...register("email")}
      />
      {formError && (
        <p className="text-[13px] text-danger" role="alert">
          {formError}
        </p>
      )}
      <Button type="submit" size="lg" fullWidth loading={isSubmitting} loadingText="Sending your link">
        Continue with email
      </Button>
      <p className="text-center text-[12px] text-muted">We&rsquo;ll email you a secure link. No password needed.</p>
    </form>
  );
}
