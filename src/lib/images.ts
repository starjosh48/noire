/**
 * The artwork is authored as SVG (scripts/generate-art.mjs) but served as pre-rendered WebP
 * (scripts/generate-raster-images.mjs): its blur filters are slow for browsers to paint.
 */
export function artwork(src: string) {
  return src.replace(/^(\/images\/[^?#]+)\.svg$/, "$1.webp");
}
