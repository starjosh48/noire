export type CartLine = {
  id: string;
  quantity: number;
  product: {
    id: string;
    number: number;
    name: string;
    slug: string;
    image_url: string;
    fragrance_family: string;
    secondary_family: string | null;
  };
  variant: {
    id: string;
    size_ml: number;
    price: number;
    stock_quantity: number;
    sku: string;
  };
  lineTotal: number;
  /** Highest quantity the customer may choose for this line. */
  maxQuantity: number;
  /** Set when the line can't be ordered as-is (sold out, reduced stock, discontinued). */
  issue: string | null;
};

export type Cart = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  total: number;
  freeShippingRemaining: number;
  hasIssues: boolean;
};

export type CartActionResult =
  | { ok: true; cart: Cart; message?: string }
  | { ok: false; error: string; cart?: Cart };
