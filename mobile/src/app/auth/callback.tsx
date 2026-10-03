import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useAuth } from "~/auth/auth-provider";
import { Button } from "~/components/button";
import { ErrorState, LoadingState } from "~/components/states";

/**
 * Where an email sign-in link (or a Google sign-in on Android) opens the app:
 * noire://auth/callback?code=…  The code is exchanged for a session, then the customer lands
 * on their account.
 */
export default function AuthCallbackScreen() {
  const url = Linking.useURL();
  const { completeFromUrl } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (!url || handled.current) return;
    handled.current = true;
    completeFromUrl(url).then((result) => {
      if (result.ok) router.replace("/account");
      else setError(result.error ?? "Sign-in couldn't be completed. Please try again.");
    });
  }, [url, completeFromUrl]);

  if (error) {
    return (
      <View style={{ flex: 1, paddingBottom: 48 }}>
        <ErrorState message={`${error} Sign-in links work once and expire after an hour.`} />
        <Button label="Back to sign in" variant="secondary" onPress={() => router.replace("/sign-in")} style={{ marginHorizontal: 40 }} />
      </View>
    );
  }
  return <LoadingState />;
}
