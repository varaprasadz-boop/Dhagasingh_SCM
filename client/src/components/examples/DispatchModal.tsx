import { useState } from "react";
import { DispatchModal } from "../DispatchModal";
import { Button } from "@/components/ui/button";
import { mockOrders } from "@/lib/mockData";

export default function DispatchModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Dispatch Modal</Button>
      <DispatchModal
        order={mockOrders[0]}
        open={open}
        onOpenChange={setOpen}
        onDispatch={(data) => console.log("Dispatch data:", data)}
      />
    </>
  );
}
