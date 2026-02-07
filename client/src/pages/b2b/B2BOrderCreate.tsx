import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import { format } from "date-fns";
import { ArrowLeft, Plus, Trash2, Upload, X, Package, IndianRupee, FileText, Eye, Loader2, ImageIcon, CheckCircle, ChevronsUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { B2BClient, Product, ProductVariant, B2BPrintingType } from "@shared/schema";

const orderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  productVariantId: z.string().min(1, "Variant is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0).optional(),
});

const formSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  printingTypeId: z.string().optional(),
  artworkStatus: z.enum(["pending", "received", "approved", "revision_needed"]),
  priority: z.enum(["normal", "urgent"]),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  deliveryCity: z.string().optional(),
  deliveryState: z.string().optional(),
  deliveryZip: z.string().optional(),
  requiredDeliveryDate: z.string().optional(),
  specialInstructions: z.string().optional(),
  totalAmount: z.coerce.number().positive("Total amount must be greater than 0"),
  advanceAmount: z.coerce.number().positive("Advance amount is required"),
  advanceMode: z.enum(["cash", "upi", "bank_transfer", "card", "cheque", "online_gateway"]),
  advanceDate: z.string().min(1, "Advance date is required"),
  advanceReference: z.string().min(1, "Transaction reference is required"),
  advanceProofUrl: z.string().min(1, "Payment proof is required"),
  items: z.array(orderItemSchema).min(1, "At least one product is required"),
}).refine(data => data.advanceAmount <= data.totalAmount, {
  message: "Advance cannot exceed total amount",
  path: ["advanceAmount"],
});

type FormData = z.infer<typeof formSchema>;

type ProductWithVariants = Product & { variants: ProductVariant[] };

const ARTWORK_SLOTS = 5;
const ARTWORK_ACCEPT = ".pdf,.png,.jpg,.jpeg,.xlsx,.xls";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry",
];

type ArtworkSlot = { objectPath: string; fileName: string; fileType: string } | null;

export default function B2BOrderCreate() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [advanceProofName, setAdvanceProofName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [artworkFiles, setArtworkFiles] = useState<ArtworkSlot[]>(Array(ARTWORK_SLOTS).fill(null));
  const artworkSlotRef = useRef<number>(0);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: "",
      printingTypeId: "",
      artworkStatus: "pending",
      priority: "normal",
      deliveryAddress: "",
      deliveryCity: "",
      deliveryState: "",
      deliveryZip: "",
      requiredDeliveryDate: "",
      specialInstructions: "",
      totalAmount: 0,
      advanceAmount: 0,
      advanceMode: "upi",
      advanceDate: format(new Date(), "yyyy-MM-dd"),
      advanceReference: "",
      advanceProofUrl: "",
      items: [{ productId: "", productVariantId: "", quantity: 1, unitPrice: undefined }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (response) => {
      form.setValue("advanceProofUrl", response.objectPath);
      toast({ title: "Payment proof uploaded successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to upload payment proof",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { uploadFile: uploadArtworkFile, isUploading: isArtworkUploading } = useUpload({
    category: "artwork",
    onSuccess: (response) => {
      const slot = artworkSlotRef.current;
      setArtworkFiles((prev) => {
        const next = [...prev];
        next[slot] = {
          objectPath: response.objectPath,
          fileName: response.metadata?.name ?? "file",
          fileType: response.metadata?.contentType ?? "",
        };
        return next;
      });
      toast({ title: `Artwork file ${slot + 1} uploaded` });
    },
    onError: (error) => {
      toast({
        title: "Failed to upload artwork file",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const advanceProofUrl = form.watch("advanceProofUrl");
  const artworkStatus = form.watch("artworkStatus");

  const { data: clients = [] } = useQuery<B2BClient[]>({
    queryKey: ["/api/b2b/clients"],
  });

  const { data: products = [] } = useQuery<ProductWithVariants[]>({
    queryKey: ["/api/products"],
  });

  const { data: printingTypes = [] } = useQuery<B2BPrintingType[]>({
    queryKey: ["/api/b2b/printing-types"],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (payload: { data: FormData; artworkFiles: ArtworkSlot[] }) => {
      const { data, artworkFiles: files } = payload;
      const response = await apiRequest("POST", "/api/b2b/orders", data);
      const order = await response.json();
      const toUpload = files.filter((s): s is NonNullable<ArtworkSlot> => s !== null);
      for (let i = 0; i < toUpload.length; i++) {
        try {
          await apiRequest("POST", `/api/b2b/orders/${order.id}/artwork`, {
            fileName: toUpload[i].fileName,
            fileUrl: toUpload[i].objectPath,
            fileType: toUpload[i].fileType || undefined,
          });
        } catch (err) {
          console.error("Artwork upload failed for file", i + 1, err);
          toast({
            title: `Artwork file ${i + 1} could not be attached`,
            variant: "destructive",
          });
        }
      }
      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/b2b/orders"] });
      toast({ title: "Order created successfully" });
      navigate("/b2b/orders");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create order",
        description: error.message || "Please check the form and try again",
        variant: "destructive",
      });
    },
  });

  const selectedClient = clients.find(c => c.id === form.watch("clientId"));
  const totalAmount = form.watch("totalAmount");
  const advanceAmount = form.watch("advanceAmount");
  const balanceDue = totalAmount - advanceAmount;

  const getVariantsForProduct = (productId: string): ProductVariant[] => {
    const product = products.find(p => p.id === productId);
    return product?.variants || [];
  };

  const getVariantById = (variantId: string): ProductVariant | undefined => {
    for (const product of products) {
      const variant = product.variants?.find(v => v.id === variantId);
      if (variant) return variant;
    }
    return undefined;
  };

  const validateStockQuantities = (): { valid: boolean; errors: string[] } => {
    const items = form.watch("items") || [];
    const errors: string[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.productVariantId && item.quantity) {
        const variant = getVariantById(item.productVariantId);
        if (variant && item.quantity > variant.stockQuantity) {
          errors.push(`Item ${i + 1}: Quantity (${item.quantity}) exceeds available stock (${variant.stockQuantity})`);
        }
      }
    }
    
    return { valid: errors.length === 0, errors };
  };

  const stockValidation = validateStockQuantities();

  const onSubmit = (data: FormData) => {
    if (!stockValidation.valid) {
      toast({
        title: "Stock quantity exceeded",
        description: stockValidation.errors.join(". "),
        variant: "destructive",
      });
      return;
    }
    createOrderMutation.mutate({ data, artworkFiles });
  };

  const handleFormSubmit = () => {
    const errors = form.formState.errors;
    if (Object.keys(errors).length > 0) {
      console.error("Form validation errors:", errors);
      const errorMessages = Object.entries(errors).map(([field, error]) => 
        `${field}: ${(error as any)?.message || 'Invalid'}`
      ).join(", ");
      toast({
        title: "Please fix the following errors",
        description: errorMessages,
        variant: "destructive",
      });
    }
  };

  const advanceReference = form.watch("advanceReference");
  const canProceedToStep2 = form.watch("clientId") && (form.watch("items")?.length || 0) > 0 && stockValidation.valid;
  const canProceedToStep3 = canProceedToStep2 && form.watch("totalAmount") > 0 && form.watch("advanceAmount") > 0 && advanceReference && advanceProofUrl;
  const canProceedToStep4 = canProceedToStep3 && form.watch("deliveryAddress");

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/b2b/orders")} data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Create B2B Order</h1>
              <p className="text-sm text-muted-foreground">Fill in the details to create a new corporate order</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full ${
                step >= s ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {step === 1 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Order Details
                    </CardTitle>
                    <CardDescription>Select client and add products to the order</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="clientId"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Client *</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    data-testid="select-client"
                                    className={cn(
                                      "w-full justify-between",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value
                                      ? clients.find((client) => client.id === field.value)?.companyName
                                      : "Search and select a client"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[300px] p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Search clients..." />
                                  <CommandList>
                                    <CommandEmpty>No client found.</CommandEmpty>
                                    <CommandGroup>
                                      {clients.map((client) => (
                                        <CommandItem
                                          key={client.id}
                                          value={client.companyName}
                                          onSelect={() => {
                                            form.setValue("clientId", client.id);
                                          }}
                                          data-testid={`client-option-${client.id}`}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              client.id === field.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          {client.companyName}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="printingTypeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Printing Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-printing-type">
                                  <SelectValue placeholder="Select printing type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {printingTypes.filter(pt => pt.isActive).map((pt) => (
                                  <SelectItem key={pt.id} value={pt.id}>
                                    {pt.name}
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
                        name="artworkStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Artwork Status</FormLabel>
                            <Select
                              onValueChange={(v) => {
                                field.onChange(v);
                                if (v !== "received") setArtworkFiles(Array(ARTWORK_SLOTS).fill(null));
                              }}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-artwork-status">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="received">Received</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="revision_needed">Revision Needed</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {artworkStatus === "received" && (
                        <div className="md:col-span-2 space-y-2">
                          <Label>Artwork files (PDF, PNG, XLSX, etc.) — up to 5</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                            {Array.from({ length: ARTWORK_SLOTS }).map((_, i) => (
                              <div key={i} className="space-y-1">
                                <input
                                  type="file"
                                  accept={ARTWORK_ACCEPT}
                                  className="hidden"
                                  id={`artwork-file-${i}`}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    artworkSlotRef.current = i;
                                    await uploadArtworkFile(file);
                                    e.target.value = "";
                                  }}
                                  data-testid={`input-artwork-${i}`}
                                />
                                <Label
                                  htmlFor={`artwork-file-${i}`}
                                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-3 cursor-pointer hover:bg-muted/50 text-xs"
                                >
                                  {artworkFiles[i] ? (
                                    <>
                                      <CheckCircle className="h-5 w-5 text-green-600 mb-1" />
                                      <span className="truncate w-full text-center">{artworkFiles[i]!.fileName}</span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 mt-1"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setArtworkFiles((prev) => {
                                            const next = [...prev];
                                            next[i] = null;
                                            return next;
                                          });
                                        }}
                                        data-testid={`button-remove-artwork-${i}`}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </>
                                  ) : isArtworkUploading && artworkSlotRef.current === i ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                  ) : (
                                    <>
                                      <Upload className="h-5 w-5 mb-1 text-muted-foreground" />
                                      <span>Slot {i + 1}</span>
                                    </>
                                  )}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-priority">
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
                    </div>

                    <Separator />

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-base font-semibold">Products & Variants</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => append({ productId: "", productVariantId: "", quantity: 1, unitPrice: undefined })}
                          data-testid="button-add-product"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Product
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {fields.map((field, index) => {
                          const productId = form.watch(`items.${index}.productId`);
                          const variants = getVariantsForProduct(productId);

                          return (
                            <div key={field.id} className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30">
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.productId`}
                                  render={({ field: f }) => (
                                    <FormItem>
                                      <FormLabel>Product</FormLabel>
                                      <Select
                                        onValueChange={(value) => {
                                          f.onChange(value);
                                          form.setValue(`items.${index}.productVariantId`, "");
                                        }}
                                        value={f.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger data-testid={`select-product-${index}`}>
                                            <SelectValue placeholder="Select product" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {products.map((product) => (
                                            <SelectItem key={product.id} value={product.id}>
                                              {product.name}
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
                                  name={`items.${index}.productVariantId`}
                                  render={({ field: f }) => (
                                    <FormItem>
                                      <FormLabel>Variant (Color/Size)</FormLabel>
                                      <Select onValueChange={f.onChange} value={f.value} disabled={!productId}>
                                        <FormControl>
                                          <SelectTrigger data-testid={`select-variant-${index}`}>
                                            <SelectValue placeholder="Select variant" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {variants.map((v) => (
                                            <SelectItem 
                                              key={v.id} 
                                              value={v.id}
                                              disabled={v.stockQuantity === 0}
                                              className={v.stockQuantity === 0 ? "text-muted-foreground opacity-50" : ""}
                                            >
                                              {v.color && v.size
                                                ? `${v.color} - ${v.size}`
                                                : v.color || v.size || v.sku}
                                              {v.stockQuantity === 0 
                                                ? " (Out of stock)" 
                                                : ` (${v.stockQuantity} in stock)`}
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
                                  name={`items.${index}.quantity`}
                                  render={({ field: f }) => {
                                    const selectedVariantId = form.watch(`items.${index}.productVariantId`);
                                    const selectedVariant = selectedVariantId ? getVariantById(selectedVariantId) : undefined;
                                    const exceeds = selectedVariant && f.value > selectedVariant.stockQuantity;
                                    
                                    return (
                                      <FormItem>
                                        <FormLabel className="flex items-center gap-1">
                                          Quantity
                                          {exceeds && (
                                            <span className="text-xs text-red-500 font-normal">(Exceeds stock!)</span>
                                          )}
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            min={1}
                                            max={selectedVariant?.stockQuantity}
                                            {...f}
                                            className={exceeds ? "border-red-500 focus:border-red-500" : ""}
                                            data-testid={`input-quantity-${index}`}
                                          />
                                        </FormControl>
                                        {selectedVariant && (
                                          <p className={`text-xs ${exceeds ? "text-red-500" : "text-muted-foreground"}`}>
                                            Max available: {selectedVariant.stockQuantity}
                                          </p>
                                        )}
                                        <FormMessage />
                                      </FormItem>
                                    );
                                  }}
                                />

                                <FormField
                                  control={form.control}
                                  name={`items.${index}.unitPrice`}
                                  render={({ field: f }) => (
                                    <FormItem>
                                      <FormLabel>Cost per t-shirt (₹)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min={0}
                                          step={0.01}
                                          placeholder="0"
                                          {...f}
                                          value={f.value === undefined ? "" : f.value}
                                          onChange={(e) => f.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                                          data-testid={`input-unit-price-${index}`}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              {fields.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="mt-8"
                                  onClick={() => remove(index)}
                                  data-testid={`button-remove-product-${index}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!canProceedToStep2}
                    data-testid="button-next-step-1"
                  >
                    Next: Finance Details
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IndianRupee className="h-5 w-5" />
                      Finance Details
                    </CardTitle>
                    <CardDescription>Enter total amount and advance payment details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="totalAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Amount (INR) *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                placeholder="Enter total order amount"
                                {...field}
                                data-testid="input-total-amount"
                              />
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
                            <FormLabel>Advance Amount (INR) *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                placeholder="Enter advance received"
                                {...field}
                                data-testid="input-advance-amount"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="advanceMode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Mode *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-advance-mode">
                                  <SelectValue placeholder="How was advance received?" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="upi">UPI</SelectItem>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                <SelectItem value="card">Card</SelectItem>
                                <SelectItem value="cheque">Cheque</SelectItem>
                                <SelectItem value="online_gateway">Online Gateway</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="advanceDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Advance Date *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-advance-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="advanceReference"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="flex items-center gap-1">
                              Transaction Reference *
                              {!field.value && (
                                <span className="text-xs text-orange-500 font-normal">(Required to proceed)</span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Transaction ID / Cheque number / Reference"
                                {...field}
                                className={!field.value ? "border-orange-400 focus:border-orange-500" : ""}
                                data-testid="input-advance-reference"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="md:col-span-2">
                        <Label className="flex items-center gap-1">
                          Payment Proof *
                          {!advanceProofUrl && (
                            <span className="text-xs text-orange-500 font-normal">(Required to proceed)</span>
                          )}
                        </Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Upload screenshot or image of payment confirmation
                        </p>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setAdvanceProofName(file.name);
                              await uploadFile(file);
                            }
                          }}
                          data-testid="input-proof-file"
                        />
                        
                        {!advanceProofUrl ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className={`w-full h-20 border-dashed gap-2 ${!advanceProofUrl ? "border-orange-400 hover:border-orange-500" : ""}`}
                            data-testid="button-upload-proof"
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Uploading... {progress}%</span>
                              </>
                            ) : (
                              <>
                                <ImageIcon className="h-5 w-5" />
                                <span>Click to upload payment proof</span>
                              </>
                            )}
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2 p-3 border rounded-md bg-green-50 dark:bg-green-900/20">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="flex-1 text-sm truncate">{advanceProofName || "Payment proof uploaded"}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                form.setValue("advanceProofUrl", "");
                                setAdvanceProofName(null);
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = "";
                                }
                              }}
                              data-testid="button-remove-proof"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {totalAmount > 0 && (
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Total Amount:</span>
                          <span className="font-medium">₹{totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-muted-foreground">Advance Received:</span>
                          <span className="font-medium text-green-600">₹{advanceAmount.toLocaleString()}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Balance Due:</span>
                          <span className="font-bold text-lg">₹{balanceDue.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} data-testid="button-prev-step-2">
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!canProceedToStep3}
                    data-testid="button-next-step-2"
                  >
                    Next: Delivery Details
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Delivery Details
                    </CardTitle>
                    <CardDescription>Enter delivery address and special instructions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="deliveryAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Address *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Full delivery address"
                              className="min-h-[100px]"
                              {...field}
                              data-testid="textarea-delivery-address"
                            />
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
                              <Input placeholder="City" {...field} data-testid="input-delivery-city" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="deliveryState"
                        render={({ field }) => {
                          const stateValue = field.value;
                          const isFromList = INDIAN_STATES.includes(stateValue);
                          const selectValue = isFromList ? stateValue : stateValue ? "Other" : "";
                          return (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <Select
                                value={selectValue}
                                onValueChange={(v) => {
                                  if (v === "Other") {
                                    field.onChange("");
                                  } else {
                                    field.onChange(v);
                                  }
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-delivery-state">
                                    <SelectValue placeholder="Select state" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {INDIAN_STATES.map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {s}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              {selectValue === "Other" && (
                                <Input
                                  placeholder="Enter state"
                                  value={stateValue}
                                  onChange={(e) => field.onChange(e.target.value)}
                                  data-testid="input-delivery-state-other"
                                />
                              )}
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        control={form.control}
                        name="deliveryZip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PIN Code</FormLabel>
                            <FormControl>
                              <Input placeholder="PIN Code" {...field} data-testid="input-delivery-zip" />
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
                          <FormLabel>Required Delivery Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-required-delivery-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specialInstructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Instructions</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any special requirements or notes"
                              className="min-h-[80px]"
                              {...field}
                              data-testid="textarea-special-instructions"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} data-testid="button-prev-step-3">
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep(4)}
                    disabled={!canProceedToStep4}
                    data-testid="button-next-step-3"
                  >
                    Next: Review Order
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Order Summary
                    </CardTitle>
                    <CardDescription>Review your order before creating</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase">Client</h3>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="font-medium">{selectedClient?.companyName || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">{selectedClient?.contactPerson}</p>
                        </div>

                        <h3 className="font-semibold text-sm text-muted-foreground uppercase mt-4">Order Details</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Priority:</span>
                            <Badge variant={form.watch("priority") === "urgent" ? "destructive" : "secondary"}>
                              {form.watch("priority")}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Artwork Status:</span>
                            <span>{form.watch("artworkStatus").replace("_", " ")}</span>
                          </div>
                          {form.watch("printingTypeId") && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Printing Type:</span>
                              <span>{printingTypes.find(pt => pt.id === form.watch("printingTypeId"))?.name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase">Delivery Address</h3>
                        <div className="p-3 bg-muted rounded-lg text-sm">
                          <p>{form.watch("deliveryAddress")}</p>
                          {(form.watch("deliveryCity") || form.watch("deliveryState") || form.watch("deliveryZip")) && (
                            <p className="mt-1">
                              {[form.watch("deliveryCity"), form.watch("deliveryState"), form.watch("deliveryZip")]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase mb-3">Products</h3>
                      <div className="space-y-2">
                        {form.watch("items").map((item, index) => {
                          const product = products.find(p => p.id === item.productId);
                          const variant = product?.variants.find(v => v.id === item.productVariantId);
                          return (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div>
                                <p className="font-medium">{product?.name || "Unknown Product"}</p>
                                <p className="text-sm text-muted-foreground">
                                  {variant ? `${variant.color || ""} ${variant.size || ""} (${variant.sku})` : "N/A"}
                                </p>
                              </div>
                              <Badge variant="secondary">Qty: {item.quantity}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase mb-3">Payment Details</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Amount:</span>
                            <span className="font-medium">₹{totalAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Advance Received:</span>
                            <span className="font-medium text-green-600">₹{advanceAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Payment Mode:</span>
                            <span>{form.watch("advanceMode").replace("_", " ").toUpperCase()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Advance Date:</span>
                            <span>{form.watch("advanceDate")}</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between text-base">
                            <span className="font-semibold">Balance Due:</span>
                            <span className="font-bold">₹{balanceDue.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {form.watch("specialInstructions") && (
                        <div>
                          <h3 className="font-semibold text-sm text-muted-foreground uppercase mb-3">Special Instructions</h3>
                          <p className="text-sm p-3 bg-muted rounded-lg">{form.watch("specialInstructions")}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(3)} data-testid="button-prev-step-4">
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={createOrderMutation.isPending}
                    onClick={handleFormSubmit}
                    data-testid="button-create-order"
                  >
                    {createOrderMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Order...
                      </>
                    ) : (
                      "Create Order"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
