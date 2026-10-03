import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Space at the bottom of a tab screen that the system tab bar covers. On iOS the native tab bar
 * floats over full-screen content; on Android it sits below the screen.
 */
export function useTabBarInset() {
  const insets = useSafeAreaInsets();
  return Platform.OS === "ios" ? insets.bottom + 52 : 12;
}
