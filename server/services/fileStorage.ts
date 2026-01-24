import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";

export type StorageMode = "replit" | "local";

export interface UploadResult {
  uploadURL: string;
  objectPath: string;
  mode: StorageMode;
}

export interface FileStorageConfig {
  uploadsDir: string;
  baseUrl: string;
}

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

export class FileStorageService {
  private config: FileStorageConfig;
  private mode: StorageMode;

  constructor() {
    const storageMode = process.env.FILE_STORAGE_MODE || "auto";
    
    if (storageMode === "local") {
      this.mode = "local";
    } else if (storageMode === "replit") {
      this.mode = "replit";
    } else {
      this.mode = this.detectStorageMode();
    }

    const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
    const baseUrl = process.env.BASE_URL || "";

    this.config = {
      uploadsDir,
      baseUrl,
    };

    if (this.mode === "local") {
      this.ensureUploadsDirExists();
    }

    console.log(`[FileStorage] Initialized in ${this.mode} mode`);
  }

  private detectStorageMode(): StorageMode {
    const hasReplitConfig = !!(
      process.env.PRIVATE_OBJECT_DIR &&
      process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID
    );
    
    if (hasReplitConfig && process.env.REPL_ID) {
      return "replit";
    }
    
    return "local";
  }

  private ensureUploadsDirExists(): void {
    const dirs = [
      this.config.uploadsDir,
      path.join(this.config.uploadsDir, "payment-proofs"),
      path.join(this.config.uploadsDir, "artwork"),
      path.join(this.config.uploadsDir, "misc"),
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`[FileStorage] Created directory: ${dir}`);
      }
    }
  }

  getMode(): StorageMode {
    return this.mode;
  }

  async getUploadUrl(category: string = "misc"): Promise<UploadResult> {
    if (this.mode === "replit") {
      return this.getReplitUploadUrl();
    }
    return this.getLocalUploadInfo(category);
  }

  private async getReplitUploadUrl(): Promise<UploadResult> {
    const privateObjectDir = process.env.PRIVATE_OBJECT_DIR;
    if (!privateObjectDir) {
      throw new Error("PRIVATE_OBJECT_DIR not set for Replit storage mode");
    }

    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = this.parseObjectPath(fullPath);

    const uploadURL = await this.signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900,
    });

    const objectPath = this.normalizeObjectEntityPath(uploadURL, privateObjectDir);

    return {
      uploadURL,
      objectPath,
      mode: "replit",
    };
  }

  private getLocalUploadInfo(category: string): UploadResult {
    const fileId = randomUUID();
    const objectPath = `/uploads/${category}/${fileId}`;
    const uploadURL = "/api/uploads/file";

    return {
      uploadURL,
      objectPath,
      mode: "local",
    };
  }

  async saveLocalFile(
    fileBuffer: Buffer,
    originalName: string,
    category: string = "misc",
    contentType?: string
  ): Promise<string> {
    const fileId = randomUUID();
    let ext = path.extname(originalName);
    
    // If no extension, try to derive from content type
    if (!ext && contentType) {
      const mimeToExt: Record<string, string> = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
        "application/pdf": ".pdf",
      };
      ext = mimeToExt[contentType] || ".bin";
    }
    
    ext = ext || ".bin";
    const fileName = `${fileId}${ext}`;
    const filePath = path.join(this.config.uploadsDir, category, fileName);

    this.ensureUploadsDirExists();

    await fs.promises.writeFile(filePath, fileBuffer);
    console.log(`[FileStorage] Saved file: ${filePath}`);

    return `/uploads/${category}/${fileName}`;
  }

  async saveToPath(
    fileBuffer: Buffer,
    objectPath: string
  ): Promise<string> {
    // Validate and sanitize objectPath to prevent path traversal
    const allowedCategories = ["payment-proofs", "artwork", "misc"];
    
    // objectPath format: /uploads/category/filename.ext
    const relativePath = objectPath.replace(/^\/uploads\//, "");
    const parts = relativePath.split("/");
    const category = parts[0] || "misc";
    const fileName = parts.slice(1).join("/");
    
    if (!fileName) {
      throw new Error("Invalid file path: no filename");
    }
    
    // Security: validate category is allowed
    if (!allowedCategories.includes(category)) {
      throw new Error(`Invalid upload category: ${category}`);
    }
    
    // Security: prevent path traversal
    if (fileName.includes("..") || fileName.startsWith("/")) {
      throw new Error("Invalid file path");
    }
    
    // Validate filename doesn't escape category directory
    const normalizedPath = path.normalize(path.join(category, fileName));
    if (!normalizedPath.startsWith(category)) {
      throw new Error("Invalid file path");
    }
    
    const filePath = path.join(this.config.uploadsDir, category, fileName);

    this.ensureUploadsDirExists();

    await fs.promises.writeFile(filePath, fileBuffer);
    console.log(`[FileStorage] Saved file to path: ${filePath}`);

    // Return exact same objectPath to ensure consistency
    return objectPath;
  }

  async deleteFile(objectPath: string): Promise<void> {
    if (this.mode === "local") {
      const filePath = path.join(this.config.uploadsDir, objectPath.replace("/uploads/", ""));
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        console.log(`[FileStorage] Deleted file: ${filePath}`);
      }
    }
  }

  getFilePath(objectPath: string): string | null {
    if (this.mode === "local") {
      const relativePath = objectPath.replace("/uploads/", "");
      const filePath = path.join(this.config.uploadsDir, relativePath);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }
    return null;
  }

  private parseObjectPath(objPath: string): { bucketName: string; objectName: string } {
    let normalizedPath = objPath;
    if (!normalizedPath.startsWith("/")) {
      normalizedPath = `/${normalizedPath}`;
    }
    const pathParts = normalizedPath.split("/");
    if (pathParts.length < 3) {
      throw new Error("Invalid path: must contain at least a bucket name");
    }

    const bucketName = pathParts[1];
    const objectName = pathParts.slice(2).join("/");

    return { bucketName, objectName };
  }

  private async signObjectURL({
    bucketName,
    objectName,
    method,
    ttlSec,
  }: {
    bucketName: string;
    objectName: string;
    method: "GET" | "PUT" | "DELETE" | "HEAD";
    ttlSec: number;
  }): Promise<string> {
    const request = {
      bucket_name: bucketName,
      object_name: objectName,
      method,
      expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
    };
    
    const response = await fetch(
      `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      }
    );
    
    if (!response.ok) {
      throw new Error(
        `Failed to sign object URL, errorcode: ${response.status}`
      );
    }

    const { signed_url: signedURL } = await response.json();
    return signedURL;
  }

  private normalizeObjectEntityPath(rawPath: string, privateObjectDir: string): string {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }

    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;

    let objectEntityDir = privateObjectDir;
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }

    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }

    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }
}

export const fileStorageService = new FileStorageService();
