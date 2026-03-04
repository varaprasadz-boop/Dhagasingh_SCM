# VPS Storage Setup Guide

This guide configures the application to use **VPS local filesystem storage** instead of Replit Object Storage. All uploads (payment proofs, artwork, etc.) are stored in a directory on your VPS.

---

## 1. Environment variables

On your VPS, set these in `.env` (or your process manager’s env):

```bash
# Force local (VPS) storage. Do not set Replit-related vars when using VPS.
FILE_STORAGE_MODE=local

# Directory where uploaded files will be stored (must be writable by the app).
# Use an absolute path for production. Examples:
#   UPLOADS_DIR=/var/www/Dhagasingh_SCM/uploads   (inside project)
#   UPLOADS_DIR=/var/www/storage                  (shared folder outside project)
UPLOADS_DIR=/var/www/storage

# Optional: base URL for the app (e.g. https://yourdomain.com). Leave empty if same origin.
# BASE_URL=
```

**Important:** When using VPS storage, **do not set** these Replit-only variables (remove them from `.env` if present):

- `REPL_ID`
- `PRIVATE_OBJECT_DIR`
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID`
- `PUBLIC_OBJECT_SEARCH_PATHS`

---

## 2. Create and secure the uploads directory

Create the directory and give the app user ownership. Use the **same path** as `UPLOADS_DIR` in your `.env`.

**Option A – Shared folder (e.g. `/var/www/storage`):**

```bash
# Replace www-data with the user that runs your Node app
export APP_USER=www-data
export UPLOADS_DIR=/var/www/storage

sudo mkdir -p "$UPLOADS_DIR"/{payment-proofs,artwork,misc}
sudo chown -R "$APP_USER:$APP_USER" "$UPLOADS_DIR"
sudo chmod 755 "$UPLOADS_DIR"
sudo chmod 755 "$UPLOADS_DIR"/payment-proofs "$UPLOADS_DIR"/artwork "$UPLOADS_DIR"/misc
```

**Option B – Inside project (e.g. `/var/www/Dhagasingh_SCM/uploads`):**

```bash
export APP_USER=www-data
export UPLOADS_DIR=/var/www/Dhagasingh_SCM/uploads

sudo mkdir -p "$UPLOADS_DIR"/{payment-proofs,artwork,misc}
sudo chown -R "$APP_USER:$APP_USER" "$UPLOADS_DIR"
sudo chmod 755 "$UPLOADS_DIR"
```

**Option C – Default (project dir, relative):**  
Omit `UPLOADS_DIR` in `.env` to use `./uploads` inside the project. Then:

```bash
mkdir -p uploads/payment-proofs uploads/artwork uploads/misc
```

---

## 3. Application behavior

- **Upload flow:** Client requests an upload URL from `/api/uploads/request-url`; server returns `mode: "local"` and an `objectPath` like `/uploads/category/<uuid>.<ext>`. The file is then sent to `/api/uploads/file` (PUT or POST) and saved under `UPLOADS_DIR`.
- **Serving files:** Uploaded files are served by Express at `/uploads/...` (e.g. `https://yourdomain.com/uploads/artwork/abc-123.png`). Ensure your reverse proxy (e.g. Nginx) does not strip or override `/uploads`.

---

## 4. Nginx (optional)

If you use Nginx in front of the Node app, you can serve uploads directly from disk for better performance:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Optional: serve uploads directly from disk (path must match UPLOADS_DIR)
    location /uploads/ {
        alias /var/www/storage/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

If you don’t add this `location /uploads/` block, the Node app will still serve `/uploads`; Nginx will just proxy those requests to the app.

---

## 5. Backups

VPS storage is local to the server. Back up the uploads directory regularly:

```bash
# Example: tar backup (use your actual UPLOADS_DIR)
tar -czvf uploads-backup-$(date +%Y%m%d).tar.gz -C /var/www storage

# Or rsync (e.g. when UPLOADS_DIR=/var/www/storage)
rsync -av /var/www/storage/ backup-server:/backups/dhagasingh-scm/uploads/
```

---

## 6. Verify

1. Restart the application after changing `.env`.
2. Check logs for: `[FileStorage] Initialized in local mode`.
3. Upload a file in the app and confirm it appears under `UPLOADS_DIR` (e.g. `uploads/artwork/` or `uploads/payment-proofs/`) and is accessible at `https://yourdomain.com/uploads/...`.

---

## Summary

| Item              | Value / Action                                      |
|-------------------|-----------------------------------------------------|
| Storage mode      | `FILE_STORAGE_MODE=local`                           |
| Uploads path      | `UPLOADS_DIR` (e.g. `/var/www/storage` or `./uploads`) |
| Replit env vars   | Remove or leave unset on VPS                        |
| File URLs         | `https://yourdomain.com/uploads/<category>/<file>`  |
| Backups           | Back up `UPLOADS_DIR` regularly                     |
