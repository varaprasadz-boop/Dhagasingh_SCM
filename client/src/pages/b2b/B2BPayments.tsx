import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Search, CreditCard, Calendar, DollarSign, TrendingUp, Clock, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import type { B2BPayment, B2BOrderWithDetails } from "@shared/schema";

const paymentFormSchema = z.object({
  orderId: z.string().min(1, "Order is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  paymentMethod: z.enum(["cash", "bank_transfer", "upi", "cheque", "card"]),
  referenceNumber: z.string().optional().or(z.literal("")),
  paymentDate: z.string().min(1, "Payment date is required"),
  notes: z.string().optional().or(z.literal("")),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

const paymentMethodLabels: Record<string, string> = {
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  upi: "UPI",
  cheque: "Cheque",
  card: "Card",
};

const ITEMS_PER_PAGE = 10;

export default function B2BPayments() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const { toast } = useToast();

  const { data: payments, isLoading } = useQuery<B2BPayment[]>({
    queryKey: ["/api/b2b/payments"],
  });

  const { data: orders } = useQuery<B2BOrderWithDetails[]>({
    queryKey: ["/api/b2b/orders"],
  });

  const { data: dashboardStats } = useQuery<{
    totalRevenue: number;
    amountReceived: number;
    amountPending: number;
  }>({
    queryKey: ["/api/b2b/dashboard"],
  });

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      orderId: "",
      amount: 0,
      paymentMethod: "bank_transfer",
      referenceNumber: "",
      paymentDate: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: PaymentFormData) =>
      apiRequest("POST", "/api/b2b/payments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/b2b/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/b2b/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/b2b/dashboard"] });
      toast({ title: "Payment recorded successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      const message = error?.message || "";
      toast({ 
        title: "Could not record payment", 
        description: message.includes("403") ? "You can only record payments for your own orders" : "Please check the form and try again",
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (data: PaymentFormData) => {
    createMutation.mutate(data);
  };

  const filteredPayments = payments?.filter((payment) => {
    const order = orders?.find((o) => o.id === payment.orderId);
    return (
      order?.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      payment.referenceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      order?.client?.companyName?.toLowerCase().includes(search.toLowerCase())
    );
  });

  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [search]);

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
        <h1 className="text-2xl font-bold">B2B Payments</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">B2B Payments</h1>
          <p className="text-muted-foreground">Track and manage corporate order payments</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-record-payment">
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="orderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-order">
                            <SelectValue placeholder="Select an order" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {orders?.filter((o) => o.paymentStatus !== "fully_paid").map((order) => (
                            <SelectItem key={order.id} value={order.id}>
                              {order.orderNumber} - {order.client?.companyName} ({formatCurrency(order.balancePending)} pending)
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
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (INR) *</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="0" data-testid="input-amount" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-method">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referenceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Transaction/Cheque number" data-testid="input-reference" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Date *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-payment">
                    {createMutation.isPending ? "Saving..." : "Save Payment"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-revenue">
              {formatCurrency(dashboardStats?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all B2B orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-received">
              {formatCurrency(dashboardStats?.amountReceived || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total payments collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600" data-testid="stat-pending">
              {formatCurrency(dashboardStats?.amountPending || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting collection</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search payments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          data-testid="input-search"
        />
      </div>

      {filteredPayments && filteredPayments.length > 0 ? (
        <div className="space-y-4">
          {filteredPayments.slice(0, displayCount).map((payment) => {
            const order = orders?.find((o) => o.id === payment.orderId);
            return (
              <Card key={payment.id} className="hover-elevate" data-testid={`payment-card-${payment.id}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <span className="font-bold text-lg text-green-600" data-testid={`payment-amount-${payment.id}`}>
                          {formatCurrency(payment.amount)}
                        </span>
                        <Badge variant="outline">
                          {paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                        <span>Order: {order?.orderNumber || "Unknown"}</span>
                        <span>{order?.client?.companyName || "Unknown Client"}</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(payment.paymentDate), "MMM d, yyyy")}</span>
                        </div>
                        {payment.referenceNumber && (
                          <span>Ref: {payment.referenceNumber}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {filteredPayments.length > displayCount && (
            <div className="flex justify-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => setDisplayCount(prev => prev + ITEMS_PER_PAGE)}
                data-testid="button-load-more"
              >
                <ChevronDown className="h-4 w-4 mr-2" />
                Show More ({filteredPayments.length - displayCount} remaining)
              </Button>
            </div>
          )}
          
          {filteredPayments.length > ITEMS_PER_PAGE && displayCount > ITEMS_PER_PAGE && (
            <p className="text-center text-sm text-muted-foreground">
              Showing {Math.min(displayCount, filteredPayments.length)} of {filteredPayments.length} payments
            </p>
          )}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-medium mb-1">No payments found</h3>
            <p className="text-sm">Record your first payment to get started</p>
          </div>
        </Card>
      )}
    </div>
  );
}
