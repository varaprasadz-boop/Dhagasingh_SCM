import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { mockCouriers, type Order, type CourierPartner } from "@/lib/mockData";

interface DispatchModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDispatch?: (data: {
    courierId: string;
    awbNumber?: string;
    driverName?: string;
    driverPhone?: string;
    deliveryCost?: number;
  }) => void;
}

export function DispatchModal({ order, open, onOpenChange, onDispatch }: DispatchModalProps) {
  const [deliveryType, setDeliveryType] = useState<"third_party" | "in_house">("third_party");
  const [selectedCourier, setSelectedCourier] = useState<string>("");
  const [awbNumber, setAwbNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [deliveryCost, setDeliveryCost] = useState("");

  const filteredCouriers = mockCouriers.filter((c) => c.type === deliveryType);

  const handleSubmit = () => {
    if (!selectedCourier) return;

    onDispatch?.({
      courierId: selectedCourier,
      awbNumber: deliveryType === "third_party" ? awbNumber : undefined,
      driverName: deliveryType === "in_house" ? driverName : undefined,
      driverPhone: deliveryType === "in_house" ? driverPhone : undefined,
      deliveryCost: deliveryType === "in_house" ? parseFloat(deliveryCost) || 0 : undefined,
    });

    setSelectedCourier("");
    setAwbNumber("");
    setDriverName("");
    setDriverPhone("");
    setDeliveryCost("");
    onOpenChange(false);
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="modal-dispatch">
        <DialogHeader>
          <DialogTitle>Dispatch Order {order.orderNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Delivery Type</Label>
            <RadioGroup
              value={deliveryType}
              onValueChange={(v) => {
                setDeliveryType(v as "third_party" | "in_house");
                setSelectedCourier("");
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="third_party" id="third_party" data-testid="radio-third-party" />
                <Label htmlFor="third_party" className="font-normal">Third Party</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="in_house" id="in_house" data-testid="radio-in-house" />
                <Label htmlFor="in_house" className="font-normal">In-House</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Courier Partner</Label>
            <Select value={selectedCourier} onValueChange={setSelectedCourier}>
              <SelectTrigger data-testid="select-courier">
                <SelectValue placeholder="Select courier" />
              </SelectTrigger>
              <SelectContent>
                {filteredCouriers.map((courier) => (
                  <SelectItem key={courier.id} value={courier.id}>
                    {courier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {deliveryType === "third_party" && (
            <div className="space-y-2">
              <Label>AWB Number</Label>
              <Input
                value={awbNumber}
                onChange={(e) => setAwbNumber(e.target.value)}
                placeholder="Enter tracking number"
                data-testid="input-awb"
              />
            </div>
          )}

          {deliveryType === "in_house" && (
            <>
              <div className="space-y-2">
                <Label>Driver Name</Label>
                <Input
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Enter driver name"
                  data-testid="input-driver-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Driver Phone</Label>
                <Input
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="Enter driver phone"
                  data-testid="input-driver-phone"
                />
              </div>
              <div className="space-y-2">
                <Label>Delivery Cost (₹)</Label>
                <Input
                  type="number"
                  value={deliveryCost}
                  onChange={(e) => setDeliveryCost(e.target.value)}
                  placeholder="0"
                  data-testid="input-delivery-cost"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-dispatch">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedCourier} data-testid="button-confirm-dispatch">
            Dispatch Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
