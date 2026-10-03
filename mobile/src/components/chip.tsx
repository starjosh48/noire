import * as Haptics from "expo-haptics";
import { Pressable, Text } from "react-native";
import { fonts, makeStyles } from "~/theme";

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      hitSlop={4}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && { opacity: 0.75 }]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  chip: {
    height: 38,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.paper,
  },
  selected: { backgroundColor: c.ink, borderColor: c.ink },
  label: { fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: c.ink },
  selectedLabel: { color: c.ivory },
}));
