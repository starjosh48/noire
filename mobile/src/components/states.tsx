import { ActivityIndicator, View } from "react-native";
import { gutter, makeStyles, useColors } from "~/theme";
import { Button } from "./button";
import { Body, Display } from "./typography";

export function LoadingState() {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={styles.center} accessibilityLabel="Loading">
      <ActivityIndicator color={colors.ink} />
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const styles = useStyles();
  return (
    <View style={styles.center}>
      <Display size={28} style={styles.text}>
        Something went quiet
      </Display>
      <Body muted style={[styles.text, { marginTop: 10 }]}>
        {message}
      </Body>
      {onRetry && <Button label="Try again" variant="secondary" onPress={onRetry} style={{ marginTop: 24 }} />}
    </View>
  );
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.center}>
      <Display size={28} style={styles.text}>
        {title}
      </Display>
      {message && (
        <Body muted style={[styles.text, { marginTop: 10 }]}>
          {message}
        </Body>
      )}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  center: {
    flex: 1,
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: gutter * 2,
    backgroundColor: c.ivory,
  },
  text: { textAlign: "center" },
}));
