-- Drops the `timezone` preference: no longer part of the system.
ALTER TABLE "profiles" ALTER COLUMN "preferences" SET DEFAULT '{"theme":"light","accessibility":{"highContrast":false,"fontSizeMultiplier":1},"localization":{"dateFormat":"DD/MM/YYYY"}}';

UPDATE "profiles"
SET "preferences" = "preferences" #- '{localization,timezone}'
WHERE "preferences" IS NOT NULL;
