-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "avatar_url" TEXT,
ADD COLUMN "preferences" JSONB DEFAULT '{"theme":"light","accessibility":{"highContrast":false,"fontSizeMultiplier":1},"localization":{"timezone":"America/Recife","dateFormat":"DD/MM/YYYY"}}';
