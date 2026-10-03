import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useOrder } from "~/api/account";
import { Button } from "~/components/button";
import { OrderStatusBadge, OrderTimeline } from "~/components/order-status";
import { RowsSkeleton } from "~/components/skeleton";
import { ErrorState } from "~/components/states";
import { Body, Display, Eyebrow } from "~/components/typography";
import { formatPrice, imageUrl } from "~/lib/format";
import { deliveryEstimate, firstName, formatDate, paymentMethodLabel } from "~/shared";
import { fonts, gutter, makeStyles, useColors } from "~/theme";

/**
 * One order. Straight after checkout (?placed=1) it opens as the confirmation; from the account
 * it's the order's details. Guests reach it with the order's access key (?key=…), as on the website.
 */
export default function OrderScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { orderNumber, key, placed } = useLocalSearchParams<{ orderNumber: string; key?: string; placed?: string }>();
  const order = useOrder(orderNumber, key);
  const justPlaced = placed === "1";

  if (order.isPending) return <RowsSkeleton count={3} />;
  if (order.isError) {
    return <ErrorState message={order.error.message} onRetry={order.refetch} />;
  }
  const o = order.data;
  const pending = o.status === "pending_payment";

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 56 }}
      refreshControl={<RefreshControl refreshing={order.isRefetching} onRefresh={order.refetch} tintColor={colors.ink} />}
    >
      <Stack.Screen options={{ title: justPlaced ? "" : o.order_number, headerBackVisible: !justPlaced, gestureEnabled: !justPlaced }} />

      <View style={styles.padded}>
        {justPlaced ? (
          <>
            <Feather name={pending ? "clock" : "check-circle"} size={30} color={colors.ink} style={{ marginTop: 8 }} />
            <Display size={44} style={{ marginTop: 14 }} accessibilityLiveRegion="polite">
              {pending ? "Almost there" : "Order confirmed"}
            </Display>
            <Body muted style={{ marginTop: 10 }}>
              {pending
                ? `Thank you, ${firstName(o.customer_name)}. We're waiting for Paystack to confirm your payment.`
                : `Thank you, ${firstName(o.customer_name)}. A confirmation is on its way to ${o.customer_email}.`}
            </Body>
          </>
        ) : (
          <>
            <Eyebrow>Placed {formatDate(o.created_at)}</Eyebrow>
            <Display size={34} style={{ marginTop: 8 }}>
              {o.order_number}
            </Display>
          </>
        )}

        <View style={styles.numberRow}>
          <View>
            <Text style={styles.caption}>Order number</Text>
            <Text style={styles.value}>{o.order_number}</Text>
          </View>
          <OrderStatusBadge status={o.status} />
        </View>
        <View style={{ marginTop: 20 }}>
          <OrderTimeline status={o.status} />
        </View>
      </View>

      <Section title="Your fragrances">
        {o.items.map((item) => (
          <View key={item.id} style={styles.item}>
            <Image source={imageUrl(item.image_url)} style={styles.thumb} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.product_name}</Text>
              <Text style={styles.itemMeta}>
                {item.size_ml} ml · {item.quantity} × {formatPrice(item.unit_price, o.currency)}
              </Text>
            </View>
            <Text style={styles.value}>{formatPrice(item.total_price, o.currency)}</Text>
          </View>
        ))}
        <View style={styles.totals}>
          <Line label="Subtotal" value={formatPrice(o.subtotal, o.currency)} />
          <Line label="Delivery" value={Number(o.shipping_fee) === 0 ? "Free" : formatPrice(o.shipping_fee, o.currency)} />
          <Line label="Total" value={formatPrice(o.total, o.currency)} strong />
          <Text style={styles.payment}>{paymentMethodLabel(o.payment_method)}</Text>
        </View>
      </Section>

      <Section title="Delivery">
        <Body>{o.customer_name}</Body>
        <Body muted>
          {o.shipping_address}, {o.city}, {o.state}
          {o.postal_code ? ` ${o.postal_code}` : ""}, {o.country}
        </Body>
        <Body muted>{o.customer_phone}</Body>
        {o.status !== "cancelled" && o.status !== "delivered" && (
          <Body style={{ marginTop: 10 }}>Expected {deliveryEstimate(o.state)} after dispatch.</Body>
        )}
      </Section>

      {justPlaced && (
        <View style={[styles.padded, { marginTop: 36, gap: 12 }]}>
          <Button
            label="View order"
            onPress={() => router.replace({ pathname: "/order/[orderNumber]", params: { orderNumber: o.order_number, ...(key ? { key } : {}) } })}
          />
          <Button
            label="Continue shopping"
            variant="secondary"
            onPress={() => {
              router.dismissAll();
              router.navigate("/shop");
            }}
          />
        </View>
      )}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useStyles();
  return (
    <View style={[styles.section, styles.padded]}>
      <Display size={24} style={{ marginBottom: 12 }}>
        {title}
      </Display>
      {children}
    </View>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.line}>
      <Text style={[styles.lineLabel, strong && styles.strong]}>{label}</Text>
      <Text style={[styles.lineValue, strong && styles.strong]}>{value}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.ivory },
  padded: { paddingHorizontal: gutter },
  numberRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 28 },
  caption: { fontFamily: fonts.sans, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: colors.muted },
  value: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink, marginTop: 4, fontVariant: ["tabular-nums"] },
  section: { marginTop: 36, paddingTop: 24, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  item: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 10 },
  thumb: { width: 56, height: 70, borderRadius: 10, backgroundColor: colors.stone },
  itemName: { fontFamily: fonts.serif, fontSize: 19, color: colors.ink },
  itemMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 3 },
  totals: { marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, gap: 8 },
  line: { flexDirection: "row", justifyContent: "space-between" },
  lineLabel: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted },
  lineValue: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink, fontVariant: ["tabular-nums"] },
  strong: { fontFamily: fonts.sansMedium, fontSize: 16, color: colors.ink },
  payment: { fontFamily: fonts.sans, fontSize: 12, color: colors.faint, marginTop: 4 },
}));
