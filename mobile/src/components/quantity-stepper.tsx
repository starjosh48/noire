import Feather from "@expo/vector-icons/Feather";
import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";
import { fonts, makeStyles, useColors } from "~/theme";

type Props = {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  disabled?: boolean;
};

export function QuantityStepper({ value, min = 1, max, onChange, label, disabled }: Props) {
  const colors = useColors();
  const styles = useStyles();
  const step = (next: number) => {
    if (next < min || next > max || disabled) return;
    void Haptics.selectionAsync();
    onChange(next);
  };
  return (
    <View
      style={[styles.wrap, disabled && { opacity: 0.5 }]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === "increment" ? value + 1 : value - 1)}
    >
      <Pressable onPress={() => step(value - 1)} hitSlop={6} style={styles.button} disabled={value <= min || disabled}>
        <Feather name="minus" size={16} color={value <= min ? colors.sand : colors.ink} />
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable onPress={() => step(value + 1)} hitSlop={6} style={styles.button} disabled={value >= max || disabled}>
        <Feather name="plus" size={16} color={value >= max ? colors.sand : colors.ink} />
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.paper,
    alignSelf: "flex-start",
  },
  button: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  value: { minWidth: 24, textAlign: "center", fontFamily: fonts.sansMedium, fontSize: 15, color: c.ink, fontVariant: ["tabular-nums"] },
}));
