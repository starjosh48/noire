import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHome } from "~/api/catalog";
import { Button } from "~/components/button";
import { ProductCard } from "~/components/product-card";
import { ErrorState, LoadingState } from "~/components/states";
import { Body, Display, Eyebrow } from "~/components/typography";
import { imageUrl } from "~/lib/format";
import { moods, type ProductSummary } from "~/shared";
import { colors, fonts, gutter } from "~/theme";

const GAP = 16;

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const home = useHome();
  const gridWidth = (width - gutter * 2 - GAP) / 2;
  const railWidth = Math.min(260, width * 0.62);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 56 }}
      refreshControl={<RefreshControl refreshing={home.isRefetching} onRefresh={home.refetch} tintColor={colors.ink} />}
    >
      <Text style={styles.wordmark} accessibilityRole="header">
        NOIRÉ
      </Text>

      <View style={styles.padded}>
        <Eyebrow>The NOIRÉ collection · Twelve eaux de parfum</Eyebrow>
        <Display size={46} style={{ marginTop: 16 }}>
          Find the scent that <Text style={{ fontFamily: fonts.serifItalic }}>feels</Text> like you.
        </Display>
        <Body muted style={{ marginTop: 14 }}>
          Curated fragrances for every mood, moment, and memory.
        </Body>
        <Button label="Explore fragrances" onPress={() => router.navigate("/shop")} style={{ marginTop: 24 }} />
      </View>

      <Image
        source={imageUrl("/images/editorial/hero.webp")}
        accessibilityLabel="Three NOIRÉ flacons, Citrus Veil, Santal Obscur and Midnight Iris, on stone plinths in window light"
        style={{ width, height: width * 1.2, marginTop: 32, backgroundColor: colors.stone }}
        contentFit="cover"
        transition={300}
      />

      {home.isPending ? (
        <LoadingState />
      ) : home.isError ? (
        <ErrorState message={home.error.message} onRetry={home.refetch} />
      ) : (
        <>
          <Section eyebrow="Selected for you" title="Featured">
            <ProductRail products={home.data.featured} cardWidth={railWidth} />
          </Section>

          <Section eyebrow="Shop by mood" title="For every moment">
            <View style={[styles.padded, styles.grid]}>
              {moods.map((mood) => (
                <Pressable
                  key={mood.slug}
                  accessibilityRole="link"
                  accessibilityLabel={`${mood.label}. ${mood.description}`}
                  onPress={() => router.navigate({ pathname: "/shop", params: { mood: mood.slug } })}
                  style={({ pressed }) => [{ width: gridWidth }, pressed && { opacity: 0.85 }]}
                >
                  <Image
                    source={imageUrl(mood.image)}
                    style={{ width: gridWidth, height: gridWidth * 1.2, backgroundColor: colors.stone }}
                    contentFit="cover"
                    transition={250}
                  />
                  <Text style={styles.moodLabel}>{mood.label}</Text>
                </Pressable>
              ))}
            </View>
          </Section>

          <Section eyebrow="Loved most" title="Bestsellers">
            <View style={[styles.padded, styles.grid]}>
              {home.data.bestsellers.map((product) => (
                <ProductCard key={product.id} product={product} width={gridWidth} />
              ))}
            </View>
          </Section>
        </>
      )}
    </ScrollView>
  );
}

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 52 }}>
      <View style={[styles.padded, { marginBottom: 20 }]}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Display size={34} style={{ marginTop: 8 }}>
          {title}
        </Display>
      </View>
      {children}
    </View>
  );
}

function ProductRail({ products, cardWidth }: { products: ProductSummary[]; cardWidth: number }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: gutter, gap: GAP }}
      decelerationRate="fast"
      snapToInterval={cardWidth + GAP}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} width={cardWidth} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  padded: { paddingHorizontal: gutter },
  wordmark: {
    fontFamily: fonts.serif,
    fontSize: 26,
    letterSpacing: 4,
    textAlign: "center",
    color: colors.ink,
    paddingVertical: 14,
    marginBottom: 12,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", columnGap: GAP, rowGap: 28 },
  moodLabel: { fontFamily: fonts.serif, fontSize: 20, color: colors.ink, marginTop: 10 },
});
