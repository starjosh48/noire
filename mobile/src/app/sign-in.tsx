import Feather from "@expo/vector-icons/Feather";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { z } from "zod";
import { useAuth } from "~/auth/auth-provider";
import { Button } from "~/components/button";
import { TextField } from "~/components/text-field";
import { useToast } from "~/components/toast";
import { Body, Display, Eyebrow } from "~/components/typography";
import { colors, fonts, gutter } from "~/theme";

// The website's email rule (src/components/auth/email-sign-in.tsx).
const schema = z.object({
  email: z.string().trim().min(1, "Enter your email address.").pipe(z.email("Enter a valid email address, like name@example.com.")),
});

/**
 * Sign in with the same account as the website: Google (the same Google sign-in, through
 * Supabase) or a one-time email link. Both land on the same Supabase user.
 */
export default function SignInScreen() {
  const { signInWithGoogle, sendEmailLink, expired } = useAuth();
  const toast = useToast();
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<{ email: string }>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  const google = async () => {
    setError(null);
    setGoogleBusy(true);
    const result = await signInWithGoogle();
    setGoogleBusy(false);
    if (result.ok) {
      toast({ title: "You're signed in", description: "Your cart and orders are here too." });
      router.back();
    } else if (!result.cancelled) {
      setError(result.error ?? "Google sign-in couldn't be completed. Please try again.");
    }
  };

  const email = form.handleSubmit(async ({ email }) => {
    setError(null);
    const result = await sendEmailLink(email);
    if (result.ok) setSentTo(email);
    else setError(result.error ?? null);
  });

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Eyebrow>Your NOIRÉ account</Eyebrow>
        <Display size={40} style={{ marginTop: 10 }}>
          Welcome back
        </Display>
        <Body muted style={{ marginTop: 12 }}>
          Use the account you use on the NOIRÉ website. Your cart, orders and details are the same everywhere.
        </Body>

        {expired && (
          <Text style={styles.notice} accessibilityRole="alert">
            Your session expired. Please sign in again.
          </Text>
        )}

        <Button
          label={googleBusy ? "Opening Google…" : "Continue with Google"}
          onPress={google}
          disabled={googleBusy || form.formState.isSubmitting}
          style={{ marginTop: 32 }}
        />

        <View style={styles.divider} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={styles.rule} />
          <Text style={styles.or}>or</Text>
          <View style={styles.rule} />
        </View>

        {sentTo ? (
          <View style={styles.sent} accessibilityRole="summary" accessibilityLiveRegion="polite">
            <Feather name="mail" size={26} color={colors.ink} />
            <Display size={26} style={{ marginTop: 12, textAlign: "center" }}>
              Check your inbox
            </Display>
            <Body muted style={{ marginTop: 8, textAlign: "center" }}>
              We’ve sent a secure sign-in link to {sentTo}. Open it on this phone to continue. The link expires in one hour.
            </Body>
            <Button label="Use a different email" variant="secondary" onPress={() => setSentTo(null)} style={{ marginTop: 20, alignSelf: "stretch" }} />
          </View>
        ) : (
          <>
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <TextField
                  label="Email address"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="send"
                  onSubmitEditing={email}
                  placeholder="name@example.com"
                />
              )}
            />
            <Button
              label={form.formState.isSubmitting ? "Sending…" : "Email me a sign-in link"}
              variant="secondary"
              onPress={email}
              disabled={form.formState.isSubmitting || googleBusy}
              style={{ marginTop: 16 }}
            />
          </>
        )}

        {error && (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  content: { paddingHorizontal: gutter, paddingTop: 16, paddingBottom: 48 },
  notice: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink, backgroundColor: colors.stone, padding: 14, marginTop: 20 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 28 },
  rule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
  or: { fontFamily: fonts.sans, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", color: colors.faint },
  sent: { alignItems: "center", padding: 24, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper },
  error: { fontFamily: fonts.sans, fontSize: 14, color: colors.danger, marginTop: 20 },
});
