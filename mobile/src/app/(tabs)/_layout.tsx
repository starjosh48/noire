import Feather from "@expo/vector-icons/Feather";
import { Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import { useCartCount } from "~/cart/cart";
import { colors, fonts } from "~/theme";

type IconName = React.ComponentProps<typeof Feather>["name"];

function icon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Feather name={name} color={color} size={size - 2} />;
  };
}

export default function TabsLayout() {
  const count = useCartCount();
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
      <Tabs.Screen name="discover" options={{ title: "Discover", tabBarIcon: icon("compass") }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: icon("shopping-bag"),
          tabBarBadge: count > 0 ? count : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.ink, color: colors.ivory, fontFamily: fonts.sansMedium, fontSize: 10 },
          tabBarAccessibilityLabel: count > 0 ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart, empty",
        }}
      />
      <Tabs.Screen name="account" options={{ title: "Account", tabBarIcon: icon("user") }} />
    </Tabs>
  );
}
