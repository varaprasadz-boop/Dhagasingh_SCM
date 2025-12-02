import { useState } from "react";
import { ReceiveStockModal } from "../ReceiveStockModal";
import { Button } from "@/components/ui/button";

export default function ReceiveStockModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Receive Stock</Button>
      <ReceiveStockModal
        open={open}
        onOpenChange={setOpen}
        onReceive={(data) => console.log("Receive data:", data)}
      />
    </>
  );
}
