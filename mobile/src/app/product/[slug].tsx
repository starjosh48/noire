import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useProduct } from "~/api/catalog";
import { Button } from "~/components/button";
import { ProductCard } from "~/components/product-card";
import { ErrorState, LoadingState } from "~/components/states";
import { Body, Display, Eyebrow } from "~/components/typography";
import { formatPrice, imageUrl, productLabel } from "~/lib/format";
import { commerce, familyLine, type ProductDetail, type ProductSummary } from "~/shared";
import { colors, fonts, gutter } from "~/theme";

const NOTE_TIERS = [
  { key: "top_notes", title: "Top notes", timing: "The first impression · 0–15 minutes" },
  { key: "heart_notes", title: "Heart notes", timing: "The character · 15 minutes – 3 hours" },
  { key: "base_notes", title: "Base notes", timing: "What lingers · 3 hours and beyond" },
] as const;

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const query = useProduct(slug);

  if (query.isPending) return <LoadingState />;
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

function ProductView({ product, related }: { product: ProductDetail; related: ProductSummary[] }) {
  const { width } = useWindowDimensions();
  const images = product.gallery_images.length ? product.gallery_images : [product.image_url];
  const [page, setPage] = useState(0);
  const firstInStock = product.variants.find((v) => v.stock_quantity > 0) ?? product.variants[0];
  const [variantId, setVariantId] = useState(firstInStock?.id);
  const variant = product.variants.find((v) => v.id === variantId) ?? firstInStock;
  const railWidth = Math.min(240, width * 0.58);

  const stockNote = !variant
    ? null
    : variant.stock_quantity <= 0
      ? "This size is sold out."
      : variant.stock_quantity <= commerce.lowStockThreshold
        ? `Only ${variant.stock_quantity} left in ${variant.size_ml} ml.`
        : "In stock. Delivered within Nigeria.";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 56 }}>
      <Stack.Screen options={{ title: product.name }} />

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

        <Text style={styles.price}>{variant ? formatPrice(variant.price, product.currency) : "Unavailable"}</Text>

        <Eyebrow style={{ marginTop: 24 }}>Size</Eyebrow>
        <View style={styles.sizes}>
          {product.variants.map((v) => {
            const selected = v.id === variant?.id;
            const soldOut = v.stock_quantity <= 0;
            return (
              <Pressable
                key={v.id}
                accessibilityRole="radio"
                accessibilityState={{ selected, disabled: soldOut }}
                accessibilityLabel={`${v.size_ml} millilitres, ${formatPrice(v.price, product.currency)}${soldOut ? ", sold out" : ""}`}
                onPress={() => setVariantId(v.id)}
                style={[styles.size, selected && styles.sizeSelected]}
              >
                <Text style={[styles.sizeLabel, selected && { color: colors.ivory }, soldOut && styles.soldOut]}>
                  {v.size_ml} ml
                </Text>
                <Text style={[styles.sizePrice, selected && { color: colors.sand }]}>
                  {formatPrice(v.price, product.currency)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {stockNote && <Text style={styles.stock}>{stockNote}</Text>}

        <Button label="Add to bag" disabled style={{ marginTop: 20 }} />
        <Text style={styles.soon}>Ordering in the app is coming soon. Until then, order on the NOIRÉ website.</Text>

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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: gutter, gap: 16 }}
          >
            {related.map((p) => (
              <ProductCard key={p.id} product={p} width={railWidth} />
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  padded: { paddingHorizontal: gutter },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.sand },
  family: {
    fontFamily: fonts.sans,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.faint,
    marginTop: 8,
  },
  price: { fontFamily: fonts.sans, fontSize: 20, color: colors.ink, marginTop: 18, fontVariant: ["tabular-nums"] },
  sizes: { flexDirection: "row", gap: 8, marginTop: 10 },
  size: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  sizeSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  sizeLabel: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink },
  sizePrice: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  soldOut: { textDecorationLine: "line-through" },
  stock: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 12 },
  soon: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, color: colors.muted, marginTop: 10, textAlign: "center" },
  section: { marginTop: 40, paddingTop: 24, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  tier: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  tierTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.ink },
  tierTiming: { fontFamily: fonts.sans, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: colors.faint, marginTop: 2 },
});
