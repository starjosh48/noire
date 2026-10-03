import Feather from "@expo/vector-icons/Feather";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProducts } from "~/api/catalog";
import { ProductCard } from "~/components/product-card";
import { ProductFeed } from "~/components/product-feed";
import { FeedSkeleton, ProductGridSkeleton } from "~/components/skeleton";
import { EmptyState, ErrorState } from "~/components/states";
import { Display, Eyebrow } from "~/components/typography";
import { pluralize } from "~/lib/format";
import { families, moodBySlug, sortOptions, type ProductSummary, type SortKey } from "~/shared";
import { fonts, gutter, makeStyles, onImage, useColors } from "~/theme";

const GAP = 16;

/**
 * A selection of the collection (a family, a mood, new arrivals…), shown as a lookbook or, one
 * tap away, as a grid. Filters live in the route params, like the website's /shop URL.
 */
export default function CollectionScreen() {
  const params = useLocalSearchParams<{ family?: string; mood?: string; sort?: string }>();
  const family = families.find((f) => f.slug === params.family);
  const mood = params.mood ? moodBySlug(params.mood) : undefined;
  const sort = (sortOptions.find((o) => o.slug === params.sort)?.slug ?? "featured") as SortKey;
  const products = useProducts({ family: family?.slug, mood: mood?.slug, sort });
  const [view, setView] = useState<"lookbook" | "grid">("lookbook");
  const insets = useSafeAreaInsets();

  const title = mood?.label ?? family?.label ?? (sort === "newest" ? "New arrivals" : sort === "bestselling" ? "Bestsellers" : "All fragrances");
  const eyebrow = mood ? "Collection" : family ? "Fragrance family" : "The collection";

  if (products.isPending) return view === "lookbook" ? <FeedSkeleton /> : <ProductGridSkeleton />;
  if (products.isError) return <ErrorState message={products.error.message} onRetry={products.refetch} />;
  const list = products.data.products;
  if (list.length === 0) return <EmptyState title="Nothing here yet" message="Try another family or mood." />;

  const toggle = () => setView((v) => (v === "lookbook" ? "grid" : "lookbook"));
  return view === "lookbook" ? (
    <ProductFeed products={list} overlay={<FeedBar title={title} onToggle={toggle} />} bottomInset={insets.bottom + 8} />
  ) : (
    <Grid title={title} eyebrow={eyebrow} products={list} refreshing={products.isRefetching} onRefresh={products.refetch} onToggle={toggle} />
  );
}

/** Over the lookbook: back, the selection's name, and the switch to a grid. */
function FeedBar({ title, onToggle }: { title: string; onToggle: () => void }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.feedBar, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
      <RoundButton icon="chevron-left" label="Back" onPress={() => router.back()} />
      <Text style={styles.feedTitle} numberOfLines={1}>
        {title}
      </Text>
      <RoundButton icon="grid" label="Show as a grid" onPress={onToggle} />
    </View>
  );
}

function RoundButton({ icon, label, onPress }: { icon: React.ComponentProps<typeof Feather>["name"]; label: string; onPress: () => void }) {
  const styles = useStyles();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={8} style={({ pressed }) => [styles.round, pressed && { opacity: 0.7 }]}>
      <Feather name={icon} size={20} color={onImage.cream} />
    </Pressable>
  );
}

function Grid({
  title,
  eyebrow,
  products,
  refreshing,
  onRefresh,
  onToggle,
}: {
  title: string;
  eyebrow: string;
  products: ProductSummary[];
  refreshing: boolean;
  onRefresh: () => void;
  onToggle: () => void;
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
      ListHeaderComponent={
        <View style={[styles.gridHeader, { paddingTop: insets.top + 8 }]}>
          <View style={styles.gridBar}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={10} style={styles.plainButton}>
              <Feather name="chevron-left" size={24} color={c.ink} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Show as a lookbook" onPress={onToggle} hitSlop={10} style={styles.plainButton}>
              <Feather name="layers" size={20} color={c.ink} />
            </Pressable>
          </View>
          <Eyebrow style={{ marginTop: 12 }}>{eyebrow}</Eyebrow>
          <Display size={40} style={{ marginTop: 6 }}>
            {title}
          </Display>
          <Text style={styles.count}>{pluralize(products.length, "fragrance")}</Text>
        </View>
      }
    />
  );
}

const useStyles = makeStyles((c) => ({
  screen: { flex: 1, backgroundColor: c.ivory },
  feedBar: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: gutter },
  feedTitle: { flex: 1, textAlign: "center", fontFamily: fonts.serif, fontSize: 22, color: onImage.cream },
  round: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(26,25,24,0.35)",
    borderWidth: 1,
    borderColor: "rgba(247,243,237,0.35)",
  },
  gridHeader: { paddingHorizontal: gutter, paddingBottom: 24 },
  gridBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  plainButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  count: { fontFamily: fonts.sans, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: c.muted, marginTop: 8 },
}));
