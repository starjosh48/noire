// Renders every SVG under public/images to a WebP beside it. The site serves the WebP files:
// the SVG artwork uses blur filters that are slow for browsers to paint, especially on phones.
// Usage: node scripts/generate-raster-images.mjs   (run after scripts/generate-art.mjs)

import sharp from "sharp";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../public/images/", import.meta.url));

async function* svgFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* svgFiles(path);
    else if (entry.name.endsWith(".svg")) yield path;
  }
}

let count = 0;
for await (const file of svgFiles(root)) {
  await sharp(file, { density: 72 }).webp({ quality: 82, effort: 6 }).toFile(file.replace(/\.svg$/, ".webp"));
  count++;
}
console.log(`Rendered ${count} WebP images`);
