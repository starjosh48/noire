// Checkout and order creation through the app's API, on the website's rules.
//
// Orders here use Paystack in test mode: an online order waits for payment, so no confirmation
// email is sent (Mailgun may be configured locally and pay-on-delivery would email the address).
// Requires PAYSTACK_SECRET_KEY=sk_test_… in the website's .env.local; skipped otherwise.
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { admin, createCustomer, getProduct, inStockVariant, mobileClient } from "./helpers.mjs";

const RETURN_URL = "noire://payment-return";

describe("checkout", () => {
  let customer, app, variant, setup;

  before(async () => {
    customer = await createCustomer("Checkout Tester");
    app = mobileClient(customer.session);
    variant = inStockVariant(await getProduct("noire-02"));
    await app.call("POST", "/cart/items", { variantId: variant.id, quantity: 1 });
    setup = await app.call("GET", "/checkout");
  });
  after(() => customer?.cleanup());

  const details = () => ({
    email: customer.email,
    phone: "0803 123 4567",
    fullName: "Checkout Tester",
    address: "12 Admiralty Way",
    city: "Lekki",
    state: "Lagos",
    country: "Nigeria",
    postalCode: "",
    deliveryNotes: "",
  });

  test("checkout data: the cart, prefilled details and the payment methods on offer", () => {
    assert.equal(setup.status, 200);
    assert.equal(setup.body.cart.itemCount, 1);
    assert.equal(setup.body.defaults.email, customer.email);
    assert.ok(setup.body.paymentMethods.some((m) => m.id === "pay_on_delivery"));
  });

  test("invalid details are refused field by field, before anything is created", async () => {
    const { status, body } = await app.call("POST", "/checkout", {
      ...details(),
      email: "not-an-email",
      state: "Atlantis",
      idempotencyKey: crypto.randomUUID(),
      paymentMethod: "pay_on_delivery",
      returnUrl: RETURN_URL,
    });
    assert.equal(status, 422);
    assert.ok(body.fieldErrors.email && body.fieldErrors.state);
  });

  test("a return link that isn't the app's is refused", async () => {
    const { status } = await app.call("POST", "/checkout", {
      ...details(),
      idempotencyKey: crypto.randomUUID(),
      paymentMethod: "pay_on_delivery",
      returnUrl: "https://evil.example/steal",
    });
    assert.equal(status, 400);
  });

  test("totals sent by the app are ignored: the server prices the order", async (t) => {
    if (!setup.body.paymentMethods.some((m) => m.id === "paystack")) return t.skip("Paystack test key not configured");
    const key = crypto.randomUUID();
    const placed = await app.call("POST", "/checkout", {
      ...details(),
      total: 1,
      subtotal: 1,
      idempotencyKey: key,
      paymentMethod: "paystack",
      returnUrl: RETURN_URL,
    });
    assert.equal(placed.status, 200, JSON.stringify(placed.body));
    assert.match(placed.body.paymentUrl, /^https:\/\/checkout\.paystack\.com\//);
    const { orderNumber } = placed.body.order;

    const { data: order } = await admin.from("noire_orders").select("total, subtotal, shipping_fee, status, user_id").eq("order_number", orderNumber).single();
    assert.equal(Number(order.subtotal), Number(variant.price));
    assert.equal(Number(order.total), Number(variant.price) + Number(order.shipping_fee));
    assert.equal(order.status, "pending_payment");
    assert.equal(order.user_id, customer.id);

    // A double tap (same idempotency key) returns the same order, never a second one.
    const again = await app.call("POST", "/checkout", { ...details(), idempotencyKey: key, paymentMethod: "paystack", returnUrl: RETURN_URL });
    assert.equal(again.body.order.orderNumber, orderNumber);
    const { count } = await admin.from("noire_orders").select("id", { count: "exact", head: true }).eq("user_id", customer.id);
    assert.equal(count, 1);

    // The order is the customer's: in their list and readable by its owner or its access key.
    const list = await app.call("GET", "/orders");
    assert.ok(list.body.orders.some((o) => o.order_number === orderNumber));
    assert.equal((await app.call("GET", `/orders/${orderNumber}`)).status, 200);
    assert.equal((await mobileClient().call("GET", `/orders/${orderNumber}?key=${placed.body.order.accessToken}`)).status, 200);
    assert.equal((await mobileClient().call("GET", `/orders/${orderNumber}`)).status, 404);

    // Leaving Paystack without paying: the server verifies with Paystack, cancels the order,
    // returns the stock and sends the in-app browser back to the app with the outcome only.
    const { data: ref } = await admin.from("noire_orders").select("payment_reference").eq("order_number", orderNumber).single();
    const back = await fetch(
      `${process.env.NOIRE_API_URL ?? "http://127.0.0.1:3100"}/api/mobile/checkout/return?to=${encodeURIComponent(RETURN_URL)}&reference=${ref.payment_reference}`,
      { redirect: "manual" },
    );
    assert.equal(back.status, 303);
    const location = new URL(back.headers.get("location"));
    assert.equal(location.protocol, "noire:");
    assert.equal(location.searchParams.get("status"), "failed");
    assert.equal(location.searchParams.get("key"), null, "the access key must not travel in the link");

    const { data: after } = await admin.from("noire_orders").select("status").eq("order_number", orderNumber).single();
    assert.equal(after.status, "cancelled");
    const cart = await app.call("GET", "/cart");
    assert.equal(cart.body.cart.itemCount, 1, "an unpaid online order keeps the cart");
  });

  test("the Paystack return link only ever leads back into the app", async () => {
    const response = await fetch(
      `${process.env.NOIRE_API_URL ?? "http://127.0.0.1:3100"}/api/mobile/checkout/return?to=${encodeURIComponent("https://evil.example")}&reference=x`,
      { redirect: "manual" },
    );
    assert.equal(response.status, 400);
  });
});
