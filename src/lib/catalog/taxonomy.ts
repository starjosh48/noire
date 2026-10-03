// The vocabulary of the catalog: families, moods, scent characters and filter options.

export type Option = { slug: string; label: string };

export const families = [
  {
    slug: "woody",
    label: "Woody",
    description: "Cedar, sandalwood and vetiver. Dry, grounded and quietly confident.",
    swatch: "#6B5443",
  },
  {
    slug: "floral",
    label: "Floral",
    description: "Iris, rose and jasmine, cut with spice and shadow rather than sugar.",
    swatch: "#8C5A62",
  },
  {
    slug: "fresh",
    label: "Fresh",
    description: "Clean musks, rain-washed greens and the feeling of a cool morning.",
    swatch: "#8FA2A4",
  },
  {
    slug: "amber",
    label: "Amber",
    description: "Resins, vanilla and warm spice that glow on skin for hours.",
    swatch: "#B0662B",
  },
  {
    slug: "citrus",
    label: "Citrus",
    description: "Bergamot, yuzu and blood orange. Bright and sunlit.",
    swatch: "#C9A64F",
  },
  {
    slug: "gourmand",
    label: "Gourmand",
    description: "Fig, tonka and soft sweetness, rich without being cloying.",
    swatch: "#5A3F4C",
  },
] as const;

export const moods = [
  {
    slug: "after-dark",
    label: "After Dark",
    description: "Smoke, iris and leather for evenings that run late.",
    image: "/images/moods/after-dark.webp",
  },
  {
    slug: "fresh-start",
    label: "Fresh Start",
    description: "Citrus and clean musk for first light and new beginnings.",
    image: "/images/moods/fresh-start.webp",
  },
  {
    slug: "slow-sunday",
    label: "Slow Sunday",
    description: "Soft skin scents and warm fig for unhurried days.",
    image: "/images/moods/slow-sunday.webp",
  },
  {
    slug: "date-night",
    label: "Date Night",
    description: "Rose, amber and vanilla. Close, warm and memorable.",
    image: "/images/moods/date-night.webp",
  },
  {
    slug: "main-character",
    label: "Main Character",
    description: "Bold, radiant compositions that walk into the room first.",
    image: "/images/moods/main-character.webp",
  },
  {
    slug: "quiet-luxury",
    label: "Quiet Luxury",
    description: "Understated musks and woods that never need to raise their voice.",
    image: "/images/moods/quiet-luxury.webp",
  },
] as const;

export const scentProfiles = [
  { slug: "fresh", label: "Fresh", description: "Airy, green, awake" },
  { slug: "warm", label: "Warm", description: "Amber, resin, glow" },
  { slug: "woody", label: "Woody", description: "Cedar, sandalwood, smoke" },
  { slug: "sweet", label: "Sweet", description: "Vanilla, fig, tonka" },
  { slug: "floral", label: "Floral", description: "Iris, rose, jasmine" },
  { slug: "spicy", label: "Spicy", description: "Saffron, pepper, clove" },
  { slug: "clean", label: "Clean", description: "Musk, cotton, skin" },
  { slug: "mysterious", label: "Mysterious", description: "Oud, incense, shadow" },
] as const;

export const genders = [
  { slug: "unisex", label: "For everyone" },
  { slug: "feminine", label: "Feminine-leaning" },
  { slug: "masculine", label: "Masculine-leaning" },
] as const;

export const sizes = [30, 50, 100] as const;

export const priceRanges = [
  { slug: "under-60000", label: "Under ₦60,000", min: 0, max: 59999 },
  { slug: "60000-100000", label: "₦60,000 – ₦100,000", min: 60000, max: 100000 },
  { slug: "over-100000", label: "Over ₦100,000", min: 100001, max: null },
] as const;

export const sortOptions = [
  { slug: "featured", label: "Featured" },
  { slug: "newest", label: "Newest" },
  { slug: "price-asc", label: "Price: Low to High" },
  { slug: "price-desc", label: "Price: High to Low" },
  { slug: "bestselling", label: "Bestselling" },
] as const;

export type SortKey = (typeof sortOptions)[number]["slug"];

const secondaryLabels: Record<string, string> = {
  musk: "Musk",
  spicy: "Spicy",
  leather: "Leather",
  aquatic: "Aquatic",
};

export function familyLabel(slug: string | null | undefined) {
  if (!slug) return "";
  return families.find((f) => f.slug === slug)?.label ?? secondaryLabels[slug] ?? slug;
}

/** "Woody / Amber" */
export function familyLine(primary: string, secondary?: string | null) {
  return [familyLabel(primary), familyLabel(secondary)].filter(Boolean).join(" / ");
}

export function moodBySlug(slug: string) {
  return moods.find((m) => m.slug === slug);
}

export function genderLabel(slug: string) {
  return genders.find((g) => g.slug === slug)?.label ?? slug;
}
