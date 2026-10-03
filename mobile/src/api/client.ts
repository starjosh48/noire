import Constants from "expo-constants";

/**
 * The NOIRÉ website, which serves the app's API (/api/mobile/*) and images.
 * EXPO_PUBLIC_API_URL wins when set (release builds). In development the app talks to the
 * computer running `expo start`, where the website runs on port 3100.
 */
function resolveApiUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const devHost = Constants.expoConfig?.hostUri?.split(":")[0];
  return `http://${devHost ?? "localhost"}:3100`;
}

export const API_URL = resolveApiUrl();

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const OFFLINE_MESSAGE = "We couldn't reach NOIRÉ. Check your connection and try again.";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // A manual timeout: AbortSignal.timeout isn't available in every React Native runtime.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  init?.signal?.addEventListener("abort", () => controller.abort());

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/mobile${path}`, {
      ...init,
      headers: { Accept: "application/json", ...init?.headers },
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(OFFLINE_MESSAGE, 0);
  } finally {
    clearTimeout(timer);
  }

  const body = (await response.json().catch(() => null)) as (T & { error?: string; code?: string }) | null;
  if (!response.ok) {
    throw new ApiError(body?.error ?? "Something went wrong. Please try again.", response.status, body?.code);
  }
  if (body === null) throw new ApiError("Something went wrong. Please try again.", response.status);
  return body;
}
