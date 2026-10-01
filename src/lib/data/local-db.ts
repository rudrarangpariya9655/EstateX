import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Agent, Inquiry, Property, UserRole, VisitRequest } from "../types";
import { SEED_AGENTS, buildSeedProperties } from "./seed";

/**
 * Demo-mode persistence: a single JSON document on disk.
 *
 * This is a development fallback for running EstateX without Supabase. It is
 * genuinely persistent (writes are atomic and serialised through a queue), but
 * it is a single-process store — configure Supabase for any real deployment.
 */

export interface LocalUser {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  createdAt: string;
}

export interface LocalDb {
  version: 1;
  properties: Property[];
  agents: Agent[];
  users: LocalUser[];
  favorites: { userId: string; propertyId: string; createdAt: string }[];
  visits: Omit<VisitRequest, "property">[];
  recentlyViewed: { userId: string; propertyId: string; viewedAt: string }[];
  inquiries: Inquiry[];
  passwordResets: { tokenHash: string; userId: string; expiresAt: string }[];
}

export function dataDir(): string {
  return process.env.ESTATEX_DATA_DIR ?? path.join(process.cwd(), ".data");
}

function dbFile(): string {
  return path.join(dataDir(), "estatex-db.json");
}

function seedDb(): LocalDb {
  return {
    version: 1,
    properties: buildSeedProperties().map((p) => ({ ...p, agent: null })),
    agents: SEED_AGENTS,
    users: [],
    favorites: [],
    visits: [],
    recentlyViewed: [],
    inquiries: [],
    passwordResets: [],
  };
}

interface Cache {
  db: LocalDb;
  mtimeMs: number;
  file: string;
}

const globalForDb = globalThis as unknown as { __estatexDb?: Cache; __estatexDbQueue?: Promise<unknown> };

async function readFromDisk(): Promise<LocalDb> {
  const file = dbFile();
  let stat;
  try {
    stat = await fs.stat(file);
  } catch {
    // No database yet: serve the seed from memory. It is written on the first mutation.
    const cached = globalForDb.__estatexDb;
    if (cached && cached.file === file && cached.mtimeMs === -1) return cached.db;
    const db = seedDb();
    globalForDb.__estatexDb = { db, mtimeMs: -1, file };
    return db;
  }
  const cached = globalForDb.__estatexDb;
  if (cached && cached.file === file && cached.mtimeMs === stat.mtimeMs) return cached.db;
  const db = JSON.parse(await fs.readFile(file, "utf8")) as LocalDb;
  globalForDb.__estatexDb = { db, mtimeMs: stat.mtimeMs, file };
  return db;
}

async function writeToDisk(db: LocalDb): Promise<void> {
  const file = dbFile();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db), "utf8");
  await fs.rename(tmp, file);
  const stat = await fs.stat(file);
  globalForDb.__estatexDb = { db, mtimeMs: stat.mtimeMs, file };
}

/** Read-only snapshot. Callers must not mutate the returned object. */
export async function readDb(): Promise<LocalDb> {
  return readFromDisk();
}

/**
 * Apply a mutation atomically. Mutations are serialised so concurrent requests
 * cannot interleave read-modify-write cycles.
 */
export async function mutateDb<T>(fn: (db: LocalDb) => T | Promise<T>): Promise<T> {
  const run = async () => {
    const current = await readFromDisk();
    const draft = structuredClone(current);
    const result = await fn(draft);
    await writeToDisk(draft);
    return result;
  };
  const previous = globalForDb.__estatexDbQueue ?? Promise.resolve();
  const next = previous.then(run, run);
  globalForDb.__estatexDbQueue = next.catch(() => undefined);
  return next;
}

/** Test helper: forget the in-memory cache (e.g. after pointing ESTATEX_DATA_DIR elsewhere). */
export function resetDbCache(): void {
  globalForDb.__estatexDb = undefined;
  globalForDb.__estatexDbQueue = undefined;
}
