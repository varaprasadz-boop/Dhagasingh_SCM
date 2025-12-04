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
  const result = await sql(`SELECT ${column}::text as val FROM ${table} WHERE ${idColumn} = '${id}' LIMIT 1`);
  const val = result[0]?.val;
  return val === 't' || val === 'true' || val === 'TRUE' || val === '1';
}
