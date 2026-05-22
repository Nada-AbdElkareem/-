import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

function getDbPath(): string {
  if (process.env.DB_PATH) {
    return process.env.DB_PATH;
  }
  return path.resolve("sqlite_db.db");
}

export const sqlite = new Database(getDbPath());
export const db = drizzle(sqlite, { schema });
