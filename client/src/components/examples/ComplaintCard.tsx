import { ComplaintCard } from "../ComplaintCard";
import { mockComplaints } from "@/lib/mockData";

export default function ComplaintCardExample() {
  return (
    <div className="space-y-4">
      {mockComplaints.map((complaint) => (
        <ComplaintCard
          key={complaint.id}
          complaint={complaint}
          onResolve={(c, res) => console.log("Resolve:", c.ticketNumber, res)}
        />
      ))}
    </div>
  );
}
