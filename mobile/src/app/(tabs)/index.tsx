import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHome } from "~/api/catalog";
import { Button } from "~/components/button";
import { ProductFeed } from "~/components/product-feed";
import { FeedSkeleton } from "~/components/skeleton";
import { ErrorState } from "~/components/states";
import { formatPrice, imageUrl } from "~/lib/format";
import { families, type ProductSummary } from "~/shared";
import { useTabBarInset } from "~/lib/layout";
import { fonts, gutter, makeStyles, onImage, scrims } from "~/theme";

/**
 * Home, as a lookbook: the cover (hero), the featured fragrances one per screen, then a closing
 * page with bestsellers, the fragrance families, the scent finder and the NOIRÉ philosophy.
 */
export default function HomeScreen() {
  const home = useHome();
  const bottomInset = useTabBarInset();

  if (home.isPending) return <FeedSkeleton />;
  if (home.isError) return <ErrorState message={home.error.message} onRetry={home.refetch} />;

  return (
    <ProductFeed
      products={home.data.featured}
      label="Featured"
      cover={<Cover bottomInset={bottomInset} />}
      footer={<MoreFromNoire bestsellers={home.data.bestsellers} bottomInset={bottomInset} />}
      overlay={<TopBar />}
      bottomInset={bottomInset}
    />
  );
}

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

/** The closing page: the rest of the store, on charcoal so the floating wordmark stays legible. */
function MoreFromNoire({ bestsellers, bottomInset }: { bestsellers: ProductSummary[]; bottomInset: number }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const card = Math.min(170, width * 0.42);
  return (
    <ScrollView nestedScrollEnabled style={styles.more} contentContainerStyle={{ paddingTop: insets.top + 72, paddingBottom: bottomInset + 32 }}>
      <View style={styles.padded}>
        <Text style={styles.eyebrow}>Loved most</Text>
        <Text style={styles.heading} accessibilityRole="header">
          Bestsellers
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, gap: 12, marginTop: 16 }}>
        {bestsellers.map((p) => (
          <Pressable
            key={p.id}
            accessibilityRole="link"
            accessibilityLabel={`${p.name}, from ${formatPrice(p.price, p.currency)}`}
            onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: p.slug } })}
            style={({ pressed }) => [{ width: card }, pressed && { opacity: 0.85 }]}
          >
            <Image source={imageUrl(p.image_url)} style={[styles.bestImage, { width: card, height: card * 1.25 }]} contentFit="cover" transition={250} />
            <Text style={styles.bestName} numberOfLines={1}>
              {p.name}
            </Text>
            <Text style={styles.bestPrice}>{formatPrice(p.price, p.currency)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={[styles.padded, styles.section]}>
        <Text style={styles.eyebrow}>Explore by fragrance family</Text>
        <View style={styles.families}>
          {families.map((family) => (
            <Pressable
              key={family.slug}
              accessibilityRole="link"
              accessibilityLabel={`${family.label}. ${family.description}`}
              onPress={() => router.push({ pathname: "/collection", params: { family: family.slug } })}
              style={({ pressed }) => [styles.family, pressed && { opacity: 0.7 }]}
            >
              <View style={[styles.swatch, { backgroundColor: family.swatch }]} />
              <Text style={styles.familyLabel}>{family.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.padded, styles.section]}>
        <Text style={styles.eyebrow}>The scent finder</Text>
        <Text style={styles.heading} accessibilityRole="header">
          Not sure where to start?
        </Text>
        <Text style={styles.body}>
          Tell us what you’re drawn to and when you’ll wear it, and we’ll narrow twelve fragrances down to the ones made for you.
        </Text>
        <Button variant="light" label="Discover your scent" onPress={() => router.navigate("/discover")} style={{ marginTop: 18 }} />
      </View>

      <View style={[styles.padded, styles.section]}>
        <Text style={styles.eyebrow}>The NOIRÉ philosophy</Text>
        <Text style={styles.heading} accessibilityRole="header">
          Fragrance is more than a scent.
        </Text>
        <Text style={styles.body}>It is the room you walk into before you arrive, and the memory that stays after you leave.</Text>
        {PRINCIPLES.map((p) => (
          <View key={p.title} style={styles.principle}>
            <Text style={styles.principleTitle}>{p.title}</Text>
            <Text style={styles.body}>{p.body}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.padded, styles.section]}>
        <Button variant="light" label="Shop all twelve" onPress={() => router.push("/collection")} />
      </View>
    </ScrollView>
  );
}

function TopBar() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.topBar, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
      <Text style={styles.wordmark} accessibilityRole="header">
        NOIRÉ
      </Text>
      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Search fragrances, notes and moods"
        onPress={() => router.push("/search")}
        hitSlop={8}
        style={({ pressed }) => [styles.round, pressed && { opacity: 0.7 }]}
      >
        <Feather name="search" size={19} color={onImage.cream} />
      </Pressable>
    </View>
  );
}

function Cover({ bottomInset }: { bottomInset: number }) {
  const styles = useStyles();
  const nudge = useSharedValue(0);
  useEffect(() => {
    nudge.value = withRepeat(withSequence(withTiming(-8, { duration: 700, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 700 })), -1);
  }, [nudge]);
  const hint = useAnimatedStyle(() => ({ transform: [{ translateY: nudge.value }] }));

  return (
    <View style={styles.cover}>
      <Image
        source={imageUrl("/images/editorial/hero.webp")}
        accessibilityLabel="Three NOIRÉ flacons, Citrus Veil, Santal Obscur and Midnight Iris, on stone plinths in window light"
        style={styles.fill}
        contentFit="cover"
        transition={400}
      />
      <LinearGradient colors={scrims.cover.colors} locations={scrims.cover.locations} style={styles.fill} />
      <View style={[styles.coverCopy, { paddingBottom: bottomInset + 24 }]}>
        <Animated.Text entering={FadeInDown.delay(100).duration(700)} style={styles.eyebrow}>
          The NOIRÉ lookbook · Twelve eaux de parfum
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(220).duration(800)} style={styles.headline}>
          Find the scent that <Text style={{ fontFamily: fonts.serifItalic }}>feels</Text> like you.
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(340).duration(800)} style={styles.lede}>
          Curated fragrances for every mood, moment and memory.
        </Animated.Text>
        <Animated.View style={[styles.swipe, hint]} accessibilityLabel="Swipe up to see the fragrances" accessible>
          <Feather name="chevron-up" size={20} color={onImage.cream} />
          <Text style={styles.swipeText}>Swipe up</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  more: { flex: 1, backgroundColor: onImage.night },
  padded: { paddingHorizontal: gutter },
  section: { marginTop: 44 },
  heading: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 37, color: onImage.cream, marginTop: 6 },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: onImage.creamMuted, marginTop: 10 },
  bestImage: { borderRadius: 16, backgroundColor: "#252321" },
  bestName: { fontFamily: fonts.serif, fontSize: 19, color: onImage.cream, marginTop: 10 },
  bestPrice: { fontFamily: fonts.sansMedium, fontSize: 13, color: onImage.creamMuted, marginTop: 2 },
  families: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  family: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(247,243,237,0.3)",
  },
  swatch: { width: 14, height: 14, borderRadius: 7 },
  familyLabel: { fontFamily: fonts.sansMedium, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: onImage.cream },
  principle: { marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(247,243,237,0.18)" },
  principleTitle: { fontFamily: fonts.serif, fontSize: 22, color: onImage.cream },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: gutter,
  },
  wordmark: { fontFamily: fonts.serif, fontSize: 24, letterSpacing: 5, color: onImage.cream },
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
  cover: { flex: 1, backgroundColor: onImage.night },
  fill: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  coverCopy: { flex: 1, justifyContent: "flex-end", paddingHorizontal: gutter },
  eyebrow: { fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: onImage.creamMuted },
  headline: { fontFamily: fonts.serif, fontSize: 58, lineHeight: 58, letterSpacing: -0.8, color: onImage.cream, marginTop: 14 },
  lede: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 23, color: onImage.cream, marginTop: 14, maxWidth: 300 },
  swipe: { alignItems: "center", marginTop: 36 },
  swipeText: { fontFamily: fonts.sansMedium, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: onImage.creamMuted, marginTop: 2 },
}));
