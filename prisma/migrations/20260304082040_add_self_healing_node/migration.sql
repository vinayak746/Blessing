-- AlterEnum
ALTER TYPE "NodeType" ADD VALUE 'SELF_HEALING';

-- CreateIndex
CREATE INDEX "Subscriber_subscribed_createdAt_idx" ON "Subscriber"("subscribed", "createdAt");
