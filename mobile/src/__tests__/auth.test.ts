// Reading the link Supabase sends the customer back with after Google or an email link.

import { authRedirectUrl, readAuthResult } from "~/auth/auth-provider";

jest.mock("~/lib/supabase", () => ({ supabase: { auth: {} } }));
jest.mock("~/api/client", () => ({ apiFetch: jest.fn(), setSessionExpiredHandler: jest.fn() }));
jest.mock("~/api/cart-token", () => ({ setCartToken: jest.fn() }));
jest.mock("expo-web-browser", () => ({ maybeCompleteAuthSession: jest.fn(), openAuthSessionAsync: jest.fn() }));
jest.mock("expo-linking", () => ({ createURL: (path: string) => `noire://${path}` }));

test("the app's sign-in return link", () => {
  expect(authRedirectUrl()).toBe("noire://auth/callback");
});

test("PKCE: the code arrives in the query string", () => {
  expect(readAuthResult("noire://auth/callback?code=abc123")).toMatchObject({ code: "abc123", error: null });
});

test("Expo Go links work too", () => {
  expect(readAuthResult("exp://192.168.1.5:8081/--/auth/callback?code=xyz")).toMatchObject({ code: "xyz" });
});

test("implicit flow: tokens arrive in the fragment", () => {
  const result = readAuthResult("noire://auth/callback#access_token=a&refresh_token=r&token_type=bearer");
  expect(result).toMatchObject({ code: null, accessToken: "a", refreshToken: "r" });
});

test("a cancelled or failed sign-in comes back as an error, not a session", () => {
  const result = readAuthResult("noire://auth/callback?error=access_denied&error_description=User+cancelled");
  expect(result.error).toBe("User cancelled");
  expect(result.code).toBeNull();
});
