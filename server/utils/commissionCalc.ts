/**
 * Pure commission amount calculation (no DB). Used for both storing earned commission
 * and for estimating pending commission on the agent dashboard.
 */
export function computeCommissionAmount(
  totalAmount: number,
  totalQuantity: number,
  agent: {
    commissionType?: string | null;
    commissionValue?: string | null;
    commissionMode?: string | null;
  } | null
): number {
  if (!agent?.commissionType || agent.commissionValue == null) return 0;
  const value = parseFloat(String(agent.commissionValue)) || 0;
  if (agent.commissionType === "per_piece") {
    return value * totalQuantity;
  }
  if (agent.commissionType === "per_order") {
    if (agent.commissionMode === "percentage") {
      return (value / 100) * totalAmount;
    }
    return value;
  }
  return 0;
}
