import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";

// DB_PATH is set by Electron's main.cjs (points to userData dir in production)
// Fallback to project root for standalone web server (dev mode)
const dbPath = process.env.DB_PATH || path.join(process.cwd(), "sqlite_db.db");
export const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
