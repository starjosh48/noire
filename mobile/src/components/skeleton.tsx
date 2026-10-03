import { useEffect, useState } from "react";
import { Animated, useWindowDimensions, View, type DimensionValue, type ViewStyle } from "react-native";
import { gutter, useColors } from "~/theme";

/** A softly pulsing placeholder block (the website's shimmer). */
export function Skeleton({ width, height, style }: { width: DimensionValue; height: DimensionValue; style?: ViewStyle }) {
  const colors = useColors();
  const opacity = useState(() => new Animated.Value(1))[0];
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.55, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[{ width, height, backgroundColor: colors.stone, opacity }, style]} />;
}

/** Placeholder for a two-column product grid. */
export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  const { width } = useWindowDimensions();
  const card = (width - gutter * 2 - 16) / 2;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, paddingHorizontal: gutter, paddingTop: 8 }} accessibilityLabel="Loading fragrances" accessible>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ width: card }}>
          <Skeleton width={card} height={card * 1.25} style={{ borderRadius: 14 }} />
          <Skeleton width="40%" height={10} style={{ marginTop: 14 }} />
          <Skeleton width="80%" height={20} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
  );
}

/** Placeholder rows (cart lines, orders). */
export function RowsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={{ paddingHorizontal: gutter, gap: 20, paddingTop: 12 }} accessibilityLabel="Loading" accessible>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ flexDirection: "row", gap: 16 }}>
          <Skeleton width={76} height={95} style={{ borderRadius: 12 }} />
          <View style={{ flex: 1, gap: 10, paddingTop: 4 }}>
            <Skeleton width="70%" height={18} />
            <Skeleton width="40%" height={12} />
            <Skeleton width="30%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Full-screen placeholder for the lookbook. */
export function FeedSkeleton() {
  const { height } = useWindowDimensions();
  return (
    <View style={{ flex: 1 }} accessibilityLabel="Loading fragrances" accessible>
      <Skeleton width="100%" height={height} />
    </View>
  );
}
