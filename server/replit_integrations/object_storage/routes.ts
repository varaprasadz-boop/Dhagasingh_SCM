import type { Express } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

/**
 * Register object storage routes for file uploads.
 *
 * This provides example routes for the presigned URL upload flow:
 * 1. POST /api/uploads/request-url - Get a presigned URL for uploading
 * 2. The client then uploads directly to the presigned URL
 *
 * IMPORTANT: These are example routes. Customize based on your use case:
 * - Add authentication middleware for protected uploads
 * - Add file metadata storage (save to database after upload)
 * - Add ACL policies for access control
 */
export function registerObjectStorageRoutes(app: Express): void {
  const objectStorageService = new ObjectStorageService();

  /**
   * Request a presigned URL for file upload.
   *
   * Request body (JSON):
   * {
   *   "name": "filename.jpg",
   *   "size": 12345,
   *   "contentType": "image/jpeg"
   * }
   *
   * Response:
   * {
   *   "uploadURL": "https://storage.googleapis.com/...",
   *   "objectPath": "/objects/uploads/uuid"
   * }
   *
   * IMPORTANT: The client should NOT send the file to this endpoint.
   * Send JSON metadata only, then upload the file directly to uploadURL.
   */
  app.post("/api/uploads/request-url", async (req, res) => {
    try {
      const { name, size, contentType } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Missing required field: name",
        });
      }

      // Log environment info for debugging
      const privateDir = process.env.PRIVATE_OBJECT_DIR;
      const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
      console.log("[Object Storage] Request upload URL for:", name);
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

      // Extract object path from the presigned URL for later reference
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      console.log("[Object Storage] Upload URL generated successfully for:", name);

      res.json({
        uploadURL,
        objectPath,
        // Echo back the metadata for client convenience
        metadata: { name, size, contentType },
      });
    } catch (error: any) {
      console.error("[Object Storage] Error generating upload URL:", error);
      console.error("[Object Storage] Error name:", error?.name);
      console.error("[Object Storage] Error message:", error?.message);
      console.error("[Object Storage] Error stack:", error?.stack);
      
      // Provide more helpful error message based on the error type
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

  /**
   * Serve uploaded objects.
   *
   * GET /objects/:objectPath(*)
   *
   * This serves files from object storage. For public files, no auth needed.
   * For protected files, add authentication middleware and ACL checks.
   */
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
}

