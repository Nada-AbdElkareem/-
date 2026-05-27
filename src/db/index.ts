import { drizzle } from "drizzle-orm/node-sqlite";
import { DatabaseSync } from "node:sqlite";
import * as schema from "./schema";
import path from "path";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

// DB_PATH is set by Tauri's main.rs at runtime
// Fallback to project root for dev mode
const dbPath = process.env.DB_PATH || path.join(process.cwd(), "sqlite_db.db");

// Ensure the directory exists
const dir = dirname(dbPath);
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

export const sqlite = new DatabaseSync(dbPath);
export const db = drizzle(sqlite, { schema });
