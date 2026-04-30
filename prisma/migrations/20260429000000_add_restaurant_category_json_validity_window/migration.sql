-- CreateEnum
CREATE TYPE "RestaurantCategory" AS ENUM ('coffee_drinks', 'bakeries_sweets', 'fast_food', 'sit_down', 'ice_cream', 'convenience');

-- AlterTable
ALTER TABLE "Deal" DROP COLUMN "validityWindow",
ADD COLUMN     "validityWindow" JSONB;

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "category" "RestaurantCategory" NOT NULL DEFAULT 'fast_food';
