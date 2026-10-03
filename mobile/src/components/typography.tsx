import { Text, type TextProps } from "react-native";
import { fonts, makeStyles } from "~/theme";

/** Editorial serif headings (the website's `display` style). */
export function Display({ size = 40, style, ...props }: TextProps & { size?: number }) {
  const styles = useStyles();
  return (
    <Text
      accessibilityRole="header"
      style={[styles.display, { fontSize: size, lineHeight: Math.round(size * 1.05) }, style]}
      {...props}
    />
  );
}

/** Small uppercase label for metadata, categories and section markers. */
export function Eyebrow({ style, ...props }: TextProps) {
  const styles = useStyles();
  return <Text style={[styles.eyebrow, style]} {...props} />;
}

export function Body({ style, muted, ...props }: TextProps & { muted?: boolean }) {
  const styles = useStyles();
  return <Text style={[styles.body, muted && styles.muted, style]} {...props} />;
}

const useStyles = makeStyles((c) => ({
  display: { fontFamily: fonts.serif, color: c.ink, letterSpacing: -0.4 },
  eyebrow: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: c.muted,
  },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 23, color: c.ink },
  muted: { color: c.muted },
}));
