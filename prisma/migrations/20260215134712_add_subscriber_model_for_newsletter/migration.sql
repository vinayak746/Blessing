-- CreateTable
CREATE TABLE "Subscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subscribed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "confirmToken" TEXT NOT NULL,
    "unsubscribeToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_email_key" ON "Subscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_confirmToken_key" ON "Subscriber"("confirmToken");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_unsubscribeToken_key" ON "Subscriber"("unsubscribeToken");
