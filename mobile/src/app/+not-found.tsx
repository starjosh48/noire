import { router, Stack } from "expo-router";
import { View } from "react-native";
import { Button } from "~/components/button";
import { EmptyState } from "~/components/states";

export default function NotFoundScreen() {
  return (
    <View style={{ flex: 1, paddingBottom: 48 }}>
      <Stack.Screen options={{ title: "" }} />
      <EmptyState title="This page has moved on" message="It may have been an old link." />
      <Button label="Back to NOIRÉ" variant="secondary" onPress={() => router.replace("/")} style={{ marginHorizontal: 40 }} />
    </View>
  );
}
