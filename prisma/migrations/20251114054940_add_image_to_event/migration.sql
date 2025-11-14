-- AlterTable
ALTER TABLE "public"."event" ADD COLUMN     "image" TEXT;

-- AddForeignKey
ALTER TABLE "public"."invitationsForEvent" ADD CONSTRAINT "invitationsForEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
