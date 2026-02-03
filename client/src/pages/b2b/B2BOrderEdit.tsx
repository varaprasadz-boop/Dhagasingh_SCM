import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import type { B2BOrderWithDetails, B2BPrintingType } from "@shared/schema";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry",
];

const editOrderSchema = z.object({
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  deliveryCity: z.string().optional(),
  deliveryState: z.string().optional(),
  deliveryZip: z.string().optional(),
  requiredDeliveryDate: z.string().optional(),
  priority: z.enum(["normal", "urgent"]),
  specialInstructions: z.string().optional(),
  totalAmount: z.coerce.number().min(0),
  advanceAmount: z.coerce.number().min(0),
  artworkStatus: z.enum(["pending", "received", "approved", "revision_needed"]),
  printingTypeId: z.string().optional(),
}).refine((d) => d.advanceAmount <= d.totalAmount, {
  message: "Advance cannot exceed total",
  path: ["advanceAmount"],
});

type EditOrderForm = z.infer<typeof editOrderSchema>;

export default function B2BOrderEdit() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: order, isLoading } = useQuery<B2BOrderWithDetails>({
    queryKey: ["/api/b2b/orders", params.id],
    enabled: !!params.id,
  });

  const { data: printingTypes = [] } = useQuery<B2BPrintingType[]>({
    queryKey: ["/api/b2b/printing-types"],
  });

  const form = useForm<EditOrderForm>({
    resolver: zodResolver(editOrderSchema),
    values: order
      ? {
          deliveryAddress: order.deliveryAddress ?? "",
          deliveryCity: order.deliveryCity ?? "",
          deliveryState: order.deliveryState ?? "",
          deliveryZip: order.deliveryZip ?? "",
          requiredDeliveryDate: order.requiredDeliveryDate
            ? format(new Date(order.requiredDeliveryDate), "yyyy-MM-dd")
            : "",
          priority: order.priority ?? "normal",
          specialInstructions: order.specialInstructions ?? "",
          totalAmount: parseFloat(order.totalAmount ?? "0"),
          advanceAmount: parseFloat(order.advanceAmount ?? "0"),
          artworkStatus: order.artworkStatus ?? "pending",
          printingTypeId: order.printingTypeId ?? "",
        }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: EditOrderForm) => {
      const payload: Record<string, unknown> = {
        deliveryAddress: data.deliveryAddress,
        deliveryCity: data.deliveryCity || null,
        deliveryState: data.deliveryState || null,
        deliveryZip: data.deliveryZip || null,
        requiredDeliveryDate: data.requiredDeliveryDate ? new Date(data.requiredDeliveryDate).toISOString() : null,
        priority: data.priority,
        specialInstructions: data.specialInstructions || null,
        totalAmount: String(data.totalAmount),
        advanceAmount: String(data.advanceAmount),
        artworkStatus: data.artworkStatus,
        printingTypeId: data.printingTypeId || null,
      };
      await apiRequest("PATCH", `/api/b2b/orders/${params.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/b2b/orders", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/b2b/orders"] });
      toast({ title: "Order updated successfully" });
      navigate(`/b2b/orders/${params.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading || !order) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/b2b/orders/${params.id}`}>
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Edit B2B Order</h1>
              <p className="text-sm text-muted-foreground">{order.orderNumber}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order details (read-only)
                </CardTitle>
                <CardDescription>Client and line items cannot be changed here.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Client:</span> {order.client?.companyName ?? "—"}</p>
                <p><span className="text-muted-foreground">Items:</span> {order.items?.length ?? 0} line(s)</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery &amp; amounts</CardTitle>
                <CardDescription>Update address, dates, and financial fields.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="deliveryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery address *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Full address" className="min-h-[80px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="deliveryCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deliveryState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <Select
                          value={INDIAN_STATES.includes(field.value) ? field.value : field.value ? "Other" : ""}
                          onValueChange={(v) => field.onChange(v === "Other" ? "" : v)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INDIAN_STATES.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        {field.value && !INDIAN_STATES.includes(field.value) && (
                          <Input
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            placeholder="State name"
                            className="mt-2"
                          />
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deliveryZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PIN code</FormLabel>
                        <FormControl>
                          <Input placeholder="PIN" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="requiredDeliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required delivery date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="artworkStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Artwork status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="received">Received</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="revision_needed">Revision needed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="printingTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Printing type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {printingTypes.filter((pt) => pt.isActive).map((pt) => (
                            <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="specialInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special instructions</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Optional notes" className="min-h-[60px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total amount (INR)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="advanceAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Advance amount (INR)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-order">
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save changes
              </Button>
              <Link href={`/b2b/orders/${params.id}`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
