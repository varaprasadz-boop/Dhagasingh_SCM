import type { Express } from "express";
import path from "path";
import express from "express";
import multer from "multer";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { fileStorageService } from "../../services/fileStorage";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  },
});

export function registerObjectStorageRoutes(app: Express): void {
  const objectStorageService = new ObjectStorageService();
  const storageMode = fileStorageService.getMode();
  const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");

  console.log(`[Object Storage] Registering routes in ${storageMode} mode`);
  console.log(`[Object Storage] Uploads directory: ${uploadsDir}`);

  app.use("/uploads", express.static(uploadsDir));

  app.post("/api/uploads/request-url", async (req, res) => {
    try {
      const { name, size, contentType, category = "misc" } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Missing required field: name",
        });
      }

      const currentMode = fileStorageService.getMode();
      console.log(`[Object Storage] Request upload URL for: ${name}, mode: ${currentMode}`);

      if (currentMode === "local") {
        const result = await fileStorageService.getUploadUrl(category);
        
        // Add extension based on contentType for consistent objectPath
        const mimeToExt: Record<string, string> = {
          "image/jpeg": ".jpg",
          "image/png": ".png",
          "image/gif": ".gif",
          "image/webp": ".webp",
          "application/pdf": ".pdf",
        };
        const ext = mimeToExt[contentType] || path.extname(name) || ".bin";
        const objectPathWithExt = result.objectPath + ext;
        
        return res.json({
          uploadURL: result.uploadURL,
          objectPath: objectPathWithExt,
          mode: "local",
          category,
          metadata: { name, size, contentType },
        });
      }

      const privateDir = process.env.PRIVATE_OBJECT_DIR;
      const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
      console.log("[Object Storage] PRIVATE_OBJECT_DIR set:", !!privateDir);
      console.log("[Object Storage] DEFAULT_OBJECT_STORAGE_BUCKET_ID set:", !!bucketId);

      if (!privateDir) {
        console.error("[Object Storage] PRIVATE_OBJECT_DIR not configured");
        return res.status(503).json({
          error: "Object storage not configured",
          details: "PRIVATE_OBJECT_DIR environment variable is not set. Please configure object storage in the Replit tools panel.",
        });
      }

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      console.log("[Object Storage] Upload URL generated successfully for:", name);

      res.json({
        uploadURL,
        objectPath,
        mode: "replit",
        metadata: { name, size, contentType },
      });
    } catch (error: any) {
      console.error("[Object Storage] Error generating upload URL:", error);
      console.error("[Object Storage] Error name:", error?.name);
      console.error("[Object Storage] Error message:", error?.message);
      
      let errorMessage = "Failed to generate upload URL";
      let details = error?.message || "Unknown error";
      
      if (error?.message?.includes("PRIVATE_OBJECT_DIR")) {
        errorMessage = "Object storage not configured";
        details = "Please configure object storage in the Replit tools panel.";
      } else if (error?.code === "ECONNREFUSED" || error?.message?.includes("127.0.0.1:1106")) {
        errorMessage = "Object storage service unavailable";
        details = "The storage sidecar service is not running. This may happen in deployed environments.";
      }
      
      res.status(500).json({ error: errorMessage, details });
    }
  });

  // POST for multipart form uploads  
  app.post("/api/uploads/file", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const category = (req.body.category as string) || "misc";
      const targetPath = req.body.objectPath as string;
      
      let objectPath: string;
      
      // If objectPath provided, save to exact path for consistency
      if (targetPath && targetPath.startsWith("/uploads/")) {
        objectPath = await fileStorageService.saveToPath(req.file.buffer, targetPath);
      } else if (fileStorageService.getMode() === "local") {
        // In local mode without objectPath, generate path with extension from mimetype
        const mimeToExt: Record<string, string> = {
          "image/jpeg": ".jpg",
          "image/png": ".png", 
          "image/gif": ".gif",
          "image/webp": ".webp",
          "application/pdf": ".pdf",
        };
        const ext = mimeToExt[req.file.mimetype] || path.extname(req.file.originalname) || ".bin";
        objectPath = await fileStorageService.saveLocalFile(
          req.file.buffer,
          `upload-${Date.now()}${ext}`,
          category
        );
      } else {
        // Replit mode without objectPath - generate new path
        objectPath = await fileStorageService.saveLocalFile(
          req.file.buffer,
          req.file.originalname,
          category
        );
      }

      console.log(`[Object Storage] File uploaded via POST: ${objectPath}`);

      res.json({
        objectPath,
        mode: "local",
        metadata: {
          name: req.file.originalname,
          size: req.file.size,
          contentType: req.file.mimetype,
        },
      });
    } catch (error: any) {
      console.error("[Object Storage] Error uploading file:", error);
      res.status(500).json({ 
        error: "Failed to upload file", 
        details: error?.message 
      });
    }
  });

  // PUT for presigned-URL style uploads (raw body) - requires objectPath in query params
  app.put("/api/uploads/file", express.raw({ type: "*/*", limit: "10mb" }), async (req, res) => {
    try {
      if (!req.body || !Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ error: "No file data provided" });
      }

      const contentType = req.headers["content-type"] || "application/octet-stream";
      
      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(contentType)) {
        return res.status(400).json({ 
          error: `File type not allowed: ${contentType}`,
          allowedTypes: ALLOWED_MIME_TYPES
        });
      }

      const fileName = (req.query.name as string) || `upload-${Date.now()}`;
      const targetPath = req.query.objectPath as string;
      
      // In local mode, require objectPath to ensure consistency
      if (!targetPath) {
        return res.status(400).json({
          error: "objectPath is required for local mode uploads",
          hint: "Use POST with multipart form data, or include objectPath from request-url response"
        });
      }
      
      // Validate objectPath format
      if (!targetPath.startsWith("/uploads/")) {
        return res.status(400).json({ 
          error: "Invalid objectPath format",
          hint: "objectPath must start with /uploads/" 
        });
      }
      
      const objectPath = await fileStorageService.saveToPath(req.body, targetPath);

      console.log(`[Object Storage] File uploaded via PUT: ${objectPath}`);

      res.json({
        objectPath,
        mode: "local",
        metadata: {
          name: fileName,
          size: req.body.length,
          contentType,
        },
      });
    } catch (error: any) {
      console.error("[Object Storage] Error uploading file:", error);
      res.status(500).json({ 
        error: "Failed to upload file", 
        details: error?.message 
      });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });

  app.get("/api/uploads/storage-info", (_req, res) => {
    res.json({
      mode: fileStorageService.getMode(),
      localSupported: true,
      replitSupported: !!process.env.PRIVATE_OBJECT_DIR,
    });
  });
}
