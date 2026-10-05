import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Display, Eyebrow } from "~/components/typography";
import { imageUrl } from "~/lib/format";
import { useTabBarInset } from "~/lib/layout";
import { families, moods } from "~/shared";
import { fonts, gutter, makeStyles, onImage, scrims, useColors } from "~/theme";

const GAP = 12;

/**
 * Family tiles keep the website's swatch colours, with whichever text colour reads on each:
 * measured WCAG contrast for the 12px description (≥ 4.5:1). Amber is deepened 10% so cream
 * passes; the light swatches (fresh, citrus) take charcoal text.
 */
const FAMILY_TILES: Record<string, { background?: string; text?: string }> = {
  fresh: { text: onImage.night }, // 6.6:1
  citrus: { text: onImage.night }, // 7.6:1
  amber: { background: "#a15e29", text: onImage.cream }, // 4.6:1
};
const tileFor = (slug: string, swatch: string) => ({ background: swatch, text: onImage.cream, ...FAMILY_TILES[slug] });

const collection = (params: Record<string, string> = {}): Href => ({ pathname: "/collection", params });

/** Ways into the collection, as large image-led tiles. Each opens a lookbook of that selection. */
export default function ShopScreen() {
  const styles = useStyles();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const bottom = useTabBarInset();
  const { width } = useWindowDimensions();
  const half = (width - gutter * 2 - GAP) / 2;
  const moodCard = Math.min(220, width * 0.56);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: bottom + 32 }}>
      <View style={styles.padded}>
        <Display size={44}>Shop</Display>
        <Pressable
          accessibilityRole="search"
          accessibilityLabel="Search fragrances, notes and moods"
          onPress={() => router.push("/search")}
          style={({ pressed }) => [styles.search, pressed && { opacity: 0.7 }]}
        >
          <Feather name="search" size={18} color={c.muted} />
          <Text style={styles.searchText}>Search by name, note or mood</Text>
        </Pressable>
      </View>

      <Animated.View entering={FadeInDown.duration(500)} style={styles.padded}>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="The whole collection, twelve fragrances"
          onPress={() => router.push(collection())}
          style={({ pressed }) => [styles.hero, pressed && styles.pressed]}
        >
          <Image source={imageUrl("/images/editorial/atelier.webp")} style={styles.fill} contentFit="cover" transition={300} />
          <LinearGradient colors={scrims.banner.colors} locations={scrims.banner.locations} style={styles.fill} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>The collection</Text>
            <Text style={styles.heroTitle}>All twelve</Text>
          </View>
        </Pressable>

        <View style={[styles.row, { marginTop: GAP }]}>
          <QuickLink label="New arrivals" icon="star" onPress={() => router.push(collection({ sort: "newest" }))} />
          <QuickLink label="Bestsellers" icon="trending-up" onPress={() => router.push(collection({ sort: "bestselling" }))} />
        </View>
        <View style={[styles.row, { marginTop: GAP }]}>
          <QuickLink label="Filter & sort" icon="sliders" onPress={() => router.push(collection({ view: "grid" }))} />
        </View>
      </Animated.View>

      <Section eyebrow="By mood" title="For every moment" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, gap: GAP }} decelerationRate="fast" snapToInterval={moodCard + GAP}>
        {moods.map((mood) => (
          <Pressable
            key={mood.slug}
            accessibilityRole="link"
            accessibilityLabel={`${mood.label}. ${mood.description}`}
            onPress={() => router.push(collection({ mood: mood.slug }))}
            style={({ pressed }) => [styles.mood, { width: moodCard, height: moodCard * 1.45 }, pressed && styles.pressed]}
          >
            <Image source={imageUrl(mood.image)} style={styles.fill} contentFit="cover" transition={300} />
            <LinearGradient colors={scrims.card.colors} locations={scrims.card.locations} style={styles.fill} />
            <View style={styles.moodCopy}>
              <Text style={styles.moodTitle}>{mood.label}</Text>
              <Text style={styles.moodText} numberOfLines={2}>
                {mood.description}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <Section eyebrow="By fragrance family" title="Six families" />
      <View style={[styles.padded, styles.grid]}>
        {families.map((family) => (
          <Pressable
            key={family.slug}
            accessibilityRole="link"
            accessibilityLabel={`${family.label}. ${family.description}`}
            onPress={() => router.push(collection({ family: family.slug }))}
            style={({ pressed }) => [styles.family, { width: half, backgroundColor: tileFor(family.slug, family.swatch).background }, pressed && styles.pressed]}
          >
            <Text style={[styles.familyTitle, { color: tileFor(family.slug, family.swatch).text }]}>{family.label}</Text>
            <Text style={[styles.familyText, { color: tileFor(family.slug, family.swatch).text }]} numberOfLines={3}>
              {family.description}
            </Text>
            <Feather name="arrow-up-right" size={18} color={tileFor(family.slug, family.swatch).text} style={styles.familyArrow} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function Section({ eyebrow, title }: { eyebrow: string; title: string }) {
  const styles = useStyles();
  return (
    <View style={[styles.padded, { marginTop: 40, marginBottom: 16 }]}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Display size={30} style={{ marginTop: 6 }}>
        {title}
      </Display>
    </View>
  );
}

function QuickLink({ label, icon, onPress }: { label: string; icon: React.ComponentProps<typeof Feather>["name"]; onPress: () => void }) {
  const styles = useStyles();
  const c = useColors();
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={({ pressed }) => [styles.quick, pressed && styles.pressed]}>
      <Feather name={icon} size={16} color={c.ink} />
      <Text style={styles.quickText}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  screen: { flex: 1, backgroundColor: c.ivory },
  padded: { paddingHorizontal: gutter },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  fill: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 48,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 999,
    backgroundColor: c.stone,
  },
  searchText: { fontFamily: fonts.sans, fontSize: 15, color: c.faint },
  hero: { height: 240, borderRadius: 22, overflow: "hidden", backgroundColor: c.stone },
  heroCopy: { position: "absolute", left: 20, bottom: 18 },
  heroEyebrow: { fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: onImage.creamMuted },
  heroTitle: { fontFamily: fonts.serif, fontSize: 40, color: onImage.cream, marginTop: 4 },
  row: { flexDirection: "row", gap: GAP },
  quick: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.paper,
  },
  quickText: { fontFamily: fonts.sansMedium, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: c.ink },
  mood: { borderRadius: 22, overflow: "hidden", backgroundColor: c.stone },
  moodCopy: { position: "absolute", left: 16, right: 16, bottom: 16 },
  moodTitle: { fontFamily: fonts.serif, fontSize: 28, color: onImage.cream },
  moodText: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 17, color: onImage.creamMuted, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  family: { minHeight: 150, padding: 16, borderRadius: 20, justifyContent: "flex-end" },
  familyTitle: { fontFamily: fonts.serif, fontSize: 28 },
  familyText: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 17, marginTop: 4 },
  familyArrow: { position: "absolute", top: 14, right: 14 },
}));
