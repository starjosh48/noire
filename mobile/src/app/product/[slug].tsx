import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
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
import { colors, fonts, gutter } from "~/theme";

const NOTE_TIERS = [
  { key: "top_notes", title: "Top notes", timing: "The first impression · 0–15 minutes" },
  { key: "heart_notes", title: "Heart notes", timing: "The character · 15 minutes – 3 hours" },
  { key: "base_notes", title: "Base notes", timing: "What lingers · 3 hours and beyond" },
] as const;

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const query = useProduct(slug);

  if (query.isPending) return <ProductSkeleton />;
  if (query.isError) {
    const notFound = "status" in query.error && query.error.status === 404;
    return (
      <ErrorState
        message={notFound ? "This fragrance is no longer in the collection." : query.error.message}
        onRetry={notFound ? undefined : query.refetch}
      />
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
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const cart = useCart();
  const mutation = useCartMutation();
  const images = product.gallery_images.length ? product.gallery_images : [product.image_url];
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(() => defaultVariant(product.variants)?.id);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState<"add" | "buy" | null>(null);
  const railWidth = Math.min(240, width * 0.58);

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
          : "All in your cart"
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
      <Stack.Screen options={{ title: product.name }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}>
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
              style={{ width, height: width * 1.2, backgroundColor: colors.stone }}
              contentFit="cover"
              transition={250}
            />
          )}
        />
        {images.length > 1 && (
          <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {images.map((src, i) => (
              <View key={src} style={[styles.dot, i === page && { backgroundColor: colors.ink }]} />
            ))}
          </View>
        )}

        <View style={styles.padded}>
          <Eyebrow style={{ marginTop: 24 }}>{productLabel(product.number)}</Eyebrow>
          <Display size={44} style={{ marginTop: 8 }}>
            {product.name}
          </Display>
          <Text style={styles.family}>{familyLine(product.fragrance_family, product.secondary_family)}</Text>
          <Body muted style={{ marginTop: 14 }}>
            {product.short_description}
          </Body>

          <Eyebrow style={{ marginTop: 28 }}>Size</Eyebrow>
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
                  <Text style={[styles.sizeLabel, checked && { color: colors.ivory }, soldOut && { color: colors.faint }]}>
                    {v.size_ml} ml
                  </Text>
                  <Text style={[styles.sizePrice, checked && { color: colors.sand }]}>
                    {soldOut ? "Sold out" : formatPrice(v.price, product.currency)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text
            style={[styles.stock, !unavailable && selected.stock_quantity <= commerce.lowStockThreshold && { color: colors.champagneDeep }]}
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
              style={{ marginTop: 20 }}
            />
          )}
          {inCart > 0 && (
            <Text style={styles.inCart}>
              {inCart} × {selected?.size_ml} ml already in your cart.
            </Text>
          )}

          <Section title="Delivery & returns">
            <Body>Free delivery on orders over {formatPrice(commerce.freeShippingThreshold)}. Otherwise {formatPrice(commerce.shippingFee)}.</Body>
            <Body style={{ marginTop: 6 }}>Lagos: 1–2 business days. Elsewhere in Nigeria: 3–5 business days.</Body>
            <Body style={{ marginTop: 6 }}>
              Unopened fragrances can be returned within {commerce.returnWindowDays} days of delivery.
            </Body>
          </Section>

          <Section title="The composition">
            <Body>{product.description}</Body>
          </Section>

          <Section title="The notes">
            {NOTE_TIERS.map((tier) => (
              <View key={tier.key} style={styles.tier}>
                <Text style={styles.tierTitle}>{tier.title}</Text>
                <Text style={styles.tierTiming}>{tier.timing}</Text>
                <Body style={{ marginTop: 8 }}>{product[tier.key].join(" · ")}</Body>
              </View>
            ))}
          </Section>

          {(product.longevity || product.sillage) && (
            <Section title="Longevity & projection">
              <View style={{ flexDirection: "row", gap: 24 }}>
                <View style={{ flex: 1 }}>
                  <Body muted>Longevity</Body>
                  <Body>{product.longevity ?? "—"}</Body>
                </View>
                <View style={{ flex: 1 }}>
                  <Body muted>Sillage</Body>
                  <Body>{product.sillage ?? "—"}</Body>
                </View>
              </View>
            </Section>
          )}
        </View>

        {related.length > 0 && (
          <View style={{ marginTop: 48 }}>
            <View style={[styles.padded, { marginBottom: 20 }]}>
              <Eyebrow>You may also like</Eyebrow>
              <Display size={32} style={{ marginTop: 8 }}>
                Related fragrances
              </Display>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, gap: 16 }}>
              {related.map((p) => (
                <ProductCard key={p.id} product={p} width={railWidth} />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Sticky purchase bar: quantity and Add to cart stay within reach while reading. */}
      <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.barPrice}>{selected ? formatPrice(selected.price * quantity, product.currency) : "—"}</Text>
          <Text style={styles.barMeta}>{selected ? `${selected.size_ml} ml` : ""}</Text>
        </View>
        <QuantityStepper
          label="Quantity"
          value={quantity}
          max={maxSelectable}
          onChange={setQuantity}
          disabled={unavailable || cartFull}
        />
        <Button
          label={busy === "add" ? "Adding…" : addLabel}
          disabled={unavailable || cartFull || busy !== null}
          onPress={() => add("add")}
          style={{ paddingHorizontal: 16 }}
        />
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Display size={26} style={{ marginBottom: 12 }}>
        {title}
      </Display>
      {children}
    </View>
  );
}

function ProductSkeleton() {
  const { width } = useWindowDimensions();
  return (
    <View style={styles.screen} accessibilityLabel="Loading fragrance" accessible>
      <Skeleton width={width} height={width * 1.2} />
      <View style={[styles.padded, { gap: 12, marginTop: 24 }]}>
        <Skeleton width="30%" height={10} />
        <Skeleton width="70%" height={36} />
        <Skeleton width="45%" height={12} />
        <Skeleton width="100%" height={56} style={{ marginTop: 16 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  padded: { paddingHorizontal: gutter },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.sand },
  family: { fontFamily: fonts.sans, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", color: colors.faint, marginTop: 8 },
  sizes: { flexDirection: "row", gap: 8, marginTop: 10 },
  size: { flex: 1, minHeight: 56, paddingVertical: 10, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper },
  sizeSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  sizeSoldOut: { borderStyle: "dashed", backgroundColor: "transparent" },
  sizeLabel: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink },
  sizePrice: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2, fontVariant: ["tabular-nums"] },
  stock: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 12 },
  inCart: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 12 },
  section: { marginTop: 40, paddingTop: 24, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  tier: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  tierTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.ink },
  tierTiming: { fontFamily: fonts.sans, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: colors.faint, marginTop: 2 },
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 12,
    paddingHorizontal: gutter,
    backgroundColor: colors.ivory,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  barPrice: { fontFamily: fonts.sansMedium, fontSize: 16, color: colors.ink, fontVariant: ["tabular-nums"] },
  barMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
});
