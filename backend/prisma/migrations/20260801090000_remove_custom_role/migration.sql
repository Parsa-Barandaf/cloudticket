-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_customRoleId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "customRoleId";

-- DropTable
DROP TABLE "CustomRole";
