-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastVerified" TIMESTAMP(3),
ADD COLUMN     "signupMethod" TEXT,
ADD COLUMN     "signupRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "tier" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "validityWindow" TEXT;

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "gtaLocations" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "lat" DROP NOT NULL,
ALTER COLUMN "lng" DROP NOT NULL;
