-- Catch-up migration: the Gmail Reader node was applied to the database
-- directly (db push) without a migration file. IF NOT EXISTS makes this safe
-- to run on a database that already has the values, and on a fresh one.

-- AlterEnum
ALTER TYPE "CredentialType" ADD VALUE IF NOT EXISTS 'GMAIL';

-- AlterEnum
ALTER TYPE "NodeType" ADD VALUE IF NOT EXISTS 'GMAIL_READER';