import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, FileText, Calendar, DollarSign, Eye, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import type { B2BInvoice, B2BOrderWithDetails, B2BClient } from "@shared/schema";

const optionalNumber = z.preprocess(
  (val) => (val === "" || val === undefined ? undefined : val),
  z.coerce.number().nonnegative().optional()
);

const invoiceFormSchema = z.object({
  orderId: z.string().min(1, "Order is required"),
  clientId: z.string().min(1, "Client is required"),
  invoiceType: z.enum(["proforma", "tax"]),
  subtotal: z.coerce.number().positive("Subtotal must be greater than 0"),
  taxAmount: optionalNumber,
  discountAmount: optionalNumber,
  totalAmount: z.coerce.number().positive("Total must be greater than 0"),
  dueDate: z.string().optional(),
  notes: z.string().optional().or(z.literal("")),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

const statusLabels: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-600",
};

const ITEMS_PER_PAGE = 10;

export default function B2BInvoices() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const { toast } = useToast();

  const { data: invoices, isLoading } = useQuery<B2BInvoice[]>({
    queryKey: ["/api/b2b/invoices"],
  });

  const { data: orders } = useQuery<B2BOrderWithDetails[]>({
    queryKey: ["/api/b2b/orders"],
  });

  const { data: clients } = useQuery<B2BClient[]>({
    queryKey: ["/api/b2b/clients"],
  });

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      orderId: "",
      clientId: "",
      invoiceType: "proforma",
      subtotal: 0,
      taxAmount: undefined,
      discountAmount: undefined,
      totalAmount: 0,
      dueDate: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InvoiceFormData) =>
      apiRequest("POST", "/api/b2b/invoices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/b2b/invoices"] });
      toast({ title: "Invoice created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      const message = error?.message || "";
      let description = "Please check the form and try again";
      if (message.includes("403")) {
        description = "You can only create invoices for your own orders";
      } else if (message.includes("400")) {
        description = "The selected client doesn't match the order";
      }
      toast({ 
        title: "Could not create invoice", 
        description,
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (data: InvoiceFormData) => {
    createMutation.mutate(data);
  };

  const handleOrderSelect = (orderId: string) => {
    const order = orders?.find((o) => o.id === orderId);
    if (order) {
      form.setValue("orderId", orderId);
      form.setValue("clientId", order.clientId);
      form.setValue("subtotal", order.totalAmount);
      form.setValue("totalAmount", order.totalAmount);
    }
  };

  const filteredInvoices = invoices?.filter(
    (invoice) =>
      invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">B2B Invoices</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">B2B Invoices</h1>
          <p className="text-muted-foreground">Proforma and tax invoices for corporate orders</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-invoice">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Invoice</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="orderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order *</FormLabel>
                      <Select onValueChange={handleOrderSelect} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-order">
                            <SelectValue placeholder="Select an order" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {orders?.map((order) => (
                            <SelectItem key={order.id} value={order.id}>
                              {order.orderNumber} - {order.client?.companyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="invoiceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-invoice-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="proforma">Proforma Invoice</SelectItem>
                          <SelectItem value="tax">Tax Invoice</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subtotal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtotal *</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0" data-testid="input-subtotal" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="taxAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Amount</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0" data-testid="input-tax" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="discountAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0" data-testid="input-discount" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Amount *</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="0" data-testid="input-total" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-due-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-invoice">
                    {createMutation.isPending ? "Creating..." : "Create Invoice"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search invoices..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          data-testid="input-search"
        />
      </div>

      {filteredInvoices && filteredInvoices.length > 0 ? (
        <div className="space-y-4">
          {filteredInvoices.slice(0, displayCount).map((invoice) => {
            const order = orders?.find((o) => o.id === invoice.orderId);
            const client = clients?.find((c) => c.id === invoice.clientId);
            return (
              <Card key={invoice.id} className="hover-elevate" data-testid={`invoice-card-${invoice.id}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="font-bold text-lg" data-testid={`invoice-number-${invoice.id}`}>
                          {invoice.invoiceNumber}
                        </span>
                        <Badge className={statusColors[invoice.status] || ""}>
                          {statusLabels[invoice.status] || invoice.status}
                        </Badge>
                        <Badge variant="outline">
                          {invoice.invoiceType === "proforma" ? "Proforma" : "Tax Invoice"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                        <span>{client?.companyName || "Unknown Client"}</span>
                        <span>Order: {order?.orderNumber || "Unknown"}</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(invoice.invoiceDate), "MMM d, yyyy")}</span>
                        </div>
                        {invoice.dueDate && (
                          <span>Due: {format(new Date(invoice.dueDate), "MMM d, yyyy")}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Amount</p>
                        <p className="font-bold text-lg" data-testid={`invoice-amount-${invoice.id}`}>
                          {formatCurrency(invoice.totalAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {filteredInvoices.length > displayCount && (
            <div className="flex justify-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => setDisplayCount(prev => prev + ITEMS_PER_PAGE)}
                data-testid="button-load-more"
              >
                <ChevronDown className="h-4 w-4 mr-2" />
                Show More ({filteredInvoices.length - displayCount} remaining)
              </Button>
            </div>
          )}
          
          {filteredInvoices.length > ITEMS_PER_PAGE && displayCount > ITEMS_PER_PAGE && (
            <p className="text-center text-sm text-muted-foreground">
              Showing {Math.min(displayCount, filteredInvoices.length)} of {filteredInvoices.length} invoices
            </p>
          )}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-medium mb-1">No invoices found</h3>
            <p className="text-sm">Create your first invoice to get started</p>
          </div>
        </Card>
      )}
    </div>
  );
}
