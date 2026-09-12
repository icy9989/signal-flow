-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FeedbackCategory" ADD VALUE 'USABILITY';
ALTER TYPE "FeedbackCategory" ADD VALUE 'PERFORMANCE';
ALTER TYPE "FeedbackCategory" ADD VALUE 'PRICING';
ALTER TYPE "FeedbackCategory" ADD VALUE 'SUPPORT';
ALTER TYPE "FeedbackCategory" ADD VALUE 'POSITIVE_FEEDBACK';

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "analysisErrorCode" TEXT;

-- AlterTable
ALTER TABLE "FeedbackAnalysis" ADD COLUMN     "promptVersion" TEXT,
ADD COLUMN     "topics" TEXT[] DEFAULT ARRAY[]::TEXT[];
