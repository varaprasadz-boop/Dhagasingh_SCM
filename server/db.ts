import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema, logger: false });

export async function rawQuery<T = any>(query: string): Promise<T[]> {
  return sql(query) as Promise<T[]>;
}

export async function getBooleanValue(table: string, column: string, idColumn: string, id: string): Promise<boolean> {
  // Validate id is a valid UUID format to prevent SQL injection
  // Table and column names are hardcoded in the code, so they're safe
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new Error(`Invalid ID format: ${id}`);
  }
  
  // Escape single quotes in id (though UUIDs shouldn't have them)
  const escapedId = id.replace(/'/g, "''");
  const result = await sql(`SELECT ${column}::text as val FROM ${table} WHERE ${idColumn} = '${escapedId}' LIMIT 1`);
  const val = result[0]?.val;
  return val === 't' || val === 'true' || val === 'TRUE' || val === '1';
}
