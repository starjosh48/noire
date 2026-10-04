import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProducts } from "~/api/catalog";
import { ProductFeed } from "~/components/product-feed";
import { FeedSkeleton } from "~/components/skeleton";
import { ErrorState } from "~/components/states";
import { imageUrl } from "~/lib/format";
import { useTabBarInset } from "~/lib/layout";
import { fonts, gutter, makeStyles, onImage, scrims } from "~/theme";

/** Home: the lookbook. A cover, then every fragrance full-screen, in the collection's featured order. */
export default function HomeScreen() {
  const products = useProducts({});
  const bottomInset = useTabBarInset();

  if (products.isPending) return <FeedSkeleton />;
  if (products.isError) return <ErrorState message={products.error.message} onRetry={products.refetch} />;

  return (
    <ProductFeed
      products={products.data.products}
      cover={<Cover bottomInset={bottomInset} />}
      overlay={<TopBar />}
      bottomInset={bottomInset}
    />
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
