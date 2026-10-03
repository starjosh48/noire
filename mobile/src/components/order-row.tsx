import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { OrderListItem } from "~/api/account";
import { formatPrice, imageUrl, pluralize } from "~/lib/format";
import { formatDate } from "~/shared";
import { colors, fonts, gutter } from "~/theme";
import { OrderStatusBadge } from "./order-status";

export function OrderRow({ order }: { order: OrderListItem }) {
  const count = order.items.reduce((n, item) => n + item.quantity, 0);
  const names = order.items.map((item) => item.product_name).join(", ");
  return (
    <Link href={{ pathname: "/order/[orderNumber]", params: { orderNumber: order.order_number } }} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Order ${order.order_number}, ${formatDate(order.created_at)}, ${pluralize(count, "item")}, ${formatPrice(order.total, order.currency)}`}
        style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.stone }]}
      >
        {order.items[0] && <Image source={imageUrl(order.items[0].image_url)} style={styles.thumb} contentFit="cover" />}
        <View style={{ flex: 1 }}>
          <Text style={styles.number}>{order.order_number}</Text>
          <Text style={styles.meta}>
            {formatDate(order.created_at)} · {pluralize(count, "item")}
          </Text>
          <Text style={styles.names} numberOfLines={1}>
            {names}
          </Text>
          <View style={styles.bottom}>
            <OrderStatusBadge status={order.status} />
            <Text style={styles.total}>{formatPrice(order.total, order.currency)}</Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 16, paddingHorizontal: gutter, paddingVertical: 14 },
  thumb: { width: 64, height: 80, backgroundColor: colors.stone },
  number: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink, fontVariant: ["tabular-nums"] },
  meta: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 3 },
  names: { fontFamily: fonts.serif, fontSize: 17, color: colors.ink, marginTop: 4 },
  bottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  total: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink, fontVariant: ["tabular-nums"] },
});
