import { Pressable, StyleSheet, Text, type PressableProps } from "react-native";
import { colors, fonts } from "~/theme";

type ButtonProps = Omit<PressableProps, "children"> & {
  label: string;
  variant?: "primary" | "secondary";
};

export function Button({ label, variant = "primary", disabled, style, ...props }: ButtonProps) {
  const secondary = variant === "secondary";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={(state) => [
        styles.base,
        secondary ? styles.secondary : styles.primary,
        state.pressed && { opacity: 0.8 },
        disabled && { opacity: 0.45 },
        typeof style === "function" ? style(state) : style,
      ]}
      {...props}
    >
      <Text style={[styles.label, { color: secondary ? colors.ink : colors.ivory }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: colors.ink },
  secondary: { borderWidth: 1, borderColor: colors.ink },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
});
