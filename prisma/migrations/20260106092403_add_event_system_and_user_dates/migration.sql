/*
  Warnings:

  - A unique constraint covering the columns `[google_event_id]` on the table `calendar_events` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "notification_type" ADD VALUE 'BIRTHDAY_REMINDER';
ALTER TYPE "notification_type" ADD VALUE 'ANNIVERSARY_REMINDER';

-- AlterTable
ALTER TABLE "calendar_events" ADD COLUMN     "color" TEXT,
ADD COLUMN     "cover_image" TEXT,
ADD COLUMN     "event_type" TEXT,
ADD COLUMN     "google_calendar_id" TEXT,
ADD COLUMN     "google_event_id" TEXT,
ADD COLUMN     "last_synced_at" TIMESTAMP(3),
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "calendar_event_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "birthday" DATE,
ADD COLUMN     "death_day" DATE,
ADD COLUMN     "wedding_anniversary" DATE;

-- CreateTable
CREATE TABLE "albums" (
    "id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cover_image" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "calendar_event_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "album_photos" (
    "id" TEXT NOT NULL,
    "album_id" TEXT NOT NULL,
    "photo_id" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "added_by" TEXT,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "album_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "albums_calendar_event_id_key" ON "albums"("calendar_event_id");

-- CreateIndex
CREATE INDEX "albums_family_id_idx" ON "albums"("family_id");

-- CreateIndex
CREATE INDEX "albums_calendar_event_id_idx" ON "albums"("calendar_event_id");

-- CreateIndex
CREATE INDEX "album_photos_album_id_order_idx" ON "album_photos"("album_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "album_photos_album_id_photo_id_key" ON "album_photos"("album_id", "photo_id");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_google_event_id_key" ON "calendar_events"("google_event_id");

-- CreateIndex
CREATE INDEX "calendar_events_google_event_id_idx" ON "calendar_events"("google_event_id");

-- CreateIndex
CREATE INDEX "calendar_events_event_type_idx" ON "calendar_events"("event_type");

-- CreateIndex
CREATE INDEX "posts_calendar_event_id_idx" ON "posts"("calendar_event_id");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_calendar_event_id_fkey" FOREIGN KEY ("calendar_event_id") REFERENCES "calendar_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "albums" ADD CONSTRAINT "albums_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "albums" ADD CONSTRAINT "albums_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "albums" ADD CONSTRAINT "albums_calendar_event_id_fkey" FOREIGN KEY ("calendar_event_id") REFERENCES "calendar_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_photos" ADD CONSTRAINT "album_photos_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_photos" ADD CONSTRAINT "album_photos_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
