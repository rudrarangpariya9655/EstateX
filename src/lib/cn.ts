type ClassValue = string | false | null | undefined | 0;

/** Join class names, skipping falsy values. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
