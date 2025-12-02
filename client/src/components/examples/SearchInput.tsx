import { SearchInput } from "../SearchInput";

export default function SearchInputExample() {
  return (
    <SearchInput
      placeholder="Search orders, products, SKUs..."
      onSearch={(value) => console.log("Searching:", value)}
    />
  );
}
