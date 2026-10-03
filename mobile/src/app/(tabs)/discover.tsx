import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDiscover } from "~/api/catalog";
import { Chip } from "~/components/chip";
import { ProductCard } from "~/components/product-card";
import { ProductGridSkeleton } from "~/components/skeleton";
import { EmptyState, ErrorState } from "~/components/states";
import { Body, Display, Eyebrow } from "~/components/typography";
import { pluralize } from "~/lib/format";
import { moods, scentProfiles } from "~/shared";
import { colors, fonts, gutter } from "~/theme";

const GAP = 16;

const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

/** The website's scent finder (/discovery): pick characters, then moments; matches update as you go. */
export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [scents, setScents] = useState<string[]>([]);
  const [moments, setMoments] = useState<string[]>([]);
  const results = useDiscover(scents, moments);
  const hasSelection = scents.length + moments.length > 0;
  const tile = (width - gutter * 2 - 12) / 2;
  const card = (width - gutter * 2 - GAP) / 2;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 56 }}>
      <View style={styles.padded}>
        <Eyebrow>The scent finder</Eyebrow>
        <Display size={40} style={{ marginTop: 10 }}>
          What kind of scent are you looking for?
        </Display>
        <Body muted style={{ marginTop: 12 }}>
          Choose as many characters as feel like you, then tell us when you’ll wear it. Your matches update as you go.
        </Body>
      </View>

      <Step number="01" title="The character" />
      <View style={[styles.padded, styles.tiles]}>
        {scentProfiles.map((profile) => {
          const selected = scents.includes(profile.slug);
          return (
            <Pressable
              key={profile.slug}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${profile.label}: ${profile.description}`}
              onPress={() => {
                void Haptics.selectionAsync();
                setScents((list) => toggle(list, profile.slug));
              }}
              style={[styles.tile, { width: tile }, selected && styles.tileSelected]}
            >
              <Text style={[styles.tileTitle, selected && { color: colors.ivory }]}>{profile.label}</Text>
              <Text style={[styles.tileText, selected && { color: colors.sand }]}>{profile.description}</Text>
            </Pressable>
          );
        })}
      </View>

      <Step number="02" title="The moment" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {moods.map((mood) => (
          <Chip
            key={mood.slug}
            label={mood.label}
            selected={moments.includes(mood.slug)}
            onPress={() => {
              void Haptics.selectionAsync();
              setMoments((list) => toggle(list, mood.slug));
            }}
          />
        ))}
      </ScrollView>

      <View style={[styles.padded, { marginTop: 36 }]}>
        <Eyebrow>Your matches</Eyebrow>
        {hasSelection && results.data && (
          <Text style={styles.count} accessibilityLiveRegion="polite">
            {pluralize(results.data.results.length, "fragrance")} for you
          </Text>
        )}
        {hasSelection && (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setScents([]);
              setMoments([]);
            }}
            hitSlop={8}
          >
            <Text style={styles.reset}>Start again</Text>
          </Pressable>
        )}
      </View>

      {!hasSelection ? (
        <EmptyState title="Start with a character" message="Your matches appear here as soon as you choose." />
      ) : results.isPending ? (
        <ProductGridSkeleton count={2} />
      ) : results.isError ? (
        <ErrorState message={results.error.message} onRetry={results.refetch} />
      ) : results.data.results.length === 0 ? (
        <EmptyState title="No exact match" message="Try fewer choices: every NOIRÉ fragrance has a few characters and moments." />
      ) : (
        <View style={[styles.padded, styles.grid, results.isPlaceholderData && { opacity: 0.6 }]}>
          {results.data.results.map((product) => (
            <ProductCard key={product.id} product={product} width={card} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function Step({ number, title }: { number: string; title: string }) {
  return (
    <View style={[styles.padded, styles.step]}>
      <Text style={styles.stepNumber}>{number}</Text>
      <Eyebrow style={{ color: colors.ink }}>{title}</Eyebrow>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  padded: { paddingHorizontal: gutter },
  step: { flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: 36, marginBottom: 14 },
  stepNumber: { fontFamily: fonts.sans, fontSize: 12, color: colors.faint, fontVariant: ["tabular-nums"] },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: { minHeight: 88, padding: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper },
  tileSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  tileTitle: { fontFamily: fonts.serif, fontSize: 21, color: colors.ink },
  tileText: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 4 },
  chips: { gap: 8, paddingHorizontal: gutter },
  count: { fontFamily: fonts.serif, fontSize: 26, color: colors.ink, marginTop: 8 },
  reset: { fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: colors.muted, textDecorationLine: "underline", marginTop: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", columnGap: GAP, rowGap: 28, marginTop: 20 },
});
