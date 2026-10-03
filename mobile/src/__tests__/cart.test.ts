// What the app shows between a tap and the server's answer. The server's cart always replaces
// these predictions; they only have to be right about the obvious.

import { predictAdd, predictQuantity, withTotals } from "~/cart/cart";
import { commerce, emptyCart, type CartLine, type ProductDetail, type ProductVariant } from "~/shared";

jest.mock("~/lib/supabase", () => ({ supabase: {} }));
jest.mock("~/auth/auth-provider", () => ({ useAuth: () => ({ userId: null }) }));
jest.mock("~/api/client", () => ({ apiFetch: jest.fn(), ApiError: class extends Error {} }));

const product = {
  id: "p1",
  number: 1,
  name: "Santal Obscur",
  slug: "noire-01",
  image_url: "/images/products/noire-01/front.svg",
  fragrance_family: "woody",
  secondary_family: "amber",
} as ProductDetail;

const variant = (id: string, price: number, stock = 20): ProductVariant => ({ id, size_ml: 50, price, stock_quantity: stock, sku: id });

function line(id: string, price: number, quantity: number, maxQuantity = 10): CartLine {
  return {
    id,
    quantity,
    product,
    variant: { id: `v-${id}`, size_ml: 50, price, stock_quantity: 20, sku: id },
    lineTotal: price * quantity,
    maxQuantity,
    issue: null,
  };
}

test("adding a new size shows a pending line and the delivery fee below the free threshold", () => {
  const cart = predictAdd(emptyCart(), product, variant("v1", 54000), 1);
  expect(cart.lines).toHaveLength(1);
  expect(cart.lines[0].id).toBe("pending-v1");
  expect(cart.itemCount).toBe(1);
  expect(cart.subtotal).toBe(54000);
  expect(cart.shippingFee).toBe(commerce.shippingFee);
  expect(cart.total).toBe(54000 + commerce.shippingFee);
});

test("adding a size already in the cart raises its quantity, capped by the line limit", () => {
  const start = withTotals([{ ...line("a", 54000, 9), variant: { ...line("a", 54000, 9).variant, id: "v1" } }]);
  const cart = predictAdd(start, product, variant("v1", 54000), 3);
  expect(cart.lines).toHaveLength(1);
  expect(cart.lines[0].quantity).toBe(10);
  expect(cart.lines[0].lineTotal).toBe(540000);
});

test("delivery becomes free at the website's threshold", () => {
  const cart = withTotals([line("a", commerce.freeShippingThreshold, 1)]);
  expect(cart.shippingFee).toBe(0);
  expect(cart.freeShippingRemaining).toBe(0);
});

test("changing a quantity updates the line and the totals", () => {
  const cart = predictQuantity(withTotals([line("a", 54000, 1), line("b", 85000, 1)]), "a", 2);
  expect(cart.lines.find((l) => l.id === "a")?.quantity).toBe(2);
  expect(cart.itemCount).toBe(3);
  expect(cart.subtotal).toBe(54000 * 2 + 85000);
});

test("quantity 0 removes the line", () => {
  const cart = predictQuantity(withTotals([line("a", 54000, 1), line("b", 85000, 1)]), "a", 0);
  expect(cart.lines.map((l) => l.id)).toEqual(["b"]);
  expect(cart.itemCount).toBe(1);
});

test("lines with an issue (sold out, discontinued) don't count towards the subtotal", () => {
  const cart = withTotals([line("a", 54000, 1), { ...line("b", 85000, 1), issue: "This size has just sold out." }]);
  expect(cart.subtotal).toBe(54000);
  expect(cart.hasIssues).toBe(true);
});
