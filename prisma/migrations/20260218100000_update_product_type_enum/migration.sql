-- AlterEnum: Rename DUMMY_TICKET to DUMMY_FLIGHT and add DUMMY_BUNDLE
-- ProductType enum update to match architecture v3.0

-- Step 1: Add new values
ALTER TYPE "ProductType" ADD VALUE IF NOT EXISTS 'DUMMY_FLIGHT';
ALTER TYPE "ProductType" ADD VALUE IF NOT EXISTS 'DUMMY_BUNDLE';

-- Note: PostgreSQL doesn't support removing enum values directly.
-- DUMMY_TICKET will remain in the enum but should not be used.
-- A future migration can recreate the enum type if cleanup is needed.
