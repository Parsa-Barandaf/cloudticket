/*
  Warnings:

  - Added the required column `updatedAt` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TicketMessage" DROP CONSTRAINT "TicketMessage_ticketId_fkey";

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "ticketNumber" SERIAL NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Ticket" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "TicketMessage" ADD COLUMN     "authorId" TEXT,
ADD COLUMN     "authorType" TEXT;

-- CreateTable
CREATE TABLE "TicketAttachment" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" BIGINT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticketId" TEXT NOT NULL,

    CONSTRAINT "TicketAttachment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
