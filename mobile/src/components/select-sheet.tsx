import Feather from "@expo/vector-icons/Feather";
import { useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts, gutter, makeStyles, useColors } from "~/theme";

type Props = {
  label: string;
  value: string | undefined;
  options: readonly string[];
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
};

/** A form field that opens a bottom sheet of choices (e.g. the 37 Nigerian states). */
export function SelectSheet({ label, value, options, onChange, error, placeholder = "Choose…" }: Props) {
  const styles = useStyles();
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ?? "not chosen"}`}
        accessibilityHint={error ?? "Opens a list to choose from"}
        onPress={() => setOpen(true)}
        style={[styles.field, !!error && { borderColor: colors.danger }]}
      >
        <Text style={[styles.value, !value && { color: colors.faint }]}>{value ?? placeholder}</Text>
        <Feather name="chevron-down" size={18} color={colors.muted} />
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{label}</Text>
          <FlatList
            data={options}
            keyExtractor={(o) => o}
            initialScrollIndex={value ? Math.max(0, options.indexOf(value) - 3) : 0}
            getItemLayout={(_, index) => ({ length: 52, offset: 52 * index, index })}
            renderItem={({ item }) => {
              const selected = item === value;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.stone }]}
                >
                  <Text style={[styles.optionText, selected && { fontFamily: fonts.sansMedium }]}>{item}</Text>
                  {selected && <Feather name="check" size={18} color={colors.ink} />}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  label: { fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", color: colors.muted, marginBottom: 8 },
  field: {
    minHeight: 50,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  value: { fontFamily: fonts.sans, fontSize: 16, color: colors.ink },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.danger, marginTop: 6 },
  backdrop: { flex: 1, backgroundColor: "rgba(26, 25, 24, 0.38)" },
  sheet: { maxHeight: "70%", backgroundColor: colors.ivory, paddingTop: 10, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.sand, alignSelf: "center" },
  sheetTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.ink, paddingHorizontal: gutter, paddingVertical: 14 },
  option: { height: 52, paddingHorizontal: gutter, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  optionText: { fontFamily: fonts.sans, fontSize: 16, color: colors.ink },
}));
