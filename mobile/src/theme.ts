// NOIRÉ design tokens, mirrored from the website's globals.css.
// Warm ivory ground, deep charcoal ink, a restrained champagne accent.

export const colors = {
  ivory: "#f7f3ed",
  paper: "#fbf9f5",
  stone: "#efe8de",
  sand: "#e2d8ca",
  line: "#ddd3c5",
  ink: "#1a1918",
  inkSoft: "#3a3734",
  muted: "#5f5850",
  faint: "#6f675e",
  champagne: "#b39c7d",
  champagneDeep: "#7d6a50",
  danger: "#9b2c2c",
  dangerSoft: "#f6e7e4",
  success: "#3d5a43",
  successSoft: "#e7eee6",
} as const;

export const fonts = {
  serif: "InstrumentSerif_400Regular",
  serifItalic: "InstrumentSerif_400Regular_Italic",
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
} as const;

/** Horizontal page padding, matching the website's mobile gutter. */
export const gutter = 20;
