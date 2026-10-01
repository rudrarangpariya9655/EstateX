import { promises as fs } from "node:fs";
import path from "node:path";
import { LOCAL_UPLOAD_NAME, UPLOAD_TYPES, uploadsDir } from "@/lib/uploads";

const MIME_BY_EXT = Object.fromEntries(Object.entries(UPLOAD_TYPES).map(([mime, ext]) => [ext, mime]));

/** Serves demo-mode uploads from local disk. Filenames are random UUIDs, validated before any file access. */
export async function GET(_request: Request, ctx: RouteContext<"/api/uploads/[file]">) {
  const { file } = await ctx.params;
  if (!LOCAL_UPLOAD_NAME.test(file)) return new Response("Not found", { status: 404 });
  try {
    const bytes = await fs.readFile(path.join(uploadsDir(), file));
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": MIME_BY_EXT[file.split(".").pop()!] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
