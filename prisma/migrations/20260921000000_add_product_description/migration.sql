-- Add description to Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "description" TEXT;
