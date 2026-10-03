"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { CheckIcon } from "@/components/ui/icons";
import { updateProfile, type ProfileState } from "@/lib/account/actions";

export function ProfileForm({ email, fullName, phone }: { email: string; fullName: string; phone: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, { status: "idle" });

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <TextField label="Full name" name="fullName" autoComplete="name" defaultValue={fullName} error={state.fieldErrors?.fullName} required />
      <TextField label="Email" value={email} readOnly disabled hint="Your sign-in email can't be changed here." />
      <TextField
        label="Phone"
        name="phone"
        type="tel"
        autoComplete="tel"
        optional
        defaultValue={phone}
        error={state.fieldErrors?.phone}
        hint="Used to prefill checkout."
      />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant="secondary" loading={pending} loadingText="Saving">
          Save details
        </Button>
        {state.status === "saved" && (
          <p className="flex items-center gap-1.5 text-[13px] text-success" role="status">
            <CheckIcon size={15} /> {state.message}
          </p>
        )}
        {state.status === "error" && !state.fieldErrors && (
          <p className="text-[13px] text-danger" role="alert">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
