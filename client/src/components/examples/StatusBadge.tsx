import { StatusBadge } from "../StatusBadge";

export default function StatusBadgeExample() {
  return (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="pending" />
      <StatusBadge status="dispatched" />
      <StatusBadge status="delivered" />
      <StatusBadge status="rto" />
      <StatusBadge status="open" />
      <StatusBadge status="resolved" />
    </div>
  );
}
