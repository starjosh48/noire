import { useNetInfo } from "@react-native-community/netinfo";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts, makeStyles } from "~/theme";

/** A quiet strip at the top while the phone is offline. Nothing pretends to save meanwhile. */
export function OfflineBanner() {
  const styles = useStyles();
  const { isConnected, isInternetReachable } = useNetInfo();
  const insets = useSafeAreaInsets();
  if (isConnected !== false && isInternetReachable !== false) return null;
  return (
    <View style={[styles.banner, { paddingTop: insets.top + 6 }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={styles.text}>You’re offline. Your cart will refresh when you reconnect.</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: 8,
    paddingHorizontal: 20,
    backgroundColor: colors.ink,
  },
  text: { fontFamily: fonts.sans, fontSize: 12, color: colors.ivory, textAlign: "center" },
}));
