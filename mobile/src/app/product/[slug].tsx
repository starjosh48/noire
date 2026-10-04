import Feather from "@expo/vector-icons/Feather";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProduct } from "~/api/catalog";
import { useCart, useCartMutation } from "~/cart/cart";
import { Button } from "~/components/button";
import { ProductCard } from "~/components/product-card";
import { QuantityStepper } from "~/components/quantity-stepper";
import { Skeleton } from "~/components/skeleton";
import { ErrorState } from "~/components/states";
import { useToast } from "~/components/toast";
import { Body, Display, Eyebrow } from "~/components/typography";
import { formatPrice, imageUrl, productLabel } from "~/lib/format";
import { commerce, familyLine, type ProductDetail, type ProductSummary, type ProductVariant } from "~/shared";
import { fonts, gutter, makeStyles, onImage, useColors } from "~/theme";

const NOTE_TIERS = [
  { key: "top_notes", title: "Top", timing: "0–15 min" },
  { key: "heart_notes", title: "Heart", timing: "15 min – 3 h" },
  { key: "base_notes", title: "Base", timing: "3 h and beyond" },
] as const;

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const query = useProduct(slug);

  if (query.isPending) return <ProductSkeleton />;
  if (query.isError) {
    const notFound = "status" in query.error && query.error.status === 404;
    return (
      <View style={{ flex: 1 }}>
        <ErrorState
          message={notFound ? "This fragrance is no longer in the collection." : query.error.message}
          onRetry={notFound ? undefined : query.refetch}
        />
        <FloatingBack />
      </View>
    );
  }
  return <ProductView product={query.data.product} related={query.data.related} />;
}

/** The website's default: 50 ml when it's in stock, else the first size in stock. */
function defaultVariant(variants: ProductVariant[]) {
  const inStock = variants.filter((v) => v.stock_quantity > 0);
  return inStock.find((v) => v.size_ml === 50) ?? inStock[0] ?? variants[0];
}

function ProductView({ product, related }: { product: ProductDetail; related: ProductSummary[] }) {
  const styles = useStyles();
  const c = useColors();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const cart = useCart();
  const mutation = useCartMutation();
  const images = product.gallery_images.length ? product.gallery_images : [product.image_url];
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(() => defaultVariant(product.variants)?.id);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState<"add" | "buy" | null>(null);
  const imageHeight = Math.round(Math.min(height * 0.68, width * 1.35));

  // Parallax image, and a compact title bar that fades in once the image has scrolled away.
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [-200, 0, imageHeight], [-100, 0, imageHeight * 0.5], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [-200, 0], [1.25, 1], Extrapolation.CLAMP) },
    ],
  }));
  const barStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [imageHeight - 160, imageHeight - 80], [0, 1], Extrapolation.CLAMP),
  }));

  const selected = product.variants.find((v) => v.id === selectedId);
  const allSoldOut = product.variants.every((v) => v.stock_quantity <= 0);
  const inCart = cart.data?.lines.find((l) => l.variant.id === selectedId)?.quantity ?? 0;
  const limit = selected ? Math.min(selected.stock_quantity, commerce.maxQuantityPerLine) : 0;
  const unavailable = !selected || selected.stock_quantity <= 0;
  const cartFull = !unavailable && inCart >= limit;
  const maxSelectable = Math.max(1, limit - inCart);

  const addLabel = allSoldOut
    ? "Sold out"
    : unavailable
      ? "Size sold out"
      : cartFull
        ? inCart >= commerce.maxQuantityPerLine
          ? `Limit of ${commerce.maxQuantityPerLine}`
          : "All in cart"
        : "Add to cart";

  let stockNote: string;
  if (allSoldOut) stockNote = "Sold out in every size. New stock is on its way.";
  else if (unavailable) stockNote = "This size is sold out. Please choose another.";
  else if (selected.stock_quantity <= commerce.lowStockThreshold) stockNote = `Only ${selected.stock_quantity} left in ${selected.size_ml} ml.`;
  else stockNote = "In stock, ready to ship.";

  const add = async (mode: "add" | "buy") => {
    if (!selected || unavailable || cartFull) return;
    setBusy(mode);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await mutation.mutateAsync({ kind: "add", product, variant: selected, quantity });
      setQuantity(1);
      if (mode === "buy") {
        router.push("/checkout");
      } else {
        toast({
          title: "Added to cart",
          description: result.message ?? `${product.name}, ${selected.size_ml} ml`,
          action: { label: "View cart", onPress: () => router.navigate("/cart") },
        });
      }
    } catch (error) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast({ tone: "error", title: "Your cart wasn't updated", description: (error as Error).message });
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.screen}>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 + insets.bottom }}
      >
        <Animated.View style={[styles.imageWrap, { height: imageHeight }, imageStyle]}>
          <FlatList
            data={images}
            keyExtractor={(src) => src}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item, index }) => (
              <Image
                source={imageUrl(item)}
                accessibilityLabel={`${product.name}, image ${index + 1} of ${images.length}`}
                style={{ width, height: imageHeight }}
                contentFit="cover"
                transition={250}
              />
            )}
          />
          <LinearGradient colors={["rgba(20,19,18,0.35)", "rgba(20,19,18,0)"]} style={styles.topShade} pointerEvents="none" />
          {images.length > 1 && (
            <View style={styles.dots} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {images.map((src, i) => (
                <View key={src} style={[styles.dot, i === page && styles.dotActive]} />
              ))}
            </View>
          )}
        </Animated.View>
        {/* The details sheet overlaps the bottom of the image. */}
        <View style={[styles.sheet, { marginTop: -30 }]}>
          <View style={styles.handle} />
          <Eyebrow>{productLabel(product.number)}</Eyebrow>
          <Display size={46} style={{ marginTop: 6 }}>
            {product.name}
          </Display>
          <Text style={styles.family}>{familyLine(product.fragrance_family, product.secondary_family)}</Text>
          <Body muted style={{ marginTop: 14 }}>
            {product.short_description}
          </Body>

          <Text style={styles.label}>Size</Text>
          <View style={styles.sizes} accessibilityRole="radiogroup">
            {product.variants.map((v) => {
              const checked = v.id === selectedId;
              const soldOut = v.stock_quantity <= 0;
              return (
                <Pressable
                  key={v.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked, disabled: soldOut }}
                  accessibilityLabel={`${v.size_ml} millilitres, ${soldOut ? "sold out" : formatPrice(v.price, product.currency)}`}
                  disabled={soldOut}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSelectedId(v.id);
                    setQuantity(1);
                  }}
                  style={[styles.size, checked && styles.sizeSelected, soldOut && styles.sizeSoldOut]}
                >
                  <Text style={[styles.sizeLabel, checked && styles.sizeLabelSelected, soldOut && { color: c.faint }]}>{v.size_ml} ml</Text>
                  <Text style={[styles.sizePrice, checked && styles.sizePriceSelected]}>
                    {soldOut ? "Sold out" : formatPrice(v.price, product.currency)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text
            style={[styles.stock, !unavailable && selected.stock_quantity <= commerce.lowStockThreshold && { color: c.champagneDeep }]}
            accessibilityLiveRegion="polite"
          >
            {stockNote}
          </Text>

          {!unavailable && !cartFull && (
            <Button
              label={busy === "buy" ? "Preparing checkout…" : "Buy now"}
              variant="secondary"
              disabled={busy !== null}
              onPress={() => add("buy")}
              style={{ marginTop: 18 }}
            />
          )}
          {inCart > 0 && (
            <Text style={styles.stock}>
              {inCart} × {selected?.size_ml} ml already in your cart.
            </Text>
          )}

          <Text style={[styles.label, { marginTop: 36 }]}>The notes</Text>
          <View style={styles.notes}>
            {NOTE_TIERS.map((tier) => (
              <View key={tier.key} style={styles.note}>
                <Text style={styles.noteTitle}>{tier.title}</Text>
                <Text style={styles.noteTiming}>{tier.timing}</Text>
                <Text style={styles.noteList}>{product[tier.key].join("\n")}</Text>
              </View>
            ))}
          </View>

          <Section title="The composition">
            <Body>{product.description}</Body>
          </Section>

          {(product.longevity || product.sillage) && (
            <Section title="On skin">
              <View style={{ flexDirection: "row", gap: 24 }}>
                <Fact label="Longevity" value={product.longevity} />
                <Fact label="Sillage" value={product.sillage} />
              </View>
            </Section>
          )}

          <Section title="Delivery & returns">
            <Body>Free delivery on orders over {formatPrice(commerce.freeShippingThreshold)}. Otherwise {formatPrice(commerce.shippingFee)}.</Body>
            <Body style={{ marginTop: 6 }}>Lagos: 1–2 business days. Elsewhere in Nigeria: 3–5 business days.</Body>
            <Body style={{ marginTop: 6 }}>Unopened fragrances can be returned within {commerce.returnWindowDays} days of delivery.</Body>
          </Section>
        </View>

        {related.length > 0 && (
          <View style={styles.related}>
            <View style={{ paddingHorizontal: gutter, marginBottom: 16 }}>
              <Eyebrow>You may also like</Eyebrow>
              <Display size={30} style={{ marginTop: 6 }}>
                Related fragrances
              </Display>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, gap: 16 }}>
              {related.map((p) => (
                <ProductCard key={p.id} product={p} width={Math.min(200, width * 0.48)} />
              ))}
            </ScrollView>
          </View>
        )}
      </Animated.ScrollView>

      {/* A compact title bar once the image has scrolled away. */}
      <Animated.View style={[styles.bar, { paddingTop: insets.top + 6 }, barStyle]} pointerEvents="none">
        <Text style={styles.barTitle} numberOfLines={1}>
          {product.name}
        </Text>
      </Animated.View>
      <FloatingBack />

      {/* Purchase controls stay within reach. */}
      <View style={[styles.purchase, { paddingBottom: insets.bottom + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.purchasePrice}>{selected ? formatPrice(selected.price * quantity, product.currency) : "—"}</Text>
          <Text style={styles.purchaseMeta}>{selected ? `${selected.size_ml} ml` : ""}</Text>
        </View>
        <QuantityStepper label="Quantity" value={quantity} max={maxSelectable} onChange={setQuantity} disabled={unavailable || cartFull} />
        <Button label={busy === "add" ? "Adding…" : addLabel} size="compact" disabled={unavailable || cartFull || busy !== null} onPress={() => add("add")} />
      </View>
    </View>
  );
}

function FloatingBack() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      hitSlop={8}
      style={({ pressed }) => [styles.back, { top: insets.top + 6 }, pressed && { opacity: 0.7 }]}
    >
      <Feather name="chevron-left" size={22} color={onImage.cream} />
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{title}</Text>
      <View style={{ marginTop: 10 }}>{children}</View>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={{ flex: 1 }}>
      <Body muted>{label}</Body>
      <Body>{value ?? "—"}</Body>
    </View>
  );
}

function ProductSkeleton() {
  const { width, height } = useWindowDimensions();
  return (
    <View style={{ flex: 1 }} accessibilityLabel="Loading fragrance" accessible>
      <Skeleton width={width} height={Math.min(height * 0.68, width * 1.35)} />
      <View style={{ paddingHorizontal: gutter, gap: 12, marginTop: 24 }}>
        <Skeleton width="30%" height={10} />
        <Skeleton width="70%" height={36} />
        <Skeleton width="45%" height={12} />
      </View>
      <FloatingBack />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  screen: { flex: 1, backgroundColor: c.ivory },
  imageWrap: { backgroundColor: c.stone, overflow: "hidden" },
  topShade: { position: "absolute", top: 0, left: 0, right: 0, height: 140 },
  dots: { position: "absolute", left: 0, right: 0, bottom: 44, flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(247,243,237,0.5)" },
  dotActive: { width: 18, backgroundColor: onImage.cream },
  sheet: {
    paddingHorizontal: gutter,
    marginTop: 0,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: c.ivory,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: c.sand, alignSelf: "center", marginBottom: 18 },
  family: { fontFamily: fonts.sans, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", color: c.faint, marginTop: 8 },
  label: { fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: c.muted, marginTop: 28 },
  sizes: { flexDirection: "row", gap: 8, marginTop: 12 },
  size: { flex: 1, minHeight: 60, alignItems: "center", justifyContent: "center", borderRadius: 16, borderWidth: 1, borderColor: c.line, backgroundColor: c.paper },
  sizeSelected: { backgroundColor: c.ink, borderColor: c.ink },
  sizeSoldOut: { borderStyle: "dashed", backgroundColor: "transparent" },
  sizeLabel: { fontFamily: fonts.sansMedium, fontSize: 15, color: c.ink },
  sizeLabelSelected: { color: c.ivory },
  sizePrice: { fontFamily: fonts.sans, fontSize: 12, color: c.muted, marginTop: 2, fontVariant: ["tabular-nums"] },
  sizePriceSelected: { color: c.sand },
  stock: { fontFamily: fonts.sans, fontSize: 13, color: c.muted, marginTop: 12 },
  notes: { flexDirection: "row", gap: 8, marginTop: 12 },
  note: { flex: 1, padding: 14, borderRadius: 18, backgroundColor: c.stone },
  noteTitle: { fontFamily: fonts.serif, fontSize: 22, color: c.ink },
  noteTiming: { fontFamily: fonts.sans, fontSize: 10, letterSpacing: 0.6, color: c.faint, marginTop: 2 },
  noteList: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, color: c.inkSoft, marginTop: 10 },
  section: { marginTop: 8 },
  related: { marginTop: 40, backgroundColor: c.ivory, paddingBottom: 8 },
  bar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 12,
    paddingHorizontal: 64,
    backgroundColor: c.ivory,
    borderBottomWidth: 1,
    borderBottomColor: c.line,
  },
  barTitle: { textAlign: "center", fontFamily: fonts.serif, fontSize: 20, color: c.ink, marginTop: 6 },
  back: {
    position: "absolute",
    left: gutter - 4,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(26,25,24,0.62)",
  },
  purchase: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 12,
    paddingHorizontal: gutter,
    backgroundColor: c.ivory,
    borderTopWidth: 1,
    borderTopColor: c.line,
  },
  purchasePrice: { fontFamily: fonts.sansMedium, fontSize: 16, color: c.ink, fontVariant: ["tabular-nums"] },
  purchaseMeta: { fontFamily: fonts.sans, fontSize: 12, color: c.muted, marginTop: 2 },
}));
