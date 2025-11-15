/*
  Warnings:

  - A unique constraint covering the columns `[dni]` on the table `invitationsForEvent` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dni` to the `invitationsForEvent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mention` to the `invitationsForEvent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `names` to the `invitationsForEvent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `program` to the `invitationsForEvent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."invitationsForEvent" ADD COLUMN     "dni" TEXT NOT NULL,
ADD COLUMN     "mention" TEXT NOT NULL,
ADD COLUMN     "names" TEXT NOT NULL,
ADD COLUMN     "program" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "invitationsForEvent_dni_key" ON "public"."invitationsForEvent"("dni");
