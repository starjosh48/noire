import { forwardRef } from "react";
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors, fonts } from "~/theme";

type Props = TextInputProps & { label: string; error?: string; hint?: string };

/** Labelled input with the website's field styling and an announced error. */
export const TextField = forwardRef<TextInput, Props>(function TextField({ label, error, hint, style, ...props }, ref) {
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        placeholderTextColor={colors.faint}
        style={[styles.input, !!error && { borderColor: colors.danger }, style]}
        {...props}
      />
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: { fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", color: colors.muted, marginBottom: 8 },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.ink,
  },
  error: { fontFamily: fonts.sans, fontSize: 13, color: colors.danger, marginTop: 6 },
  hint: { fontFamily: fonts.sans, fontSize: 12, color: colors.faint, marginTop: 6 },
});
