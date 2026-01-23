import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, Check, X, Printer, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { B2BPrintingType } from "@shared/schema";

export default function B2BPrintingTypes() {
  const { isSuperAdmin, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShieldAlert className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground text-center">
              Only Super Admins can manage B2B Printing Types.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <PrintingTypesContent />;
}

function PrintingTypesContent() {
  const { toast } = useToast();
  const [newTypeName, setNewTypeName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const { data: printingTypes = [], isLoading } = useQuery<B2BPrintingType[]>({
    queryKey: ["/api/b2b/printing-types"],
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/b2b/printing-types", { name });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/b2b/printing-types"] });
      setNewTypeName("");
      toast({ title: "Printing type added" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to add printing type", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, isActive }: { id: string; name?: string; isActive?: boolean }) => {
      const res = await apiRequest("PATCH", `/api/b2b/printing-types/${id}`, { name, isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/b2b/printing-types"] });
      setEditingId(null);
      toast({ title: "Printing type updated" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update printing type", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/b2b/printing-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/b2b/printing-types"] });
      toast({ title: "Printing type deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete printing type", description: error.message, variant: "destructive" });
    },
  });

  const handleAdd = () => {
    if (newTypeName.trim()) {
      createMutation.mutate(newTypeName.trim());
    }
  };

  const handleSaveEdit = (id: string) => {
    if (editingName.trim()) {
      updateMutation.mutate({ id, name: editingName.trim() });
    }
  };

  const handleToggleActive = (id: string, currentActive: boolean) => {
    updateMutation.mutate({ id, isActive: !currentActive });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Printer className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">B2B Printing Types</h1>
          <p className="text-muted-foreground">
            Configure printing types available for B2B orders
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manage Printing Types</CardTitle>
          <CardDescription>
            Add, edit, or remove printing types. Only active types will appear in the order form.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter new printing type name"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              data-testid="input-new-printing-type"
            />
            <Button
              onClick={handleAdd}
              disabled={!newTypeName.trim() || createMutation.isPending}
              data-testid="button-add-printing-type"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          <Separator />

          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : printingTypes.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No printing types configured yet. Add one above.
            </p>
          ) : (
            <div className="space-y-2">
              {printingTypes.map((pt) => (
                <div
                  key={pt.id}
                  className="flex items-center justify-between gap-2 p-3 border rounded-lg"
                  data-testid={`printing-type-${pt.id}`}
                >
                  {editingId === pt.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1"
                        data-testid={`input-edit-${pt.id}`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleSaveEdit(pt.id)}
                        disabled={updateMutation.isPending}
                        data-testid={`button-save-${pt.id}`}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                        data-testid={`button-cancel-${pt.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <span className={pt.isActive ? "" : "text-muted-foreground line-through"}>
                          {pt.name}
                        </span>
                        {!pt.isActive && (
                          <span className="text-xs text-muted-foreground">(inactive)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={pt.isActive}
                          onCheckedChange={() => handleToggleActive(pt.id, pt.isActive)}
                          data-testid={`switch-active-${pt.id}`}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(pt.id);
                            setEditingName(pt.name);
                          }}
                          data-testid={`button-edit-${pt.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(pt.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${pt.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
