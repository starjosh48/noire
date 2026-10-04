import { StyleSheet, useColorScheme } from "react-native";

// NOIRÉ design tokens, mirrored from the website's globals.css (light and dark).
// Warm ivory ground, deep charcoal ink, a restrained champagne accent.

const light = {
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
};

export type Palette = typeof light;

const dark: Palette = {
  ivory: "#141312",
  paper: "#1c1a19",
  stone: "#252321",
  sand: "#3d3934",
  line: "#302d2a",
  ink: "#f1ece4",
  inkSoft: "#d9d2c7",
  muted: "#a59c91",
  faint: "#958c81",
  champagne: "#c4ad8c",
  champagneDeep: "#d6bf99",
  danger: "#ec948a",
  dangerSoft: "#2d1b18",
  success: "#94bd9d",
  successSoft: "#18231b",
};

export const palettes = { light, dark };

/**
 * Gradients drawn behind text on photography, as [alpha, position] stops of rgba(20,19,18,…).
 * Each was measured against every image it covers (WCAG contrast of the text over the
 * brightest 5% of pixels behind it): small text ≥ 6.2:1, large ≥ 5.2:1. Change with care.
 */
export const scrims = {
  feed: { colors: ["rgba(20,19,18,0.8)", "rgba(20,19,18,0.62)", "rgba(20,19,18,0.15)", "rgba(20,19,18,0.2)", "rgba(20,19,18,0.74)", "rgba(20,19,18,0.92)"], locations: [0, 0.12, 0.2, 0.3, 0.5, 1] },
  cover: { colors: ["rgba(20,19,18,0.6)", "rgba(20,19,18,0.2)", "rgba(20,19,18,0.3)", "rgba(20,19,18,0.74)", "rgba(20,19,18,0.92)"], locations: [0, 0.16, 0.3, 0.45, 1] },
  banner: { colors: ["rgba(20,19,18,0.15)", "rgba(20,19,18,0.6)", "rgba(20,19,18,0.92)"], locations: [0, 0.5, 1] },
  card: { colors: ["rgba(20,19,18,0)", "rgba(20,19,18,0.15)", "rgba(20,19,18,0.88)"], locations: [0, 0.3, 1] },
  tile: { colors: ["rgba(20,19,18,0)", "rgba(20,19,18,0.12)", "rgba(20,19,18,0.86)"], locations: [0, 0.3, 1] },
} as const;

/** Fixed tones for type and controls laid over photography, in either theme. */
export const onImage = {
  night: "#1a1918",
  cream: "#f7f3ed",
  // 90%: measured to stay above WCAG AA on every photo it is used on (see scrims).
  creamMuted: "rgba(247, 243, 237, 0.9)",
  scrim: "rgba(26, 25, 24, 0.38)",
} as const;

export const fonts = {
  serif: "InstrumentSerif_400Regular",
  serifItalic: "InstrumentSerif_400Regular_Italic",
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
} as const;

/** Horizontal page padding, matching the website's mobile gutter. */
export const gutter = 20;

export type Scheme = "light" | "dark";

/** Follows the phone's light/dark setting. */
export function useScheme(): Scheme {
  return useColorScheme() === "dark" ? "dark" : "light";
}

export function useColors(): Palette {
  return palettes[useScheme()];
}

/**
 * Themed StyleSheets: `const useStyles = makeStyles((c) => ({ ... }))`, then
 * `const styles = useStyles()` in a component. Built once per theme.
 */
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(factory: (c: Palette) => T) {
  const cache: Partial<Record<Scheme, T>> = {};
  return function useStyles(): T {
    const scheme = useScheme();
    return (cache[scheme] ??= StyleSheet.create(factory(palettes[scheme])));
  };
}
