import Feather from "@expo/vector-icons/Feather";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { emptyFilters, families, genders, moods, priceRanges, sizes, type CatalogFilters } from "~/shared";
import { fonts, gutter, makeStyles, useColors } from "~/theme";
import { Button } from "./button";
import { Chip } from "./chip";

const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

/**
 * The website's /shop filters in a bottom sheet: family, mood, size, price, availability and
 * gender. Changes are staged and applied together with "Show results".
 */
export function FilterSheet({
  visible,
  value,
  onApply,
  onClose,
}: {
  visible: boolean;
  value: CatalogFilters;
  onApply: (filters: CatalogFilters) => void;
  onClose: () => void;
}) {
  const styles = useStyles();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(value);
  const set = (patch: Partial<CatalogFilters>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <Modal visible={visible} animationType="slide" transparent onShow={() => setDraft(value)} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close filters" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Filters
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={10}>
            <Feather name="x" size={22} color={c.ink} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 16 }}>
          <Group label="Fragrance family">
            {families.map((f) => (
              <Chip key={f.slug} label={f.label} selected={draft.family.includes(f.slug)} onPress={() => set({ family: toggle(draft.family, f.slug) })} />
            ))}
          </Group>
          <Group label="Mood">
            {moods.map((m) => (
              <Chip key={m.slug} label={m.label} selected={draft.mood.includes(m.slug)} onPress={() => set({ mood: toggle(draft.mood, m.slug) })} />
            ))}
          </Group>
          <Group label="Size">
            {sizes.map((s) => (
              <Chip key={s} label={`${s} ml`} selected={draft.size.includes(s)} onPress={() => set({ size: toggle(draft.size, s) })} />
            ))}
          </Group>
          <Group label="Price">
            {priceRanges.map((p) => (
              <Chip key={p.slug} label={p.label} selected={draft.price === p.slug} onPress={() => set({ price: draft.price === p.slug ? null : p.slug })} />
            ))}
          </Group>
          <Group label="For">
            {genders.map((g) => (
              <Chip key={g.slug} label={g.label} selected={draft.gender.includes(g.slug)} onPress={() => set({ gender: toggle(draft.gender, g.slug) })} />
            ))}
          </Group>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>In stock only</Text>
            <Switch
              value={draft.inStock}
              onValueChange={(inStock) => set({ inStock })}
              trackColor={{ true: c.ink, false: c.sand }}
              thumbColor={c.paper}
              accessibilityLabel="In stock only"
            />
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <Button label="Clear" variant="secondary" onPress={() => setDraft({ ...emptyFilters, sort: draft.sort })} style={{ flex: 1 }} />
          <Button label="Show results" onPress={() => onApply(draft)} style={{ flex: 2 }} />
        </View>
      </View>
    </Modal>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  const styles = useStyles();
  return (
    <View style={{ marginTop: 22 }}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  backdrop: { flex: 1, backgroundColor: "rgba(26, 25, 24, 0.38)" },
  sheet: { maxHeight: "85%", backgroundColor: c.ivory, paddingTop: 10, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: c.sand, alignSelf: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: gutter, paddingTop: 12 },
  title: { fontFamily: fonts.serif, fontSize: 30, color: c.ink },
  groupLabel: { fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", color: c.muted },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24, minHeight: 44 },
  switchLabel: { fontFamily: fonts.sans, fontSize: 15, color: c.ink },
  actions: { flexDirection: "row", gap: 10, paddingHorizontal: gutter, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.line },
}));
