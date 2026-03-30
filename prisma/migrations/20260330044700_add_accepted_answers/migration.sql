-- AlterTable
ALTER TABLE "Cards" ADD COLUMN "acceptedAnswers" TEXT[] DEFAULT ARRAY[]::TEXT[];
