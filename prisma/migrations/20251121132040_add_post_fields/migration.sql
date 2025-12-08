-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "event_date" DATE,
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
