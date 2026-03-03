import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { SearchInput } from "@/components/SearchInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Filter, Eye, User, MessageSquare, CheckCircle, XCircle, AlertCircle, Loader2, Package, RefreshCw, CreditCard } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Complaint, ComplaintTimeline, OrderWithItems } from "@shared/schema";

type ComplaintStatus = "open" | "in_progress" | "resolved" | "rejected" | "all";
type ComplaintCategory = "general" | "refund" | "replacement" | "all";

type ComplaintWithTimeline = Complaint & {
  timeline: ComplaintTimeline[];
  order?: OrderWithItems | null;
};

const reasonLabels: Record<string, string> = {
  wrong_item: "Wrong Item",
  damaged: "Damaged Product",
  delayed: "Delayed",
  not_received: "Not Received",
  quality: "Quality",
  size_exchange: "Size Exchange",
  other: "Other",
};

const categoryLabels: Record<string, string> = {
  general: "General",
  refund: "Refund",
  replacement: "Replacement",
};

export default function Complaints() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<ComplaintCategory>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintWithTimeline | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [newComment, setNewComment] = useState("");
  const [receiveReturnOpen, setReceiveReturnOpen] = useState(false);
  const [receiveReturnCondition, setReceiveReturnCondition] = useState<"good" | "damaged">("good");
  const [receiveReturnNotes, setReceiveReturnNotes] = useState("");
  const [processRefundOpen, setProcessRefundOpen] = useState(false);
  const [refundForm, setRefundForm] = useState({ refundAmount: "", refundMode: "bank_transfer", refundReference: "", refundDate: new Date().toISOString().split("T")[0] });

  const [newTicket, setNewTicket] = useState({
    category: "general" as "general" | "refund" | "replacement",
    orderId: "",
    reason: "",
    customReason: "",
    description: "",
  });

  const { data: complaints = [], isLoading: complaintsLoading } = useQuery<ComplaintWithTimeline[]>({
    queryKey: ["/api/complaints"],
  });

  const { data: orders = [] } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
  });

  const createComplaintMutation = useMutation({
    mutationFn: (data: { orderId: string; reason: string; description: string; category: string }) =>
      apiRequest("POST", "/api/complaints", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      toast({ title: "Ticket created successfully" });
      setCreateDialogOpen(false);
      setNewTicket({ category: "general", orderId: "", reason: "", customReason: "", description: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create ticket", description: error.message, variant: "destructive" });
    },
  });

  const addTimelineMutation = useMutation({
    mutationFn: (data: { complaintId: string; action: string; comment: string }) =>
      apiRequest("POST", `/api/complaints/${data.complaintId}/timeline`, { action: data.action, comment: data.comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      toast({ title: "Comment added" });
      setNewComment("");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add comment", description: error.message, variant: "destructive" });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (data: { complaintId: string; resolutionType: string; resolutionNotes?: string; status: string; refundAmount?: number }) =>
      apiRequest("POST", `/api/complaints/${data.complaintId}/resolve`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      toast({ title: "Complaint resolved" });
      setRefundDialogOpen(false);
      setRefundAmount("");
      setDetailSheetOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to resolve complaint", description: error.message, variant: "destructive" });
    },
  });

  const receiveReturnMutation = useMutation({
    mutationFn: (data: { complaintId: string; productCondition: "good" | "damaged"; returnNotes?: string }) =>
      apiRequest("POST", `/api/complaints/${data.complaintId}/receive-return`, { productCondition: data.productCondition, returnNotes: data.returnNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Return received and stock updated" });
      setReceiveReturnOpen(false);
      setReceiveReturnNotes("");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to receive return", description: error.message, variant: "destructive" });
    },
  });

  const createReplacementMutation = useMutation({
    mutationFn: (complaintId: string) =>
      apiRequest("POST", `/api/complaints/${complaintId}/create-replacement-order`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Replacement order created" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create replacement order", description: error.message, variant: "destructive" });
    },
  });

  const processRefundMutation = useMutation({
    mutationFn: (data: { complaintId: string; refundAmount: number; refundMode?: string; refundReference?: string; refundDate?: string }) =>
      apiRequest("POST", `/api/complaints/${data.complaintId}/process-refund`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Refund processed" });
      setProcessRefundOpen(false);
      setRefundDialogOpen(false);
      setDetailSheetOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to process refund", description: error.message, variant: "destructive" });
    },
  });

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      c.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.order?.orderNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.order?.customerName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || (c as any).category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const columns = [
    { key: "ticketNumber", header: "Ticket #", sortable: true },
    { 
      key: "orderNumber", 
      header: "Order #", 
      sortable: true,
      render: (c: ComplaintWithTimeline) => c.order?.orderNumber || "-",
    },
    { 
      key: "customerName", 
      header: "Customer", 
      sortable: true,
      render: (c: ComplaintWithTimeline) => c.order?.customerName || "-",
    },
    {
      key: "category",
      header: "Category",
      render: (c: ComplaintWithTimeline) => (
        <Badge variant="outline">{categoryLabels[(c as any).category] || "General"}</Badge>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (c: ComplaintWithTimeline) => reasonLabels[c.reason] || c.reason,
    },
    {
      key: "status",
      header: "Status",
      render: (c: ComplaintWithTimeline) => <StatusBadge status={c.status} />,
    },
    {
      key: "createdAt",
      header: "Created",
      render: (c: ComplaintWithTimeline) =>
        c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }) : "-",
    },
    {
      key: "actions",
      header: "",
      render: (c: ComplaintWithTimeline) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedComplaint(c);
            setDetailSheetOpen(true);
          }}
          data-testid={`button-view-complaint-${c.id}`}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      ),
    },
  ];

  const handleResolve = (resolution: "refund" | "replacement" | "rejected") => {
    if (!selectedComplaint) return;

    if (resolution === "refund") {
      setRefundDialogOpen(true);
      return;
    }

    resolveMutation.mutate({
      complaintId: selectedComplaint.id,
      resolutionType: resolution,
      status: resolution === "rejected" ? "rejected" : "resolved",
      resolutionNotes: resolution === "rejected" ? "Complaint rejected" : "Replacement approved",
    });
  };

  const handleRefundSubmit = () => {
    if (!selectedComplaint || !refundAmount) return;

    resolveMutation.mutate({
      complaintId: selectedComplaint.id,
      resolutionType: "refund",
      status: "resolved",
      resolutionNotes: `Refund of ₹${refundAmount} processed`,
      refundAmount: parseFloat(refundAmount),
    });
  };

  const handleAddComment = () => {
    if (!selectedComplaint || !newComment.trim()) return;

    addTimelineMutation.mutate({
      complaintId: selectedComplaint.id,
      action: "Comment Added",
      comment: newComment,
    });
  };

  const handleCreateTicket = () => {
    if (!newTicket.orderId || !newTicket.reason) return;
    if (newTicket.reason === "other" && !newTicket.customReason.trim()) return;

    // For "other" reason, append the custom reason to description
    let description = newTicket.description;
    if (newTicket.reason === "other" && newTicket.customReason.trim()) {
      description = `[Reason: ${newTicket.customReason.trim()}]${description ? '\n' + description : ''}`;
    }

    createComplaintMutation.mutate({
      orderId: newTicket.orderId,
      reason: newTicket.reason,
      description,
      category: newTicket.category,
    });
  };

  const getTimelineIcon = (action: string) => {
    if (action.includes("Created")) return <AlertCircle className="h-4 w-4 text-blue-500" />;
    if (action.includes("Resolved") || action.includes("Refund")) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (action.includes("Rejected")) return <XCircle className="h-4 w-4 text-red-500" />;
    return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
  };

  const statusCounts = {
    all: complaints.length,
    open: complaints.filter((c) => c.status === "open").length,
    in_progress: complaints.filter((c) => c.status === "in_progress").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
    rejected: complaints.filter((c) => c.status === "rejected").length,
  };

  if (complaintsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Complaints</h1>
            <p className="text-muted-foreground">Manage customer complaints and refunds</p>
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Complaints</h1>
          <p className="text-muted-foreground">Manage customer complaints and refunds</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-ticket">
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{statusCounts.all}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Open</p>
            <p className="text-2xl font-bold text-red-600">{statusCounts.open}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold text-orange-600">{statusCounts.in_progress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Resolved</p>
            <p className="text-2xl font-bold text-green-600">{statusCounts.resolved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Rejected</p>
            <p className="text-2xl font-bold text-gray-600">{statusCounts.rejected}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-wrap">
        <SearchInput
          placeholder="Search tickets, orders, customers..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="lg:w-80"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ComplaintStatus)}
        >
          <SelectTrigger className="w-full lg:w-48" data-testid="select-complaint-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets ({statusCounts.all})</SelectItem>
            <SelectItem value="open">Open ({statusCounts.open})</SelectItem>
            <SelectItem value="in_progress">In Progress ({statusCounts.in_progress})</SelectItem>
            <SelectItem value="resolved">Resolved ({statusCounts.resolved})</SelectItem>
            <SelectItem value="rejected">Rejected ({statusCounts.rejected})</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v as ComplaintCategory)}
        >
          <SelectTrigger className="w-full lg:w-44" data-testid="select-complaint-category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="refund">Refund</SelectItem>
            <SelectItem value="replacement">Replacement</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            data={filteredComplaints}
            columns={columns}
            getRowId={(c) => c.id}
            onRowClick={(c) => {
              setSelectedComplaint(c);
              setDetailSheetOpen(true);
            }}
            emptyMessage="No complaints found. Create a ticket for customer issues."
          />
        </CardContent>
      </Card>

      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto" data-testid="sheet-complaint-details">
          {selectedComplaint && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between gap-2 flex-wrap">
                  <span>{selectedComplaint.ticketNumber}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{categoryLabels[(selectedComplaint as any).category] || "General"}</Badge>
                    <StatusBadge status={selectedComplaint.status} />
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">COMPLAINT DETAILS</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order</span>
                      <span className="font-mono">{selectedComplaint.order?.orderNumber || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer</span>
                      <span>{selectedComplaint.order?.customerName || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reason</span>
                      <Badge variant="secondary">{reasonLabels[selectedComplaint.reason]}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span>{selectedComplaint.createdAt ? new Date(selectedComplaint.createdAt).toLocaleString("en-IN") : "-"}</span>
                    </div>
                  </div>
                  {selectedComplaint.description && (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-sm">{selectedComplaint.description}</p>
                    </div>
                  )}
                </div>

                {((selectedComplaint as any).category === "replacement" || (selectedComplaint as any).category === "refund") && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">WORKFLOW</h3>
                      <div className="space-y-4">
                        <div className="flex gap-2 items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-sm">Step 1: Complaint Registered</p>
                            <p className="text-xs text-muted-foreground">Done on creation</p>
                          </div>
                        </div>
                        <div className="flex gap-2 items-start">
                          {(selectedComplaint as any).returnReceivedBy ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-sm">Step 2: Receive Product</p>
                            {(selectedComplaint as any).returnReceivedBy ? (
                              <p className="text-xs text-muted-foreground">
                                Received — Condition: <Badge variant={(selectedComplaint as any).returnProductCondition === "good" ? "default" : "destructive"} className="text-xs">{(selectedComplaint as any).returnProductCondition === "good" ? "Good" : "Damaged"}</Badge>
                              </p>
                            ) : (
                              <Button size="sm" className="mt-1" onClick={() => setReceiveReturnOpen(true)} data-testid="button-receive-return">
                                <Package className="h-3 w-3 mr-1" />
                                Receive Return
                              </Button>
                            )}
                          </div>
                        </div>
                        {(selectedComplaint as any).category === "replacement" && (
                          <div className="flex gap-2 items-start">
                            {(selectedComplaint as any).replacementOrderId ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-sm">Step 3: Replacement Order</p>
                              {(selectedComplaint as any).replacementOrderId ? (
                                <Link href="/orders">
                                  <Button size="sm" variant="link" className="p-0 h-auto text-primary">View replacement order in Orders →</Button>
                                </Link>
                              ) : (
                                <Button size="sm" className="mt-1" onClick={() => selectedComplaint && createReplacementMutation.mutate(selectedComplaint.id)} disabled={!(selectedComplaint as any).returnReceivedBy || createReplacementMutation.isPending} data-testid="button-create-replacement">
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  {createReplacementMutation.isPending ? "Creating…" : "Create Replacement Order"}
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                        {(selectedComplaint as any).category === "refund" && (
                          <div className="flex gap-2 items-start">
                            {(selectedComplaint as any).refundProcessedBy ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-sm">Step 3: Process Refund</p>
                              {(selectedComplaint as any).refundProcessedBy ? (
                                <p className="text-xs text-muted-foreground">
                                  ₹{(selectedComplaint as any).refundAmount} via {(selectedComplaint as any).refundMode} — Ref: {(selectedComplaint as any).refundReference || "—"}
                                </p>
                              ) : (
                                <Button size="sm" className="mt-1" onClick={() => { setRefundForm({ ...refundForm, refundAmount: selectedComplaint.order?.totalAmount ? String(selectedComplaint.order.totalAmount) : "" }); setProcessRefundOpen(true); }} disabled={!(selectedComplaint as any).returnReceivedBy || processRefundMutation.isPending} data-testid="button-process-refund">
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  Process Refund
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex gap-2 items-start">
                          {selectedComplaint.status === "resolved" || selectedComplaint.status === "rejected" ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-muted mt-0.5 shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-sm">Step 4: Resolved</p>
                            <p className="text-xs text-muted-foreground">{selectedComplaint.status === "resolved" ? "Complaint resolved" : selectedComplaint.status === "rejected" ? "Rejected" : "Pending"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {selectedComplaint.resolutionType && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">RESOLUTION</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={selectedComplaint.resolutionType === "rejected" ? "destructive" : "default"}>
                          {selectedComplaint.resolutionType.toUpperCase()}
                        </Badge>
                      </div>
                      {selectedComplaint.resolutionNotes && (
                        <p className="text-sm text-muted-foreground mt-2">{selectedComplaint.resolutionNotes}</p>
                      )}
                    </div>
                  </>
                )}

                <Separator />

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">TIMELINE</h3>
                  <ScrollArea className="h-64">
                    <div className="space-y-4">
                      {selectedComplaint.timeline?.map((entry, idx) => (
                        <div key={entry.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            {getTimelineIcon(entry.action)}
                            {idx < (selectedComplaint.timeline?.length || 0) - 1 && (
                              <div className="w-px h-full bg-border mt-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{entry.action}</span>
                              <span className="text-xs text-muted-foreground">
                                {entry.createdAt ? new Date(entry.createdAt).toLocaleString("en-IN") : ""}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{entry.comment}</p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              {entry.employeeName} ({entry.employeeRole})
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!selectedComplaint.timeline || selectedComplaint.timeline.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-4">No timeline entries yet</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {(selectedComplaint.status === "open" || selectedComplaint.status === "in_progress") && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">ADD COMMENT</h3>
                      <div className="flex gap-2">
                        <Input
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          data-testid="input-complaint-comment"
                        />
                        <Button 
                          onClick={handleAddComment} 
                          disabled={!newComment.trim() || addTimelineMutation.isPending} 
                          data-testid="button-add-comment"
                        >
                          {addTimelineMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                        </Button>
                      </div>
                    </div>

                    <div className="pt-2 space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant="default"
                          onClick={() => handleResolve("refund")}
                          disabled={resolveMutation.isPending}
                          data-testid="button-resolve-refund"
                        >
                          Refund
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleResolve("replacement")}
                          disabled={resolveMutation.isPending}
                          data-testid="button-resolve-replacement"
                        >
                          Replace
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleResolve("rejected")}
                          disabled={resolveMutation.isPending}
                          data-testid="button-resolve-reject"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={receiveReturnOpen} onOpenChange={setReceiveReturnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receive Return</DialogTitle>
            <DialogDescription>Record product condition when receiving the return for {selectedComplaint?.ticketNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Product condition</Label>
              <RadioGroup value={receiveReturnCondition} onValueChange={(v: "good" | "damaged") => setReceiveReturnCondition(v)} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="good" id="cond-good" />
                  <Label htmlFor="cond-good" className="font-normal">Good</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="damaged" id="cond-damaged" />
                  <Label htmlFor="cond-damaged" className="font-normal">Damaged</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={receiveReturnNotes} onChange={(e) => setReceiveReturnNotes(e.target.value)} placeholder="Condition notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveReturnOpen(false)}>Cancel</Button>
            <Button onClick={() => selectedComplaint && receiveReturnMutation.mutate({ complaintId: selectedComplaint.id, productCondition: receiveReturnCondition, returnNotes: receiveReturnNotes || undefined })} disabled={receiveReturnMutation.isPending}>
              {receiveReturnMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm Received
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={processRefundOpen} onOpenChange={setProcessRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>Record refund details for {selectedComplaint?.ticketNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Refund amount (₹)</Label>
              <Input type="number" value={refundForm.refundAmount} onChange={(e) => setRefundForm((p) => ({ ...p, refundAmount: e.target.value }))} placeholder="Amount" />
            </div>
            <div className="space-y-2">
              <Label>Refund mode</Label>
              <Select value={refundForm.refundMode} onValueChange={(v) => setRefundForm((p) => ({ ...p, refundMode: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="original_payment_method">Original payment method</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reference number</Label>
              <Input value={refundForm.refundReference} onChange={(e) => setRefundForm((p) => ({ ...p, refundReference: e.target.value }))} placeholder="Transaction reference" />
            </div>
            <div className="space-y-2">
              <Label>Refund date</Label>
              <Input type="date" value={refundForm.refundDate} onChange={(e) => setRefundForm((p) => ({ ...p, refundDate: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessRefundOpen(false)}>Cancel</Button>
            <Button onClick={() => selectedComplaint && processRefundMutation.mutate({ complaintId: selectedComplaint.id, refundAmount: parseFloat(refundForm.refundAmount) || 0, refundMode: refundForm.refundMode, refundReference: refundForm.refundReference || undefined, refundDate: refundForm.refundDate })} disabled={!refundForm.refundAmount || processRefundMutation.isPending}>
              {processRefundMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent data-testid="modal-create-ticket">
          <DialogHeader>
            <DialogTitle>Create New Ticket</DialogTitle>
            <DialogDescription>Create a support ticket for a customer complaint</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Complaint Category</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["general", "refund", "replacement"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewTicket((p) => ({ ...p, category: cat }))}
                    className={`p-3 rounded-lg border-2 text-left text-sm font-medium transition-colors ${
                      newTicket.category === cat
                        ? "border-primary bg-primary/10"
                        : "border-muted hover:border-muted-foreground/50"
                    }`}
                    data-testid={`ticket-category-${cat}`}
                  >
                    {categoryLabels[cat]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {newTicket.category === "general" && "Record a general complaint and post action taken."}
                {newTicket.category === "refund" && "Customer will return product → receive and inspect → process refund."}
                {newTicket.category === "replacement" && "Customer will return product → receive and inspect → send replacement."}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Select
                value={newTicket.orderId}
                onValueChange={(v) => setNewTicket((prev) => ({ ...prev, orderId: v }))}
              >
                <SelectTrigger data-testid="select-ticket-order">
                  <SelectValue placeholder="Select order" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.orderNumber} - {order.customerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select
                value={newTicket.reason}
                onValueChange={(v) => setNewTicket((prev) => ({ ...prev, reason: v, customReason: "" }))}
              >
                <SelectTrigger data-testid="select-ticket-reason">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wrong_item">Wrong Item</SelectItem>
                  <SelectItem value="damaged">Damaged Product</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="not_received">Not Received</SelectItem>
                  <SelectItem value="quality">Quality</SelectItem>
                  <SelectItem value="size_exchange">Size Exchange</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newTicket.reason === "other" && (
              <div className="space-y-2">
                <Label>Specify Reason</Label>
                <Input
                  value={newTicket.customReason}
                  onChange={(e) => setNewTicket((prev) => ({ ...prev, customReason: e.target.value }))}
                  placeholder="Enter the specific reason..."
                  data-testid="input-custom-reason"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the issue..."
                data-testid="input-ticket-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTicket}
              disabled={!newTicket.orderId || !newTicket.reason || (newTicket.reason === "other" && !newTicket.customReason.trim()) || createComplaintMutation.isPending}
              data-testid="button-submit-ticket"
            >
              {createComplaintMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent data-testid="modal-refund">
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>Enter the refund amount for {selectedComplaint?.ticketNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Refund Amount (₹)</Label>
              <Input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Enter refund amount"
                data-testid="input-refund-amount"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRefundSubmit}
              disabled={!refundAmount || resolveMutation.isPending}
              data-testid="button-submit-refund"
            >
              {resolveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
