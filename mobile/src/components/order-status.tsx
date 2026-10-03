import { Text, View } from "react-native";
import { orderStatusLabel, orderTimeline } from "~/shared";
import { fonts, makeStyles, useColors } from "~/theme";
import { Body } from "./typography";

/** The website's status badge: champagne dot in progress, green delivered, red cancelled. */
export function OrderStatusBadge({ status }: { status: string }) {
  const styles = useStyles();
  const colors = useColors();
  const tone = status === "cancelled" ? colors.danger : status === "delivered" ? colors.success : colors.champagne;
  return (
    <View style={[styles.badge, { borderColor: status === "cancelled" || status === "delivered" ? tone : colors.line }]}>
      <View style={[styles.dot, { backgroundColor: tone }]} />
      <Text style={[styles.label, { color: status === "cancelled" ? colors.danger : status === "delivered" ? colors.success : colors.ink }]}>
        {orderStatusLabel(status)}
      </Text>
    </View>
  );
}

/** Confirmed → Processing → Shipped → Delivered, as on the website's order page. */
export function OrderTimeline({ status }: { status: string }) {
  const styles = useStyles();
  const colors = useColors();
  if (status === "pending_payment") {
    return <Body>We’re waiting for Paystack to confirm your payment. This updates once it does, usually within a few minutes.</Body>;
  }
  if (status === "cancelled") {
    return <Body style={{ color: colors.danger }}>This order was cancelled. If you have questions, contact client care.</Body>;
  }
  const current = Math.max(0, orderTimeline.indexOf(status as (typeof orderTimeline)[number]));
  return (
    <View style={styles.timeline} accessibilityLabel={`Order progress: ${orderStatusLabel(status)}`} accessible>
      {orderTimeline.map((step, i) => (
        <View key={step} style={{ flex: 1 }}>
          <View style={[styles.bar, { backgroundColor: i <= current ? colors.ink : colors.sand }]} />
          <Text style={[styles.step, { color: i <= current ? colors.ink : colors.faint }]}>{orderStatusLabel(step)}</Text>
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  badge: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start" },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontFamily: fonts.sansMedium, fontSize: 10, letterSpacing: 1.4, textTransform: "uppercase" },
  timeline: { flexDirection: "row", gap: 6 },
  bar: { height: 3 },
  step: { fontFamily: fonts.sans, fontSize: 11, marginTop: 8 },
}));
