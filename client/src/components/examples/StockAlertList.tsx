import { StockAlertList } from "../StockAlertList";
import { mockProducts } from "@/lib/mockData";

export default function StockAlertListExample() {
  const allVariants = mockProducts.flatMap((p) => p.variants);
  return <StockAlertList variants={allVariants} threshold={40} />;
}
