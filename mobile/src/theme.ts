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

/** Fixed tones for type and controls laid over photography, in either theme. */
export const onImage = {
  night: "#1a1918",
  cream: "#f7f3ed",
  creamMuted: "rgba(247, 243, 237, 0.78)",
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
