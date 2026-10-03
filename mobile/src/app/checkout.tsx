import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useRef, useState } from "react";
import { Controller, useForm, type FieldPath } from "react-hook-form";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCheckout, placeOrder, type PlaceOrderRefusal } from "~/api/checkout";
import { ApiError } from "~/api/client";
import { cartKey, useCart } from "~/cart/cart";
import { Button } from "~/components/button";
import { SelectSheet } from "~/components/select-sheet";
import { RowsSkeleton } from "~/components/skeleton";
import { EmptyState, ErrorState } from "~/components/states";
import { TextField } from "~/components/text-field";
import { Body, Display } from "~/components/typography";
import { formatPrice } from "~/lib/format";
import { checkoutSchema, nigerianStates, type CheckoutInput, type PaymentMethodId } from "~/shared";
import { colors, fonts, gutter } from "~/theme";

const paymentNotices = {
  failed: "Your payment didn't go through, so nothing was charged. Your cart is just as you left it. Please try again, or choose pay on delivery.",
  cancelled: "Payment wasn't completed, so nothing was charged. Your cart is just as you left it.",
  error: "We couldn't confirm that payment. If money left your account, contact client care with your order email before trying again.",
};

/**
 * Checkout, on the website's rules: the same schema validates here and on the server, which
 * recalculates prices, checks stock and creates the order. One idempotency key per visit means
 * a double tap (or a retry after a lost connection) can never create two orders.
 */
export default function CheckoutScreen() {
  const checkout = useCheckout();
  const cart = useCart();

  if (checkout.isPending || cart.isPending) return <RowsSkeleton count={4} />;
  if (checkout.isError) return <ErrorState message={checkout.error.message} onRetry={checkout.refetch} />;
  if (!cart.data || cart.data.lines.length === 0) {
    return <EmptyState title="Your cart is empty" message="Add a fragrance to your cart to check out." />;
  }
  return <CheckoutForm defaults={checkout.data.defaults} methods={checkout.data.paymentMethods} testMode={checkout.data.paystackTestMode} />;
}

type FormValues = CheckoutInput;

function CheckoutForm({
  defaults,
  methods,
  testMode,
}: {
  defaults: Partial<CheckoutInput>;
  methods: { id: PaymentMethodId; label: string; description: string }[];
  testMode: boolean;
}) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const cart = useCart();
  const [idempotencyKey] = useState(() => Crypto.randomUUID());
  const [chosenMethod, setPaymentMethod] = useState<PaymentMethodId>(methods[0]?.id ?? "pay_on_delivery");
  // If the chosen method stops being offered (e.g. online payment switched off), fall back.
  const paymentMethod = methods.some((m) => m.id === chosenMethod) ? chosenMethod : (methods[0]?.id ?? "pay_on_delivery");
  const [notice, setNotice] = useState<string | null>(null);
  const submitting = useRef(false);
  const scroll = useRef<ScrollView>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: "",
      phone: "",
      fullName: "",
      address: "",
      city: "",
      country: "Nigeria",
      postalCode: "",
      deliveryNotes: "",
      ...defaults,
    },
  });


  const finish = async (orderNumber: string, accessToken: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: cartKey }),
      queryClient.invalidateQueries({ queryKey: ["me", "orders"] }),
    ]);
    router.replace({ pathname: "/order/[orderNumber]", params: { orderNumber, key: accessToken, placed: "1" } });
  };

  const onValid = async (values: FormValues) => {
      if (submitting.current) return;
      submitting.current = true;
      setNotice(null);
      try {
        const returnUrl = Linking.createURL("payment-return");
        const result = await placeOrder({ ...values, idempotencyKey, paymentMethod, returnUrl });
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        if (!result.paymentUrl) {
          await finish(result.order.orderNumber, result.order.accessToken);
          return;
        }

        // Paystack's secure page; the server verifies the outcome and sends the browser back here.
        const outcome = await WebBrowser.openAuthSessionAsync(result.paymentUrl, returnUrl);
        const status = outcome.type === "success" ? new URL(outcome.url).searchParams.get("status") : "cancelled";
        if (status === "paid" || status === "pending") {
          await finish(result.order.orderNumber, result.order.accessToken);
        } else {
          setNotice(paymentNotices[status === "failed" ? "failed" : status === "cancelled" ? "cancelled" : "error"]);
          void queryClient.invalidateQueries({ queryKey: cartKey });
        }
      } catch (error) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        const refusal = error instanceof ApiError ? (error.body as PlaceOrderRefusal | undefined) : undefined;
        for (const [field, message] of Object.entries(refusal?.fieldErrors ?? {})) {
          if (field in form.getValues()) form.setError(field as FieldPath<FormValues>, { message });
        }
        if (refusal?.cart) queryClient.setQueryData(cartKey, refusal.cart);
        setNotice((error as Error).message);
        scroll.current?.scrollTo({ y: 0, animated: true });
      } finally {
        submitting.current = false;
      }
  };

  const onInvalid = () => {
    setNotice("Please check the highlighted details.");
    scroll.current?.scrollTo({ y: 0, animated: true });
  };

  // Built in the tap handler, so the form reads its refs only when the customer submits.
  const submit = () => void form.handleSubmit(onValid, onInvalid)();

  const c = cart.data!;
  const busy = form.formState.isSubmitting;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <ScrollView ref={scroll} contentContainerStyle={{ paddingBottom: 140 + insets.bottom }} keyboardShouldPersistTaps="handled">
        {notice && (
          <Text style={styles.notice} accessibilityRole="alert">
            {notice}
          </Text>
        )}

        <Section title="Contact">
          <Field form={form} name="email" label="Email" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" autoCapitalize="none" />
          <Field form={form} name="phone" label="Phone" keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" hint="So the courier can reach you." />
        </Section>

        <Section title="Delivery">
          <Field form={form} name="fullName" label="Full name" autoComplete="name" textContentType="name" />
          <Field form={form} name="address" label="Address" autoComplete="street-address" textContentType="fullStreetAddress" hint="House number and street." />
          <Field form={form} name="city" label="City or area" textContentType="addressCity" />
          <Controller
            control={form.control}
            name="state"
            render={({ field, fieldState }) => (
              <SelectSheet label="State" value={field.value} options={nigerianStates} onChange={field.onChange} error={fieldState.error?.message} placeholder="Choose a state" />
            )}
          />
          <View style={{ marginTop: 16 }}>
            <Text style={styles.label}>Country</Text>
            <Text style={styles.static}>Nigeria</Text>
            <Text style={styles.hint}>We currently deliver within Nigeria only.</Text>
          </View>
          <Field form={form} name="postalCode" label="Postal code (optional)" textContentType="postalCode" />
          <Field form={form} name="deliveryNotes" label="Delivery notes (optional)" multiline style={{ minHeight: 80, paddingTop: 12, textAlignVertical: "top" }} />
        </Section>

        <Section title="Payment">
          {methods.map((method) => {
            const checked = method.id === paymentMethod;
            return (
              <Pressable
                key={method.id}
                accessibilityRole="radio"
                accessibilityState={{ checked }}
                onPress={() => setPaymentMethod(method.id)}
                style={[styles.method, checked && { borderColor: colors.ink }]}
              >
                <View style={[styles.radio, checked && styles.radioOn]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodLabel}>{method.label}</Text>
                  <Text style={styles.methodDescription}>{method.description}</Text>
                </View>
              </Pressable>
            );
          })}
          {testMode && paymentMethod === "paystack" && (
            <Text style={styles.hint}>Paystack is in test mode: no real money moves.</Text>
          )}
        </Section>

        <Section title="Order summary">
          {c.lines.map((line) => (
            <View key={line.id} style={styles.summaryLine}>
              <Text style={styles.summaryName}>
                {line.product.name} <Text style={{ color: colors.muted }}>· {line.variant.size_ml} ml × {line.quantity}</Text>
              </Text>
              <Text style={styles.summaryValue}>{formatPrice(line.lineTotal)}</Text>
            </View>
          ))}
          <View style={styles.rule} />
          <Total label="Subtotal" value={formatPrice(c.subtotal)} />
          <Total label="Delivery" value={c.shippingFee === 0 ? "Free" : formatPrice(c.shippingFee)} />
          <Total label="Total" value={formatPrice(c.total)} strong />
          <Body muted style={{ fontSize: 12, marginTop: 8 }}>
            Prices and stock are confirmed by NOIRÉ when you place your order.
          </Body>
        </Section>
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          label={busy ? (paymentMethod === "paystack" ? "Opening secure payment…" : "Placing your order…") : `Place order · ${formatPrice(c.total)}`}
          onPress={submit}
          disabled={busy || c.hasIssues}
        />
        {c.hasIssues && <Text style={[styles.hint, { textAlign: "center" }]}>Update your cart to continue.</Text>}
      </View>
    </KeyboardAvoidingView>
  );
}

type FieldProps = React.ComponentProps<typeof TextField> & {
  form: ReturnType<typeof useForm<FormValues>>;
  name: FieldPath<FormValues>;
};

function Field({ form, name, ...props }: Omit<FieldProps, "value" | "onChangeText">) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField value={(field.value as string) ?? ""} onChangeText={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} {...props} />
      )}
    />
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Display size={26}>{title}</Display>
      {children}
    </View>
  );
}

function Total({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.summaryLine}>
      <Text style={[styles.totalLabel, strong && styles.strong]}>{label}</Text>
      <Text style={[styles.summaryValue, strong && styles.strong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ivory },
  notice: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: colors.danger, backgroundColor: colors.dangerSoft, padding: 14, marginHorizontal: gutter, marginTop: 12 },
  section: { paddingHorizontal: gutter, paddingTop: 28, marginTop: 8 },
  label: { fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", color: colors.muted, marginBottom: 8 },
  static: { fontFamily: fonts.sans, fontSize: 16, color: colors.ink },
  hint: { fontFamily: fonts.sans, fontSize: 12, color: colors.faint, marginTop: 6 },
  method: { flexDirection: "row", gap: 14, padding: 16, marginTop: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paper },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: colors.muted, marginTop: 2 },
  radioOn: { borderColor: colors.ink, borderWidth: 6 },
  methodLabel: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink },
  methodDescription: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.muted, marginTop: 4 },
  summaryLine: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 10 },
  summaryName: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.ink },
  summaryValue: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink, fontVariant: ["tabular-nums"] },
  totalLabel: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted },
  strong: { fontFamily: fonts.sansMedium, fontSize: 17, color: colors.ink },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginTop: 16, marginBottom: 6 },
  bar: { paddingHorizontal: gutter, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, backgroundColor: colors.ivory },
});
