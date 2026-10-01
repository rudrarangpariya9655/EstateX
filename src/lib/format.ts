const CRORE = 10_000_000;
const LAKH = 100_000;

function trimDecimals(value: number, maxDecimals: number): string {
  return Number(value.toFixed(maxDecimals)).toString();
}

/** Compact Indian price: ₹2.8 Cr, ₹85 L, ₹45,000. */
export function formatPrice(amount: number): string {
  if (!Number.isFinite(amount)) return "—";
  if (amount >= CRORE) return `₹${trimDecimals(amount / CRORE, 2)} Cr`;
  if (amount >= LAKH) return `₹${trimDecimals(amount / LAKH, 1)} L`;
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

/** Full rupee amount with Indian digit grouping: ₹2,80,00,000. */
export function formatRupees(amount: number): string {
  if (!Number.isFinite(amount)) return "—";
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-IN");
}

export function formatArea(sqft: number): string {
  return `${formatNumber(sqft)} sq.ft.`;
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function formatSpecs(p: { bedrooms: number; bathrooms: number; areaSqft: number }): string {
  return [plural(p.bedrooms, "Bed"), plural(p.bathrooms, "Bath"), formatArea(p.areaSqft)].join(" · ");
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-IN", opts ?? { day: "numeric", month: "short", year: "numeric" });
}

/** "14:30" → "2:30 PM" */
export function formatTimeSlot(slot: string): string {
  const [h, m] = slot.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return slot;
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${trimDecimals(km, 1)} km`;
}

/** Today's date in India (YYYY-MM-DD) — visit requests are validated against IST. */
export function todayInIndia(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
