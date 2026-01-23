import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = postgres(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema, logger: false });

export async function rawQuery<T = any>(query: string): Promise<T[]> {
  return sql.unsafe(query) as Promise<T[]>;
}

export async function getBooleanValue(table: string, column: string, idColumn: string, id: string): Promise<boolean> {
  const result = await sql.unsafe(`SELECT ${column}::text as val FROM ${table} WHERE ${idColumn} = '${id}' LIMIT 1`) as Array<{ val: string }>;
  const val = result[0]?.val;
  return val === 't' || val === 'true' || val === 'TRUE' || val === '1';
}
