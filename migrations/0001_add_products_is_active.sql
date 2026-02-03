-- Add is_active column to products table (default true for existing rows)
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
