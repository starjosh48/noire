import * as SecureStore from "expo-secure-store";

// A guest's cart lives on the server; the app only keeps its id (the same role as the website's
// guest cart cookie). Signed-in customers don't need it: their cart belongs to their account.

const KEY = "noire.guestCart";
let current: string | null | undefined;

export async function getCartToken() {
  if (current === undefined) current = await SecureStore.getItemAsync(KEY);
  return current;
}

/** Stores what the server answered. null clears it (e.g. after merging into an account). */
export async function setCartToken(token: string | null) {
  if (token === (await getCartToken())) return;
  current = token;
  if (token) await SecureStore.setItemAsync(KEY, token);
  else await SecureStore.deleteItemAsync(KEY);
}
