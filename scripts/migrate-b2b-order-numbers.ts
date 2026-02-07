/**
 * Migrate B2B order numbers from old format (e.g. B2B-MLAW9T17) to new format (B2B-yyyy-0001).
 * Run once: npx tsx scripts/migrate-b2b-order-numbers.ts
 * Requires DATABASE_URL.
 */

import { db } from "../server/db";
import { b2bOrders } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const NEW_FORMAT_REGEX = /^B2B-\d{4}-\d{4}$/;

function isNewFormat(orderNumber: string): boolean {
  return NEW_FORMAT_REGEX.test(orderNumber);
}

function getYear(createdAt: Date | string): number {
  return new Date(createdAt).getFullYear();
}

async function main() {
  const all = await db
    .select({ id: b2bOrders.id, orderNumber: b2bOrders.orderNumber, createdAt: b2bOrders.createdAt })
    .from(b2bOrders)
    .orderBy(b2bOrders.createdAt);

  const oldFormat = all.filter((r) => !isNewFormat(r.orderNumber));
  const newFormatByYear = new Map<number, number>(); // year -> max seq

  for (const r of all) {
    if (!isNewFormat(r.orderNumber)) continue;
    const match = r.orderNumber.match(/^B2B-(\d{4})-(\d+)$/);
    if (match) {
      const year = parseInt(match[1], 10);
      const seq = parseInt(match[2], 10);
      const current = newFormatByYear.get(year) ?? 0;
      newFormatByYear.set(year, Math.max(current, seq));
    }
  }

  // Assign new numbers to old-format orders: group by year(created_at), sort by created_at, assign seq
  const ordersByYear = new Map<number, typeof oldFormat>();
  for (const r of oldFormat) {
    const year = getYear(r.createdAt);
    if (!ordersByYear.has(year)) ordersByYear.set(year, []);
    ordersByYear.get(year)!.push(r);
  }

  const updates: { id: string; newNumber: string }[] = [];
  for (const [year, orders] of ordersByYear.entries()) {
    orders.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    let nextSeq = (newFormatByYear.get(year) ?? 0) + 1;
    for (const o of orders) {
      updates.push({
        id: o.id,
        newNumber: `B2B-${year}-${String(nextSeq).padStart(4, "0")}`,
      });
      nextSeq += 1;
    }
  }

  if (updates.length === 0) {
    console.log("No B2B orders with old format found. Nothing to migrate.");
    process.exit(0);
    return;
  }

  console.log(`Migrating ${updates.length} order(s) to B2B-yyyy-NNNN format:`);
  for (const u of updates) {
    const row = all.find((r) => r.id === u.id);
    console.log(`  ${row?.orderNumber} -> ${u.newNumber} (id: ${u.id})`);
  }

  // Avoid unique constraint: first set to temp, then to final
  const tempPrefix = "B2B-MIG-";
  for (const u of updates) {
    await db
      .update(b2bOrders)
      .set({ orderNumber: tempPrefix + u.id, updatedAt: new Date() })
      .where(eq(b2bOrders.id, u.id));
  }
  for (const u of updates) {
    await db
      .update(b2bOrders)
      .set({ orderNumber: u.newNumber, updatedAt: new Date() })
      .where(eq(b2bOrders.id, u.id));
  }

  console.log("Migration completed successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
