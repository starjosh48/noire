import Feather from "@expo/vector-icons/Feather";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { FlatList, Pressable, Text, View, type ViewToken } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useCart, useCartMutation } from "~/cart/cart";
import { formatPrice, imageUrl, productLabel } from "~/lib/format";
import { commerce, familyLine, type ProductSummary, type QuickVariant } from "~/shared";
import { fonts, gutter, makeStyles, onImage, scrims } from "~/theme";
import { Button } from "./button";
import { useToast } from "./toast";

type FeedProps = {
  products: ProductSummary[];
  /** An optional opening page (e.g. the cover on Home). */
  cover?: ReactNode;
  /** Shown over the top of every page (wordmark, back button, filters). */
  overlay?: ReactNode;
  /** Space the floating tab bar covers at the bottom. */
  bottomInset?: number;
};

type Page = { kind: "cover" } | { kind: "product"; product: ProductSummary; index: number };

/**
 * The lookbook: one fragrance per screen, swiped vertically like a magazine. Each page can add
 * the fragrance's default size straight to the cart, or open its full page.
 */
export function ProductFeed({ products, cover, overlay, bottomInset = 0 }: FeedProps) {
  const styles = useStyles();
  const [height, setHeight] = useState(0);
  const [active, setActive] = useState(0);
  const pages: Page[] = [...(cover ? [{ kind: "cover" } as const] : []), ...products.map((product, index) => ({ kind: "product" as const, product, index }))];

  // FlatList needs the same callback for its whole life.
  const [onViewable] = useState(() => ({ viewableItems }: { viewableItems: ViewToken<Page>[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) setActive(first.index);
  });

  return (
    <View style={styles.feed} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
      {height > 0 && (
        <FlatList
          data={pages}
          keyExtractor={(page) => (page.kind === "cover" ? "cover" : page.product.id)}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          windowSize={3}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          renderItem={({ item, index }) => (
            <View style={{ height }}>
              {item.kind === "cover" ? (
                cover
              ) : (
                <FeedPage
                  product={item.product}
                  position={item.index}
                  total={products.length}
                  active={index === active}
                  bottomInset={bottomInset}
                />
              )}
            </View>
          )}
        />
      )}
      {overlay}
      {products.length > 1 && (
        <View style={[styles.progress, { bottom: bottomInset + 32 }]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {pages.map((page, i) => (
            <View key={page.kind === "cover" ? "cover" : page.product.id} style={[styles.tick, i === active && styles.tickActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

/** The size added from the lookbook: 50 ml when in stock (the website's default), else the first in stock. */
function quickVariant(variants: QuickVariant[]) {
  const inStock = variants.filter((v) => v.stock_quantity > 0);
  return inStock.find((v) => v.size_ml === 50) ?? inStock[0];
}

function FeedPage({
  product,
  position,
  total,
  active,
  bottomInset,
}: {
  product: ProductSummary;
  position: number;
  total: number;
  active: boolean;
  bottomInset: number;
}) {
  const styles = useStyles();
  const toast = useToast();
  const cart = useCart();
  const mutation = useCartMutation();
  const [adding, setAdding] = useState(false);
  const variant = quickVariant(product.variants);
  const inCart = cart.data?.lines.find((l) => l.variant.id === variant?.id)?.quantity ?? 0;
  const full = !!variant && inCart >= Math.min(variant.stock_quantity, commerce.maxQuantityPerLine);

  // A slow push-in on the image and a rise on the words while the page is on screen.
  const zoom = useSharedValue(1.08);
  const reveal = useSharedValue(0);
  useEffect(() => {
    zoom.value = withTiming(active ? 1 : 1.08, { duration: active ? 7000 : 0, easing: Easing.out(Easing.quad) });
    reveal.value = withTiming(active ? 1 : 0, { duration: active ? 650 : 0, easing: Easing.out(Easing.cubic) });
  }, [active, zoom, reveal]);
  const imageStyle = useAnimatedStyle(() => ({ transform: [{ scale: zoom.value }] }));
  const textStyle = useAnimatedStyle(() => ({ opacity: reveal.value, transform: [{ translateY: (1 - reveal.value) * 24 }] }));

  const open = useCallback(() => router.push({ pathname: "/product/[slug]", params: { slug: product.slug } }), [product.slug]);

  const add = async () => {
    if (!variant || full) return open();
    setAdding(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await mutation.mutateAsync({ kind: "add", product, variant: { ...variant, sku: "" }, quantity: 1 });
      toast({
        title: "Added to cart",
        description: result.message ?? `${product.name}, ${variant.size_ml} ml`,
        action: { label: "View cart", onPress: () => router.navigate("/cart") },
      });
    } catch (error) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast({ tone: "error", title: "Your cart wasn't updated", description: (error as Error).message });
    } finally {
      setAdding(false);
    }
  };

  const soldOut = !variant;
  return (
    <View style={styles.page}>
      <Pressable onPress={open} accessibilityRole="link" accessibilityLabel={`${product.name}, open details`} style={styles.fill}>
        <Animated.View style={[styles.fill, imageStyle]}>
          <Image source={imageUrl(product.image_url)} style={styles.fill} contentFit="cover" transition={300} recyclingKey={product.id} />
        </Animated.View>
      </Pressable>
      <LinearGradient colors={scrims.feed.colors} locations={scrims.feed.locations} style={styles.fill} pointerEvents="none" />

      <Animated.View style={[styles.copy, { paddingBottom: bottomInset + 28 }, textStyle]} pointerEvents="box-none">
        <Text style={styles.meta}>
          {productLabel(product.number)} · {String(position + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
        </Text>
        <Text style={styles.name} accessibilityRole="header">
          {product.name}
        </Text>
        <Text style={styles.family}>{familyLine(product.fragrance_family, product.secondary_family)}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {product.short_description}
        </Text>
        {(product.new_arrival || product.bestseller) && (
          <Text style={styles.badge}>{product.new_arrival ? "New" : "Bestseller"}</Text>
        )}

        <View style={styles.actions}>
          <Button
            variant="light"
            label={
              soldOut
                ? "Sold out"
                : adding
                  ? "Adding…"
                  : full
                    ? "All in your cart"
                    : `Add ${variant.size_ml} ml · ${formatPrice(variant.price, product.currency)}`
            }
            disabled={adding || soldOut}
            onPress={add}
            style={{ flex: 1 }}
          />
          <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={`${product.name} details and sizes`} style={({ pressed }) => [styles.more, pressed && { opacity: 0.7 }]}>
            <Feather name="arrow-up-right" size={20} color={onImage.cream} />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  feed: { flex: 1, backgroundColor: onImage.night },
  page: { flex: 1, overflow: "hidden", backgroundColor: onImage.night },
  fill: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  copy: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: gutter, paddingRight: gutter + 18 },
  meta: { fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: onImage.creamMuted },
  name: { fontFamily: fonts.serif, fontSize: 52, lineHeight: 54, letterSpacing: -0.6, color: onImage.cream, marginTop: 8 },
  family: { fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 1.8, textTransform: "uppercase", color: onImage.creamMuted, marginTop: 8 },
  description: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: onImage.cream, marginTop: 12, maxWidth: 320 },
  badge: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: onImage.creamMuted,
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: onImage.cream,
    overflow: "hidden",
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 22 },
  more: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: onImage.creamMuted,
  },
  progress: { position: "absolute", right: 10, gap: 6, alignItems: "center" },
  tick: { width: 3, height: 10, borderRadius: 2, backgroundColor: "rgba(247,243,237,0.35)" },
  tickActive: { height: 22, backgroundColor: onImage.cream },
}));
