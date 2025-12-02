import { useState } from "react";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { SearchInput } from "@/components/SearchInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { Plus, Filter, Eye, Clock, User, MessageSquare, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { mockComplaints, mockOrders, type Complaint, type ComplaintTimelineEntry } from "@/lib/mockData";

type ComplaintStatus = "open" | "in_progress" | "resolved" | "rejected" | "all";

const reasonLabels: Record<string, string> = {
  wrong_item: "Wrong Item",
  damaged: "Damaged Product",
  late_delivery: "Late Delivery",
  size_issue: "Size Issue",
  quality_issue: "Quality Issue",
  other: "Other",
};

export default function Complaints() {
  const [complaints, setComplaints] = useState(mockComplaints);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [newComment, setNewComment] = useState("");

  const [newTicket, setNewTicket] = useState({
    orderId: "",
    reason: "",
    description: "",
  });

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      c.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { key: "ticketNumber", header: "Ticket #", sortable: true },
    { key: "orderNumber", header: "Order #", sortable: true },
    { key: "customerName", header: "Customer", sortable: true },
    {
      key: "reason",
      header: "Reason",
      render: (c: Complaint) => reasonLabels[c.reason] || c.reason,
    },
    {
      key: "status",
      header: "Status",
      render: (c: Complaint) => <StatusBadge status={c.status} />,
    },
    {
      key: "createdAt",
      header: "Created",
      render: (c: Complaint) =>
        new Date(c.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
    },
    {
      key: "actions",
      header: "",
      render: (c: Complaint) => (
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

    const newEntry: ComplaintTimelineEntry = {
      id: `${selectedComplaint.id}-${selectedComplaint.timeline.length + 1}`,
      action: resolution === "rejected" ? "Rejected" : "Resolved",
      comment: resolution === "rejected" ? "Complaint rejected" : "Replacement approved",
      employeeName: "Current User",
      employeeRole: "Admin",
      createdAt: new Date().toISOString(),
    };

    setComplaints((prev) =>
      prev.map((c) =>
        c.id === selectedComplaint.id
          ? {
              ...c,
              status: resolution === "rejected" ? "rejected" : "resolved",
              resolution,
              timeline: [...c.timeline, newEntry],
            }
          : c
      )
    );

    setSelectedComplaint((prev) =>
      prev ? { ...prev, status: resolution === "rejected" ? "rejected" : "resolved", resolution, timeline: [...prev.timeline, newEntry] } : null
    );
  };

  const handleRefundSubmit = () => {
    if (!selectedComplaint) return;

    const newEntry: ComplaintTimelineEntry = {
      id: `${selectedComplaint.id}-${selectedComplaint.timeline.length + 1}`,
      action: "Resolved",
      comment: `Refund of ₹${refundAmount} processed`,
      employeeName: "Current User",
      employeeRole: "Admin",
      createdAt: new Date().toISOString(),
    };

    setComplaints((prev) =>
      prev.map((c) =>
        c.id === selectedComplaint.id
          ? {
              ...c,
              status: "resolved",
              resolution: "refund",
              refundAmount: parseFloat(refundAmount) || 0,
              timeline: [...c.timeline, newEntry],
            }
          : c
      )
    );

    setSelectedComplaint((prev) =>
      prev
        ? {
            ...prev,
            status: "resolved",
            resolution: "refund",
            refundAmount: parseFloat(refundAmount) || 0,
            timeline: [...prev.timeline, newEntry],
          }
        : null
    );

    setRefundDialogOpen(false);
    setRefundAmount("");
  };

  const handleAddComment = () => {
    if (!selectedComplaint || !newComment.trim()) return;

    const newEntry: ComplaintTimelineEntry = {
      id: `${selectedComplaint.id}-${selectedComplaint.timeline.length + 1}`,
      action: "Comment Added",
      comment: newComment,
      employeeName: "Current User",
      employeeRole: "Customer Support",
      createdAt: new Date().toISOString(),
    };

    const updatedTimeline = [...selectedComplaint.timeline, newEntry];

    setComplaints((prev) =>
      prev.map((c) =>
        c.id === selectedComplaint.id
          ? { ...c, timeline: updatedTimeline, status: c.status === "open" ? "in_progress" : c.status }
          : c
      )
    );

    setSelectedComplaint((prev) =>
      prev ? { ...prev, timeline: updatedTimeline, status: prev.status === "open" ? "in_progress" : prev.status } : null
    );

    setNewComment("");
  };

  const handleCreateTicket = () => {
    const order = mockOrders.find((o) => o.id === newTicket.orderId);
    if (!order) return;

    const newComplaint: Complaint = {
      id: String(complaints.length + 1),
      ticketNumber: `TKT-${String(complaints.length + 1).padStart(3, "0")}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      reason: newTicket.reason as Complaint["reason"],
      description: newTicket.description,
      status: "open",
      timeline: [
        {
          id: "1",
          action: "Ticket Created",
          comment: newTicket.description,
          employeeName: "Current User",
          employeeRole: "Customer Support",
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    };

    setComplaints((prev) => [newComplaint, ...prev]);
    setCreateDialogOpen(false);
    setNewTicket({ orderId: "", reason: "", description: "" });
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
            emptyMessage="No complaints found"
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
                      <span className="font-mono">{selectedComplaint.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer</span>
                      <span>{selectedComplaint.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reason</span>
                      <Badge variant="secondary">{reasonLabels[selectedComplaint.reason]}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span>{new Date(selectedComplaint.createdAt).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-muted rounded-md">
                    <p className="text-sm">{selectedComplaint.description}</p>
                  </div>
                </div>

                {selectedComplaint.resolution && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2">RESOLUTION</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={selectedComplaint.resolution === "rejected" ? "destructive" : "default"}>
                          {selectedComplaint.resolution.toUpperCase()}
                        </Badge>
                        {selectedComplaint.refundAmount && (
                          <span className="text-sm">₹{selectedComplaint.refundAmount}</span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">TIMELINE</h3>
                  <ScrollArea className="h-64">
                    <div className="space-y-4">
                      {selectedComplaint.timeline.map((entry, idx) => (
                        <div key={entry.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            {getTimelineIcon(entry.action)}
                            {idx < selectedComplaint.timeline.length - 1 && (
                              <div className="w-px h-full bg-border mt-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{entry.action}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(entry.createdAt).toLocaleString("en-IN")}
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
                        <Button onClick={handleAddComment} disabled={!newComment.trim()} data-testid="button-add-comment">
                          Add
                        </Button>
                      </div>
                    </div>

                    <div className="pt-2 space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant="default"
                          onClick={() => handleResolve("refund")}
                          data-testid="button-resolve-refund"
                        >
                          Refund
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => handleResolve("replacement")}
                          data-testid="button-resolve-replacement"
                        >
                          Replace
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleResolve("rejected")}
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
                  {mockOrders.map((order) => (
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
                onValueChange={(v) => setNewTicket((prev) => ({ ...prev, reason: v }))}
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
              disabled={!newTicket.orderId || !newTicket.reason}
              data-testid="button-submit-ticket"
            >
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
              disabled={!refundAmount}
              data-testid="button-submit-refund"
            >
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
