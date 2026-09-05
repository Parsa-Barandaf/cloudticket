UPDATE "Notification" AS n
SET "description" = COALESCE(n."authorName", 'مدیر سامانه') || ' وظیفه «' || t."title" || '» را به ' || u."name" || ' محول کرد.'
FROM "Task" AS t
JOIN "User" AS u ON u."id" = t."assigneeId"
WHERE n."type" = 'tasks'
  AND n."title" = 'وظیفه جدید به شما محول شد'
  AND n."linkedId" = t."id";
