import "server-only";
import { createHash, createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { dataDir } from "../data/local-db";

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number, options: object) => Promise<Buffer>;

const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEY_LENGTH = 64;

/** Hash a password with scrypt and a random salt. Format: scrypt$N$r$p$salt$hash (base64url). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, SCRYPT);
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64url"), hash.toString("base64url")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64url");
  const actual = await scrypt(password.normalize("NFKC"), Buffer.from(saltB64, "base64url"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: SCRYPT.maxmem,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** A short fingerprint of the password hash; changing the password invalidates existing sessions. */
export function passwordVersion(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("base64url").slice(0, 12);
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

let cachedSecret: string | null = null;

/**
 * Secret for signing demo-mode session cookies. Uses ESTATEX_AUTH_SECRET when set;
 * in development a random secret is generated once and stored in `.data/`.
 */
export async function sessionSecret(): Promise<string> {
  if (cachedSecret) return cachedSecret;
  const fromEnv = process.env.ESTATEX_AUTH_SECRET;
  if (fromEnv && fromEnv.length >= 32) return (cachedSecret = fromEnv);
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ESTATEX_AUTH_SECRET (32+ characters) is required to run demo-mode authentication in production. See .env.example.",
    );
  }
  const file = path.join(dataDir(), "auth-secret");
  try {
    cachedSecret = (await fs.readFile(file, "utf8")).trim();
    if (cachedSecret.length >= 32) return cachedSecret;
  } catch {
    // generate below
  }
  cachedSecret = randomBytes(32).toString("hex");
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, cachedSecret, { mode: 0o600 });
  return cachedSecret;
}

export interface SessionPayload {
  sub: string;
  pwv: string;
  exp: number;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", await sessionSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = createHmac("sha256", await sessionSecret()).update(body).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (typeof payload.sub !== "string" || typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
