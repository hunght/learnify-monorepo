import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync, type SQLiteDatabase } from "expo-sqlite";
import * as schema from "./schema";

export const DATABASE_NAME = "learnify.db";

let expoDb: SQLiteDatabase | null = null;

function createDb() {
  return drizzle(getExpoDb(), { schema });
}

type DrizzleDb = ReturnType<typeof createDb>;
let drizzleDb: DrizzleDb | null = null;

export function getExpoDb(): SQLiteDatabase {
  if (!expoDb) {
    // Delay opening until runtime init to avoid Android startup races in native DB handles.
    expoDb = openDatabaseSync(DATABASE_NAME);
  }

  return expoDb;
}

export function getDb(): DrizzleDb {
  if (!drizzleDb) {
    drizzleDb = createDb();
  }

  return drizzleDb;
}

// Export schema for convenience
export * from "./schema";
