// The API client: identity headers, the guest cart token, session refresh and error handling.

const mockStore = new Map<string, string>();
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (k: string) => mockStore.get(k) ?? null),
  setItemAsync: jest.fn(async (k: string, v: string) => void mockStore.set(k, v)),
  deleteItemAsync: jest.fn(async (k: string) => void mockStore.delete(k)),
}));
jest.mock("expo-constants", () => ({ __esModule: true, default: { expoConfig: { hostUri: "192.168.1.5:8081" } } }));

const mockGetSession = jest.fn();
const mockRefreshSession = jest.fn();
jest.mock("~/lib/supabase", () => ({ supabase: { auth: { getSession: () => mockGetSession(), refreshSession: () => mockRefreshSession() } } }));

type Client = typeof import("~/api/client");
let client: Client;
const fetchMock = jest.fn();

function respond(status: number, body: unknown) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: async () => body } as Response);
}

const session = (token: string) => ({ data: { session: { access_token: token } } });
type Failure = { status: number; message: string; offline: boolean; body: { cart: unknown } };
const failure = (promise: Promise<unknown>) =>
  promise.then(
    () => {
      throw new Error("expected the request to fail");
    },
    (error: unknown) => error as Failure,
  );
const headersOf = (call: number) => fetchMock.mock.calls[call][1].headers as Record<string, string>;

beforeEach(() => {
  jest.resetModules();
  mockStore.clear();
  fetchMock.mockReset();
  mockGetSession.mockReset().mockResolvedValue({ data: { session: null } });
  mockRefreshSession.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  // A fresh copy per test: the client caches the guest cart id in memory.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  client = require("~/api/client");
});

test("in development the API is the computer running Expo, on the website's port", () => {
  expect(client.API_URL).toBe("http://192.168.1.5:3100");
});

test("guests: no Authorization header; the guest cart id from the server is kept and sent back", async () => {
  fetchMock.mockReturnValueOnce(respond(200, { ok: true, cart: {}, cartToken: "11111111-1111-4111-8111-111111111111" }));
  fetchMock.mockReturnValueOnce(respond(200, { ok: true, cart: {} }));

  await client.apiFetch("/cart/items", { method: "POST", body: "{}" });
  expect(headersOf(0).Authorization).toBeUndefined();
  expect(headersOf(0)["X-Noire-Cart"]).toBeUndefined();

  await client.apiFetch("/cart");
  expect(headersOf(1)["X-Noire-Cart"]).toBe("11111111-1111-4111-8111-111111111111");
});

test("a null cartToken (e.g. after merging into an account) clears the stored guest cart", async () => {
  mockStore.set("noire.guestCart", "22222222-2222-4222-8222-222222222222");
  fetchMock.mockReturnValueOnce(respond(200, { ok: true, cartToken: null }));
  fetchMock.mockReturnValueOnce(respond(200, { ok: true }));
  await client.apiFetch("/session");
  await client.apiFetch("/cart");
  expect(headersOf(1)["X-Noire-Cart"]).toBeUndefined();
  expect(mockStore.has("noire.guestCart")).toBe(false);
});

test("signed in: the Supabase access token is sent as a bearer token", async () => {
  mockGetSession.mockResolvedValue(session("token-a"));
  fetchMock.mockReturnValueOnce(respond(200, { ok: true }));
  await client.apiFetch("/orders");
  expect(headersOf(0).Authorization).toBe("Bearer token-a");
  expect(fetchMock.mock.calls[0][0]).toBe("http://192.168.1.5:3100/api/mobile/orders");
});

test("an expired token is refreshed once and the request retried", async () => {
  mockGetSession.mockResolvedValue(session("old"));
  mockRefreshSession.mockResolvedValue(session("new"));
  fetchMock.mockReturnValueOnce(respond(401, { error: "expired", code: "SESSION_EXPIRED" }));
  fetchMock.mockReturnValueOnce(respond(200, { orders: [] }));
  const expired = jest.fn();
  client.setSessionExpiredHandler(expired);

  await expect(client.apiFetch("/orders")).resolves.toEqual({ orders: [] });
  expect(headersOf(1).Authorization).toBe("Bearer new");
  expect(expired).not.toHaveBeenCalled();
});

test("a session the server still rejects after refreshing signs the app out", async () => {
  mockGetSession.mockResolvedValue(session("old"));
  mockRefreshSession.mockResolvedValue(session("new"));
  fetchMock.mockReturnValue(respond(401, { error: "Your session has expired. Please sign in again.", code: "SESSION_EXPIRED" }));
  const expired = jest.fn();
  client.setSessionExpiredHandler(expired);

  await expect(client.apiFetch("/orders")).rejects.toMatchObject({ status: 401, code: "SESSION_EXPIRED" });
  expect(expired).toHaveBeenCalledTimes(1);
});

test("no connection: a friendly offline error, never a crash", async () => {
  fetchMock.mockRejectedValueOnce(new TypeError("Network request failed"));
  const error = await failure(client.apiFetch("/cart"));
  expect(error).toBeInstanceOf(client.ApiError);
  expect(error.offline).toBe(true);
  expect(error.message).toMatch(/couldn't reach NOIRÉ/);
});

test("server errors never leak details; refusals keep their message and body", async () => {
  fetchMock.mockReturnValueOnce(respond(500, { stack: "Error: boom at …" }));
  await expect(client.apiFetch("/cart")).rejects.toMatchObject({ status: 500, message: "Something went wrong. Please try again." });

  const cart = { lines: [], itemCount: 0 };
  fetchMock.mockReturnValueOnce(respond(422, { ok: false, error: "This size has just sold out.", cart }));
  const error = await failure(client.apiFetch("/cart/items", { method: "POST", body: "{}" }));
  expect(error.message).toBe("This size has just sold out.");
  expect(error.body.cart).toEqual(cart);
});
