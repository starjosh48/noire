import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { formatPrice, imageUrl } from "~/lib/format";
import { familyLine, type ProductSummary } from "~/shared";
import { fonts, makeStyles, onImage } from "~/theme";

export function ProductCard({ product, width }: { product: ProductSummary; width: number }) {
  const styles = useStyles();
  const soldOut = product.stock_quantity <= 0;
  const badge = soldOut ? "Sold out" : product.new_arrival ? "New" : product.bestseller ? "Bestseller" : null;

  return (
    <Link href={{ pathname: "/product/[slug]", params: { slug: product.slug } }} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${product.name}, from ${formatPrice(product.price, product.currency)}${soldOut ? ", sold out" : ""}`}
        style={({ pressed }) => [{ width }, pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] }]}
      >
        <View style={[styles.imageWrap, { width, height: width * 1.3 }]}>
          <Image source={imageUrl(product.image_url)} style={styles.fill} contentFit="cover" transition={250} recyclingKey={product.id} />
          {badge && (
            <View style={[styles.badge, soldOut && styles.badgeSoldOut]}>
              <Text style={[styles.badgeText, soldOut && { color: onImage.cream }]}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={styles.family} numberOfLines={1}>
          {familyLine(product.fragrance_family, product.secondary_family)}
        </Text>
        <Text style={styles.price}>{formatPrice(product.price, product.currency)}</Text>
      </Pressable>
    </Link>
  );
}

const useStyles = makeStyles((c) => ({
  imageWrap: { borderRadius: 18, backgroundColor: c.stone, overflow: "hidden" },
  fill: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(247, 243, 237, 0.92)",
  },
  badgeSoldOut: { backgroundColor: onImage.night },
  badgeText: { fontFamily: fonts.sansMedium, fontSize: 9, letterSpacing: 1.4, textTransform: "uppercase", color: onImage.night },
  name: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 24, color: c.ink, marginTop: 12 },
  family: { fontFamily: fonts.sans, fontSize: 10, letterSpacing: 1.4, textTransform: "uppercase", color: c.faint, marginTop: 3 },
  price: { fontFamily: fonts.sansMedium, fontSize: 13, color: c.ink, marginTop: 6, fontVariant: ["tabular-nums"] },
}));
