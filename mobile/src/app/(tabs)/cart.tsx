import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Link, router } from "expo-router";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart, useCartMutation } from "~/cart/cart";
import { Button } from "~/components/button";
import { QuantityStepper } from "~/components/quantity-stepper";
import { RowsSkeleton } from "~/components/skeleton";
import { ErrorState } from "~/components/states";
import { useToast } from "~/components/toast";
import { Body, Display, Eyebrow } from "~/components/typography";
import { formatPrice, imageUrl, pluralize } from "~/lib/format";
import { commerce, familyLine, type Cart, type CartLine } from "~/shared";
import { colors, fonts, gutter } from "~/theme";

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const cart = useCart();

  const header = (
    <View style={[styles.padded, { paddingTop: insets.top + 20, paddingBottom: 12 }]}>
      <Eyebrow>Your selection</Eyebrow>
      <Display size={42} style={{ marginTop: 8 }}>
        Cart
      </Display>
      {cart.data && cart.data.itemCount > 0 && (
        <Text style={styles.count}>{pluralize(cart.data.itemCount, "item")}</Text>
      )}
    </View>
  );

  if (cart.isPending) {
    return (
      <View style={styles.screen}>
        {header}
        <RowsSkeleton />
      </View>
    );
  }
  if (cart.isError && !cart.data) {
    return (
      <View style={styles.screen}>
        {header}
        <ErrorState message={cart.error.message} onRetry={cart.refetch} />
      </View>
    );
  }

  const data = cart.data!;
  if (data.lines.length === 0) {
    return (
      <View style={styles.screen}>
        {header}
        <View style={styles.empty}>
          <Display size={34} style={{ textAlign: "center" }}>
            Your cart is waiting.
          </Display>
          <Body muted style={{ textAlign: "center", marginTop: 12 }}>
            Discover a scent worth taking home.
          </Body>
          <Button label="Explore fragrances" onPress={() => router.navigate("/shop")} style={{ marginTop: 28, alignSelf: "stretch" }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={data.lines}
        keyExtractor={(line) => line.id}
        ListHeaderComponent={
          <>
            {header}
            <FreeShippingMeter cart={data} />
          </>
        }
        renderItem={({ item }) => <CartRow line={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={cart.isRefetching} onRefresh={cart.refetch} tintColor={colors.ink} />}
        ListFooterComponent={<Totals cart={data} />}
      />
      <View style={styles.footer}>
        {data.hasIssues && (
          <Text style={styles.issueNote}>Update the highlighted items to continue.</Text>
        )}
        <Button label="Proceed to checkout" disabled={data.hasIssues} onPress={() => router.push("/checkout")} />
      </View>
    </View>
  );
}

function CartRow({ line }: { line: CartLine }) {
  const mutation = useCartMutation();
  const toast = useToast();
  const pending = line.id.startsWith("pending-");

  const change = async (quantity: number) => {
    try {
      const result = await mutation.mutateAsync({ kind: "quantity", itemId: line.id, quantity });
      if (result.message) toast({ title: result.message });
      if (quantity === 0) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      toast({ tone: "error", title: "Your cart wasn't updated", description: (error as Error).message });
    }
  };

  return (
    <View style={[styles.row, pending && { opacity: 0.6 }]}>
      <Link href={{ pathname: "/product/[slug]", params: { slug: line.product.slug } }} asChild>
        <Pressable accessibilityRole="link" accessibilityLabel={`${line.product.name}, view fragrance`}>
          <Image source={imageUrl(line.product.image_url)} style={styles.thumb} contentFit="cover" />
        </Pressable>
      </Link>
      <View style={{ flex: 1 }}>
        <View style={styles.rowTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{line.product.name}</Text>
            <Text style={styles.meta}>
              {line.variant.size_ml} ml · {familyLine(line.product.fragrance_family, line.product.secondary_family)}
            </Text>
          </View>
          <Text style={styles.price}>{formatPrice(line.lineTotal)}</Text>
        </View>
        {line.quantity > 1 && <Text style={styles.unit}>{formatPrice(line.variant.price)} each</Text>}
        {line.issue && <Text style={styles.issue}>{line.issue}</Text>}
        <View style={styles.rowActions}>
          <QuantityStepper
            label={`Quantity of ${line.product.name}`}
            value={line.quantity}
            max={line.maxQuantity}
            onChange={change}
            disabled={pending}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${line.product.name} ${line.variant.size_ml} ml`}
            onPress={() => change(0)}
            disabled={pending}
            hitSlop={10}
          >
            <Text style={styles.remove}>Remove</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function FreeShippingMeter({ cart }: { cart: Cart }) {
  const progress = Math.min(1, cart.subtotal / commerce.freeShippingThreshold);
  return (
    <View style={[styles.padded, { marginBottom: 20 }]}>
      <Text style={styles.meterText}>
        {cart.freeShippingRemaining > 0
          ? `${formatPrice(cart.freeShippingRemaining)} away from free delivery`
          : "Your order ships free"}
      </Text>
      <View
        style={styles.meterTrack}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
      >
        <View style={[styles.meterFill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

function Totals({ cart }: { cart: Cart }) {
  return (
    <View style={[styles.padded, styles.totals]}>
      <Line label="Subtotal" value={formatPrice(cart.subtotal)} />
      <Line label="Delivery" value={cart.shippingFee === 0 ? "Free" : formatPrice(cart.shippingFee)} />
      <View style={styles.totalRule} />
      <Line label="Total" value={formatPrice(cart.total)} strong />
      <Text style={styles.note}>Prices and stock are confirmed when you place your order.</Text>
    </View>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.totalLine}>
      <Text style={[styles.totalLabel, strong && styles.totalStrong]}>{label}</Text>
      <Text style={[styles.totalValue, strong && styles.totalStrong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  padded: { paddingHorizontal: gutter },
  count: { fontFamily: fonts.sans, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: colors.muted, marginTop: 8 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: gutter * 2, paddingBottom: 80 },
  row: { flexDirection: "row", gap: 16, paddingHorizontal: gutter, paddingVertical: 18 },
  thumb: { width: 84, height: 105, backgroundColor: colors.stone },
  rowTop: { flexDirection: "row", gap: 12 },
  name: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 24, color: colors.ink },
  meta: { fontFamily: fonts.sans, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: colors.faint, marginTop: 4 },
  price: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink, fontVariant: ["tabular-nums"] },
  unit: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 4 },
  issue: { fontFamily: fonts.sans, fontSize: 13, color: colors.danger, marginTop: 6 },
  rowActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  remove: { fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: colors.muted, textDecorationLine: "underline" },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginHorizontal: gutter },
  meterText: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink },
  meterTrack: { height: 3, backgroundColor: colors.sand, marginTop: 10 },
  meterFill: { height: 3, backgroundColor: colors.champagneDeep },
  totals: { marginTop: 12, paddingTop: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, gap: 10 },
  totalLine: { flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted },
  totalValue: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink, fontVariant: ["tabular-nums"] },
  totalStrong: { fontFamily: fonts.sansMedium, fontSize: 17, color: colors.ink },
  totalRule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginVertical: 4 },
  note: { fontFamily: fonts.sans, fontSize: 12, color: colors.faint, marginTop: 6 },
  issueNote: { fontFamily: fonts.sans, fontSize: 13, color: colors.danger, marginBottom: 10, textAlign: "center" },
  footer: {
    paddingHorizontal: gutter,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: colors.ivory,
  },
});
