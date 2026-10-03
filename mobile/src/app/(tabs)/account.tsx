import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";
import { useOrders, useProfile, useSaveProfile } from "~/api/account";
import { useAuth } from "~/auth/auth-provider";
import { Button } from "~/components/button";
import { OrderRow } from "~/components/order-row";
import { RowsSkeleton } from "~/components/skeleton";
import { ErrorState } from "~/components/states";
import { TextField } from "~/components/text-field";
import { useToast } from "~/components/toast";
import { Body, Display, Eyebrow } from "~/components/typography";
import { firstName, greeting } from "~/shared";
import { colors, fonts, gutter } from "~/theme";

// The website's profile rules (src/lib/account/service.ts).
const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(120, "That name is a little too long."),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?[0-9][0-9\s()-]{6,18}[0-9])?$/, "Enter a valid phone number, like 0803 123 4567."),
});
type ProfileValues = z.infer<typeof profileSchema>;

export default function AccountScreen() {
  const { session } = useAuth();
  return session ? <SignedIn /> : <SignedOut />;
}

function SignedOut() {
  const insets = useSafeAreaInsets();
  const { expired } = useAuth();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.padded, { paddingTop: insets.top + 20, paddingBottom: 48 }]}>
      <Eyebrow>Your NOIRÉ account</Eyebrow>
      <Display size={42} style={{ marginTop: 10 }}>
        Account
      </Display>
      <Body muted style={{ marginTop: 12 }}>
        Sign in with the account you use on the website. Your cart, orders and details follow you between the website and
        the app.
      </Body>
      {expired && (
        <Text style={styles.notice} accessibilityRole="alert">
          Your session expired. Please sign in again.
        </Text>
      )}
      <Button label="Sign in" onPress={() => router.push("/sign-in")} style={{ marginTop: 28 }} />
      <Body muted style={{ marginTop: 20, fontSize: 13 }}>
        No account yet? Signing in with Google or your email creates one. Anything already in your cart comes with you.
      </Body>
    </ScrollView>
  );
}

function SignedIn() {
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const profile = useProfile();
  const orders = useOrders();
  const name = profile.data?.full_name ?? (session?.user.user_metadata?.full_name as string | undefined);

  const confirmSignOut = () =>
    Alert.alert("Sign out of NOIRÉ?", "You'll stay signed in on the website.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => void signOut() },
    ]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 56 }}
      refreshControl={
        <RefreshControl
          refreshing={profile.isRefetching || orders.isRefetching}
          onRefresh={() => {
            void profile.refetch();
            void orders.refetch();
          }}
          tintColor={colors.ink}
        />
      }
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.padded}>
        <Eyebrow>{greeting()}</Eyebrow>
        <Display size={42} style={{ marginTop: 10 }}>
          {name ? firstName(name) : "Your account"}
        </Display>
        <Body muted style={{ marginTop: 6 }}>
          {session?.user.email}
        </Body>
      </View>

      <Section title="Recent orders">
        {orders.isPending ? (
          <RowsSkeleton count={2} />
        ) : orders.isError ? (
          <ErrorState message={orders.error.message} onRetry={orders.refetch} />
        ) : orders.data.length === 0 ? (
          <Body muted style={styles.padded}>
            No orders yet. When you place one, here or on the website, it appears here.
          </Body>
        ) : (
          <>
            {orders.data.slice(0, 3).map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
            {orders.data.length > 3 && (
              <Pressable accessibilityRole="link" onPress={() => router.push("/orders")} style={styles.padded} hitSlop={8}>
                <Text style={styles.link}>View all {orders.data.length} orders</Text>
              </Pressable>
            )}
          </>
        )}
      </Section>

      <Section title="Your details">
        <View style={styles.padded}>{profile.data ? <ProfileForm fullName={profile.data.full_name} phone={profile.data.phone} /> : <RowsSkeleton count={1} />}</View>
      </Section>

      <View style={[styles.padded, { marginTop: 40 }]}>
        <Button label="Sign out" variant="secondary" onPress={confirmSignOut} />
      </View>
    </ScrollView>
  );
}

function ProfileForm({ fullName, phone }: { fullName: string | null; phone: string | null }) {
  const save = useSaveProfile();
  const toast = useToast();
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: fullName ?? "", phone: phone ?? "" },
  });
  useEffect(() => form.reset({ fullName: fullName ?? "", phone: phone ?? "" }), [fullName, phone, form]);

  const submit = form.handleSubmit(async (values) => {
    try {
      await save.mutateAsync(values);
      toast({ title: "Your details have been saved." });
    } catch (error) {
      toast({ tone: "error", title: "We couldn't save your details", description: (error as Error).message });
    }
  });

  return (
    <>
      <Controller
        control={form.control}
        name="fullName"
        render={({ field, fieldState }) => (
          <TextField label="Full name" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} autoComplete="name" textContentType="name" />
        )}
      />
      <Controller
        control={form.control}
        name="phone"
        render={({ field, fieldState }) => (
          <TextField
            label="Phone"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            hint="Used for delivery updates only."
          />
        )}
      />
      <Button
        label={form.formState.isSubmitting ? "Saving…" : "Save details"}
        variant="secondary"
        onPress={submit}
        disabled={form.formState.isSubmitting || !form.formState.isDirty}
        style={{ marginTop: 20 }}
      />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Display size={26} style={[styles.padded, { marginBottom: 8 }]}>
        {title}
      </Display>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  padded: { paddingHorizontal: gutter },
  section: { marginTop: 36, paddingTop: 24, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  notice: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink, backgroundColor: colors.stone, padding: 14, marginTop: 20 },
  link: { fontFamily: fonts.sansMedium, fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: colors.ink, textDecorationLine: "underline", marginTop: 12 },
});
