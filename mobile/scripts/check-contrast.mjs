// WCAG contrast of the app's text over its photography, as the phone renders it: each image
// cover-cropped to its view, the app's scrim (src/theme.ts → scrims) composited on top, then the
// text colour compared with the brightest 5% of pixels behind each piece of text (worst case).
// Needs: 4.5:1 for small text, 3:1 for large text (WCAG AA). Run: npm run check:contrast
// (uses sharp from the website's node_modules and images from ../public).
import { createRequire } from "node:module";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
const require = createRequire(new URL("../../package.json", import.meta.url));
const sharp = require("sharp");

const ROOT = fileURLToPath(new URL("../../public", import.meta.url));
// Scrims come from the app's theme, so this checks exactly what the app draws.
const theme = fs.readFileSync(new URL("../src/theme.ts", import.meta.url), "utf8");
const block = /export const scrims = (\{[\s\S]*?\n\}) as const;/.exec(theme)[1];
const raw = Function(`return ${block}`)();
const stops = (s) => s.locations.map((p, i) => [p, Number(/,([\d.]+)\)$/.exec(s.colors[i])[1])]);
const config = views({ feed: stops(raw.feed), cover: stops(raw.cover), shopHero: stops(raw.banner), moodCard: stops(raw.card), moment: stops(raw.tile) });

// Where the app puts text on photos (iPhone 390×844), and the scrims it draws today.
// Text positions mirror the layouts in src/components/product-feed.tsx and src/app/(tabs).
function views(s) {
  const products = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const feedText = [
    { name: "top: wordmark", top: 55, bottom: 85, left: 20, right: 140, large: true },
    { name: "meta", alpha: 0.9, top: 494, bottom: 512, left: 20, right: 352 },
    { name: "name", top: 518, bottom: 574, left: 20, right: 352, large: true },
    { name: "family", alpha: 0.9, top: 582, bottom: 598, left: 20, right: 352 },
    { name: "description", top: 610, bottom: 654, left: 20, right: 352 },
  ];
  return [
    ...products.map((n) => ({ label: `Home feed · noire-${n}`, image: `/images/products/noire-${n}/front.webp`, width: 390, height: 844, scrim: s.feed, text: feedText })),
    {
      label: "Home cover · hero",
      image: "/images/editorial/hero.webp",
      width: 390,
      height: 844,
      scrim: s.cover,
      text: [
        { name: "eyebrow", alpha: 0.9, top: 394, bottom: 410, left: 20, right: 370 },
        { name: "headline", top: 424, bottom: 598, left: 20, right: 370, large: true },
        { name: "lede", top: 612, bottom: 658, left: 20, right: 320 },
        { name: "swipe hint", top: 694, bottom: 734, left: 160, right: 230 },
      ],
    },
    {
      label: "Shop banner · atelier",
      image: "/images/editorial/atelier.webp",
      width: 350,
      height: 240,
      scrim: s.shopHero,
      text: [
        { name: "eyebrow", alpha: 0.9, top: 160, bottom: 176, left: 20, right: 250 },
        { name: "title", top: 182, bottom: 222, left: 20, right: 250, large: true },
      ],
    },
    ...["after-dark", "fresh-start", "slow-sunday", "date-night", "main-character", "quiet-luxury"].flatMap((m) => [
      {
        label: `Shop mood card · ${m}`,
        image: `/images/moods/${m}.webp`,
        width: 220,
        height: 319,
        scrim: s.moodCard,
        text: [
          { name: "title", top: 235, bottom: 265, left: 16, right: 204, large: true },
          { name: "description", alpha: 0.9, top: 269, bottom: 303, left: 16, right: 204 },
        ],
      },
      {
        label: `Discover tile · ${m}`,
        image: `/images/moods/${m}.webp`,
        width: 169,
        height: 211,
        scrim: s.moment,
        text: [{ name: "title", top: 167, bottom: 197, left: 14, right: 155, large: true }],
      },
    ]),
  ];
}

const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const CREAM = lum([0xf7, 0xf3, 0xed]);
const SCRIM = [20, 19, 18];

/** Alpha of a vertical gradient (stops: [position 0..1, alpha]) at relative height t. */
function alphaAt(stops, t) {
  if (t <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [p1, a1] = stops[i];
    const [p0, a0] = stops[i - 1];
    if (t <= p1) return a0 + ((a1 - a0) * (t - p0)) / (p1 - p0 || 1);
  }
  return stops[stops.length - 1][1];
}

async function measure(view) {
  const { data, info } = await sharp(`${ROOT}${view.image}`)
    .resize(view.width, view.height, { fit: "cover", position: "centre" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const results = [];
  for (const el of view.text) {
    const lums = [];
    for (let y = el.top; y < el.bottom; y++) {
      const a = Math.max(alphaAt(view.scrim, y / view.height), el.extraScrim ?? 0);
      for (let x = el.left ?? 0; x < (el.right ?? view.width); x += 2) {
        const i = (y * info.width + x) * 3;
        const px = [0, 1, 2].map((k) => data[i + k] * (1 - a) + SCRIM[k] * a);
        lums.push(lum(px));
      }
    }
    lums.sort((p, q) => p - q);
    const bright = lums[Math.floor(lums.length * 0.95)];
    const alpha = el.alpha ?? 1;
    // Text drawn at partial opacity is blended with what's behind it.
    const bg = bright;
    const textLum = lum([0xf7, 0xf3, 0xed].map((c, k) => c * alpha + (Math.pow(bg, 1 / 2.2) * 255) * (1 - alpha)));
    const r = ratio(textLum, bg);
    results.push({ el: el.name, ratio: Math.round(r * 100) / 100, need: el.large ? 3 : 4.5, pass: r >= (el.large ? 3 : 4.5) });
  }
  return results;
}

let failures = 0;
for (const view of config) {
  for (const r of await measure(view)) {
    if (!r.pass) failures++;
    console.log(`${r.pass ? "PASS" : "FAIL"}  ${view.label.padEnd(30)} ${r.el.padEnd(14)} ${String(r.ratio).padStart(5)}:1  (needs ${r.need}:1)`);
  }
}
console.log(failures ? `\n${failures} failing` : "\nall pass");
