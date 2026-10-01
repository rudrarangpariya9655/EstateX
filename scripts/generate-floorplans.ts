/**
 * Generates the demo floor plans in public/floorplans/ as clean line drawings.
 * Layouts are defined in metres; 1 m = 40 px.
 *
 *   npx tsx scripts/generate-floorplans.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Side = "n" | "s" | "e" | "w";
interface Room {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  open?: boolean; // dashed outline (terraces, voids, courtyards)
  door?: [Side, number]; // wall + offset (m) from the wall's start
  stair?: "h" | "v";
  pool?: boolean;
  trees?: boolean;
  hideDims?: boolean;
}

interface Plan {
  file: string;
  title: string;
  w: number;
  h: number;
  rooms: Room[];
  outside?: Room[];
}

const M = 40;
const INK = "#151515";
const MUTED = "#6f6d68";
const BG = "#faf9f6";
const PAD_X = 70;
const PAD_TOP = 60;

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmt(n: number) {
  return Number.isInteger(n) ? `${n}.0` : n.toFixed(1);
}

function roomSvg(r: Room, ox: number, oy: number): string {
  const x = ox + r.x * M;
  const y = oy + r.y * M;
  const w = r.w * M;
  const h = r.h * M;
  const parts: string[] = [];
  if (r.pool) {
    parts.push(`<rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="${h - 16}" fill="#e2e6dd" stroke="${INK}" stroke-width="1"/>`);
    for (let i = 1; i < 4; i++) {
      const ly = y + 8 + ((h - 16) * i) / 4;
      parts.push(`<path d="M${x + 20} ${ly} q12 -5 24 0 t24 0" fill="none" stroke="${MUTED}" stroke-width="0.8"/>`);
    }
  }
  parts.push(
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-width="${r.open ? 1.2 : 2.5}"${r.open ? ' stroke-dasharray="6 5"' : ""}/>`,
  );
  if (r.stair) {
    const steps = r.stair === "h" ? Math.floor(w / 14) : Math.floor(h / 14);
    for (let i = 1; i < steps; i++) {
      parts.push(
        r.stair === "h"
          ? `<line x1="${x + i * 14}" y1="${y + 6}" x2="${x + i * 14}" y2="${y + h - 6}" stroke="${INK}" stroke-width="0.9"/>`
          : `<line x1="${x + 6}" y1="${y + i * 14}" x2="${x + w - 6}" y2="${y + i * 14}" stroke="${INK}" stroke-width="0.9"/>`,
      );
    }
  }
  if (r.trees) {
    for (const [cx, cy, rad] of [
      [0.32, 0.35, 0.16],
      [0.68, 0.62, 0.2],
      [0.3, 0.75, 0.12],
    ] as const) {
      parts.push(
        `<circle cx="${x + w * cx}" cy="${y + h * cy}" r="${Math.min(w, h) * rad}" fill="none" stroke="${MUTED}" stroke-width="0.9" stroke-dasharray="2 3"/>`,
      );
    }
  }
  if (r.door) {
    const [side, off] = r.door;
    const d = 0.9 * M;
    const o = off * M;
    let gap = "";
    let swing = "";
    if (side === "n" || side === "s") {
      const wy = side === "n" ? y : y + h;
      const dir = side === "n" ? 1 : -1;
      gap = `<line x1="${x + o}" y1="${wy}" x2="${x + o + d}" y2="${wy}" stroke="${BG}" stroke-width="5"/>`;
      swing = `<path d="M${x + o} ${wy} L${x + o} ${wy + dir * d} A${d} ${d} 0 0 ${dir === 1 ? 0 : 1} ${x + o + d} ${wy}" fill="none" stroke="${INK}" stroke-width="0.9"/>`;
    } else {
      const wx = side === "w" ? x : x + w;
      const dir = side === "w" ? 1 : -1;
      gap = `<line x1="${wx}" y1="${y + o}" x2="${wx}" y2="${y + o + d}" stroke="${BG}" stroke-width="5"/>`;
      swing = `<path d="M${wx} ${y + o} L${wx + dir * d} ${y + o} A${d} ${d} 0 0 ${dir === 1 ? 1 : 0} ${wx} ${y + o + d}" fill="none" stroke="${INK}" stroke-width="0.9"/>`;
    }
    parts.push(gap, swing);
  }
  const cx = x + w / 2;
  const cy = y + h / 2;
  const small = w < 3.2 * M || h < 2.6 * M;
  parts.push(
    `<text x="${cx}" y="${cy - (r.hideDims ? -4 : 2)}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${small ? 9.5 : 11}" letter-spacing="${small ? 1.2 : 2}" fill="${INK}">${escapeXml(r.name.toUpperCase())}</text>`,
  );
  if (!r.hideDims) {
    parts.push(
      `<text x="${cx}" y="${cy + 14}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${small ? 8.5 : 10}" fill="${MUTED}">${fmt(r.w)} × ${fmt(r.h)} m</text>`,
    );
  }
  return parts.join("\n  ");
}

function planSvg(plan: Plan): string {
  const outside = plan.outside ?? [];
  const minY = Math.min(0, ...outside.map((r) => r.y));
  const maxY = Math.max(plan.h, ...outside.map((r) => r.y + r.h));
  const ox = PAD_X;
  const oy = PAD_TOP - minY * M;
  const width = plan.w * M + PAD_X * 2;
  const height = (maxY - minY) * M + PAD_TOP + 110;
  const bottom = oy + maxY * M;

  const body = [
    ...outside.map((r) => roomSvg({ ...r, open: true }, ox, oy)),
    ...plan.rooms.map((r) => roomSvg(r, ox, oy)),
    // Heavy outer wall.
    `<rect x="${ox}" y="${oy}" width="${plan.w * M}" height="${plan.h * M}" fill="none" stroke="${INK}" stroke-width="6"/>`,
  ];

  // Re-draw door gaps through the outer wall where doors sit on the perimeter.
  for (const r of plan.rooms) {
    if (!r.door) continue;
    const [side, off] = r.door;
    const onPerimeter =
      (side === "n" && r.y === 0) || (side === "s" && r.y + r.h === plan.h) || (side === "w" && r.x === 0) || (side === "e" && r.x + r.w === plan.w);
    if (!onPerimeter) continue;
    const d = 0.9 * M;
    if (side === "n" || side === "s") {
      const wy = oy + (side === "n" ? r.y : r.y + r.h) * M;
      body.push(`<line x1="${ox + r.x * M + off * M}" y1="${wy}" x2="${ox + r.x * M + off * M + d}" y2="${wy}" stroke="${BG}" stroke-width="8"/>`);
    } else {
      const wx = ox + (side === "w" ? r.x : r.x + r.w) * M;
      body.push(`<line x1="${wx}" y1="${oy + r.y * M + off * M}" x2="${wx}" y2="${oy + r.y * M + off * M + d}" stroke="${BG}" stroke-width="8"/>`);
    }
  }

  const scaleY = bottom + 60;
  const footer = [
    `<text x="${ox}" y="${scaleY - 18}" font-family="Georgia, 'Times New Roman', serif" font-size="22" fill="${INK}">${plan.title}</text>`,
    // Scale bar 0–5 m.
    ...[0, 1, 2, 3, 4].map(
      (i) =>
        `<rect x="${ox + i * M}" y="${scaleY}" width="${M}" height="5" fill="${i % 2 ? BG : INK}" stroke="${INK}" stroke-width="0.8"/>`,
    ),
    `<text x="${ox}" y="${scaleY + 20}" font-family="Helvetica, Arial, sans-serif" font-size="9" fill="${MUTED}">0</text>`,
    `<text x="${ox + 5 * M - 10}" y="${scaleY + 20}" font-family="Helvetica, Arial, sans-serif" font-size="9" fill="${MUTED}">5 m</text>`,
    // North arrow.
    `<g transform="translate(${width - PAD_X - 14} ${scaleY - 26})"><circle r="16" fill="none" stroke="${INK}" stroke-width="0.8"/><path d="M0 -12 L6 8 L0 4 L-6 8 Z" fill="${INK}"/><text y="30" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="9" letter-spacing="1.5" fill="${INK}">N</text></g>`,
    `<text x="${width - PAD_X}" y="${height - 14}" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="8.5" fill="${MUTED}">Indicative plan · dimensions approximate · EstateX demo</text>`,
  ];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">
  <rect width="${width}" height="${height}" fill="${BG}"/>
  ${body.join("\n  ")}
  ${footer.join("\n  ")}
</svg>
`;
}

const PLANS: Plan[] = [
  {
    file: "house-ground",
    title: "Ground floor",
    w: 16,
    h: 12,
    rooms: [
      { name: "Living", x: 0, y: 0, w: 7, h: 6, door: ["e", 4.2] },
      { name: "Courtyard", x: 7, y: 0, w: 5, h: 6, open: true, trees: true },
      { name: "Kitchen", x: 12, y: 0, w: 4, h: 4, door: ["w", 2.6] },
      { name: "Pantry", x: 12, y: 4, w: 4, h: 2, door: ["s", 1.2] },
      { name: "Dining", x: 0, y: 6, w: 5, h: 6, door: ["n", 3.6] },
      { name: "Entry", x: 5, y: 6, w: 3, h: 3, door: ["s", 1] },
      { name: "Stair", x: 8, y: 6, w: 3, h: 3, stair: "h", hideDims: true },
      { name: "Powder", x: 5, y: 9, w: 3, h: 3, door: ["n", 1] },
      { name: "Study", x: 8, y: 9, w: 3, h: 3, door: ["n", 1.8] },
      { name: "Guest bedroom", x: 11, y: 6, w: 5, h: 6, door: ["w", 0.6] },
    ],
    outside: [{ name: "Verandah", x: 0, y: 12, w: 8, h: 2.5 }],
  },
  {
    file: "house-first",
    title: "First floor",
    w: 16,
    h: 12,
    rooms: [
      { name: "Principal bedroom", x: 0, y: 0, w: 7, h: 6, door: ["s", 4.6] },
      { name: "Open to below", x: 7, y: 0, w: 5, h: 6, open: true, hideDims: true },
      { name: "Bedroom 2", x: 12, y: 0, w: 4, h: 6, door: ["s", 0.6] },
      { name: "Bath", x: 0, y: 6, w: 4, h: 3, door: ["n", 2.4] },
      { name: "Dressing", x: 0, y: 9, w: 4, h: 3, door: ["e", 1] },
      { name: "Landing", x: 4, y: 6, w: 4, h: 3 },
      { name: "Stair", x: 8, y: 6, w: 3, h: 3, stair: "h", hideDims: true },
      { name: "Family room", x: 4, y: 9, w: 7, h: 3, door: ["n", 0.6] },
      { name: "Bath", x: 11, y: 6, w: 5, h: 2, door: ["w", 0.5] },
      { name: "Bedroom 3", x: 11, y: 8, w: 5, h: 4, door: ["w", 0.4] },
    ],
    outside: [{ name: "Terrace", x: 0, y: -2.5, w: 7, h: 2.5 }],
  },
  {
    file: "villa-ground",
    title: "Ground floor",
    w: 20,
    h: 13,
    rooms: [
      { name: "Living", x: 0, y: 0, w: 8, h: 7, door: ["e", 5.6] },
      { name: "Dining", x: 8, y: 0, w: 6, h: 5, door: ["s", 2.5] },
      { name: "Kitchen", x: 14, y: 0, w: 6, h: 5, door: ["w", 3.4] },
      { name: "Entrance hall", x: 8, y: 5, w: 4, h: 4, door: ["s", 1.5] },
      { name: "Stair", x: 12, y: 5, w: 3, h: 4, stair: "v", hideDims: true },
      { name: "Utility", x: 15, y: 5, w: 5, h: 4, door: ["n", 0.5] },
      { name: "Family room", x: 0, y: 7, w: 8, h: 6, door: ["e", 0.6] },
      { name: "Guest suite", x: 8, y: 9, w: 7, h: 4, door: ["n", 4.6] },
      { name: "Staff", x: 15, y: 9, w: 5, h: 4, door: ["n", 3.6] },
    ],
    outside: [
      { name: "Terrace", x: 0, y: 13, w: 9, h: 3 },
      { name: "Pool", x: 9.5, y: 13.5, w: 10.5, h: 2.5, pool: true, hideDims: true },
    ],
  },
  {
    file: "villa-first",
    title: "First floor",
    w: 20,
    h: 13,
    rooms: [
      { name: "Principal suite", x: 0, y: 0, w: 9, h: 7, door: ["s", 7.4] },
      { name: "Bedroom 2", x: 9, y: 0, w: 6, h: 5, door: ["s", 0.6] },
      { name: "Bedroom 3", x: 15, y: 0, w: 5, h: 5, door: ["s", 0.6] },
      { name: "Bath", x: 0, y: 7, w: 4, h: 3, door: ["n", 2.4] },
      { name: "Dressing", x: 4, y: 7, w: 4, h: 3, door: ["n", 2.4] },
      { name: "Landing", x: 8, y: 5, w: 4, h: 4 },
      { name: "Stair", x: 12, y: 5, w: 3, h: 4, stair: "v", hideDims: true },
      { name: "Bath", x: 15, y: 5, w: 5, h: 3, door: ["w", 0.6] },
      { name: "Study", x: 0, y: 10, w: 8, h: 3, door: ["n", 6.6] },
      { name: "Bedroom 4", x: 8, y: 9, w: 7, h: 4, door: ["n", 0.6] },
      { name: "Bath", x: 15, y: 8, w: 5, h: 5, door: ["w", 0.6] },
    ],
    outside: [{ name: "Balcony", x: 0, y: -2.5, w: 9, h: 2.5 }],
  },
  {
    file: "penthouse-main",
    title: "Main level",
    w: 22,
    h: 12,
    rooms: [
      { name: "Living & dining", x: 0, y: 0, w: 12, h: 7, door: ["s", 10.4] },
      { name: "Kitchen", x: 12, y: 0, w: 5, h: 7, door: ["w", 5.4] },
      { name: "Library", x: 17, y: 0, w: 5, h: 5, door: ["s", 0.6] },
      { name: "Principal bedroom", x: 0, y: 7, w: 7, h: 5, door: ["n", 5.6] },
      { name: "Bath", x: 7, y: 7, w: 3, h: 5, door: ["w", 3.6] },
      { name: "Bedroom 2", x: 10, y: 7, w: 5, h: 5, door: ["n", 0.4] },
      { name: "Lift lobby", x: 15, y: 7, w: 3, h: 5, door: ["n", 1] },
      { name: "Bedroom 3", x: 18, y: 5, w: 4, h: 7, door: ["w", 0.4] },
    ],
    outside: [{ name: "Wraparound terrace", x: 0, y: -2.5, w: 17, h: 2.5 }],
  },
  {
    file: "penthouse-terrace",
    title: "Terrace level",
    w: 22,
    h: 12,
    rooms: [
      { name: "Roof terrace", x: 0, y: 0, w: 14, h: 12, open: true },
      { name: "Lap pool", x: 1, y: 7.5, w: 12, h: 3.5, pool: true, hideDims: true },
      { name: "Lounge pavilion", x: 14, y: 0, w: 8, h: 6, door: ["w", 3.8] },
      { name: "Outdoor kitchen", x: 14, y: 6, w: 4, h: 6, door: ["w", 0.6] },
      { name: "Stair & lift", x: 18, y: 6, w: 4, h: 6, stair: "v", hideDims: true },
    ],
  },
  {
    file: "apartment-2bhk",
    title: "Floor plan",
    w: 12,
    h: 10,
    rooms: [
      { name: "Living & dining", x: 0, y: 0, w: 7, h: 6, door: ["e", 4.6] },
      { name: "Kitchen", x: 7, y: 0, w: 5, h: 3, door: ["w", 1] },
      { name: "Bath", x: 7, y: 3, w: 3, h: 3, door: ["s", 1] },
      { name: "Utility", x: 10, y: 3, w: 2, h: 3, door: ["w", 1], hideDims: true },
      { name: "Bedroom 1", x: 0, y: 6, w: 6, h: 4, door: ["n", 4.6] },
      { name: "Bedroom 2", x: 6, y: 6, w: 6, h: 4, door: ["n", 0.4] },
    ],
    outside: [{ name: "Balcony", x: 0, y: -2, w: 7, h: 2 }],
  },
  {
    file: "apartment-3bhk",
    title: "Floor plan",
    w: 15,
    h: 11,
    rooms: [
      { name: "Living", x: 0, y: 0, w: 8, h: 6, door: ["e", 4.4] },
      { name: "Kitchen", x: 8, y: 0, w: 4, h: 3.5, door: ["s", 1.4] },
      { name: "Dining", x: 8, y: 3.5, w: 4, h: 2.5 },
      { name: "Study", x: 12, y: 0, w: 3, h: 3.5, door: ["s", 1] },
      { name: "Entry", x: 12, y: 3.5, w: 3, h: 2.5, door: ["e", 0.8] },
      { name: "Bedroom 1", x: 0, y: 6, w: 5, h: 5, door: ["n", 3.6] },
      { name: "Bath", x: 5, y: 6, w: 3, h: 2.5, door: ["n", 1] },
      { name: "Bath", x: 5, y: 8.5, w: 3, h: 2.5, door: ["e", 0.8] },
      { name: "Bedroom 2", x: 8, y: 6, w: 4, h: 5, door: ["n", 0.4] },
      { name: "Bedroom 3", x: 12, y: 6, w: 3, h: 5, door: ["n", 1] },
    ],
    outside: [{ name: "Verandah", x: 0, y: -2.2, w: 8, h: 2.2 }],
  },
  {
    file: "apartment-4bhk",
    title: "Floor plan",
    w: 17,
    h: 12,
    rooms: [
      { name: "Drawing room", x: 0, y: 0, w: 8, h: 6, door: ["e", 4.6] },
      { name: "Dining", x: 8, y: 0, w: 5, h: 4, door: ["s", 3.2] },
      { name: "Kitchen", x: 13, y: 0, w: 4, h: 4, door: ["w", 1.6] },
      { name: "Hall", x: 8, y: 4, w: 5, h: 3, door: ["e", 1] },
      { name: "Staff", x: 13, y: 4, w: 4, h: 3, door: ["w", 1] },
      { name: "Bedroom 1", x: 0, y: 6, w: 6, h: 6, door: ["n", 4.6] },
      { name: "Bath", x: 6, y: 6, w: 2, h: 3, door: ["s", 0.6], hideDims: true },
      { name: "Bath", x: 6, y: 9, w: 2, h: 3, door: ["e", 1], hideDims: true },
      { name: "Bedroom 2", x: 8, y: 7, w: 4, h: 5, door: ["n", 0.4] },
      { name: "Bedroom 3", x: 12, y: 7, w: 5, h: 5, door: ["n", 0.4] },
    ],
    outside: [{ name: "Garden", x: 0, y: -2.5, w: 13, h: 2.5 }],
  },
];

const OUT = join(import.meta.dirname, "..", "public", "floorplans");
mkdirSync(OUT, { recursive: true });
for (const plan of PLANS) {
  writeFileSync(join(OUT, `${plan.file}.svg`), planSvg(plan));
}
console.log(`Wrote ${PLANS.length} floor plans to ${OUT}`);
