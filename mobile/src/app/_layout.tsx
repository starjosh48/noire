// Per-weight imports: the package index would bundle every weight of the family.
import { InstrumentSerif_400Regular } from "@expo-google-fonts/instrument-serif/400Regular";
import { InstrumentSerif_400Regular_Italic } from "@expo-google-fonts/instrument-serif/400Regular_Italic";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "~/auth/auth-provider";
import { useCartRealtime } from "~/cart/cart";
import { OfflineBanner } from "~/components/offline-banner";
import { ToastProvider } from "~/components/toast";
import { createQueryClient } from "~/lib/query";
import { colors, fonts } from "~/theme";

// Keep the splash screen up until the brand fonts and the saved session are ready, so nothing
// flashes in a system font or as "signed out".
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
  });
  const [queryClient] = useState(createQueryClient);

  if (!fontsLoaded && !fontError) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function App() {
  const { ready } = useAuth();
  useCartRealtime();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);
  if (!ready) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.ivory },
          headerStyle: { backgroundColor: colors.ivory },
          headerShadowVisible: false,
          headerTintColor: colors.ink,
          headerTitleStyle: { fontFamily: fonts.sansMedium, fontSize: 15 },
          headerBackButtonDisplayMode: "minimal",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: "" }} />
        <Stack.Screen name="product/[slug]" options={{ title: "" }} />
        <Stack.Screen name="search" options={{ title: "Search" }} />
        <Stack.Screen name="checkout" options={{ title: "Checkout" }} />
        <Stack.Screen name="order/[orderNumber]" options={{ title: "Order" }} />
        <Stack.Screen name="orders" options={{ title: "Your orders" }} />
        <Stack.Screen name="sign-in" options={{ title: "", presentation: "modal" }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="payment-return" options={{ headerShown: false }} />
      </Stack>
      <OfflineBanner />
    </>
  );
}
