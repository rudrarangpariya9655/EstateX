/**
 * Generates tiny base64 blur placeholders for every Unsplash photo referenced in
 * `src/`. Output: src/lib/data/blur-placeholders.json (imported server-side only).
 *
 *   npm run images:blur
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const ROOT = join(import.meta.dirname, "..");
const OUT = join(ROOT, "src/lib/data/blur-placeholders.json");
const ID_PATTERN = /\b(\d{10,13}-[0-9a-f]{12})\b/g;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

async function main() {
  const ids = new Set<string>();
  for (const file of walk(join(ROOT, "src"))) {
    for (const match of readFileSync(file, "utf8").matchAll(ID_PATTERN)) ids.add(match[1]!);
  }
  const existing: Record<string, string> = JSON.parse(readFileSync(OUT, "utf8"));
  const result: Record<string, string> = {};
  const queue = [...ids].sort();
  let fetched = 0;
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      for (let id = queue.shift(); id; id = queue.shift()) {
        if (existing[id]) {
          result[id] = existing[id]!;
          continue;
        }
        const res = await fetch(`https://images.unsplash.com/photo-${id}?w=16&q=40&fm=jpg&blur=20`);
        if (!res.ok) {
          console.warn(`skip ${id}: HTTP ${res.status}`);
          continue;
        }
        const tiny = await sharp(Buffer.from(await res.arrayBuffer()))
          .resize(16)
          .jpeg({ quality: 50 })
          .toBuffer(); // re-encoding drops the embedded ICC profile (~3 KB)
        const base64 = tiny.toString("base64");
        result[id] = `data:image/jpeg;base64,${base64}`;
        fetched++;
      }
    }),
  );
  const sorted = Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(OUT, `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(`${Object.keys(sorted).length} placeholders (${fetched} fetched) → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
