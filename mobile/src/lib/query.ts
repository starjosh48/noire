import NetInfo from "@react-native-community/netinfo";
import { focusManager, onlineManager, QueryClient } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";
import { ApiError } from "~/api/client";

// Refetch when the app returns to the foreground (e.g. the cart was changed on the website).
AppState.addEventListener("change", (state) => {
  if (Platform.OS !== "web") focusManager.setFocused(state === "active");
});

// Pause requests while offline; queries refetch (and the cart re-syncs) when the connection returns.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(state.isConnected !== false && state.isInternetReachable !== false)),
);

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        // Retry network blips, not answers: a 404 or a rejected session won't change on retry.
        retry: (count, error) => count < 2 && (!(error instanceof ApiError) || error.offline || error.status >= 500),
      },
      mutations: {
        // Never replay a purchase or cart change automatically; the customer decides.
        retry: false,
        networkMode: "always",
      },
    },
  });
}
