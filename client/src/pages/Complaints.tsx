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
import { Plus, Filter, Eye, User, MessageSquare, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Complaint, ComplaintTimeline, OrderWithItems } from "@shared/schema";

type ComplaintStatus = "open" | "in_progress" | "resolved" | "rejected" | "all";

type ComplaintWithTimeline = Complaint & {
  timeline: ComplaintTimeline[];
  order?: OrderWithItems | null;
};

const reasonLabels: Record<string, string> = {
  wrong_item: "Wrong Item",
  damaged: "Damaged Product",
  late_delivery: "Late Delivery",
  size_issue: "Size Issue",
  quality_issue: "Quality Issue",
  other: "Other",
};

export default function Complaints() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintWithTimeline | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [newComment, setNewComment] = useState("");

  const [newTicket, setNewTicket] = useState({
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
    mutationFn: (data: { orderId: string; reason: string; description: string }) =>
      apiRequest("POST", "/api/complaints", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      toast({ title: "Ticket created successfully" });
      setCreateDialogOpen(false);
      setNewTicket({ orderId: "", reason: "", customReason: "", description: "" });
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

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      c.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.order?.orderNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.order?.customerName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
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

      <div className="flex flex-col lg:flex-row gap-4">
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
                <SheetTitle className="flex items-center justify-between">
                  <span>{selectedComplaint.ticketNumber}</span>
                  <StatusBadge status={selectedComplaint.status} />
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

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent data-testid="modal-create-ticket">
          <DialogHeader>
            <DialogTitle>Create New Ticket</DialogTitle>
            <DialogDescription>Create a support ticket for a customer complaint</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
                  <SelectItem value="late_delivery">Late Delivery</SelectItem>
                  <SelectItem value="size_issue">Size Issue</SelectItem>
                  <SelectItem value="quality_issue">Quality Issue</SelectItem>
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
