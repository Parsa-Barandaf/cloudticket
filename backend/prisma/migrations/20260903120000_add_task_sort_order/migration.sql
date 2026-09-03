ALTER TABLE "Task" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

UPDATE "Task" AS t
SET "sortOrder" = ranked.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "updatedAt" DESC, "createdAt" DESC)::INTEGER AS rn
  FROM "Task"
) AS ranked
WHERE t.id = ranked.id;
