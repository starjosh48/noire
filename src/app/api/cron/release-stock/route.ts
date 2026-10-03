import { NextResponse, type NextRequest } from "next/server";
import { releaseAbandonedCheckouts } from "@/lib/orders/maintenance";

/**
 * Daily Vercel Cron job (vercel.json). Vercel sends `Authorization: Bearer $CRON_SECRET`;
 * anything else is refused so the endpoint can't be triggered by the public.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const released = await releaseAbandonedCheckouts();
  return NextResponse.json({ released });
}
