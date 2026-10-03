import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useOrders } from "~/api/account";
import { OrderRow } from "~/components/order-row";
import { RowsSkeleton } from "~/components/skeleton";
import { EmptyState, ErrorState } from "~/components/states";
import { gutter, makeStyles, useColors } from "~/theme";

export default function OrdersScreen() {
  const styles = useStyles();
  const colors = useColors();
  const orders = useOrders();
  if (orders.isPending) return <RowsSkeleton count={4} />;
  if (orders.isError) return <ErrorState message={orders.error.message} onRetry={orders.refetch} />;
  return (
    <FlatList
      style={{ backgroundColor: colors.ivory }}
      data={orders.data}
      keyExtractor={(order) => order.id}
      renderItem={({ item }) => <OrderRow order={item} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={<EmptyState title="No orders yet" message="Orders you place in the app or on the website appear here." />}
      refreshControl={<RefreshControl refreshing={orders.isRefetching} onRefresh={orders.refetch} tintColor={colors.ink} />}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
}

const useStyles = makeStyles((colors) => ({
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginHorizontal: gutter },
}));
