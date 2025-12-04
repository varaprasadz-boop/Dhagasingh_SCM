const DELHIVERY_API_BASE = process.env.DELHIVERY_MODE === "live" 
  ? "https://track.delhivery.com" 
  : "https://staging-express.delhivery.com";

const DELHIVERY_TRACK_API = "https://track.delhivery.com";

interface DelhiveryShipment {
  waybill?: string;
  name: string;
  add: string;
  pin: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  order: string;
  payment_mode: "Prepaid" | "COD";
  return_pin?: string;
  return_city?: string;
  return_phone?: string;
  return_add?: string;
  return_state?: string;
  products_desc: string;
  hsn_code?: string;
  cod_amount?: number;
  order_date?: string;
  total_amount: number;
  seller_add?: string;
  seller_name?: string;
  seller_inv?: string;
  quantity?: number;
  shipment_width?: number;
  shipment_height?: number;
  weight: number;
  seller_gst_tin?: string;
  shipping_mode?: "Surface" | "Express";
  address_type?: "home" | "office";
}

interface DelhiveryPickupLocation {
  name: string;
  add: string;
  city: string;
  pin_code: string;
  country: string;
  phone: string;
  state?: string;
}

interface CreateOrderRequest {
  shipments: DelhiveryShipment[];
  pickup_location: DelhiveryPickupLocation;
}

interface DelhiveryResponse {
  success: boolean;
  packages?: Array<{
    waybill: string;
    status: string;
    remarks?: string;
  }>;
  error?: string;
  message?: string;
}

interface TrackingResponse {
  ShipmentData?: Array<{
    Shipment: {
      AWB: string;
      Status: {
        Status: string;
        StatusDateTime: string;
        StatusLocation: string;
        Instructions?: string;
      };
      Scans?: Array<{
        ScanDetail: {
          ScanDateTime: string;
          ScanType: string;
          Scan: string;
          StatusDateTime: string;
          ScannedLocation: string;
          Instructions?: string;
        };
      }>;
      DeliveredDate?: string;
      ExpectedDeliveryDate?: string;
      DestRecieveDate?: string;
    };
  }>;
  Error?: string;
}

interface PincodeResponse {
  delivery_codes?: Array<{
    postal_code: {
      pin: string;
      city: string;
      state: string;
      pre_paid: string;
      cod: string;
      pickup: string;
      repl: string;
      country_code: string;
    };
  }>;
  error?: string;
}

class DelhiveryService {
  private token: string;
  private baseUrl: string;
  private trackUrl: string;

  constructor() {
    this.token = process.env.DELHIVERY_API_TOKEN || "";
    this.baseUrl = DELHIVERY_API_BASE;
    this.trackUrl = DELHIVERY_TRACK_API;
  }

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "Authorization": `Token ${this.token}`,
    };
  }

  isConfigured(): boolean {
    return !!this.token;
  }

  async checkPincodeServiceability(pincode: string): Promise<{
    serviceable: boolean;
    cod: boolean;
    prepaid: boolean;
    pickup: boolean;
    city?: string;
    state?: string;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return { serviceable: false, cod: false, prepaid: false, pickup: false, error: "Delhivery API not configured" };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/c/api/pin-codes/json/?filter_codes=${pincode}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data: PincodeResponse = await response.json();

      if (data.error) {
        return { serviceable: false, cod: false, prepaid: false, pickup: false, error: data.error };
      }

      if (!data.delivery_codes || data.delivery_codes.length === 0) {
        return { serviceable: false, cod: false, prepaid: false, pickup: false, error: "Pincode not serviceable" };
      }

      const postal = data.delivery_codes[0].postal_code;
      return {
        serviceable: true,
        cod: postal.cod === "Y",
        prepaid: postal.pre_paid === "Y",
        pickup: postal.pickup === "Y",
        city: postal.city,
        state: postal.state,
      };
    } catch (error) {
      console.error("Delhivery pincode check error:", error);
      return { 
        serviceable: false, 
        cod: false, 
        prepaid: false, 
        pickup: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }

  async generateWaybills(count: number = 1): Promise<{
    success: boolean;
    waybills?: string[];
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return { success: false, error: "Delhivery API not configured" };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/waybill/api/bulk/json/?count=${count}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        return { success: false, error: data.error };
      }

      return {
        success: true,
        waybills: Array.isArray(data) ? data : [data.waybill || data],
      };
    } catch (error) {
      console.error("Delhivery waybill generation error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }

  async createShipment(request: CreateOrderRequest): Promise<{
    success: boolean;
    waybill?: string;
    error?: string;
    response?: DelhiveryResponse;
  }> {
    if (!this.isConfigured()) {
      return { success: false, error: "Delhivery API not configured" };
    }

    try {
      const payload = new URLSearchParams();
      payload.append("format", "json");
      payload.append("data", JSON.stringify(request));

      const response = await fetch(
        `${this.baseUrl}/api/cmu/create.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Token ${this.token}`,
          },
          body: payload.toString(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data: DelhiveryResponse = await response.json();

      if (!data.success) {
        return { 
          success: false, 
          error: data.error || data.message || "Shipment creation failed",
          response: data,
        };
      }

      const waybill = data.packages?.[0]?.waybill;
      return {
        success: true,
        waybill,
        response: data,
      };
    } catch (error) {
      console.error("Delhivery shipment creation error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }

  async trackShipment(awbNumber: string): Promise<{
    success: boolean;
    status?: string;
    statusDateTime?: string;
    location?: string;
    expectedDelivery?: string;
    deliveredDate?: string;
    scans?: Array<{
      dateTime: string;
      type: string;
      description: string;
      location: string;
    }>;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return { success: false, error: "Delhivery API not configured" };
    }

    try {
      const response = await fetch(
        `${this.trackUrl}/api/v1/packages/json/?waybill=${awbNumber}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data: TrackingResponse = await response.json();

      if (data.Error) {
        return { success: false, error: data.Error };
      }

      if (!data.ShipmentData || data.ShipmentData.length === 0) {
        return { success: false, error: "Shipment not found" };
      }

      const shipment = data.ShipmentData[0].Shipment;
      const scans = shipment.Scans?.map((scan) => ({
        dateTime: scan.ScanDetail.ScanDateTime,
        type: scan.ScanDetail.ScanType,
        description: scan.ScanDetail.Scan,
        location: scan.ScanDetail.ScannedLocation,
      }));

      return {
        success: true,
        status: shipment.Status.Status,
        statusDateTime: shipment.Status.StatusDateTime,
        location: shipment.Status.StatusLocation,
        expectedDelivery: shipment.ExpectedDeliveryDate,
        deliveredDate: shipment.DeliveredDate,
        scans,
      };
    } catch (error) {
      console.error("Delhivery tracking error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }

  async cancelShipment(awbNumber: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return { success: false, error: "Delhivery API not configured" };
    }

    try {
      const payload = new URLSearchParams();
      payload.append("waybill", awbNumber);
      payload.append("cancellation", "true");

      const response = await fetch(
        `${this.baseUrl}/api/p/edit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Token ${this.token}`,
          },
          body: payload.toString(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: data.status === "Success" || data.success === true,
        error: data.error || data.message,
      };
    } catch (error) {
      console.error("Delhivery cancellation error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }
}

export const delhiveryService = new DelhiveryService();

export function createDelhiveryShipmentFromOrder(
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string | null;
    shippingAddress: string;
    shippingCity?: string | null;
    shippingState?: string | null;
    shippingPincode?: string | null;
    paymentMethod: string;
    totalAmount: string;
    items?: Array<{ productName: string; quantity: number }>;
  },
  pickupLocation: DelhiveryPickupLocation,
  waybill?: string
): CreateOrderRequest {
  const productsDesc = order.items 
    ? order.items.map(i => `${i.productName} x${i.quantity}`).join(", ")
    : "Merchandise";

  const totalQty = order.items 
    ? order.items.reduce((sum, i) => sum + i.quantity, 0)
    : 1;

  return {
    shipments: [{
      waybill,
      name: order.customerName,
      add: order.shippingAddress,
      pin: order.shippingPincode || "",
      city: order.shippingCity || "",
      state: order.shippingState || "",
      country: "India",
      phone: order.customerPhone,
      order: order.orderNumber,
      payment_mode: order.paymentMethod?.toLowerCase() === "cod" ? "COD" : "Prepaid",
      products_desc: productsDesc,
      cod_amount: order.paymentMethod?.toLowerCase() === "cod" ? parseFloat(order.totalAmount) : 0,
      total_amount: parseFloat(order.totalAmount),
      quantity: totalQty,
      weight: 0.5,
      shipping_mode: "Surface",
      address_type: "home",
    }],
    pickup_location: pickupLocation,
  };
}
