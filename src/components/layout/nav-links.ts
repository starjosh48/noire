export const primaryNav = [
  { href: "/shop", label: "Shop" },
  { href: "/collections", label: "Collections" },
  { href: "/discovery", label: "Discovery" },
  { href: "/about", label: "About" },
] as const;

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
