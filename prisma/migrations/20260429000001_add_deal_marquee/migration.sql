-- Add marquee flag to deals (used for ⭐ national food days)
ALTER TABLE "Deal" ADD COLUMN "marquee" BOOLEAN NOT NULL DEFAULT false;
