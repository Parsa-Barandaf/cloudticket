-- Add notification timeline fields
ALTER TABLE "Notification" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "authorName" TEXT,
ADD COLUMN "authorAvatarBg" TEXT,
ADD COLUMN "detailedContent" TEXT,
ADD COLUMN "linkedType" TEXT,
ADD COLUMN "linkedId" TEXT,
ADD COLUMN "linkedName" TEXT;