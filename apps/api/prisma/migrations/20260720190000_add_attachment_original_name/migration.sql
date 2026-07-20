-- AlterTable
ALTER TABLE "attachments" ADD COLUMN "original_name" TEXT;

-- Backfill from URL basename for existing rows
UPDATE "attachments"
SET "original_name" = COALESCE(
  NULLIF(
    regexp_replace(split_part("url", '?', 1), '^.*/', ''),
    ''
  ),
  'unknown'
)
WHERE "original_name" IS NULL;

-- AlterTable
ALTER TABLE "attachments" ALTER COLUMN "original_name" SET NOT NULL;
