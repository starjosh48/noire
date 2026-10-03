// Shared account + shared cart between the website and the mobile app (the assignment's core).
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { admin, createCustomer, getProduct, inStockVariant, mobileClient, watchCart, websiteClient } from "./helpers.mjs";

describe("one account, one cart, website and app", () => {
  let customer, other, app, site, product, variant;

  before(async () => {
    customer = await createCustomer("Ada Sync");
    other = await createCustomer("Someone Else");
    app = mobileClient(customer.session);
    site = await websiteClient(customer.session);
    product = await getProduct("noire-01");
    variant = inStockVariant(product);
  });

  after(async () => {
    await customer?.cleanup();
    await other?.cleanup();
  });

  test("the app and the website resolve to the same Supabase user", async () => {
    const mobile = await app.call("GET", "/session");
    const web = await site.session();
    assert.equal(mobile.status, 200);
    assert.equal(mobile.body.user.id, customer.id);
    assert.equal(web.user.id, customer.id);
  });

  test("mobile → website: an item added in the app is in the website cart, with size, quantity and price", async () => {
    const added = await app.call("POST", "/cart/items", { variantId: variant.id, quantity: 1 });
    assert.equal(added.status, 200, JSON.stringify(added.body));

    const web = await site.session();
    const line = web.cart.lines.find((l) => l.variant.id === variant.id);
    assert.ok(line, "line missing on the website");
    assert.equal(line.product.id, product.id);
    assert.equal(line.variant.size_ml, variant.size_ml);
    assert.equal(line.quantity, 1);
    assert.equal(line.variant.price, Number(variant.price));
  });

  test("quantity 1 → 2 in the app is reflected on the website", async () => {
    const { body } = await app.call("GET", "/cart");
    const line = body.cart.lines.find((l) => l.variant.id === variant.id);
    const updated = await app.call("PATCH", `/cart/items/${line.id}`, { quantity: 2 });
    assert.equal(updated.status, 200);
    const web = await site.session();
    assert.equal(web.cart.lines.find((l) => l.id === line.id).quantity, 2);
  });

  test("website → mobile: a change saved by the website's cart service appears in the app", async () => {
    // The website's server actions and the app's API call the same cart service and tables.
    // Here the change is written straight to the shared tables (as the server does) and read
    // back through the app's API.
    const { data: cart } = await admin.from("noire_carts").select("id").eq("user_id", customer.id).single();
    const second = inStockVariant(await getProduct("noire-02"));
    const { error } = await admin.from("noire_cart_items").insert({
      cart_id: cart.id,
      product_id: second.product_id ?? (await getProduct("noire-02")).id,
      product_variant_id: second.id,
      quantity: 1,
    });
    assert.ifError(error);

    const mobile = await app.call("GET", "/cart");
    assert.ok(mobile.body.cart.lines.some((l) => l.variant.id === second.id));
  });

  test("realtime: the owner's devices are told when the cart changes", async () => {
    const watcher = await watchCart(customer, customer.id);
    try {
      const pending = watcher.next();
      await app.call("POST", "/cart/items", { variantId: variant.id, quantity: 1 });
      const event = await pending;
      assert.ok(event, "no realtime event within 6s");
      assert.equal(event.table, "noire_carts");
      assert.equal(event.new.user_id, customer.id);
    } finally {
      await watcher.close();
    }
  });

  test("realtime: removing an item notifies, and the item is gone on both clients", async () => {
    const watcher = await watchCart(customer, customer.id);
    try {
      const { body } = await app.call("GET", "/cart");
      const line = body.cart.lines.find((l) => l.variant.id === variant.id);
      const pending = watcher.next();
      const removed = await app.call("DELETE", `/cart/items/${line.id}`);
      assert.equal(removed.status, 200);
      assert.ok(await pending, "no realtime event for the removal");

      const web = await site.session();
      assert.ok(!web.cart.lines.some((l) => l.id === line.id), "still on the website");
      const mobile = await app.call("GET", "/cart");
      assert.ok(!mobile.body.cart.lines.some((l) => l.id === line.id), "still in the app");
    } finally {
      await watcher.close();
    }
  });

  test("persistence: a new app session (e.g. after a restart) sees the same cart", async () => {
    const before = (await app.call("GET", "/cart")).body.cart;
    const restarted = mobileClient(customer.session);
    const afterRestart = (await restarted.call("GET", "/cart")).body.cart;
    assert.deepEqual(
      afterRestart.lines.map((l) => [l.variant.id, l.quantity]),
      before.lines.map((l) => [l.variant.id, l.quantity]),
    );
  });

  test("privacy: another customer gets no realtime events for this cart", async () => {
    const snoop = await watchCart(other, customer.id);
    try {
      const pending = snoop.next(4000);
      await app.call("POST", "/cart/items", { variantId: variant.id, quantity: 1 });
      assert.equal(await pending, null, "another customer received this customer's cart event");
    } finally {
      await snoop.close();
    }
  });

  test("privacy: another customer can't read or change this cart directly", async () => {
    const { data: carts } = await other.client.from("noire_carts").select("id").eq("user_id", customer.id);
    assert.deepEqual(carts, []);
    const { data: items } = await other.client.from("noire_cart_items").select("id");
    assert.deepEqual(items, []);

    const { data: cart } = await admin.from("noire_carts").select("id").eq("user_id", customer.id).single();
    const { data: changed } = await other.client.from("noire_cart_items").update({ quantity: 9 }).eq("cart_id", cart.id).select();
    assert.deepEqual(changed ?? [], []);
    const { error: insertError } = await other.client
      .from("noire_cart_items")
      .insert({ cart_id: cart.id, product_id: product.id, product_variant_id: variant.id, quantity: 1 });
    assert.ok(insertError, "insert into someone else's cart was allowed");
  });

  test("the owner can read their cart row but can't write carts directly", async () => {
    const { data: own } = await customer.client.from("noire_carts").select("id, user_id");
    assert.equal(own.length, 1);
    assert.equal(own[0].user_id, customer.id);
    const { data: items } = await customer.client.from("noire_cart_items").select("id");
    assert.deepEqual(items, [], "cart items should only be reachable through the server");
    const { data: changed } = await customer.client.from("noire_carts").update({ user_id: other.id }).eq("id", own[0].id).select();
    assert.deepEqual(changed ?? [], []);
  });

  test("sign out and back in: the same cart is there", async () => {
    const before = (await app.call("GET", "/cart")).body.cart.lines.map((l) => l.id).sort();
    const signedOut = mobileClient(null);
    const guest = await signedOut.call("GET", "/cart");
    assert.equal(guest.body.cart.itemCount, 0, "a signed-out app must not see the customer's cart");
    const again = mobileClient(customer.session);
    const after = (await again.call("GET", "/cart")).body.cart.lines.map((l) => l.id).sort();
    assert.deepEqual(after, before);
  });
});
