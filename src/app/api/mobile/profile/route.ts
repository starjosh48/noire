import type { NextRequest } from "next/server";
import { saveProfile } from "@/lib/account/service";
import { loadProfile } from "@/lib/auth/session";
import { getMobileContext, mobileError, mobileJson, readJson } from "@/lib/mobile/context";

export async function GET(request: NextRequest) {
  const context = await getMobileContext(request);
  if (context instanceof Response) return context;
  if (!context.user) return mobileError("Sign in to see your details.", 401, { code: "SIGNED_OUT" });
  return mobileJson({ profile: await loadProfile(context) });
}

/** Body: { fullName, phone }. */
export async function PATCH(request: NextRequest) {
  const context = await getMobileContext(request);
  if (context instanceof Response) return context;
  const body = (await readJson(request)) as { fullName?: unknown; phone?: unknown } | null;
  const result = await saveProfile(context, { fullName: body?.fullName, phone: body?.phone ?? "" });
  if (result.status !== "saved") return mobileJson(result, { status: context.user ? 422 : 401 });
  return mobileJson({ ...result, profile: await loadProfile(context) });
}
