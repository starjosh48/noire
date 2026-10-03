// Cart creation, retrieval, updates and deletion through the app's API (guests and customers).
import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { createCustomer, getProduct, inStockVariant, mobileClient } from "./helpers.mjs";

describe("guest cart", () => {
  let guest, v30, v50;
  before(async () => {
    guest = mobileClient();
    const product = await getProduct("noire-01");
    [v30, v50] = product.variants.filter((v) => v.stock_quantity >= 3);
  });

  test("starts empty without creating anything", async () => {
    const { status, body } = await guest.call("GET", "/cart");
    assert.equal(status, 200);
    assert.equal(body.cart.itemCount, 0);
    assert.equal(body.cartToken, null);
  });

  test("adding creates a cart and hands the app its id", async () => {
    const { status, body } = await guest.call("POST", "/cart/items", { variantId: v30.id, quantity: 2 });
    assert.equal(status, 200);
    assert.match(body.cartToken, /^[0-9a-f-]{36}$/);
    assert.equal(body.cart.itemCount, 2);
    assert.equal(body.cart.subtotal, Number(v30.price) * 2);
  });

  test("the same cart is reused, and a second size is a second line", async () => {
    const token = guest.cartToken;
    const { body } = await guest.call("POST", "/cart/items", { variantId: v50.id, quantity: 1 });
    assert.equal(body.cartToken, token);
    assert.equal(body.cart.lines.length, 2);
  });

  test("adding the same size again raises its quantity instead of duplicating it", async () => {
    const { body } = await guest.call("POST", "/cart/items", { variantId: v30.id, quantity: 1 });
    const lines = body.cart.lines.filter((l) => l.variant.id === v30.id);
    assert.equal(lines.length, 1);
    assert.equal(lines[0].quantity, 3);
  });

  test("quantity updates are validated and limited", async () => {
    const { body } = await guest.call("GET", "/cart");
    const line = body.cart.lines.find((l) => l.variant.id === v30.id);
    assert.equal((await guest.call("PATCH", `/cart/items/${line.id}`, { quantity: 99 })).status, 422);
    assert.equal((await guest.call("PATCH", `/cart/items/${line.id}`, { quantity: -1 })).status, 422);
    const ok = await guest.call("PATCH", `/cart/items/${line.id}`, { quantity: 1 });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.cart.lines.find((l) => l.id === line.id).quantity, 1);
  });

  test("invalid adds are refused with a reason", async () => {
    const bad = await guest.call("POST", "/cart/items", { variantId: "not-a-uuid", quantity: 1 });
    assert.equal(bad.status, 422);
    assert.match(bad.body.error, /size and quantity/);
  });

  test("deleting removes the line", async () => {
    const { body } = await guest.call("GET", "/cart");
    const line = body.cart.lines.find((l) => l.variant.id === v50.id);
    const removed = await guest.call("DELETE", `/cart/items/${line.id}`);
    assert.equal(removed.status, 200);
    assert.ok(!removed.body.cart.lines.some((l) => l.id === line.id));
  });

  test("a different device (no cart id) can't see this cart", async () => {
    const stranger = mobileClient();
    const { body } = await stranger.call("GET", "/cart");
    assert.equal(body.cart.itemCount, 0);
  });
});

describe("signing in keeps the guest cart", () => {
  let customer;
  after(() => customer?.cleanup());

  test("auth/complete merges the guest cart into the account and tells the app to forget it", async () => {
    const product = await getProduct("noire-03");
    const variant = inStockVariant(product);
    const guest = mobileClient();
    await guest.call("POST", "/cart/items", { variantId: variant.id, quantity: 1 });
    const guestToken = guest.cartToken;

    customer = await createCustomer("Merge Test");
    const app = mobileClient(customer.session);
    app.cartToken = guestToken;
    const done = await app.call("POST", "/auth/complete");
    assert.equal(done.status, 200);
    assert.equal(done.body.cartToken, null);

    const { body } = await app.call("GET", "/session");
    assert.equal(body.user.id, customer.id);
    assert.ok(body.cart.lines.some((l) => l.variant.id === variant.id), "guest item missing after sign-in");
    assert.equal(body.cartToken, null);

    const oldGuest = mobileClient();
    oldGuest.cartToken = guestToken;
    assert.equal((await oldGuest.call("GET", "/cart")).body.cart.itemCount, 0, "the guest cart should be gone");
  });
});

describe("authentication errors", () => {
  test("a malformed token is a 401 SESSION_EXPIRED, not a server error", async () => {
    const app = mobileClient({ access_token: "abc.def.ghi" });
    const { status, body } = await app.call("GET", "/session");
    assert.equal(status, 401);
    assert.equal(body.code, "SESSION_EXPIRED");
  });

  test("a token with a forged signature is rejected", async () => {
    const customer = await createCustomer();
    try {
      const [h, p] = customer.session.access_token.split(".");
      const app = mobileClient({ access_token: `${h}.${p}.AAAA` });
      assert.equal((await app.call("GET", "/session")).status, 401);
    } finally {
      await customer.cleanup();
    }
  });

  test("customer-only endpoints ask guests to sign in", async () => {
    const guest = mobileClient();
    for (const path of ["/orders", "/profile", "/wishlist"]) {
      const { status, body } = await guest.call("GET", path);
      assert.equal(status, 401, path);
      assert.equal(body.code, "SIGNED_OUT", path);
    }
  });
});
