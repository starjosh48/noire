import Feather from "@expo/vector-icons/Feather";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProducts } from "~/api/catalog";
import { Chip } from "~/components/chip";
import { FilterSheet } from "~/components/filter-sheet";
import { ProductCard } from "~/components/product-card";
import { ProductFeed } from "~/components/product-feed";
import { FeedSkeleton, ProductGridSkeleton } from "~/components/skeleton";
import { EmptyState, ErrorState } from "~/components/states";
import { Display, Eyebrow } from "~/components/typography";
import { pluralize } from "~/lib/format";
import {
  activeFilterCount,
  families,
  filtersToSearchParams,
  moodBySlug,
  parseFilters,
  sortOptions,
  type CatalogFilters,
  type ProductSummary,
} from "~/shared";
import { fonts, gutter, makeStyles, onImage, useColors } from "~/theme";

const GAP = 16;
const FILTER_KEYS = ["family", "size", "price", "gender", "mood", "scent", "availability", "sort"] as const;

/** The website's /shop headings: a single mood or family names the page, else the sort or "All". */
function headingFor(f: CatalogFilters) {
  const others = (k: "family" | "mood" | "scent") => (["family", "mood", "scent"] as const).filter((x) => x !== k).reduce((n, x) => n + f[x].length, 0);
  if (f.mood.length === 1 && others("mood") === 0) return { eyebrow: "Collection", title: moodBySlug(f.mood[0])?.label ?? "Collection" };
  if (f.family.length === 1 && others("family") === 0) return { eyebrow: "Fragrance family", title: families.find((x) => x.slug === f.family[0])?.label ?? "Family" };
  if (activeFilterCount(f) > 0) return { eyebrow: "Your selection", title: "Filtered fragrances" };
  if (f.sort === "newest") return { eyebrow: "The collection", title: "New arrivals" };
  if (f.sort === "bestselling") return { eyebrow: "The collection", title: "Bestsellers" };
  return { eyebrow: "The collection", title: "All fragrances" };
}

/**
 * A selection of the collection (a family, a mood, new arrivals…), as a lookbook or a grid.
 * Filters and sort live in the route params in the website's /shop format, so links from Home
 * and Shop work and the server applies exactly the website's filtering.
 */
export default function CollectionScreen() {
  const params = useLocalSearchParams<Record<(typeof FILTER_KEYS)[number] | "view", string>>();
  const filters = parseFilters(params);
  const products = useProducts(filters);
  // Opens as a lookbook, or straight in the grid (?view=grid, e.g. from Shop's Filter & sort).
  const [view, setView] = useState<"lookbook" | "grid">(params.view === "grid" ? "grid" : "lookbook");
  const [filtering, setFiltering] = useState(false);
  const insets = useSafeAreaInsets();
  const { eyebrow, title } = headingFor(filters);

  const apply = (next: CatalogFilters) => {
    const search = filtersToSearchParams(next);
    // Every key is set, so filters that were removed are cleared from the route.
    router.setParams(Object.fromEntries(FILTER_KEYS.map((k) => [k, search.get(k) ?? undefined])));
    setFiltering(false);
  };
  const toggle = () => setView((v) => (v === "lookbook" ? "grid" : "lookbook"));
  const sheet = <FilterSheet visible={filtering} value={filters} onApply={apply} onClose={() => setFiltering(false)} />;
  const count = activeFilterCount(filters);

  if (products.isPending) return view === "lookbook" ? <FeedSkeleton /> : <ProductGridSkeleton />;
  if (products.isError) return <ErrorState message={products.error.message} onRetry={products.refetch} />;
  const list = products.data.products;

  if (view === "lookbook" && list.length > 0) {
    return (
      <>
        <ProductFeed
          products={list}
          overlay={<FeedBar title={title} filterCount={count} onFilter={() => setFiltering(true)} onToggle={toggle} />}
          bottomInset={insets.bottom + 8}
        />
        {sheet}
      </>
    );
  }
  return (
    <>
      <Grid
        title={title}
        eyebrow={eyebrow}
        products={list}
        filters={filters}
        filterCount={count}
        refreshing={products.isRefetching}
        onRefresh={products.refetch}
        onToggle={toggle}
        onFilter={() => setFiltering(true)}
        onSort={(sort) => apply({ ...filters, sort })}
        onClear={() => apply({ ...parseFilters({}), sort: filters.sort })}
      />
      {sheet}
    </>
  );
}

/** Over the lookbook: back, the selection's name, filters and the switch to a grid. */
function FeedBar({ title, filterCount, onFilter, onToggle }: { title: string; filterCount: number; onFilter: () => void; onToggle: () => void }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.feedBar, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
      <RoundButton icon="chevron-left" label="Back" onPress={() => router.back()} />
      <Text style={styles.feedTitle} numberOfLines={1}>
        {title}
      </Text>
      <RoundButton icon="sliders" label={filterCount ? `Filters, ${filterCount} active` : "Filters"} onPress={onFilter} badge={filterCount} />
      <RoundButton icon="grid" label="Show as a grid" onPress={onToggle} />
    </View>
  );
}

function RoundButton({ icon, label, onPress, badge }: { icon: React.ComponentProps<typeof Feather>["name"]; label: string; onPress: () => void; badge?: number }) {
  const styles = useStyles();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={8} style={({ pressed }) => [styles.round, pressed && { opacity: 0.7 }]}>
      <Feather name={icon} size={19} color={onImage.cream} />
      {!!badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

function Grid({
  title,
  eyebrow,
  products,
  filters,
  filterCount,
  refreshing,
  onRefresh,
  onToggle,
  onFilter,
  onSort,
  onClear,
}: {
  title: string;
  eyebrow: string;
  products: ProductSummary[];
  filters: CatalogFilters;
  filterCount: number;
  refreshing: boolean;
  onRefresh: () => void;
  onToggle: () => void;
  onFilter: () => void;
  onSort: (sort: CatalogFilters["sort"]) => void;
  onClear: () => void;
}) {
  const styles = useStyles();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const card = (width - gutter * 2 - GAP) / 2;
  return (
    <FlatList
      style={styles.screen}
      data={products}
      keyExtractor={(p) => p.id}
      numColumns={2}
      columnWrapperStyle={{ gap: GAP, paddingHorizontal: gutter }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32, rowGap: 28 }}
      renderItem={({ item }) => <ProductCard product={item} width={card} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.ink} />}
      ListEmptyComponent={
        <View>
          <EmptyState title="Nothing matches yet" message="Try fewer filters." />
          {filterCount > 0 && (
            <Pressable accessibilityRole="button" onPress={onClear} style={{ alignSelf: "center" }} hitSlop={8}>
              <Text style={styles.clear}>Clear filters</Text>
            </Pressable>
          )}
        </View>
      }
      ListHeaderComponent={
        <View style={[styles.gridHeader, { paddingTop: insets.top + 8 }]}>
          <View style={[styles.gridBar, styles.padded]}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={10} style={styles.plainButton}>
              <Feather name="chevron-left" size={24} color={c.ink} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Show as a lookbook" onPress={onToggle} hitSlop={10} style={styles.plainButton}>
              <Feather name="layers" size={20} color={c.ink} />
            </Pressable>
          </View>
          <View style={styles.padded}>
            <Eyebrow style={{ marginTop: 12 }}>{eyebrow}</Eyebrow>
            <Display size={40} style={{ marginTop: 6 }}>
              {title}
            </Display>
          </View>

          <View style={[styles.padded, styles.toolbar]}>
            <Text style={styles.count}>{pluralize(products.length, "fragrance")}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={filterCount ? `Filters, ${filterCount} active` : "Filters"}
              onPress={onFilter}
              style={({ pressed }) => [styles.filterButton, pressed && { opacity: 0.7 }]}
            >
              <Feather name="sliders" size={15} color={c.ink} />
              <Text style={styles.filterText}>Filters{filterCount ? ` · ${filterCount}` : ""}</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow} accessibilityLabel="Sort by">
            {sortOptions.map((o) => (
              <Chip key={o.slug} label={o.label} selected={filters.sort === o.slug} onPress={() => onSort(o.slug)} />
            ))}
          </ScrollView>
        </View>
      }
    />
  );
}

const useStyles = makeStyles((c) => ({
  screen: { flex: 1, backgroundColor: c.ivory },
  padded: { paddingHorizontal: gutter },
  feedBar: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: gutter },
  feedTitle: { flex: 1, textAlign: "center", fontFamily: fonts.serif, fontSize: 22, color: onImage.cream },
  round: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(26,25,24,0.45)",
    borderWidth: 1,
    borderColor: "rgba(247,243,237,0.35)",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: onImage.cream,
  },
  badgeText: { fontFamily: fonts.sansMedium, fontSize: 10, color: onImage.night },
  gridHeader: { paddingBottom: 20 },
  gridBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  plainButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
  count: { fontFamily: fonts.sans, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: c.muted },
  filterButton: { flexDirection: "row", alignItems: "center", gap: 8, height: 40, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: c.line },
  filterText: { fontFamily: fonts.sansMedium, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: c.ink },
  sortRow: { gap: 8, paddingHorizontal: gutter, paddingTop: 14 },
  clear: { fontFamily: fonts.sansMedium, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: c.ink, textDecorationLine: "underline" },
}));
