export const NAV_LINKS = [
  { href: "/properties", label: "Properties" },
  { href: "/collections", label: "Explore" },
  { href: "/neighborhoods", label: "Neighborhoods" },
  { href: "/about", label: "About" },
] as const;

/** Routes whose first section is a full-bleed image, so the header starts transparent. */
export function hasOverlayHero(pathname: string): boolean {
  return pathname === "/" || pathname === "/about";
}

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
