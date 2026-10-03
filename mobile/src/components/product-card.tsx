import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatPrice, imageUrl, productLabel } from "~/lib/format";
import { familyLine, type ProductSummary } from "~/shared";
import { colors, fonts } from "~/theme";
import { Eyebrow } from "./typography";

export function ProductCard({ product, width }: { product: ProductSummary; width: number }) {
  const soldOut = product.stock_quantity <= 0;
  const badge = soldOut ? "Sold out" : product.new_arrival ? "New" : product.bestseller ? "Bestseller" : null;

  return (
    <Link href={{ pathname: "/product/[slug]", params: { slug: product.slug } }} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${product.name}, from ${formatPrice(product.price, product.currency)}${soldOut ? ", sold out" : ""}`}
        style={({ pressed }) => [{ width }, pressed && { opacity: 0.85 }]}
      >
        <View style={[styles.imageWrap, { width, height: width * 1.25 }]}>
          <Image
            source={imageUrl(product.image_url)}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={250}
            recyclingKey={product.id}
          />
          {badge && (
            <View style={[styles.badge, soldOut && { backgroundColor: colors.ink }]}>
              <Text style={[styles.badgeText, soldOut && { color: colors.ivory }]}>{badge}</Text>
            </View>
          )}
        </View>
        <Eyebrow style={{ marginTop: 14 }}>{productLabel(product.number)}</Eyebrow>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.family} numberOfLines={1}>
          {familyLine(product.fragrance_family, product.secondary_family)}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {product.short_description}
        </Text>
        <Text style={styles.price}>
          <Text style={{ color: colors.muted }}>From </Text>
          {formatPrice(product.price, product.currency)}
        </Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  imageWrap: { backgroundColor: colors.stone, overflow: "hidden" },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(247, 243, 237, 0.92)",
  },
  badgeText: {
    fontFamily: fonts.sansMedium,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.ink,
  },
  name: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 23, color: colors.ink, marginTop: 4 },
  family: {
    fontFamily: fonts.sans,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.faint,
    marginTop: 4,
  },
  description: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: 6 },
  price: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink, marginTop: 8, fontVariant: ["tabular-nums"] },
});
