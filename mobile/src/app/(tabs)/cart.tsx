import Feather from "@expo/vector-icons/Feather";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Link, router } from "expo-router";
import { useRef } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart, useCartMutation } from "~/cart/cart";
import { Button } from "~/components/button";
import { QuantityStepper } from "~/components/quantity-stepper";
import { RowsSkeleton } from "~/components/skeleton";
import { ErrorState } from "~/components/states";
import { useToast } from "~/components/toast";
import { Body, Display } from "~/components/typography";
import { formatPrice, imageUrl, pluralize } from "~/lib/format";
import { useTabBarInset } from "~/lib/layout";
import { commerce, familyLine, type Cart, type CartLine } from "~/shared";
import { fonts, gutter, makeStyles, onImage, useColors } from "~/theme";

const ACTION_WIDTH = 96;

export default function CartScreen() {
  const styles = useStyles();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const bottom = useTabBarInset();
  const cart = useCart();

  const header = (
    <View style={[styles.padded, { paddingTop: insets.top + 16, paddingBottom: 8 }]}>
      <Display size={44}>Cart</Display>
      {cart.data && cart.data.itemCount > 0 && <Text style={styles.count}>{pluralize(cart.data.itemCount, "item")}</Text>}
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
        <Animated.View entering={FadeIn.duration(400)} style={[styles.empty, { paddingBottom: bottom + 40 }]}>
          <View style={styles.emptyIcon}>
            <Feather name="shopping-bag" size={28} color={c.ink} />
          </View>
          <Display size={34} style={{ textAlign: "center", marginTop: 20 }}>
            Your cart is waiting.
          </Display>
          <Body muted style={{ textAlign: "center", marginTop: 10 }}>
            Discover a scent worth taking home.
          </Body>
          <Button label="Explore fragrances" onPress={() => router.navigate("/")} style={{ marginTop: 28, alignSelf: "stretch" }} />
        </Animated.View>
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
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={cart.isRefetching} onRefresh={cart.refetch} tintColor={c.ink} />}
        ListFooterComponent={<Totals cart={data} />}
      />
      <View style={[styles.footer, { paddingBottom: bottom + 10 }]}>
        {data.hasIssues && <Text style={styles.issueNote}>Update the highlighted items to continue.</Text>}
        <Button label={`Checkout · ${formatPrice(data.total)}`} disabled={data.hasIssues} onPress={() => router.push("/checkout")} />
      </View>
    </View>
  );
}

/** A cart line; swipe it left to reveal Remove (the visible Remove link does the same). */
function CartRow({ line }: { line: CartLine }) {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const mutation = useCartMutation();
  const toast = useToast();
  const swipe = useRef<ScrollView>(null);
  const pending = line.id.startsWith("pending-");

  const change = async (quantity: number) => {
    try {
      const result = await mutation.mutateAsync({ kind: "quantity", itemId: line.id, quantity });
      if (result.message) toast({ title: result.message });
      if (quantity === 0) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      swipe.current?.scrollTo({ x: 0, animated: true });
      toast({ tone: "error", title: "Your cart wasn't updated", description: (error as Error).message });
    }
  };

  return (
    <Animated.View layout={LinearTransition.duration(220)}>
      <ScrollView
        ref={swipe}
        horizontal
        bounces={false}
        showsHorizontalScrollIndicator={false}
        snapToOffsets={[0, ACTION_WIDTH]}
        decelerationRate="fast"
        scrollEnabled={!pending}
        accessibilityActions={[{ name: "delete", label: "Remove" }]}
        onAccessibilityAction={(e) => e.nativeEvent.actionName === "delete" && change(0)}
      >
        <View style={[styles.row, { width }, pending && { opacity: 0.6 }]}>
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
              <QuantityStepper label={`Quantity of ${line.product.name}`} value={line.quantity} max={line.maxQuantity} onChange={change} disabled={pending} />
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
        <Pressable
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          onPress={() => change(0)}
          style={styles.swipeAction}
        >
          <Feather name="trash-2" size={20} color={onImage.cream} />
          <Text style={styles.swipeText}>Remove</Text>
        </Pressable>
      </ScrollView>
    </Animated.View>
  );
}

function FreeShippingMeter({ cart }: { cart: Cart }) {
  const styles = useStyles();
  const progress = Math.min(1, cart.subtotal / commerce.freeShippingThreshold);
  return (
    <View style={styles.meter}>
      <Text style={styles.meterText}>
        {cart.freeShippingRemaining > 0 ? `${formatPrice(cart.freeShippingRemaining)} away from free delivery` : "Your order ships free"}
      </Text>
      <View style={styles.meterTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}>
        <View style={[styles.meterFill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

function Totals({ cart }: { cart: Cart }) {
  const styles = useStyles();
  return (
    <View style={styles.totals}>
      <Line label="Subtotal" value={formatPrice(cart.subtotal)} />
      <Line label="Delivery" value={cart.shippingFee === 0 ? "Free" : formatPrice(cart.shippingFee)} />
      <View style={styles.totalRule} />
      <Line label="Total" value={formatPrice(cart.total)} strong />
      <Text style={styles.note}>Prices and stock are confirmed when you place your order.</Text>
    </View>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.totalLine}>
      <Text style={[styles.totalLabel, strong && styles.totalStrong]}>{label}</Text>
      <Text style={[styles.totalValue, strong && styles.totalStrong]}>{value}</Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  screen: { flex: 1, backgroundColor: c.ivory },
  padded: { paddingHorizontal: gutter },
  count: { fontFamily: fonts.sans, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: c.muted, marginTop: 6 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: gutter * 2 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", backgroundColor: c.stone },
  row: { flexDirection: "row", gap: 16, paddingHorizontal: gutter, paddingVertical: 16, backgroundColor: c.ivory },
  thumb: { width: 92, height: 118, borderRadius: 14, backgroundColor: c.stone },
  rowTop: { flexDirection: "row", gap: 12 },
  name: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 25, color: c.ink },
  meta: { fontFamily: fonts.sans, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: c.faint, marginTop: 4 },
  price: { fontFamily: fonts.sansMedium, fontSize: 14, color: c.ink, fontVariant: ["tabular-nums"] },
  unit: { fontFamily: fonts.sans, fontSize: 12, color: c.muted, marginTop: 4 },
  issue: { fontFamily: fonts.sans, fontSize: 13, color: c.danger, marginTop: 6 },
  rowActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  remove: { fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: c.muted, textDecorationLine: "underline" },
  swipeAction: { width: ACTION_WIDTH, alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#9b2c2c" },
  swipeText: { fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: onImage.cream },
  meter: { marginHorizontal: gutter, marginTop: 8, marginBottom: 8, padding: 16, borderRadius: 18, backgroundColor: c.stone },
  meterText: { fontFamily: fonts.sans, fontSize: 13, color: c.ink },
  meterTrack: { height: 4, borderRadius: 2, backgroundColor: c.sand, marginTop: 10, overflow: "hidden" },
  meterFill: { height: 4, borderRadius: 2, backgroundColor: c.champagneDeep },
  totals: { marginHorizontal: gutter, marginTop: 16, paddingTop: 20, borderTopWidth: 1, borderTopColor: c.line, gap: 10 },
  totalLine: { flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { fontFamily: fonts.sans, fontSize: 14, color: c.muted },
  totalValue: { fontFamily: fonts.sans, fontSize: 14, color: c.ink, fontVariant: ["tabular-nums"] },
  totalStrong: { fontFamily: fonts.sansMedium, fontSize: 17, color: c.ink },
  totalRule: { height: 1, backgroundColor: c.line, marginVertical: 4 },
  note: { fontFamily: fonts.sans, fontSize: 12, color: c.faint, marginTop: 6 },
  issueNote: { fontFamily: fonts.sans, fontSize: 13, color: c.danger, marginBottom: 10, textAlign: "center" },
  footer: { paddingHorizontal: gutter, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.ivory },
}));
