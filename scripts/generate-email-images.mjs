// Renders JPG versions of the product shots for emails (Gmail and Outlook block SVG images).
// Usage: node scripts/generate-email-images.mjs   (run after scripts/generate-art.mjs)

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { products, slugFor } from "./catalog.mjs";

const root = fileURLToPath(new URL("../public/images/products/", import.meta.url));

for (const product of products) {
  const dir = `${root}${slugFor(product)}/`;
  // Rasterise the 1200×1500 artwork, crop around the bottle, then size for email at 2×
  // (displayed at 120×150). Sharp allows one resize per pipeline, hence two steps.
  const cropped = await sharp(`${dir}front.svg`, { density: 72 })
    .extract({ left: 150, top: 300, width: 900, height: 1125 })
    .toBuffer();
  await sharp(cropped).resize(240, 300).jpeg({ quality: 84, mozjpeg: true }).toFile(`${dir}email.jpg`);
}
console.log(`Rendered ${products.length} email images`);
