import { Pressable, StyleSheet, Text } from "react-native";
import { colors, fonts } from "~/theme";

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && { opacity: 0.75 }]}
    >
      <Text style={[styles.label, selected && { color: colors.ivory }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 36,
    paddingHorizontal: 14,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  selected: { backgroundColor: colors.ink, borderColor: colors.ink },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.ink,
  },
});
