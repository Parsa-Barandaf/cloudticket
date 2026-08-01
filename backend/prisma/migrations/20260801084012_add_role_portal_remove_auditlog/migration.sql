/*
  Warnings:

  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_actorUserId_fkey";

-- DropTable
DROP TABLE "AuditLog";

-- CreateTable
CREATE TABLE "RolePortal" (
    "roleId" TEXT NOT NULL,
    "portalId" TEXT NOT NULL,

    CONSTRAINT "RolePortal_pkey" PRIMARY KEY ("roleId","portalId")
);

-- AddForeignKey
ALTER TABLE "RolePortal" ADD CONSTRAINT "RolePortal_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePortal" ADD CONSTRAINT "RolePortal_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "Portal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
