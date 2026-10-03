import Feather from "@expo/vector-icons/Feather";
import { router, useLocalSearchParams } from "expo-router";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProducts } from "~/api/catalog";
import { Chip } from "~/components/chip";
import { ProductCard } from "~/components/product-card";
import { ProductGridSkeleton } from "~/components/skeleton";
import { EmptyState, ErrorState } from "~/components/states";
import { Body, Display, Eyebrow } from "~/components/typography";
import { pluralize } from "~/lib/format";
import { families, moodBySlug, sortOptions, type SortKey } from "~/shared";
import { colors, fonts, gutter } from "~/theme";

const GAP = 16;

type ShopParams = { family?: string; mood?: string; sort?: string };

// Filters live in the route params (like the website's URL), so Home can link straight to a
// mood and the back gesture behaves as expected.
export default function ShopScreen() {
  const params = useLocalSearchParams<ShopParams>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cardWidth = (width - gutter * 2 - GAP) / 2;

  const family = families.find((f) => f.slug === params.family);
  const mood = params.mood ? moodBySlug(params.mood) : undefined;
  const sort = (sortOptions.find((o) => o.slug === params.sort)?.slug ?? "featured") as SortKey;
  const products = useProducts({ family: family?.slug, mood: mood?.slug, sort });

  const setFilter = (next: ShopParams) => router.setParams(next);

  const heading = mood
    ? { eyebrow: "Collection", title: mood.label, description: mood.description }
    : family
      ? { eyebrow: "Fragrance family", title: family.label, description: family.description }
      : {
          eyebrow: "The collection",
          title: "All Fragrances",
          description: "Twelve eaux de parfum, each composed around a single idea. Available in 30, 50 and 100 ml.",
        };

  const header = (
    <View style={{ paddingTop: insets.top + 20 }}>
      <View style={styles.padded}>
        <Eyebrow>{heading.eyebrow}</Eyebrow>
        <Display size={42} style={{ marginTop: 10 }}>
          {heading.title}
        </Display>
        <Body muted style={{ marginTop: 10 }}>
          {heading.description}
        </Body>
        <Pressable
          accessibilityRole="search"
          accessibilityLabel="Search fragrances, notes and moods"
          onPress={() => router.push("/search")}
          style={({ pressed }) => [styles.search, pressed && { backgroundColor: colors.stone }]}
        >
          <Feather name="search" size={18} color={colors.muted} />
          <Text style={styles.searchText}>Search by name, note or mood</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {mood && <Chip label={`${mood.label}  ×`} selected onPress={() => setFilter({ mood: undefined })} />}
        <Chip label="All" selected={!family} onPress={() => setFilter({ family: undefined })} />
        {families.map((f) => (
          <Chip
            key={f.slug}
            label={f.label}
            selected={family?.slug === f.slug}
            onPress={() => setFilter({ family: family?.slug === f.slug ? undefined : f.slug })}
          />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chips, { paddingTop: 0 }]}>
        {sortOptions.map((o) => (
          <Chip
            key={o.slug}
            label={o.label}
            selected={sort === o.slug}
            onPress={() => setFilter({ sort: o.slug === "featured" ? undefined : o.slug })}
          />
        ))}
      </ScrollView>

      {products.data && (
        <Text style={[styles.padded, styles.count]}>{pluralize(products.data.products.length, "fragrance")}</Text>
      )}
    </View>
  );

  return (
    <FlatList
      style={styles.screen}
      data={products.data?.products ?? []}
      keyExtractor={(p) => p.id}
      numColumns={2}
      columnWrapperStyle={{ gap: GAP, paddingHorizontal: gutter }}
      contentContainerStyle={{ paddingBottom: 56, rowGap: 32 }}
      ListHeaderComponent={header}
      renderItem={({ item }) => <ProductCard product={item} width={cardWidth} />}
      ListEmptyComponent={
        products.isPending ? (
          <ProductGridSkeleton />
        ) : products.isError ? (
          <ErrorState message={products.error.message} onRetry={products.refetch} />
        ) : (
          <EmptyState title="Nothing matches yet" message="Try another family or clear the mood." />
        )
      }
      refreshControl={
        <RefreshControl refreshing={products.isRefetching} onRefresh={products.refetch} tintColor={colors.ink} />
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  padded: { paddingHorizontal: gutter },
  search: { flexDirection: "row", alignItems: "center", gap: 10, height: 48, paddingHorizontal: 14, marginTop: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper },
  searchText: { fontFamily: fonts.sans, fontSize: 15, color: colors.faint },
  chips: { gap: 8, paddingHorizontal: gutter, paddingVertical: 12 },
  count: {
    fontFamily: fonts.sans,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.muted,
    marginTop: 8,
    marginBottom: 20,
  },
});
