import { storage } from "../storage";
import type { UserWithRole } from "@shared/schema";
import { computeCommissionAmount } from "../utils/commissionCalc";

/**
 * Calculate and store commission, product cost, and earning for a B2B order
 * when both paymentStatus === "fully_paid" and status is "delivered" or "closed".
 * Idempotent: skips if commissionStatus is already "earned".
 */
export async function calculateAndStoreCommission(orderId: string): Promise<void> {
  const order = await storage.getB2BOrderById(orderId);
  if (!order) return;

  if (order.paymentStatus !== "fully_paid") return;
  if (order.status !== "delivered" && order.status !== "closed") return;
  if (order.commissionStatus === "earned") return;

  const totalAmount = parseFloat(String(order.totalAmount ?? 0)) || 0;
  const items = order.items ?? [];
  let productCost = 0;
  let totalQuantity = 0;

  for (const item of items) {
    const qty = item.quantity ?? 0;
    totalQuantity += qty;
    const variantId = item.productVariantId;
    if (variantId) {
      const variant = await storage.getProductVariantById(variantId);
      const cost = variant ? parseFloat(String(variant.costPrice ?? 0)) || 0 : 0;
      productCost += cost * qty;
    }
  }

  const createdBy = order.createdBy;
  const agent = createdBy
    ? (await storage.getUserById(createdBy)) as UserWithRole & {
        commissionType?: string | null;
        commissionValue?: string | null;
        commissionMode?: string | null;
      }
    : null;
  const salesAgentCommission = computeCommissionAmount(totalAmount, totalQuantity, agent);
  const earning = totalAmount - productCost - salesAgentCommission;

  await storage.updateB2BOrder(orderId, {
    salesAgentCommission: salesAgentCommission.toFixed(2),
    productCost: productCost.toFixed(2),
    earning: earning.toFixed(2),
    commissionStatus: "earned",
  });
}
