// Renders NOIRÉ's studio imagery as SVG: one consistent flacon, lit the same way for every
// fragrance, plus campaign scenes for the homepage and mood collections.
// Output lives in public/images and can be swapped for photography (or Supabase Storage URLs)
// by changing products.image_url / gallery_images.
// Usage: node scripts/generate-art.mjs

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { products, slugFor } from "./catalog.mjs";

const root = fileURLToPath(new URL("../public/images/", import.meta.url));

// ── colour helpers ───────────────────────────────────────────────────────────
const toRgb = (hex) => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const toHex = (rgb) =>
  "#" + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
const mix = (a, b, t) => {
  const [ra, ga, ba] = toRgb(a);
  const [rb, gb, bb] = toRgb(b);
  return toHex([ra + (rb - ra) * t, ga + (gb - ga) * t, ba + (bb - ba) * t]);
};
const lighten = (c, t) => mix(c, "#ffffff", t);
const darken = (c, t) => mix(c, "#000000", t);

const SERIF = "Didot, 'Bodoni 72', 'Bodoni MT', 'Times New Roman', Georgia, serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

let uid = 0;
const id = (name) => `${name}-${++uid}`;

// ── the flacon ───────────────────────────────────────────────────────────────
// Drawn in a local 420×800 box: cap (0–190), collar (190–232), body (232–800).
// Returns { defs, body } so several bottles can share one <svg>.
function flacon({ liquid, label, number, concentration }) {
  const g = {
    edge: id("edge"),
    liquid: id("liquid"),
    liquidV: id("liquidV"),
    base: id("base"),
    collar: id("collar"),
    cap: id("cap"),
    hl: id("hl"),
    clip: id("clip"),
  };
  const deep = darken(liquid, 0.38);
  const glass = lighten(liquid, 0.55);
  const defs = `
    <linearGradient id="${g.edge}" x1="0" x2="1">
      <stop offset="0" stop-color="${mix(glass, deep, 0.35)}"/>
      <stop offset="0.08" stop-color="${lighten(glass, 0.35)}"/>
      <stop offset="0.5" stop-color="${lighten(glass, 0.15)}"/>
      <stop offset="0.92" stop-color="${lighten(glass, 0.3)}"/>
      <stop offset="1" stop-color="${mix(glass, deep, 0.45)}"/>
    </linearGradient>
    <linearGradient id="${g.liquid}" x1="0" x2="1">
      <stop offset="0" stop-color="${darken(liquid, 0.32)}"/>
      <stop offset="0.18" stop-color="${liquid}"/>
      <stop offset="0.46" stop-color="${lighten(liquid, 0.18)}"/>
      <stop offset="0.78" stop-color="${liquid}"/>
      <stop offset="1" stop-color="${darken(liquid, 0.4)}"/>
    </linearGradient>
    <linearGradient id="${g.liquidV}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/>
      <stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.22"/>
    </linearGradient>
    <linearGradient id="${g.base}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${lighten(liquid, 0.25)}"/>
      <stop offset="0.35" stop-color="${lighten(liquid, 0.62)}"/>
      <stop offset="1" stop-color="${mix(lighten(liquid, 0.4), deep, 0.25)}"/>
    </linearGradient>
    <linearGradient id="${g.collar}" x1="0" x2="1">
      <stop offset="0" stop-color="#7D6C52"/>
      <stop offset="0.22" stop-color="#E9DCC0"/>
      <stop offset="0.45" stop-color="#A08B68"/>
      <stop offset="0.7" stop-color="#F3EAD6"/>
      <stop offset="1" stop-color="#6E5E46"/>
    </linearGradient>
    <linearGradient id="${g.cap}" x1="0" x2="1">
      <stop offset="0" stop-color="#0E0D0C"/>
      <stop offset="0.18" stop-color="#2E2B29"/>
      <stop offset="0.34" stop-color="#4A4643"/>
      <stop offset="0.5" stop-color="#22201E"/>
      <stop offset="1" stop-color="#0B0A09"/>
    </linearGradient>
    <linearGradient id="${g.hl}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="0.12" stop-color="#ffffff" stop-opacity="0.75"/>
      <stop offset="0.85" stop-color="#ffffff" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="${g.clip}"><rect x="0" y="232" width="420" height="568" rx="34"/></clipPath>`;

  const body = `
    <!-- cap -->
    <rect x="105" y="0" width="210" height="192" rx="5" fill="url(#${g.cap})"/>
    <rect x="105" y="0" width="210" height="6" rx="3" fill="#ffffff" opacity="0.12"/>
    <rect x="132" y="14" width="10" height="168" fill="#ffffff" opacity="0.06"/>
    <!-- collar -->
    <rect x="140" y="190" width="140" height="44" fill="url(#${g.collar})"/>
    <rect x="140" y="190" width="140" height="3" fill="#000" opacity="0.25"/>
    <!-- body: thick glass walls around the juice -->
    <rect x="0" y="232" width="420" height="568" rx="34" fill="url(#${g.edge})"/>
    <g clip-path="url(#${g.clip})">
      <rect x="20" y="278" width="380" height="438" rx="16" fill="url(#${g.liquid})"/>
      <rect x="20" y="278" width="380" height="438" rx="16" fill="url(#${g.liquidV})"/>
      <rect x="20" y="278" width="380" height="5" fill="${lighten(liquid, 0.45)}" opacity="0.9"/>
      <rect x="0" y="716" width="420" height="84" fill="url(#${g.base})"/>
      <rect x="20" y="716" width="380" height="2" fill="${darken(liquid, 0.25)}" opacity="0.5"/>
      <rect x="30" y="252" width="22" height="532" fill="url(#${g.hl})"/>
      <rect x="64" y="262" width="56" height="510" fill="url(#${g.hl})" opacity="0.18"/>
      <rect x="388" y="256" width="7" height="520" fill="url(#${g.hl})" opacity="0.55"/>
      <rect x="0" y="232" width="420" height="4" fill="#ffffff" opacity="0.5"/>
    </g>
    <!-- label -->
    <g transform="translate(70 404)">
      <rect width="280" height="186" fill="#F5F0E8"/>
      <rect x="8" y="8" width="264" height="170" fill="none" stroke="#1A1918" stroke-opacity="0.18" stroke-width="1"/>
      <text x="140" y="56" text-anchor="middle" font-family="${SERIF}" font-size="34" letter-spacing="9" fill="#1A1918">NOIRÉ</text>
      <rect x="122" y="74" width="36" height="1" fill="#1A1918" opacity="0.5"/>
      <text x="140" y="118" text-anchor="middle" font-family="${SERIF}" font-size="34" font-style="italic" fill="#1A1918">${number}</text>
      <text x="140" y="146" text-anchor="middle" font-family="${SANS}" font-size="12" letter-spacing="4.2" fill="#1A1918">${label.toUpperCase()}</text>
      <text x="140" y="166" text-anchor="middle" font-family="${SANS}" font-size="8.5" letter-spacing="2.6" fill="#1A1918" opacity="0.6">${concentration.toUpperCase()}</text>
    </g>`;
  return { defs, body };
}

// Bottle placed on a floor at (cx, floorY), scaled; with contact shadow, cast shadow,
// coloured light spill and a faint reflection.
function placedBottle({ product, cx, floorY, scale = 1, reflection = true, spill = true, shadowSide = 1 }) {
  const { defs, body } = flacon({
    liquid: product.palette.liquid,
    label: product.name,
    number: String(product.number).padStart(2, "0"),
    concentration: product.category,
  });
  const w = 420 * scale;
  const h = 800 * scale;
  const x = cx - w / 2;
  const y = floorY - h;
  const blur = id("blur");
  const blurSoft = id("blurSoft");
  const fade = id("fade");
  const mask = id("mask");
  const groupId = id("bottle");
  const extraDefs = `
    ${defs}
    <filter id="${blur}" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="${10 * scale}"/></filter>
    <filter id="${blurSoft}" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="${26 * scale}"/></filter>
    <linearGradient id="${fade}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.22"/>
      <stop offset="0.35" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <mask id="${mask}"><rect x="${x - 10}" y="${floorY}" width="${w + 20}" height="${h}" fill="url(#${fade})"/></mask>
    <g id="${groupId}">${body}</g>`;
  const cast = `
    <polygon filter="url(#${blurSoft})" fill="#000" opacity="0.16"
      points="${x + 10 * scale},${floorY} ${x + w - 10 * scale},${floorY} ${cx + shadowSide * (w * 1.05)},${floorY - 46 * scale} ${cx + shadowSide * (w * 0.45)},${floorY - 52 * scale}"/>`;
  const contact = `<ellipse cx="${cx}" cy="${floorY + 2 * scale}" rx="${w * 0.56}" ry="${16 * scale}" fill="#000" opacity="0.32" filter="url(#${blur})"/>`;
  const spillLight = spill
    ? `<ellipse cx="${cx + shadowSide * w * 0.42}" cy="${floorY + 18 * scale}" rx="${w * 0.5}" ry="${26 * scale}" fill="${product.palette.liquid}" opacity="0.32" filter="url(#${blurSoft})"/>`
    : "";
  const refl = reflection
    ? `<g mask="url(#${mask})"><use href="#${groupId}" transform="translate(${x} ${floorY * 2 - (y + h) + h}) scale(${scale} ${-scale}) translate(0 0)"/></g>`
    : "";
  const placed = `<use href="#${groupId}" transform="translate(${x} ${y}) scale(${scale})"/>`;
  return { defs: extraDefs, body: `${cast}${spillLight}${contact}${refl}${placed}` };
}

// ── backdrops ────────────────────────────────────────────────────────────────
function studio({ width, height, backdrop, floor, horizon }) {
  const wall = id("wall");
  const ground = id("ground");
  const glow = id("glow");
  const defs = `
    <linearGradient id="${wall}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${lighten(backdrop, 0.22)}"/>
      <stop offset="1" stop-color="${backdrop}"/>
    </linearGradient>
    <linearGradient id="${ground}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${mix(floor, backdrop, 0.4)}"/>
      <stop offset="1" stop-color="${darken(floor, 0.06)}"/>
    </linearGradient>
    <radialGradient id="${glow}" cx="0.28" cy="0.18" r="0.75">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>`;
  const body = `
    <rect width="${width}" height="${height}" fill="url(#${wall})"/>
    <rect y="${horizon}" width="${width}" height="${height - horizon}" fill="url(#${ground})"/>
    <rect width="${width}" height="${height}" fill="url(#${glow})"/>`;
  return { defs, body };
}

function windowLight({ width, height, opacity = 0.18, skew = 1 }) {
  const f = id("wl");
  return {
    defs: `<filter id="${f}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="28"/></filter>`,
    body: `<g filter="url(#${f})" opacity="${opacity}" fill="#FFFDF7">
      <polygon points="${width * 0.08},0 ${width * 0.3},0 ${width * (0.62 + 0.1 * skew)},${height} ${width * (0.38 + 0.1 * skew)},${height}"/>
      <polygon points="${width * 0.36},0 ${width * 0.45},0 ${width * (0.78 + 0.1 * skew)},${height} ${width * (0.68 + 0.1 * skew)},${height}"/>
    </g>`,
  };
}

function plinth({ cx, topY, width, height, color }) {
  const side = id("plinth");
  return {
    defs: `<linearGradient id="${side}" x1="0" x2="1">
      <stop offset="0" stop-color="${darken(color, 0.12)}"/>
      <stop offset="0.35" stop-color="${lighten(color, 0.1)}"/>
      <stop offset="1" stop-color="${darken(color, 0.18)}"/>
    </linearGradient>`,
    body: `
      <rect x="${cx - width / 2}" y="${topY}" width="${width}" height="${height}" fill="url(#${side})"/>
      <ellipse cx="${cx}" cy="${topY}" rx="${width / 2}" ry="${width * 0.09}" fill="${lighten(color, 0.18)}"/>`,
  };
}

function svg(width, height, parts, title) {
  const defs = parts.map((p) => p.defs).join("");
  const body = parts.map((p) => p.body).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${title}">
<title>${title}</title>
<defs>${defs}</defs>
${body}
</svg>`;
}

function write(relPath, content) {
  const target = root + relPath;
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}

// ── product imagery ──────────────────────────────────────────────────────────
const W = 1200;
const H = 1500;

function familyObject(product, cx, floorY) {
  const c = product.palette.liquid;
  const shade = id("obj");
  const defs = `<radialGradient id="${shade}" cx="0.35" cy="0.3" r="0.8">
      <stop offset="0" stop-color="${lighten(c, 0.35)}"/>
      <stop offset="1" stop-color="${darken(c, 0.35)}"/>
    </radialGradient>`;
  const softShadow = (rx) =>
    `<ellipse cx="${cx}" cy="${floorY + 4}" rx="${rx}" ry="12" fill="#000" opacity="0.18"/>`;
  switch (product.family) {
    case "citrus":
    case "gourmand":
      return {
        defs,
        body: `${softShadow(100)}<circle cx="${cx}" cy="${floorY - 104}" r="108" fill="url(#${shade})"/>`,
      };
    case "woody":
      return {
        defs,
        body: `${softShadow(150)}
          <rect x="${cx - 150}" y="${floorY - 64}" width="300" height="64" fill="${darken(product.palette.backdrop, 0.38)}"/>
          <rect x="${cx - 150}" y="${floorY - 64}" width="300" height="6" fill="#fff" opacity="0.15"/>
          <rect x="${cx - 112}" y="${floorY - 128}" width="230" height="64" fill="${darken(product.palette.backdrop, 0.24)}"/>`,
      };
    case "amber":
      return {
        defs,
        body: `<circle cx="${cx}" cy="${floorY - 520}" r="210" fill="${lighten(c, 0.2)}" opacity="0.55"/>`,
      };
    case "fresh":
      return {
        defs,
        body: [0, 1, 2]
          .map(
            (i) =>
              `<ellipse cx="${cx}" cy="${floorY + 30}" rx="${120 + i * 70}" ry="${14 + i * 8}" fill="none" stroke="#fff" stroke-opacity="${0.5 - i * 0.14}" stroke-width="2"/>`,
          )
          .join(""),
      };
    default: // floral
      return {
        defs,
        body: `${softShadow(80)}
          <path d="M ${cx} ${floorY - 10} C ${cx - 110} ${floorY - 60}, ${cx - 90} ${floorY - 230}, ${cx} ${floorY - 260} C ${cx + 90} ${floorY - 230}, ${cx + 110} ${floorY - 60}, ${cx} ${floorY - 10} Z" fill="url(#${shade})" opacity="0.92"/>`,
      };
  }
}

for (const product of products) {
  const slug = slugFor(product);
  const title = `NOIRÉ ${String(product.number).padStart(2, "0")} ${product.name}`;
  const { backdrop, floor } = product.palette;

  // 1. Front — the flacon alone in studio light.
  {
    const horizon = 1180;
    write(
      `products/${slug}/front.svg`,
      svg(
        W,
        H,
        [
          studio({ width: W, height: H, backdrop, floor, horizon }),
          placedBottle({ product, cx: 600, floorY: 1250, scale: 1.04 }),
        ],
        `${title} — Eau de Parfum flacon`,
      ),
    );
  }

  // 2. Still life — on a plinth with an object that hints at the fragrance family.
  {
    const horizon = 1080;
    const deeper = darken(backdrop, 0.08);
    write(
      `products/${slug}/still.svg`,
      svg(
        W,
        H,
        [
          studio({ width: W, height: H, backdrop: deeper, floor: darken(floor, 0.06), horizon }),
          windowLight({ width: W, height: H, opacity: 0.22 }),
          {
            defs: "",
            body: `<path d="M 230 1080 L 230 420 A 370 370 0 0 1 970 420 L 970 1080 Z" fill="${lighten(backdrop, 0.18)}" opacity="0.55"/>`,
          },
          familyObject(product, 860, 1250),
          plinth({ cx: 480, topY: 1010, width: 380, height: 260, color: lighten(floor, 0.1) }),
          placedBottle({ product, cx: 480, floorY: 1012, scale: 0.82, reflection: false }),
        ],
        `${title} — still life`,
      ),
    );
  }

  // 3. Detail — cap, collar and label up close.
  {
    const horizon = 1500;
    const parts = [
      studio({ width: W, height: H, backdrop: lighten(backdrop, 0.05), floor, horizon }),
      placedBottle({ product, cx: 600, floorY: 1727, scale: 2.4, reflection: false, spill: false }),
    ];
    write(`products/${slug}/detail.svg`, svg(W, H, parts, `${title} — label detail`));
  }
}

// ── campaign imagery ─────────────────────────────────────────────────────────
const byNumber = (n) => products.find((p) => p.number === n);

// Hero: three flacons on stepped plinths in raking window light.
{
  const width = 1200;
  const height = 1500;
  write(
    "editorial/hero.svg",
    svg(
      width,
      height,
      [
        studio({ width, height, backdrop: "#D8CCBC", floor: "#CBBDA9", horizon: 1120 }),
        windowLight({ width, height, opacity: 0.28 }),
        { defs: "", body: `<circle cx="820" cy="430" r="250" fill="#E9DFD1" opacity="0.7"/>` },
        plinth({ cx: 300, topY: 1000, width: 300, height: 360, color: "#D9CDBD" }),
        plinth({ cx: 900, topY: 940, width: 280, height: 420, color: "#CFC2B0" }),
        placedBottle({ product: byNumber(3), cx: 300, floorY: 1002, scale: 0.56, reflection: false }),
        placedBottle({ product: byNumber(5), cx: 900, floorY: 942, scale: 0.56, reflection: false }),
        plinth({ cx: 600, topY: 1150, width: 420, height: 260, color: "#E4D9CA" }),
        placedBottle({ product: byNumber(1), cx: 600, floorY: 1152, scale: 0.84, reflection: false }),
      ],
      "Three NOIRÉ flacons on stone plinths in window light",
    ),
  );
}

// Editorial: the three sizes of one fragrance, side by side.
{
  const width = 1200;
  const height = 1500;
  const p = byNumber(7);
  write(
    "editorial/atelier.svg",
    svg(
      width,
      height,
      [
        studio({ width, height, backdrop: "#E3D8CB", floor: "#D6C8B7", horizon: 1100 }),
        windowLight({ width, height, opacity: 0.3, skew: -1 }),
        placedBottle({ product: byNumber(8), cx: 300, floorY: 1240, scale: 0.5 }),
        placedBottle({ product: p, cx: 620, floorY: 1240, scale: 0.78 }),
        placedBottle({ product: byNumber(9), cx: 930, floorY: 1240, scale: 0.6 }),
      ],
      "NOIRÉ flacons arranged in soft afternoon light",
    ),
  );
}

// Discovery: a single flacon under a spotlight on charcoal, set right of centre for wide banners.
{
  const width = 2400;
  const height = 1000;
  const spot = id("spot");
  write(
    "editorial/discovery.svg",
    svg(
      width,
      height,
      [
        studio({ width, height, backdrop: "#2A2826", floor: "#201F1D", horizon: 780 }),
        {
          defs: `<radialGradient id="${spot}" cx="0.7" cy="0.45" r="0.35">
            <stop offset="0" stop-color="#F4E9D6" stop-opacity="0.32"/>
            <stop offset="1" stop-color="#F4E9D6" stop-opacity="0"/></radialGradient>`,
          body: `<rect width="${width}" height="${height}" fill="url(#${spot})"/>`,
        },
        placedBottle({ product: byNumber(11), cx: 1680, floorY: 860, scale: 0.7 }),
      ],
      "A NOIRÉ flacon under a single spotlight",
    ),
  );
}

// Mood scenes.
const moods = [
  { slug: "after-dark", bottle: 6, backdrop: "#2B2A30", floor: "#1F1E22", light: "#C9B9E0", orb: [870, 380, 120] },
  { slug: "fresh-start", bottle: 3, backdrop: "#E6E3D6", floor: "#D8D4C2", light: "#FFF9E8", orb: [330, 520, 150] },
  { slug: "slow-sunday", bottle: 7, backdrop: "#E3D6C8", floor: "#D4C4B3", light: "#FFFDF7", window: true },
  { slug: "date-night", bottle: 11, backdrop: "#4A2A2D", floor: "#3A2023", light: "#F0C9A8", orb: [600, 470, 300] },
  { slug: "main-character", bottle: 12, backdrop: "#B9714F", floor: "#A3603F", light: "#FFE7CF", orb: [600, 560, 360] },
  { slug: "quiet-luxury", bottle: 5, backdrop: "#CFCAC2", floor: "#BEB8AE", light: "#FFFFFF", slabs: true },
];

for (const mood of moods) {
  const width = 1200;
  const height = 1500;
  const parts = [studio({ width, height, backdrop: mood.backdrop, floor: mood.floor, horizon: 1120 })];
  if (mood.window) parts.push(windowLight({ width, height, opacity: 0.35 }));
  if (mood.orb) {
    const [cx, cy, r] = mood.orb;
    const g = id("orb");
    parts.push({
      defs: `<radialGradient id="${g}"><stop offset="0" stop-color="${mood.light}" stop-opacity="0.55"/><stop offset="1" stop-color="${mood.light}" stop-opacity="0"/></radialGradient>`,
      body: `<circle cx="${cx}" cy="${cy}" r="${r * 1.8}" fill="url(#${g})"/><circle cx="${cx}" cy="${cy}" r="${r * 0.55}" fill="${mood.light}" opacity="0.35"/>`,
    });
  }
  if (mood.slabs) {
    parts.push(plinth({ cx: 600, topY: 1060, width: 560, height: 120, color: "#DAD5CD" }));
    parts.push(plinth({ cx: 600, topY: 990, width: 420, height: 80, color: "#E6E1D9" }));
  }
  parts.push(
    placedBottle({
      product: byNumber(mood.bottle),
      cx: 600,
      floorY: mood.slabs ? 992 : 1260,
      scale: 0.86,
      reflection: !mood.slabs,
    }),
  );
  write(`moods/${mood.slug}.svg`, svg(width, height, parts, `NOIRÉ — ${mood.slug.replace("-", " ")}`));
}

console.log("Rendered product and campaign imagery to public/images");
