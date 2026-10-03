"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "@/components/ui/icons";
import { THEME_STORAGE_KEY, type ThemeChoice } from "@/lib/theme";
import { cn } from "@/lib/utils";

const THEME_EVENT = "noire-theme-change";

/** Light unless the visitor has chosen dark. */
function readTheme(): ThemeChoice {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  return () => window.removeEventListener(THEME_EVENT, onChange);
}

function setTheme(next: ThemeChoice) {
  const root = document.documentElement;
  // Fade colours across the switch, then drop the transition so it never slows normal use.
  root.classList.add("theme-transition");
  root.dataset.theme = next;
  window.setTimeout(() => root.classList.remove("theme-transition"), 450);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Private mode: the choice simply isn't remembered.
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

/** Switches between light and dark; the choice is remembered on this device. */
export function ThemeToggle({ className, withLabel }: { className?: string; withLabel?: boolean }) {
  // null on the server: the icon renders once the browser knows the theme.
  const theme = useSyncExternalStore<ThemeChoice | null>(subscribe, readTheme, () => null);
  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={() => setTheme(readTheme() === "dark" ? "light" : "dark")}
      aria-label={withLabel ? undefined : label}
      title={label}
      className={cn("relative flex items-center gap-3 text-ink transition-opacity duration-200 hover:opacity-60", className)}
    >
      <span className="relative size-[21px]" aria-hidden="true">
        <SunIcon
          size={21}
          className={cn(
            "absolute inset-0 transition-[opacity,rotate,scale] duration-500 ease-out-soft",
            theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0",
          )}
        />
        <MoonIcon
          size={21}
          className={cn(
            "absolute inset-0 transition-[opacity,rotate,scale] duration-500 ease-out-soft",
            theme === "light" ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-50 opacity-0",
          )}
        />
      </span>
      {withLabel && <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}
