import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHome } from "~/api/catalog";
import { Button } from "~/components/button";
import { ProductCard } from "~/components/product-card";
import { ProductGridSkeleton } from "~/components/skeleton";
import { ErrorState } from "~/components/states";
import { Body, Display, Eyebrow } from "~/components/typography";
import { imageUrl } from "~/lib/format";
import { families, moods, type ProductSummary } from "~/shared";
import { colors, fonts, gutter } from "~/theme";

const GAP = 16;

// The website's editorial principles (src/components/home/editorial-feature.tsx).
const PRINCIPLES = [
  {
    title: "Composed with restraint",
    body: "Each fragrance is built around a few exceptional materials, so it reads clearly on skin rather than shouting across a room.",
  },
  {
    title: "Made to be worn",
    body: "Every formula is tested in Lagos heat and humidity, tuned to last from morning meetings to late dinners.",
  },
  {
    title: "Honest by design",
    body: "Every note listed in full, clear concentrations, and no fragrance released until it is ready.",
  },
];

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
        <View style={{ marginTop: 52 }}><ProductGridSkeleton /></View>
      ) : home.isError ? (
        <ErrorState message={home.error.message} onRetry={home.refetch} />
      ) : (
        <>
          <Section eyebrow="Selected for you" title="Featured">
            <ProductRail products={home.data.featured} cardWidth={railWidth} />
          </Section>

          <Section eyebrow="Explore by fragrance family" title="Six families">
            <View style={styles.padded}>
              {families.map((family) => (
                <Pressable
                  key={family.slug}
                  accessibilityRole="link"
                  accessibilityLabel={`${family.label}. ${family.description}`}
                  onPress={() => router.navigate({ pathname: "/shop", params: { family: family.slug } })}
                  style={({ pressed }) => [styles.family, pressed && { opacity: 0.7 }]}
                >
                  <View style={[styles.swatch, { backgroundColor: family.swatch }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.familyLabel}>{family.label}</Text>
                    <Text style={styles.familyText}>{family.description}</Text>
                  </View>
                  <Feather name="arrow-right" size={18} color={colors.muted} />
                </Pressable>
              ))}
            </View>
          </Section>

          <View style={[styles.banner, { marginTop: 56 }]}>
            <Image
              source={imageUrl("/images/editorial/discovery.webp")}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
            <View style={styles.bannerShade} />
            <View style={styles.bannerContent}>
              <Eyebrow style={{ color: "rgba(247, 243, 237, 0.75)" }}>The scent finder</Eyebrow>
              <Display size={38} style={{ color: colors.ivory, marginTop: 10 }}>
                Not sure where to start?
              </Display>
              <Body style={{ color: colors.sand, marginTop: 10 }}>
                Tell us what you’re drawn to and when you’ll wear it, and we’ll narrow twelve fragrances down to the ones
                made for you.
              </Body>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.navigate("/discover")}
                style={({ pressed }) => [styles.bannerButton, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.bannerButtonText}>Discover your scent</Text>
              </Pressable>
            </View>
          </View>

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

          <View style={{ marginTop: 56 }}>
            <Image
              source={imageUrl("/images/editorial/atelier.webp")}
              accessibilityLabel="Three NOIRÉ flacons in different sizes in soft afternoon light"
              style={{ width, height: width * 0.9, backgroundColor: colors.stone }}
              contentFit="cover"
              transition={300}
            />
            <View style={[styles.padded, { marginTop: 28 }]}>
              <Eyebrow>The NOIRÉ philosophy</Eyebrow>
              <Display size={34} style={{ marginTop: 10 }}>
                Fragrance is more than a scent.
              </Display>
              <Body style={{ marginTop: 14, color: colors.inkSoft }}>
                It is the room you walk into before you arrive, and the memory that stays after you leave. We make
                fragrances that feel personal rather than performed: quiet, considered and entirely your own.
              </Body>
              {PRINCIPLES.map((p) => (
                <View key={p.title} style={styles.principle}>
                  <Text style={styles.principleTitle}>{p.title}</Text>
                  <Body muted style={{ marginTop: 4 }}>
                    {p.body}
                  </Body>
                </View>
              ))}
            </View>
          </View>

          <Section eyebrow="Loved most" title="Bestsellers">
            <View style={[styles.padded, styles.grid]}>
              {home.data.bestsellers.map((product) => (
                <ProductCard key={product.id} product={product} width={gridWidth} />
              ))}
            </View>
          </Section>

          <View style={[styles.padded, { marginTop: 56, alignItems: "center" }]}>
            <Display size={32} style={{ textAlign: "center" }}>
              Twelve eaux de parfum. One is yours.
            </Display>
            <Button label="Explore fragrances" onPress={() => router.navigate("/shop")} style={{ marginTop: 22, alignSelf: "stretch" }} />
          </View>
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
  family: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  swatch: { width: 36, height: 36, borderRadius: 18 },
  familyLabel: { fontFamily: fonts.serif, fontSize: 22, color: colors.ink },
  familyText: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: 2 },
  banner: { minHeight: 420, justifyContent: "flex-end", backgroundColor: colors.ink },
  bannerShade: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(26, 25, 24, 0.55)" },
  bannerContent: { padding: gutter, paddingBottom: 32 },
  bannerButton: { marginTop: 22, minHeight: 52, alignItems: "center", justifyContent: "center", backgroundColor: colors.ivory },
  bannerButtonText: { fontFamily: fonts.sansMedium, fontSize: 12, letterSpacing: 1.8, textTransform: "uppercase", color: colors.ink },
  principle: { paddingVertical: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, marginTop: 16 },
  principleTitle: { fontFamily: fonts.serif, fontSize: 21, color: colors.ink },
});
