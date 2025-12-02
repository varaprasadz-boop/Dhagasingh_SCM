import { ProductVariantTable } from "../ProductVariantTable";
import { mockProducts } from "@/lib/mockData";

export default function ProductVariantTableExample() {
  return (
    <ProductVariantTable
      variants={mockProducts[0].variants}
      editable
      onQuantityChange={(id, qty) => console.log("Variant:", id, "Qty:", qty)}
    />
  );
}
