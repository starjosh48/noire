import type { NextRequest } from "next/server";

/** Public origin of the request, honouring the host's proxy headers outside development. */
export function requestOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (process.env.NODE_ENV !== "development" && forwardedHost) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${forwardedHost}`;
  }
  return request.nextUrl.origin;
}
