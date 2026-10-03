// Per-weight imports: the package index would bundle every weight of the family.
import { InstrumentSerif_400Regular } from "@expo-google-fonts/instrument-serif/400Regular";
import { InstrumentSerif_400Regular_Italic } from "@expo-google-fonts/instrument-serif/400Regular_Italic";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { colors, fonts } from "~/theme";

// Keep the splash screen up until the brand fonts are ready, so text never flashes in a system font.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
  });
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } }),
  );

  const ready = fontsLoaded || !!fontError;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);
  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[slug]" options={{ title: "" }} />
      </Stack>
    </QueryClientProvider>
  );
}
