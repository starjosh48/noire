import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Platform } from "react-native";
import { useCartCount } from "~/cart/cart";
import { useColors } from "~/theme";

/** The system tab bar (iOS and Android), with the cart count as a native badge. */
export default function TabsLayout() {
  const count = useCartCount();
  const c = useColors();
  return (
    <NativeTabs
      tintColor={c.ink}
      iconColor={{ default: c.faint, selected: c.ink }}
      backgroundColor={Platform.OS === "android" ? c.ivory : undefined}
      badgeBackgroundColor={c.ink}
      labelVisibilityMode="labeled"
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="shop">
        <NativeTabs.Trigger.Icon sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }} md="grid_view" />
        <NativeTabs.Trigger.Label>Shop</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="discover">
        <NativeTabs.Trigger.Icon sf={{ default: "wand.and.stars", selected: "wand.and.stars" }} md="explore" />
        <NativeTabs.Trigger.Label>Discover</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="cart">
        <NativeTabs.Trigger.Icon sf={{ default: "bag", selected: "bag.fill" }} md="shopping_bag" />
        <NativeTabs.Trigger.Label>Cart</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Badge hidden={count === 0}>{String(count)}</NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Icon sf={{ default: "person", selected: "person.fill" }} md="person" />
        <NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
