import * as Haptics from "expo-haptics";
import { Pressable, Text, type PressableProps } from "react-native";
import { fonts, makeStyles, onImage } from "~/theme";

type ButtonProps = Omit<PressableProps, "children"> & {
  label: string;
  /** primary: ink fill · secondary: outline · light: cream fill for use over photography */
  variant?: "primary" | "secondary" | "light";
  size?: "regular" | "compact";
};

export function Button({ label, variant = "primary", size = "regular", disabled, style, onPress, ...props }: ButtonProps) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={(e) => {
        void Haptics.selectionAsync();
        onPress?.(e);
      }}
      style={(state) => [
        styles.base,
        size === "compact" && styles.compact,
        styles[variant],
        state.pressed && { opacity: 0.82, transform: [{ scale: 0.985 }] },
        disabled && { opacity: 0.45 },
        typeof style === "function" ? style(state) : style,
      ]}
      {...props}
    >
      <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  base: { minHeight: 54, paddingHorizontal: 24, alignItems: "center", justifyContent: "center", borderRadius: 999 },
  compact: { minHeight: 44, paddingHorizontal: 18 },
  primary: { backgroundColor: c.ink },
  secondary: { borderWidth: 1, borderColor: c.ink },
  light: { backgroundColor: onImage.cream },
  label: { fontFamily: fonts.sansMedium, fontSize: 12, letterSpacing: 1.8, textTransform: "uppercase" },
  primaryLabel: { color: c.ivory },
  secondaryLabel: { color: c.ink },
  lightLabel: { color: onImage.night },
}));
