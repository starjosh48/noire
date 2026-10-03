import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "~/theme";

type Toast = { title: string; description?: string; tone?: "default" | "error"; action?: { label: string; onPress: () => void } };

const ToastContext = createContext<((toast: Toast) => void) | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

/** Small confirmations above the tab bar ("Added to cart · View cart"); the shopper stays put. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(Toast & { id: number }) | null>(null);
  const opacity = useState(() => new Animated.Value(0))[0];
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const insets = useSafeAreaInsets();

  const hide = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setToast(null));
  }, [opacity]);

  const show = useCallback(
    (next: Toast) => {
      clearTimeout(timer.current);
      setToast({ ...next, id: Date.now() });
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      AccessibilityInfo.announceForAccessibility([next.title, next.description].filter(Boolean).join(". "));
      timer.current = setTimeout(hide, next.tone === "error" ? 5000 : 3200);
    },
    [opacity, hide],
  );

  useEffect(() => () => clearTimeout(timer.current), []);
  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.wrap, { bottom: insets.bottom + 72, opacity }]}
        >
          <View style={[styles.toast, toast.tone === "error" && { backgroundColor: colors.danger }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{toast.title}</Text>
              {toast.description && <Text style={styles.description}>{toast.description}</Text>}
            </View>
            {toast.action && (
              <Pressable
                accessibilityRole="button"
                hitSlop={10}
                onPress={() => {
                  hide();
                  toast.action?.onPress();
                }}
              >
                <Text style={styles.action}>{toast.action.label}</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16 },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: colors.ink,
  },
  title: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ivory },
  description: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: colors.sand, marginTop: 2 },
  action: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.ivory,
    textDecorationLine: "underline",
  },
});
