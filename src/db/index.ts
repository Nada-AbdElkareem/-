import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";

export const sqlite = new Database(path.join(process.cwd(), "sqlite_db.db"));
export const db = drizzle(sqlite, { schema });
