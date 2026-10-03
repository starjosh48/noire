type ClassValue = string | number | false | null | undefined | ClassValue[];

/** Join class names, skipping falsy values. */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value)) out.push(cn(...value));
    else out.push(String(value));
  }
  return out.filter(Boolean).join(" ");
}

/** Only allow same-origin relative paths as post-login destinations. */
export function safeRedirectPath(value: string | null | undefined, fallback = "/") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
