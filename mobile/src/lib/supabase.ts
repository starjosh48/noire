import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { AppState } from "react-native";

/**
 * Session storage in the device keychain/keystore. A Supabase session is larger than one
 * secure-store entry should hold (~2 KB), so values are split across numbered entries.
 */
const CHUNK = 1800;
const keyFor = (key: string, i?: number) => `${key.replace(/[^A-Za-z0-9._-]/g, "_")}${i === undefined ? "" : `.${i}`}`;

const secureStorage = {
  async getItem(key: string) {
    const count = Number(await SecureStore.getItemAsync(keyFor(key)));
    if (!count) return null;
    const parts = await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(keyFor(key, i))));
    return parts.some((p) => p === null) ? null : parts.join("");
  },
  async setItem(key: string, value: string) {
    await secureStorage.removeItem(key);
    const parts = value.match(new RegExp(`[\\s\\S]{1,${CHUNK}}`, "g")) ?? [""];
    await Promise.all(parts.map((part, i) => SecureStore.setItemAsync(keyFor(key, i), part)));
    await SecureStore.setItemAsync(keyFor(key), String(parts.length));
  },
  async removeItem(key: string) {
    const count = Number(await SecureStore.getItemAsync(keyFor(key)));
    await Promise.all(Array.from({ length: count || 0 }, (_, i) => SecureStore.deleteItemAsync(keyFor(key, i))));
    await SecureStore.deleteItemAsync(keyFor(key));
  },
};

/**
 * The website's Supabase project (same users, same Google sign-in). In development, a local
 * Supabase on the computer running `expo start` is used unless EXPO_PUBLIC_SUPABASE_URL is set.
 * Only the public anon key belongs here; everything privileged stays on the server.
 */
function supabaseUrl() {
  const configured = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const devHost = Constants.expoConfig?.hostUri?.split(":")[0];
  return `http://${devHost ?? "localhost"}:54321`;
}

const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
if (!anonKey) {
  throw new Error("EXPO_PUBLIC_SUPABASE_ANON_KEY is missing. Copy mobile/.env.example to mobile/.env.local.");
}

export const supabase = createClient(supabaseUrl(), anonKey, {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});

// Refresh tokens only while the app is in the foreground (Supabase's React Native guidance).
AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
