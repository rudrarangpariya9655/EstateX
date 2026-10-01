import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { dataDir } from "./data/local-db";
import { DataError } from "./data/store";
import { isSupabaseEnabled } from "./env";
import { createSupabaseServerClient } from "./supabase/server";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export const UPLOAD_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
} as const;

export type UploadMime = keyof typeof UPLOAD_TYPES;

/** Local upload filenames are always `<uuid>.<ext>` — anything else is rejected before touching the disk. */
export const LOCAL_UPLOAD_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|avif)$/;

/**
 * Identify an image by its magic bytes. The browser-supplied MIME type and
 * filename are never trusted; SVG (which can carry script) is not accepted.
 */
export function sniffImageType(bytes: Uint8Array): UploadMime | null {
  const at = (i: number) => bytes[i] ?? -1;
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return "image/jpeg";
  if (at(0) === 0x89 && ascii(1, 4) === "PNG" && at(4) === 0x0d && at(5) === 0x0a) return "image/png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) return "image/avif";
  return null;
}

export function uploadsDir(): string {
  return path.join(dataDir(), "uploads");
}

function cloudinaryConfig() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) return null;
  return { cloud, key, secret, folder: process.env.CLOUDINARY_UPLOAD_FOLDER || "estatex" };
}

export function uploadTarget(): "cloudinary" | "supabase" | "local" {
  if (cloudinaryConfig()) return "cloudinary";
  if (isSupabaseEnabled) return "supabase";
  return "local";
}

async function toCloudinary(bytes: Uint8Array, mime: UploadMime): Promise<string> {
  const config = cloudinaryConfig()!;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  // Signed upload: parameters sorted alphabetically, then the API secret appended.
  const signature = createHash("sha1").update(`folder=${config.folder}&timestamp=${timestamp}${config.secret}`).digest("hex");
  const form = new FormData();
  form.set("file", new Blob([new Uint8Array(bytes)], { type: mime }));
  form.set("api_key", config.key);
  form.set("timestamp", timestamp);
  form.set("folder", config.folder);
  form.set("signature", signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloud)}/image/upload`, {
    method: "POST",
    body: form,
  });
  const body = (await res.json().catch(() => null)) as { secure_url?: string; error?: { message?: string } } | null;
  if (!res.ok || !body?.secure_url) {
    console.error("[uploads] cloudinary failed", res.status, body?.error?.message);
    throw new DataError("The image service rejected the upload.", "unavailable");
  }
  return body.secure_url;
}

async function toSupabase(bytes: Uint8Array, mime: UploadMime): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const objectPath = `properties/${randomUUID()}.${UPLOAD_TYPES[mime]}`;
  // Runs as the signed-in admin; storage RLS only lets admins write to this bucket.
  const { error } = await supabase.storage.from("property-images").upload(objectPath, bytes, {
    contentType: mime,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    console.error("[uploads] supabase storage failed", error.message);
    throw new DataError("The image could not be stored.", "unavailable");
  }
  return supabase.storage.from("property-images").getPublicUrl(objectPath).data.publicUrl;
}

async function toLocal(bytes: Uint8Array, mime: UploadMime): Promise<string> {
  const name = `${randomUUID()}.${UPLOAD_TYPES[mime]}`;
  await fs.mkdir(uploadsDir(), { recursive: true });
  await fs.writeFile(path.join(uploadsDir(), name), bytes);
  return `/api/uploads/${name}`;
}

/** Validate and store an uploaded image, returning its public URL. */
export async function storeImage(file: File): Promise<string> {
  if (file.size === 0) throw new DataError("The file is empty.", "invalid");
  if (file.size > MAX_UPLOAD_BYTES) throw new DataError("Images must be 8 MB or smaller.", "invalid");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffImageType(bytes);
  if (!mime) throw new DataError("Upload a JPEG, PNG, WebP or AVIF image.", "invalid");

  switch (uploadTarget()) {
    case "cloudinary":
      return toCloudinary(bytes, mime);
    case "supabase":
      return toSupabase(bytes, mime);
    default:
      return toLocal(bytes, mime);
  }
}
