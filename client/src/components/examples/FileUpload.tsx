import { FileUpload } from "../FileUpload";

export default function FileUploadExample() {
  return (
    <FileUpload
      accept=".csv"
      label="Upload Shopify Orders CSV"
      description="Drag and drop your Shopify export file"
      onUpload={(file) => console.log("Uploading:", file.name)}
    />
  );
}
