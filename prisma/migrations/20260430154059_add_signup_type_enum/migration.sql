-- CreateEnum
CREATE TYPE "SignupType" AS ENUM ('no_signup', 'show_id', 'app', 'rewards', 'newsletter', 'loyalty');

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "signupType" "SignupType" NOT NULL DEFAULT 'no_signup';
