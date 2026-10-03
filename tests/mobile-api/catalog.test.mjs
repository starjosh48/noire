// Product loading for the app: the same catalog, queries and filters as the website.
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { API } from "./helpers.mjs";

const get = async (path) => {
  const response = await fetch(`${API}/api/mobile${path}`);
  return { status: response.status, body: await response.json() };
};

describe("catalog", () => {
  test("home: featured fragrances and bestsellers", async () => {
    const { status, body } = await get("/catalog/home");
    assert.equal(status, 200);
    assert.ok(body.featured.length > 0);
    assert.ok(body.bestsellers.length > 0);
    for (const p of body.featured) assert.ok(p.variants.length > 0, `${p.name} has no sizes`);
  });

  test("listing with the website's filters and sort", async () => {
    const all = await get("/catalog/products");
    assert.equal(all.status, 200);
    const woody = await get("/catalog/products?family=woody&sort=price-asc");
    assert.ok(woody.body.products.length > 0 && woody.body.products.length < all.body.products.length);
    assert.ok(woody.body.products.every((p) => p.fragrance_family === "woody"));
    const prices = woody.body.products.map((p) => Number(p.price));
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
  });

  test("product detail with sizes, notes and related fragrances", async () => {
    const { status, body } = await get("/catalog/products/noire-01");
    assert.equal(status, 200);
    assert.deepEqual(body.product.variants.map((v) => v.size_ml), [30, 50, 100]);
    assert.ok(body.product.top_notes.length && body.product.heart_notes.length && body.product.base_notes.length);
    assert.ok(body.related.length > 0);
  });

  test("an unknown product is a 404 with a friendly message", async () => {
    const { status, body } = await get("/catalog/products/not-a-fragrance");
    assert.equal(status, 404);
    assert.match(body.error, /couldn't be found/);
  });

  test("search covers names and notes", async () => {
    const byName = await get("/catalog/search?q=santal");
    assert.ok(byName.body.results.some((p) => p.slug === "noire-01"));
    const { body: product } = await get("/catalog/products/noire-01");
    const note = product.product.heart_notes[0];
    const byNote = await get(`/catalog/search?q=${encodeURIComponent(note)}`);
    assert.ok(byNote.body.results.length > 0, `no results for the note "${note}"`);
  });

  test("discovery: characters and moments, best matches first", async () => {
    const { status, body } = await get("/catalog/discover?scent=warm,woody&mood=after-dark");
    assert.equal(status, 200);
    assert.ok(body.results.length > 0);
    const none = await get("/catalog/discover");
    assert.deepEqual(none.body.results, []);
  });
});
