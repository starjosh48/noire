import Feather from "@expo/vector-icons/Feather";
import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import { colors, fonts } from "~/theme";

type IconName = React.ComponentProps<typeof Feather>["name"];

function icon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Feather name={name} color={color} size={size - 2} />;
  };
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.ivory },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: { backgroundColor: colors.ivory, borderTopColor: colors.line },
        tabBarLabelStyle: { fontFamily: fonts.sansMedium, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon("home") }} />
      <Tabs.Screen name="shop" options={{ title: "Shop", tabBarIcon: icon("grid") }} />
      <Tabs.Screen name="search" options={{ title: "Search", tabBarIcon: icon("search") }} />
    </Tabs>
  );
}
