import { useState, useRef } from "react";
import { Upload, X, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface FileUploadProps {
  accept?: string;
  maxSize?: number;
  onUpload?: (file: File) => void;
  label?: string;
  description?: string;
}

export function FileUpload({
  accept = ".csv",
  maxSize = 5 * 1024 * 1024,
  onUpload,
  label = "Upload CSV File",
  description = "Drag and drop or click to upload. Max 5MB.",
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File) => {
    setError(null);

    if (selectedFile.size > maxSize) {
      setError(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
      return;
    }

    const acceptedTypes = accept.split(",").map((t) => t.trim());
    const fileExt = `.${selectedFile.name.split(".").pop()?.toLowerCase()}`;
    if (!acceptedTypes.some((t) => t === fileExt || selectedFile.type.includes(t.replace(".", "")))) {
      setError(`File type not supported. Please upload ${accept}`);
      return;
    }

    setFile(selectedFile);
    setUploaded(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  };

  const handleUpload = () => {
    if (file) {
      onUpload?.(file);
      setUploaded(true);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setUploaded(false);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed p-6 transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-muted"
        } ${error ? "border-destructive" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        data-testid="dropzone-file-upload"
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          data-testid="input-file"
        />

        <div className="flex flex-col items-center gap-2 text-center cursor-pointer">
          <Upload className={`h-10 w-10 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
          <div>
            <p className="font-medium">{label}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </Card>

      {error && (
        <p className="text-sm text-destructive" data-testid="text-file-error">{error}</p>
      )}

      {file && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            {uploaded ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <>
                <Button size="sm" onClick={handleUpload} data-testid="button-upload">
                  Upload
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemove}
                  data-testid="button-remove-file"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
