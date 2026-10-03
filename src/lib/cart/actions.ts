"use server";

import { addCartItem, readCart, updateCartLine } from "./mutations";
import { getWebCartOwner } from "./service";
import type { CartActionResult } from "./types";

export async function getCartAction(): Promise<CartActionResult> {
  return readCart(await getWebCartOwner());
}

export async function addToCart(input: { variantId: string; quantity: number }): Promise<CartActionResult> {
  return addCartItem(await getWebCartOwner(), input);
}

export async function updateCartItem(input: { itemId: string; quantity: number }): Promise<CartActionResult> {
  return updateCartLine(await getWebCartOwner(), input);
}

export async function removeCartItem(itemId: string): Promise<CartActionResult> {
  return updateCartItem({ itemId, quantity: 0 });
}
