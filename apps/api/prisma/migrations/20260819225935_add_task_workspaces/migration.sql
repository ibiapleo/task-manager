-- CreateTable
CREATE TABLE "workspaces" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "profile_id" UUID NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workspaces_profile_id_idx" ON "workspaces"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_profile_id_name_key" ON "workspaces"("profile_id", "name");

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable (nullable primeiro: producao ja tem tasks)
ALTER TABLE "tasks" ADD COLUMN "workspace_id" UUID;

-- Backfill: um espaco default por profile existente (inclusive profiles sem tasks)
INSERT INTO "workspaces" ("id", "name", "profile_id", "created_at", "updated_at")
SELECT gen_random_uuid(), 'Geral', p."id", NOW(), NOW()
FROM "profiles" p
ON CONFLICT ("profile_id", "name") DO NOTHING;

-- Backfill: aponta toda task existente para o espaco default do dono
UPDATE "tasks" t
SET "workspace_id" = w."id"
FROM "workspaces" w
WHERE w."profile_id" = t."profile_id"
  AND w."name" = 'Geral'
  AND t."workspace_id" IS NULL;

-- AlterTable
ALTER TABLE "tasks" ALTER COLUMN "workspace_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "tasks_workspace_id_idx" ON "tasks"("workspace_id");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
